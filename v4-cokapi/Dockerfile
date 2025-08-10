# Backend Dockerfile for Interactive Coding Tutor
FROM node:24-alpine

WORKDIR /app

# Install Docker CLI (for Docker-in-Docker execution)
RUN apk add --no-cache docker-cli

# Copy package.json and install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy application code
COPY . .

# Ensure the modernized JavaScript backend container is available
RUN cd backends/javascript && docker build -t pgbovine/cokapi-js:v2 . || echo "Warning: Could not build JS backend container"

# Expose port
EXPOSE 3000

# Start the backend server in local mode
CMD ["node", "cokapi.js", "local"]
