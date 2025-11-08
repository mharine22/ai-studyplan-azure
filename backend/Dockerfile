# Use the official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy all backend files
COPY . .

# Expose port (Azure Functions default is 80)
EXPOSE 80

# Start the Node.js app (Azure Functions)
CMD ["npx", "func", "start", "--javascript"]
