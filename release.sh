#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Get username from env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi


# Define variables
FRONTEND_IMAGE_NAME="$DOCKER_USERNAME/schedulrai-frontend"
BACKEND_IMAGE_NAME="$DOCKER_USERNAME/schedulrai-backend"
OLLAMA_IMAGE_NAME="$DOCKER_USERNAME/schedulrai-ollama"
VERSION_TAG=$(date +%Y%m%d%H%M)

# Create and use a new builder instance
docker buildx create --use

# Build and push frontend image for both x86 and ARM64
echo "Building and pushing frontend image..."
docker buildx build --platform linux/amd64,linux/arm64 -t $FRONTEND_IMAGE_NAME:latest -t $FRONTEND_IMAGE_NAME:$VERSION_TAG -f Dockerfile.frontend . --push

# Build and push backend image for both x86 and ARM64
echo "Building and pushing backend image..."
docker buildx build --platform linux/amd64,linux/arm64 -t $BACKEND_IMAGE_NAME:latest -t $BACKEND_IMAGE_NAME:$VERSION_TAG -f Dockerfile.backend . --push

# # Build and push ollama image for both x86 and ARM64
# echo "Building and pushing ollama image..."
# docker buildx build --platform linux/amd64,linux/arm64 -t $OLLAMA_IMAGE_NAME:latest -t $OLLAMA_IMAGE_NAME:$VERSION_TAG -f Dockerfile.ollama . --push
# Remove the builder instance
docker buildx rm
docker buildx use default

echo "Release completed successfully!"