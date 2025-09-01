#!/bin/bash

# Exit on any error
set -e

echo "=== STARTING BUILD PROCESS ==="
echo "Working directory: $(pwd)"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install || { echo "❌ Root npm install failed"; exit 1; }
echo "✅ Root dependencies installed"

# Install server dependencies  
echo "📦 Installing server dependencies..."
cd server
npm install || { echo "❌ Server npm install failed"; exit 1; }
echo "✅ Server dependencies installed"
echo "Server directory contents:"
ls -la

# Install client dependencies and build
echo "📦 Installing client dependencies..."
cd ../client
npm install || { echo "❌ Client npm install failed"; exit 1; }
echo "✅ Client dependencies installed"

echo "Client directory contents:"
ls -la

echo "🏗️  Building React application..."
CI=false npm run build || { echo "❌ React build failed"; exit 1; }

echo "🔍 Verifying build output..."
if [ -d "build" ]; then
    echo "✅ Build directory created successfully!"
    echo "Build directory contents:"
    ls -la build/
    
    if [ -f "build/index.html" ]; then
        echo "✅ index.html found in build directory"
        echo "Index.html size: $(du -h build/index.html)"
    else
        echo "❌ ERROR: index.html not found in build directory"
        echo "Build directory contents:"
        find build -type f -name "*.html" || echo "No HTML files found"
        exit 1
    fi
    
    # Check for other critical files
    if [ -d "build/static" ]; then
        echo "✅ Static assets directory found"
        echo "Static assets: $(find build/static -name '*.js' -o -name '*.css' | wc -l) files"
    else
        echo "⚠️  Warning: No static assets directory found"
    fi
else
    echo "❌ ERROR: Build directory not created"
    echo "Current directory contents:"
    ls -la
    exit 1
fi

echo "🎉 Build process completed successfully!"
echo "Final build structure:"
find build -type f | head -10
