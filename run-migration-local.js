#!/usr/bin/env node

// Load environment variables from .env.local
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && !key.startsWith('#')) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

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

// Create Aurora DSQL connection pool with IAM authentication
async function createAuroraPool() {
  const config = getAuroraConfig();
  
  // Generate auth token using AWS CLI
  const clusterId = config.host.split('.')[0];
  const command = `aws dsql generate-db-connect-admin-auth-token --hostname ${config.host} --region ${config.region}`;
  
  try {
    const { stdout } = await execAsync(command);
    const authToken = stdout.trim();
    
    const poolConfig = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: 'admin',
      password: authToken,
      ssl: { rejectUnauthorized: false },
      max: 1
    };
    
    const pool = new Pool(poolConfig);
    return pool;
  } catch (error) {
    console.error('❌ Failed to create Aurora DSQL connection:', error.message);
    throw error;
  }
}

// Query function
async function queryAurora(pool, sql, params = []) {
  try {
    const result = await pool.query(sql, params);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Run the migration
async function runMigration() {
  let pool;
  
  try {
    console.log('🚀 Starting units column migration...');
    
    // Create database connection
    console.log('🔌 Connecting to Aurora DSQL...');
    pool = await createAuroraPool();
    
    // Check if units column exists
    console.log('🔍 Checking if units column exists...');
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'units'
    `;
    
    const { data: columns, error: checkError } = await queryAurora(pool, checkQuery);
    
    if (checkError) {
      console.error('❌ Error checking columns:', checkError.message);
      return;
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Units column already exists!');
      return;
    }
    
    // Add the units column
    console.log('📝 Adding units column to products table...');
    const addColumnQuery = `
      ALTER TABLE products 
      ADD COLUMN units VARCHAR(10) NOT NULL DEFAULT 'oz'
    `;
    
    const { error: addError } = await queryAurora(pool, addColumnQuery);
    
    if (addError) {
      console.error('❌ Error adding units column:', addError.message);
      return;
    }
    
    console.log('✅ Successfully added units column!');
    
    // Add check constraint
    console.log('📝 Adding check constraint...');
    const constraintQuery = `
      ALTER TABLE products 
      ADD CONSTRAINT check_units 
      CHECK (units IN ('oz', 'each', 'lbs', 'grams'))
    `;
    
    const { error: constraintError } = await queryAurora(pool, constraintQuery);
    
    if (constraintError) {
      console.log('⚠️  Warning: Could not add constraint (may already exist):', constraintError.message);
    } else {
      console.log('✅ Successfully added check constraint!');
    }
    
    // Update existing products to have 'oz' as default
    console.log('📝 Updating existing products...');
    const updateQuery = `
      UPDATE products 
      SET units = 'oz' 
      WHERE units IS NULL OR units = ''
    `;
    
    const { error: updateError } = await queryAurora(pool, updateQuery);
    
    if (updateError) {
      console.error('❌ Error updating existing products:', updateError.message);
      return;
    }
    
    console.log('✅ Successfully updated existing products!');
    
    // Verify the migration
    console.log('🔍 Verifying migration...');
    const verifyQuery = `
      SELECT id, name, unit_price, units, created_at 
      FROM products 
      LIMIT 3
    `;
    
    const { data: products, error: verifyError } = await queryAurora(pool, verifyQuery);
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError.message);
      return;
    }
    
    console.log('✅ Migration verification successful!');
    console.log('📋 Sample products:');
    products.forEach(product => {
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
