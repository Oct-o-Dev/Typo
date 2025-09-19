import { Router } from 'express';
import { startRegistration, verifyRegistration, login, guestLogin } from '../controllers/authController';

const router = Router();

router.post('/start-registration', startRegistration);
router.post('/verify-registration', verifyRegistration);
router.post('/login', login);
router.post('/guest', guestLogin);

export default router;
