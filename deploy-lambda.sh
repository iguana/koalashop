#!/bin/bash

# Build and deploy Lambda function
cd lambda

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create deployment package
npm run deploy

# Deploy to AWS Lambda (you'll need to configure this)
echo "Lambda function built successfully!"
echo "To deploy:"
echo "1. Create a Lambda function in AWS Console"
echo "2. Upload the api.zip file"
echo "3. Set the handler to 'api.handler'"
echo "4. Configure environment variables"
echo "5. Set up API Gateway to route to the Lambda function"
