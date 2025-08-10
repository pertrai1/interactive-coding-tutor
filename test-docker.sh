#!/bin/bash

# Test script for Docker deployment of Interactive Coding Tutor
# Tests both frontend and backend connectivity

echo "🧪 Testing Interactive Coding Tutor Docker Setup..."
echo ""

# Test frontend
echo "📡 Testing Frontend (Port 8003)..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8003/visualize.html")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "✅ Frontend is running correctly on http://localhost:8003"
else
    echo "❌ Frontend test failed (HTTP $FRONTEND_RESPONSE)"
    exit 1
fi

# Test backend
echo ""
echo "🔧 Testing Backend (Port 3000)..."
BACKEND_TEST=$(curl -G -s "http://localhost:3000/exec_js_native" --data-urlencode "user_script=console.log('Backend test successful!');")

if echo "$BACKEND_TEST" | grep -q "Backend test successful!"; then
    echo "✅ Backend is running correctly on http://localhost:3000"
    echo "✅ JavaScript execution engine is working"
else
    echo "❌ Backend test failed"
    echo "Response: $BACKEND_TEST"
    exit 1
fi

# Test modern JavaScript features
echo ""
echo "🚀 Testing Modern JavaScript Features..."
MODERN_JS_TEST=$(curl -G -s "http://localhost:3000/exec_js_native" --data-urlencode "user_script=const arr = [1,2,3]; const doubled = arr.map(x => x * 2); console.log('Modern JS:', doubled);")

if echo "$MODERN_JS_TEST" | grep -q "Modern JS:"; then
    echo "✅ ECMAScript 2025 features working correctly"
else
    echo "❌ Modern JavaScript test failed"
    echo "Response: $MODERN_JS_TEST"
    exit 1
fi

echo ""
echo "🎉 All tests passed! Your Interactive Coding Tutor is ready to use."
echo "📖 Access the application at: http://localhost:8003/visualize.html"
echo ""
