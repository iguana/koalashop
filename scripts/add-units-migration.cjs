#!/usr/bin/env node

const { queryAurora } = require('../lib/aurora/client')

async function addUnitsColumn() {
  try {
    console.log('🔍 Checking if units column exists...')
    
    // Check if units column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'units'
    `
    
    const { data: columns, error: checkError } = await queryAurora(checkQuery)
    
    if (checkError) {
      console.error('❌ Error checking columns:', checkError)
      return
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Units column already exists!')
      return
    }
    
    console.log('📝 Adding units column to products table...')
    
    // Add the units column
    const addColumnQuery = `
      ALTER TABLE products 
      ADD COLUMN units VARCHAR(10) NOT NULL DEFAULT 'oz'
    `
    
    const { error: addError } = await queryAurora(addColumnQuery)
    
    if (addError) {
      console.error('❌ Error adding units column:', addError)
      return
    }
    
    console.log('✅ Successfully added units column!')
    
    // Add check constraint
    console.log('📝 Adding check constraint...')
    
    const constraintQuery = `
      ALTER TABLE products 
      ADD CONSTRAINT check_units 
      CHECK (units IN ('oz', 'each', 'lbs', 'grams'))
    `
    
    const { error: constraintError } = await queryAurora(constraintQuery)
    
    if (constraintError) {
      console.log('⚠️  Warning: Could not add constraint (may already exist):', constraintError.message)
    } else {
      console.log('✅ Successfully added check constraint!')
    }
    
    // Update existing products to have 'oz' as default
    console.log('📝 Updating existing products...')
    
    const updateQuery = `
      UPDATE products 
      SET units = 'oz' 
      WHERE units IS NULL OR units = ''
    `
    
    const { error: updateError } = await queryAurora(updateQuery)
    
    if (updateError) {
      console.error('❌ Error updating existing products:', updateError)
      return
    }
    
    console.log('✅ Successfully updated existing products!')
    
    // Verify the migration
    console.log('🔍 Verifying migration...')
    
    const verifyQuery = `
      SELECT id, name, unit_price, units, created_at 
      FROM products 
      LIMIT 3
    `
    
    const { data: products, error: verifyError } = await queryAurora(verifyQuery)
    
    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError)
      return
    }
    
    console.log('✅ Migration verification successful!')
    console.log('📋 Sample products:')
    products.forEach(product => {
      console.log(`  - ${product.name}: $${product.unit_price}/${product.units}`)
    })
    
    console.log('\n🎉 Migration completed successfully!')
    console.log('💡 You can now use the units feature in your application.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the migration
addUnitsColumn()
