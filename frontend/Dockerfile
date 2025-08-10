# Frontend Dockerfile for Interactive Coding Tutor
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json and tsconfig.json and install dependencies
COPY package.json package-lock.json* ./
COPY tsconfig.json ./
COPY vite.config.ts ./
RUN npm install

# Copy source files
COPY js/ ./js/
COPY css/ ./css/
COPY *.html ./

# Build the frontend assets
RUN npm run build

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install Python dependencies
RUN pip install bottle==0.12.25

# Copy Python server files
COPY *.py ./
COPY *.html ./
COPY css/ ./css/

# Copy built assets from builder stage
COPY --from=builder /app/build ./build/

# Expose port
EXPOSE 8003

# Start the frontend server
CMD ["python", "bottle_server.py"]
