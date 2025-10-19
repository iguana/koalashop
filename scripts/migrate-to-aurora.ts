#!/usr/bin/env node

/**
 * Data Migration Script: Supabase to Aurora DSQL
 * 
 * This script helps migrate data from Supabase to Aurora DSQL.
 * Run this script after setting up your Aurora DSQL cluster.
 */

import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'
import { Signer } from '@aws-sdk/rds-signer'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const AURORA_HOST = process.env.AURORA_DSQL_HOST
const AURORA_PORT = parseInt(process.env.AURORA_DSQL_PORT || '5432')
const AURORA_DATABASE = process.env.AURORA_DSQL_DATABASE || 'postgres'
const AWS_REGION = process.env.AWS_REGION || 'us-east-1'
const AURORA_IAM_ROLE_ARN = process.env.AURORA_DSQL_IAM_ROLE_ARN

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

if (!AURORA_HOST) {
  console.error('Missing Aurora DSQL configuration')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Initialize Aurora DSQL connection
const createAuroraPool = () => {
  const poolConfig: any = {
    host: AURORA_HOST,
    port: AURORA_PORT,
    database: AURORA_DATABASE,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }

  if (AURORA_IAM_ROLE_ARN) {
    const signer = new Signer({
      region: AWS_REGION,
      hostname: AURORA_HOST,
      port: AURORA_PORT,
      username: AURORA_IAM_ROLE_ARN,
    })

    poolConfig.password = async () => {
      const token = await signer.getAuthToken()
      return token
    }
  }

  return new Pool(poolConfig)
}

const auroraPool = createAuroraPool()

// Migration functions
async function migrateCustomers() {
  console.log('🔄 Migrating customers...')
  
  try {
    // Fetch from Supabase
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at')

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    if (!customers || customers.length === 0) {
      console.log('✅ No customers to migrate')
      return
    }

    // Insert into Aurora DSQL
    for (const customer of customers) {
      await auroraPool.query(
        `INSERT INTO customers (id, name, email, phone, address, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         address = EXCLUDED.address,
         updated_at = EXCLUDED.updated_at`,
        [
          customer.id,
          customer.name,
          customer.email,
          customer.phone,
          customer.address,
          customer.created_at,
          customer.updated_at
        ]
      )
    }

    console.log(`✅ Migrated ${customers.length} customers`)
  } catch (error) {
    console.error('❌ Error migrating customers:', error)
    throw error
  }
}

async function migrateProducts() {
  console.log('🔄 Migrating products...')
  
  try {
    // Fetch from Supabase
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at')

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    if (!products || products.length === 0) {
      console.log('✅ No products to migrate')
      return
    }

    // Insert into Aurora DSQL
    for (const product of products) {
      await auroraPool.query(
        `INSERT INTO products (id, name, description, unit_price, created_at) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         unit_price = EXCLUDED.unit_price`,
        [
          product.id,
          product.name,
          product.description,
          product.unit_price,
          product.created_at
        ]
      )
    }

    console.log(`✅ Migrated ${products.length} products`)
  } catch (error) {
    console.error('❌ Error migrating products:', error)
    throw error
  }
}

async function migrateOrders() {
  console.log('🔄 Migrating orders...')
  
  try {
    // Fetch from Supabase
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at')

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    if (!orders || orders.length === 0) {
      console.log('✅ No orders to migrate')
      return
    }

    // Insert into Aurora DSQL
    for (const order of orders) {
      await auroraPool.query(
        `INSERT INTO orders (id, customer_id, order_name, total_amount, status, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET
         customer_id = EXCLUDED.customer_id,
         order_name = EXCLUDED.order_name,
         total_amount = EXCLUDED.total_amount,
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at`,
        [
          order.id,
          order.customer_id,
          order.order_name,
          order.total_amount,
          order.status,
          order.created_at,
          order.updated_at
        ]
      )
    }

    console.log(`✅ Migrated ${orders.length} orders`)
  } catch (error) {
    console.error('❌ Error migrating orders:', error)
    throw error
  }
}

async function migrateOrderItems() {
  console.log('🔄 Migrating order items...')
  
  try {
    // Fetch from Supabase
    const { data: orderItems, error } = await supabase
      .from('order_items')
      .select('*')
      .order('created_at')

    if (error) {
      throw new Error(`Supabase error: ${error.message}`)
    }

    if (!orderItems || orderItems.length === 0) {
      console.log('✅ No order items to migrate')
      return
    }

    // Insert into Aurora DSQL
    for (const item of orderItems) {
      await auroraPool.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, weight_oz, unit_price, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         ON CONFLICT (id) DO UPDATE SET
         order_id = EXCLUDED.order_id,
         product_id = EXCLUDED.product_id,
         quantity = EXCLUDED.quantity,
         weight_oz = EXCLUDED.weight_oz,
         unit_price = EXCLUDED.unit_price`,
        [
          item.id,
          item.order_id,
          item.product_id,
          item.quantity,
          item.weight_oz,
          item.unit_price,
          item.created_at
        ]
      )
    }

    console.log(`✅ Migrated ${orderItems.length} order items`)
  } catch (error) {
    console.error('❌ Error migrating order items:', error)
    throw error
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...')
  
  try {
    // Count records in Aurora DSQL
    const customersResult = await auroraPool.query('SELECT COUNT(*) FROM customers')
    const productsResult = await auroraPool.query('SELECT COUNT(*) FROM products')
    const ordersResult = await auroraPool.query('SELECT COUNT(*) FROM orders')
    const orderItemsResult = await auroraPool.query('SELECT COUNT(*) FROM order_items')

    console.log('📊 Migration Summary:')
    console.log(`  Customers: ${customersResult.rows[0].count}`)
    console.log(`  Products: ${productsResult.rows[0].count}`)
    console.log(`  Orders: ${ordersResult.rows[0].count}`)
    console.log(`  Order Items: ${orderItemsResult.rows[0].count}`)

    // Verify some sample data
    const sampleCustomer = await auroraPool.query('SELECT * FROM customers LIMIT 1')
    if (sampleCustomer.rows.length > 0) {
      console.log('✅ Sample customer data verified')
    }

    console.log('✅ Migration verification completed')
  } catch (error) {
    console.error('❌ Error verifying migration:', error)
    throw error
  }
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Supabase to Aurora DSQL migration...')
  
  try {
    // Test Aurora DSQL connection
    await auroraPool.query('SELECT 1')
    console.log('✅ Aurora DSQL connection successful')

    // Run migrations in order
    await migrateCustomers()
    await migrateProducts()
    await migrateOrders()
    await migrateOrderItems()
    
    // Verify migration
    await verifyMigration()
    
    console.log('🎉 Migration completed successfully!')
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  } finally {
    await auroraPool.end()
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration()
}

export { runMigration }
