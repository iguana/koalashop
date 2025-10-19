#!/usr/bin/env node

// Load environment variables
require('dotenv').config();

const { Pool } = require('pg');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Aurora DSQL connection configuration
function getAuroraConfig() {
  const host = process.env.AURORA_DSQL_HOST;
  const port = parseInt(process.env.AURORA_DSQL_PORT || '5432');
  const database = process.env.AURORA_DSQL_DATABASE || 'postgres';
  const region = process.env.AWS_REGION || 'us-east-1';
  const iamRoleArn = process.env.AURORA_DSQL_IAM_ROLE_ARN;

  if (!host) {
    throw new Error('AURORA_DSQL_HOST environment variable is required');
  }

  return { host, port, database, region, iamRoleArn };
}

// Get AWS credentials using AWS CLI
async function getAwsCredentials() {
  try {
    const { stdout } = await execAsync('aws sts get-caller-identity --output json');
    const identity = JSON.parse(stdout);
    console.log(`🔐 Using AWS credentials for: ${identity.Arn}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to get AWS credentials:', error.message);
    return false;
  }
}

// Create Aurora DSQL connection
async function createConnection() {
  const config = getAuroraConfig();
  
  // Get AWS credentials
  const hasCredentials = await getAwsCredentials();
  if (!hasCredentials) {
    throw new Error('AWS credentials not available');
  }

  // Generate auth token
  const authCommand = `aws rds generate-db-auth-token --hostname ${config.host} --port ${config.port} --region ${config.region} --username postgres`;
  
  try {
    const { stdout: authToken } = await execAsync(authCommand);
    
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: 'postgres',
      password: authToken.trim(),
      ssl: {
        rejectUnauthorized: false
      },
      max: 1
    });

    return pool;
  } catch (error) {
    console.error('❌ Failed to create database connection:', error.message);
    throw error;
  }
}

// Run the migration
async function runMigration() {
  let pool;
  
  try {
    console.log('🚀 Starting units column migration...');
    
    // Create database connection
    console.log('🔌 Connecting to database...');
    pool = await createConnection();
    
    // Check if units column exists
    console.log('🔍 Checking if units column exists...');
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'units'
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Units column already exists!');
      return;
    }
    
    // Add the units column
    console.log('📝 Adding units column to products table...');
    const addColumnQuery = `
      ALTER TABLE products 
      ADD COLUMN units VARCHAR(10) NOT NULL DEFAULT 'oz'
    `;
    
    await pool.query(addColumnQuery);
    console.log('✅ Successfully added units column!');
    
    // Add check constraint
    console.log('📝 Adding check constraint...');
    const constraintQuery = `
      ALTER TABLE products 
      ADD CONSTRAINT check_units 
      CHECK (units IN ('oz', 'each', 'lbs', 'grams'))
    `;
    
    try {
      await pool.query(constraintQuery);
      console.log('✅ Successfully added check constraint!');
    } catch (error) {
      console.log('⚠️  Warning: Could not add constraint (may already exist):', error.message);
    }
    
    // Update existing products to have 'oz' as default
    console.log('📝 Updating existing products...');
    const updateQuery = `
      UPDATE products 
      SET units = 'oz' 
      WHERE units IS NULL OR units = ''
    `;
    
    await pool.query(updateQuery);
    console.log('✅ Successfully updated existing products!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const verifyQuery = `
      SELECT id, name, unit_price, units, created_at 
      FROM products 
      LIMIT 3
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    
    console.log('✅ Migration verification successful!');
    console.log('📋 Sample products:');
    verifyResult.rows.forEach(product => {
      console.log(`  - ${product.name}: $${product.unit_price}/${product.units}`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('💡 You can now use the units feature in your application.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
