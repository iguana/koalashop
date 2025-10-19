#!/bin/bash

# KoalaShop AWS Amplify Deployment Script
# This script helps deploy your Next.js app to AWS Amplify with Aurora DSQL

echo "🚀 KoalaShop AWS Amplify Deployment Script"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if user is logged in
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
    exit 1
fi

echo "✅ AWS CLI is configured"

# App details
APP_ID="d1ph18zqpzftga"
BRANCH_NAME="main"
APP_NAME="koalashop"

echo "📋 App Details:"
echo "   App ID: $APP_ID"
echo "   Branch: $BRANCH_NAME"
echo "   Domain: https://$APP_ID.amplifyapp.com"
echo ""

# Check if app exists
echo "🔍 Checking Amplify app status..."
aws amplify get-app --app-id $APP_ID --region us-west-1

echo ""
echo "🔍 Checking branch status..."
aws amplify get-branch --app-id $APP_ID --branch-name $BRANCH_NAME --region us-west-1

echo ""
echo "🔍 Checking Aurora DSQL cluster..."
aws dsql get-cluster --identifier tfthqqgcj6tcmvrwthlasn2rm4 --region us-west-2

echo ""
echo "📝 Next Steps:"
echo "1. Push your code to a Git repository (GitHub, GitLab, etc.)"
echo "2. Connect your repository to Amplify:"
echo "   - Go to AWS Amplify Console"
echo "   - Select your app: $APP_NAME"
echo "   - Click 'Connect repository'"
echo "   - Choose your Git provider and repository"
echo "   - Select branch: $BRANCH_NAME"
echo ""
echo "3. Your app will be available at: https://$APP_ID.amplifyapp.com"
echo ""
echo "🔧 Environment Variables are already configured:"
echo "   - AURORA_DSQL_HOST: tfthqqgcj6tcmvrwthlasn2rm4.dsql.us-west-2.on.aws"
echo "   - AURORA_DSQL_PORT: 5432"
echo "   - AURORA_DSQL_DATABASE: postgres"
echo "   - AURORA_DSQL_IAM_ROLE_ARN: admin"
echo "   - USE_AURORA_DSQL: true"
echo "   - FALLBACK_TO_SUPABASE: false"
echo ""
echo "✅ Setup Complete! Your app is ready for deployment."
