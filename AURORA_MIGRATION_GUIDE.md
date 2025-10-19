# Aurora DSQL Migration Guide

## Overview
This guide will help you migrate your KoalaShop application from Supabase to Amazon Aurora DSQL.

## Prerequisites

1. **AWS Account** with Aurora DSQL access
2. **IAM Role** configured for Aurora DSQL authentication
3. **Aurora DSQL Cluster** created and running

## Step 1: Set up Aurora DSQL Cluster

### 1.1 Create Aurora DSQL Cluster
```bash
aws dsql create-cluster \
  --cluster-name koalashop-cluster \
  --region us-east-1 \
  --engine aurora-postgresql \
  --engine-version 15.4
```

### 1.2 Configure IAM Role
Create an IAM role with the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dsql:DbConnect",
        "dsql:GetCluster"
      ],
      "Resource": "arn:aws:dsql:us-east-1:123456789012:cluster/koalashop-cluster"
    }
  ]
}
```

## Step 2: Environment Configuration

Create a `.env.local` file with the following variables:

```env
# Aurora DSQL Connection Details
AURORA_DSQL_HOST=your-aurora-dsql-cluster-endpoint.region.rds.amazonaws.com
AURORA_DSQL_PORT=5432
AURORA_DSQL_DATABASE=postgres

# AWS Configuration
AWS_REGION=us-east-1
AURORA_DSQL_IAM_ROLE_ARN=arn:aws:iam::123456789012:role/koalashop-app-role

# Migration Settings
USE_AURORA_DSQL=true
FALLBACK_TO_SUPABASE=false
```

## Step 3: Database Setup

### 3.1 Connect to Aurora DSQL
Use the AWS CLI to generate an authentication token:

```bash
aws dsql generate-auth-token \
  --cluster-identifier koalashop-cluster \
  --region us-east-1
```

### 3.2 Create Database Schema
Run the Aurora DSQL schema script:

```bash
psql "host=your-cluster-endpoint port=5432 dbname=postgres user=your-iam-role sslmode=require" \
  -f scripts/01-create-aurora-tables.sql
```

### 3.3 Seed Sample Data
```bash
psql "host=your-cluster-endpoint port=5432 dbname=postgres user=your-iam-role sslmode=require" \
  -f scripts/02-seed-aurora-data.sql
```

## Step 4: Install Dependencies

```bash
pnpm install
```

This will install the required packages:
- `pg` - PostgreSQL client for Node.js
- `@aws-sdk/rds-signer` - AWS RDS authentication
- `@types/pg` - TypeScript types for pg

## Step 5: Database Role Configuration

### 5.1 Create Database Role
Connect to your Aurora DSQL cluster and create a custom database role:

```sql
-- Connect as admin role first
CREATE ROLE koalashop_app;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO koalashop_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO koalashop_app;

-- Associate with IAM role
AWS IAM GRANT koalashop_app TO 'arn:aws:iam::123456789012:role/koalashop-app-role';
```

## Step 6: Data Migration

### 6.1 Export Data from Supabase
```bash
# Export customers
pg_dump "postgresql://postgres:[password]@[supabase-host]:5432/postgres" \
  --table=customers --data-only --inserts > customers_export.sql

# Export products
pg_dump "postgresql://postgres:[password]@[supabase-host]:5432/postgres" \
  --table=products --data-only --inserts > products_export.sql

# Export orders
pg_dump "postgresql://postgres:[password]@[supabase-host]:5432/postgres" \
  --table=orders --data-only --inserts > orders_export.sql

# Export order_items
pg_dump "postgresql://postgres:[password]@[supabase-host]:5432/postgres" \
  --table=order_items --data-only --inserts > order_items_export.sql
```

### 6.2 Import Data to Aurora DSQL
```bash
# Import each table
psql "host=your-cluster-endpoint port=5432 dbname=postgres user=your-iam-role sslmode=require" \
  -f customers_export.sql

psql "host=your-cluster-endpoint port=5432 dbname=postgres user=your-iam-role sslmode=require" \
  -f products_export.sql

psql "host=your-cluster-endpoint port=5432 dbname=postgres user=your-iam-role sslmode=require" \
  -f orders_export.sql

psql "host=your-cluster-endpoint port=5432 dbname=postgres user=your-iam-role sslmode=require" \
  -f order_items_export.sql
```

## Step 7: Testing

### 7.1 Start Development Server
```bash
pnpm dev
```

### 7.2 Test API Endpoints
- Customer search: `GET /api/customers/search?q=john`
- Products: `GET /api/products`
- Customer orders: `GET /api/customers/[id]/orders`
- Create order: `POST /api/orders`

## Step 8: Deployment

### 8.1 Update Deployment Environment Variables
Add the Aurora DSQL environment variables to your deployment platform (Vercel, etc.)

### 8.2 Deploy Application
```bash
pnpm build
pnpm start
```

## Troubleshooting

### Common Issues

1. **Connection Issues**
   - Verify Aurora DSQL cluster is running
   - Check IAM role permissions
   - Ensure security groups allow connections

2. **Authentication Errors**
   - Verify IAM role ARN is correct
   - Check AWS credentials are configured
   - Ensure database role is properly associated

3. **Query Errors**
   - Check PostgreSQL syntax compatibility
   - Verify table names and column names
   - Test queries directly in psql

### Debugging

Enable debug logging by setting:
```env
DEBUG=aurora:*
```

## Rollback Plan

If you need to rollback to Supabase:

1. Set `USE_AURORA_DSQL=false` in environment variables
2. Ensure Supabase environment variables are still configured
3. The application will automatically fall back to Supabase

## Security Considerations

1. **IAM Roles**: Use least privilege principle
2. **Network Security**: Configure VPC and security groups
3. **Encryption**: Enable encryption at rest and in transit
4. **Monitoring**: Set up CloudWatch monitoring
5. **Backups**: Configure automated backups

## Performance Optimization

1. **Connection Pooling**: Configure appropriate pool size
2. **Indexes**: Monitor and optimize database indexes
3. **Query Optimization**: Use EXPLAIN ANALYZE for slow queries
4. **Caching**: Implement application-level caching where appropriate

## Cost Optimization

1. **Instance Sizing**: Right-size your Aurora DSQL cluster
2. **Storage**: Monitor storage usage and costs
3. **Backup Retention**: Optimize backup retention periods
4. **Monitoring**: Use AWS Cost Explorer to track expenses
