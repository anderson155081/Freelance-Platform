#!/bin/bash

# Freelance Platform Deployment Script

set -e

ENVIRONMENT=${1:-development}

echo "🚀 Starting deployment for $ENVIRONMENT environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and start services based on environment
case $ENVIRONMENT in
    "development")
        echo "🔧 Starting development environment..."
        docker-compose -f docker-compose.dev.yml down
        docker-compose -f docker-compose.dev.yml build
        docker-compose -f docker-compose.dev.yml up -d
        ;;
    "production")
        echo "🏭 Starting production environment..."
        docker-compose down
        docker-compose build
        docker-compose up -d
        ;;
    "test")
        echo "🧪 Starting test environment..."
        docker-compose -f docker-compose.test.yml down
        docker-compose -f docker-compose.test.yml build
        docker-compose -f docker-compose.test.yml up --abort-on-container-exit
        ;;
    *)
        echo "❌ Invalid environment: $ENVIRONMENT"
        echo "Valid options: development, production, test"
        exit 1
        ;;
esac

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

echo "✅ Deployment completed successfully!"
echo "🌐 Application should be available at:"

case $ENVIRONMENT in
    "development")
        echo "   Frontend: http://localhost:3000"
        echo "   API: http://localhost:8080"
        echo "   Database Admin: http://localhost:8081"
        echo "   Redis Admin: http://localhost:8082"
        ;;
    "production")
        echo "   Application: http://localhost"
        ;;
esac 