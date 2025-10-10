# Use official Node.js Azure Functions base image
FROM mcr.microsoft.com/azure-functions/node:4-node18

# Set working directory
WORKDIR /home/site/wwwroot

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy all backend code
COPY . .

# Set Azure Functions environment variables
ENV AzureWebJobsScriptRoot=/home/site/wwwroot \
    FUNCTIONS_WORKER_RUNTIME=node

# Expose port (optional, Functions default is 80)
EXPOSE 80

# Start Azure Functions
CMD ["func", "start", "--javascript"]
