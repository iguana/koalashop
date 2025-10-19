import { type NextRequest, NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"
import { randomUUID } from "crypto"

export async function GET() {
  try {
    // Check if we need to run migration first
    console.log('🔍 Checking for units column...')
    const checkUnitsColumn = `SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'units'`
    const { data: columns } = await queryAurora(checkUnitsColumn)
    console.log('📋 Columns check result:', columns)
    
    if (!columns || columns.length === 0) {
      console.log('🔧 Units column missing, running migration...')
      
      try {
        // Add the units column (without NOT NULL first)
        await queryAurora(`ALTER TABLE products ADD COLUMN units VARCHAR(10) DEFAULT 'oz'`)
        console.log('✅ Added units column')
        
        // Make it NOT NULL
        try {
          await queryAurora(`ALTER TABLE products ALTER COLUMN units SET NOT NULL`)
          console.log('✅ Set units column to NOT NULL')
        } catch (e) {
          console.log('⚠️ Could not set NOT NULL:', e.message)
        }
        
        // Add constraint
        try {
          await queryAurora(`ALTER TABLE products ADD CONSTRAINT check_units CHECK (units IN ('oz', 'each', 'lbs', 'grams'))`)
          console.log('✅ Added check constraint')
        } catch (e) {
          console.log('⚠️ Constraint may already exist')
        }
        
        // Update existing products
        await queryAurora(`UPDATE products SET units = 'oz' WHERE units IS NULL OR units = ''`)
        console.log('✅ Updated existing products')
        
        console.log('🎉 Migration completed!')
      } catch (migrationError) {
        console.error('❌ Migration failed:', migrationError)
      }
    }
    
    const sql = `SELECT * FROM products ORDER BY name`
    const { data: products, error } = await queryAurora(sql)

    if (error) {
      console.error("Error fetching products:", error)
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
    }

    return NextResponse.json({ products: products || [] })
  } catch (error) {
    console.error("Error in products fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/products - Request body:', JSON.stringify(body, null, 2))
    
    const { name, description, unit_price, units } = body

    if (!name || unit_price === undefined) {
      console.log('POST /api/products - Validation failed: name or unit_price missing')
      return NextResponse.json({ error: "Name and unit_price are required" }, { status: 400 })
    }

    // Default to 'oz' if units not provided
    const productUnits = units || 'oz'
    console.log('POST /api/products - Using units:', productUnits)
    console.log('POST /api/products - Unit price type:', typeof unit_price, 'value:', unit_price)

    const id = randomUUID()
    const now = new Date().toISOString()
    console.log('POST /api/products - Generated ID:', id)

    // Check if units column exists, if not, use the old schema
    const checkUnitsColumn = `SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'units'`
    console.log('POST /api/products - Checking for units column...')
    const { data: columns, error: columnError } = await queryAurora(checkUnitsColumn)
    
    if (columnError) {
      console.error('POST /api/products - Error checking columns:', columnError)
    }
    console.log('POST /api/products - Columns check result:', columns)
    
    let sql: string
    let queryParams: any[]
    
    if (columns && columns.length > 0) {
      // Units column exists, use new schema
      console.log('POST /api/products - Using new schema with units column')
      sql = `
        INSERT INTO products (id, name, description, unit_price, units, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `
      queryParams = [id, name, description || null, unit_price, productUnits, now]
    } else {
      // Units column doesn't exist, use old schema
      console.log('POST /api/products - Using old schema without units column')
      sql = `
        INSERT INTO products (id, name, description, unit_price, created_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `
      queryParams = [id, name, description || null, unit_price, now]
    }

    console.log('POST /api/products - Executing SQL:', sql)
    console.log('POST /api/products - Parameters:', queryParams)

    const { data: products, error } = await queryAurora(sql, queryParams)

    if (error) {
      console.error('POST /api/products - Database error:', error)
      console.error('POST /api/products - Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: "Failed to create product", details: error.message }, { status: 500 })
    }

    console.log('POST /api/products - Successfully created product:', products?.[0])
    return NextResponse.json({ product: products?.[0] })
  } catch (error) {
    console.error('POST /api/products - Unexpected error:', error)
    console.error('POST /api/products - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
