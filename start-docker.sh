#!/bin/bash

# Interactive Coding Tutor Docker Startup Script

echo "🚀 Starting Interactive Coding Tutor with Docker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start the services
echo "📦 Building and starting services..."
docker-compose up --build

echo "✅ Services started!"
echo ""
echo "🌐 Access the application at:"
echo "   Frontend: http://localhost:8003"
echo "   Backend API: http://localhost:3000"
echo ""
echo "🔧 Available pages:"
echo "   • Main visualizer: http://localhost:8003/visualize.html"
echo "   • Live programming: http://localhost:8003/live.html"
echo "   • Index page: http://localhost:8003/index.html"
echo ""
echo "⏹️  To stop: Press Ctrl+C or run 'docker-compose down'"
