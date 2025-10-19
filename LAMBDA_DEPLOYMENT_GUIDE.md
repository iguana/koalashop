# Lambda Deployment Guide

## Overview
This guide will help you deploy the KoalaShop Lambda function to AWS and configure it with API Gateway.

## Prerequisites
- AWS CLI configured with appropriate permissions
- AWS account with Lambda and API Gateway access
- Environment variables for Aurora DSQL connection

## Step 1: Deploy Lambda Function

### Option A: Using AWS Console (Recommended for first deployment)

1. **Create Lambda Function**:
   - Go to AWS Lambda Console
   - Click "Create function"
   - Choose "Author from scratch"
   - Function name: `koalashop-api`
   - Runtime: `Node.js 20.x`
   - Architecture: `x86_64`
   - Click "Create function"

2. **Upload Code**:
   - In the function code section, click "Upload from" → ".zip file"
   - Upload the `lambda/api.zip` file created by the build process
   - Click "Save"

3. **Configure Handler**:
   - Set Handler to: `api.handler`
   - Runtime: `Node.js 20.x`

4. **Set Environment Variables**:
   ```
   AURORA_DSQL_HOST=your-aurora-host
   AURORA_DSQL_PORT=5432
   AURORA_DSQL_DATABASE=your-database-name
   AURORA_DSQL_REGION=us-west-1
   ```

5. **Configure IAM Role**:
   - The Lambda execution role needs permissions for:
     - `rds-db:connect` (for Aurora DSQL)
     - CloudWatch Logs (for logging)

### Option B: Using AWS CLI

```bash
# Create the Lambda function
aws lambda create-function \
  --function-name koalashop-api \
  --runtime nodejs20.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler api.handler \
  --zip-file fileb://lambda/api.zip \
  --environment Variables='{
    "AURORA_DSQL_HOST":"your-aurora-host",
    "AURORA_DSQL_PORT":"5432",
    "AURORA_DSQL_DATABASE":"your-database-name",
    "AURORA_DSQL_REGION":"us-west-1"
  }'
```

## Step 2: Create API Gateway

1. **Create REST API**:
   - Go to API Gateway Console
   - Click "Create API"
   - Choose "REST API" → "Build"
   - API name: `koalashop-api`
   - Description: `KoalaShop API Gateway`
   - Click "Create API"

2. **Create Resources**:
   - Create the following resources:
     - `/api`
     - `/api/products`
     - `/api/customers`
     - `/api/orders`
     - `/api/debug`

3. **Configure Methods**:
   - For each resource, add methods:
     - `GET` for listing resources
     - `POST` for creating resources
     - `PUT` for updating resources
     - `DELETE` for deleting resources

4. **Set up Lambda Integration**:
   - For each method, set Integration type to "Lambda Function"
   - Lambda Function: `koalashop-api`
   - Use Lambda Proxy integration: ✅

5. **Deploy API**:
   - Click "Actions" → "Deploy API"
   - Deployment stage: `prod`
   - Click "Deploy"

## Step 3: Update Frontend Configuration

Update `lib/api-config.ts` with your API Gateway URL:

```typescript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://YOUR_API_GATEWAY_ID.execute-api.us-west-1.amazonaws.com/prod' // Replace with your actual API Gateway URL
  : 'http://localhost:3000/api';
```

## Step 4: Test the Deployment

1. **Test Lambda Function**:
   ```bash
   aws lambda invoke \
     --function-name koalashop-api \
     --payload '{"path":"/api/debug","httpMethod":"GET"}' \
     response.json
   ```

2. **Test API Gateway**:
   ```bash
   curl https://YOUR_API_GATEWAY_ID.execute-api.us-west-1.amazonaws.com/prod/api/debug
   ```

3. **Test Frontend**:
   - Deploy the updated frontend to Amplify
   - Verify that the application can connect to the Lambda backend

## Step 5: Configure CORS (if needed)

If you encounter CORS issues, add CORS headers to your Lambda function responses:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
};
```

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Verify Aurora DSQL is running
   - Check environment variables
   - Ensure Lambda has proper IAM permissions

2. **API Gateway Errors**:
   - Check Lambda function logs in CloudWatch
   - Verify API Gateway integration settings
   - Test Lambda function directly

3. **CORS Issues**:
   - Add CORS headers to Lambda responses
   - Configure API Gateway CORS settings

### Monitoring:

- **CloudWatch Logs**: Monitor Lambda function execution
- **API Gateway Logs**: Monitor API requests and responses
- **X-Ray**: Enable for detailed tracing (optional)

## Next Steps

1. Deploy the Lambda function using the steps above
2. Update the API configuration with your actual API Gateway URL
3. Deploy the updated frontend to Amplify
4. Test the complete application

The static frontend will now communicate with your Lambda backend through API Gateway, resolving the 500 errors you were experiencing.
