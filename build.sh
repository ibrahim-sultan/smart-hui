#!/bin/bash

echo "Starting build process..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Install server dependencies  
echo "Installing server dependencies..."
cd server
npm install

# Install client dependencies and build
echo "Installing client dependencies..."
cd ../client
npm install

echo "Building React application..."
npm run build

echo "Verifying build output..."
if [ -d "build" ]; then
    echo "Build directory created successfully!"
    ls -la build/
    if [ -f "build/index.html" ]; then
        echo "index.html found in build directory"
    else
        echo "ERROR: index.html not found in build directory"
        exit 1
    fi
else
    echo "ERROR: Build directory not created"
    exit 1
fi

echo "Build process completed successfully!"
