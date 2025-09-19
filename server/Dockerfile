# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
# This leverages Docker's layer caching
COPY package*.json ./

# Install app dependencies inside the container
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Make port 5001 available to the outside world
EXPOSE 5001

# The command to run when the container launches
CMD [ "npm", "run", "dev" ]
