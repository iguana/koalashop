import { type NextRequest, NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: "POST to this endpoint to run the migration",
    instructions: "Send a POST request to /api/migrate-units to add the units column"
  })
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Starting units column migration...')
    
    // Check if units column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'units'
    `
    
    const { data: columns, error: checkError } = await queryAurora(checkQuery)
    
    if (checkError) {
      console.error('❌ Error checking columns:', checkError)
      return NextResponse.json({ error: "Failed to check columns", details: checkError.message }, { status: 500 })
    }
    
    if (columns && columns.length > 0) {
      console.log('✅ Units column already exists!')
      return NextResponse.json({ message: "Units column already exists", success: true })
    }
    
    console.log('📝 Adding units column to products table...')
    
    // Add the units column (Aurora DSQL compatible)
    const addColumnQuery = `
      ALTER TABLE products 
      ADD COLUMN units VARCHAR(10)
    `
    
    const { error: addError } = await queryAurora(addColumnQuery)
    
    if (addError) {
      console.error('❌ Error adding units column:', addError)
      return NextResponse.json({ error: "Failed to add units column", details: addError.message }, { status: 500 })
    }
    
    console.log('✅ Successfully added units column!')
    
    // Set default value for existing rows
    console.log('📝 Setting default values...')
    const updateQuery = `
      UPDATE products 
      SET units = 'oz' 
      WHERE units IS NULL
    `
    
    const { error: updateError } = await queryAurora(updateQuery)
    
    if (updateError) {
      console.log('⚠️  Warning: Could not update existing rows:', updateError.message)
    } else {
      console.log('✅ Successfully set default values!')
    }
    
    // Set default for new rows
    console.log('📝 Setting column default...')
    const defaultQuery = `
      ALTER TABLE products 
      ALTER COLUMN units SET DEFAULT 'oz'
    `
    
    const { error: defaultError } = await queryAurora(defaultQuery)
    
    if (defaultError) {
      console.log('⚠️  Warning: Could not set default:', defaultError.message)
    } else {
      console.log('✅ Successfully set column default!')
    }
    
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
    
    const updateExistingQuery = `
      UPDATE products 
      SET units = 'oz' 
      WHERE units IS NULL OR units = ''
    `
    
    const { error: updateExistingError } = await queryAurora(updateExistingQuery)
    
    if (updateExistingError) {
      console.error('❌ Error updating existing products:', updateExistingError)
      return NextResponse.json({ error: "Failed to update existing products", details: updateExistingError.message }, { status: 500 })
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
      return NextResponse.json({ error: "Failed to verify migration", details: verifyError.message }, { status: 500 })
    }
    
    console.log('✅ Migration verification successful!')
    console.log('📋 Sample products:')
    products.forEach(product => {
      console.log(`  - ${product.name}: $${product.unit_price}/${product.units}`)
    })
    
    console.log('🎉 Migration completed successfully!')
    
    return NextResponse.json({ 
      message: "Migration completed successfully!", 
      success: true,
      sampleProducts: products
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
