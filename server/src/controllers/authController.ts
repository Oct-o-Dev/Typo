import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import redisClient from '../config/redisClient';
import { sendOtpEmail } from '../services/emailService';
import mongoose from 'mongoose';

const tempOtpStorage = new Map<string, { email: string; password: string; username: string; otp: string; expiresAt: number }>();

const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in .env file.');
    throw new Error('JWT secret is missing, server cannot sign tokens.');
  }
  
  return jwt.sign({ id }, secret as jwt.Secret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  } as jwt.SignOptions);
};

const storeOtpData = async (registrationId: string, userData: any): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.set(`reg:${registrationId}`, JSON.stringify(userData), { EX: 600 });
  } else {
    tempOtpStorage.set(registrationId, { ...userData, expiresAt: Date.now() + 600000 });
    console.warn('⚠️ Redis not connected. Using temporary in-memory storage for OTP.');
  }
};

const getOtpData = async (registrationId: string): Promise<any> => {
  if (redisClient.isOpen) {
    const data = await redisClient.get(`reg:${registrationId}`);
    return data ? JSON.parse(data) : null;
  } else {
    const data = tempOtpStorage.get(registrationId);
    if (data && data.expiresAt > Date.now()) return data;
    return null;
  }
};

const deleteOtpData = async (registrationId: string): Promise<void> => {
  if (redisClient.isOpen) {
    await redisClient.del(`reg:${registrationId}`);
  } else {
    tempOtpStorage.delete(registrationId);
  }
};

// API LOGIC 1: Start the registration process
export const startRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username } = req.body;
    
    if (!email || !password || !username) {
      res.status(400).json({ message: 'Email, password, and username are required.' });
      return;
    }

    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      res.status(409).json({ message: 'A user with that email or username already exists.' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const registrationId = uuidv4();
    
    // --- FIX: Trim whitespace from password before hashing ---
    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const userData = { email: email.toLowerCase(), password: hashedPassword, username, otp };

    await storeOtpData(registrationId, userData);
    await sendOtpEmail(email, otp);

    res.status(200).json({ message: 'OTP sent to your email.', registrationId });
  } catch (error) {
    console.error('Error in startRegistration:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// API LOGIC 2: Verify the OTP and create the user
export const verifyRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const { registrationId, otp } = req.body;
    
    const userData = await getOtpData(registrationId);
    if (!userData || userData.otp !== otp) {
      res.status(400).json({ message: 'The OTP is incorrect or your session has expired.' });
      return;
    }

    const user = await User.create({
      email: userData.email,
      password: userData.password,
      username: userData.username,
      isVerified: true,
    });

    await deleteOtpData(registrationId);

    const token = generateToken(String(user._id));
    res.status(201).json({ token, userId: user._id, username: user.username, isGuest: false });
  } catch (error) {
    console.error('Error in verifyRegistration:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// API LOGIC 3: Handle user login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // --- FIX: Trim whitespace from password before comparing ---
    if (!user || !(await user.comparePassword(password.trim()))) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = generateToken(String(user._id));
    res.json({ token, userId: user._id, username: user.username, isGuest: user.isGuest });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};

// API LOGIC 4: Handle guest login
export const guestLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const guestUsername = `Guest_${Math.random().toString(36).substring(2, 8)}`;
    
    const guestUser = await User.create({
      username: guestUsername,
      isGuest: true,
      isVerified: true,
    });

    const token = generateToken(String(guestUser._id));
    res.status(201).json({ token, userId: guestUser._id, username: guestUser.username, isGuest: true });
  } catch (error) {
    console.error('Error in guestLogin:', error);
    res.status(500).json({ message: 'An internal server error occurred.' });
  }
};