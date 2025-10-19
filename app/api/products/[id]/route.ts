import { type NextRequest, NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const sql = `SELECT * FROM products WHERE id = $1`
    const { data: products, error } = await queryAurora(sql, [id])

    if (error) {
      console.error("Error fetching product:", error)
      return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ product: products[0] })
  } catch (error) {
    console.error("Error in product fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    console.log('PUT /api/products/[id] - Request body:', JSON.stringify(body, null, 2))
    console.log('PUT /api/products/[id] - Product ID:', id)
    
    const { name, description, unit_price, units } = body

    if (!name || unit_price === undefined) {
      console.log('PUT /api/products/[id] - Validation failed: name or unit_price missing')
      return NextResponse.json({ error: "Name and unit_price are required" }, { status: 400 })
    }

    // Default to 'oz' if units not provided
    const productUnits = units || 'oz'
    console.log('PUT /api/products/[id] - Using units:', productUnits)
    console.log('PUT /api/products/[id] - Unit price type:', typeof unit_price, 'value:', unit_price)

    // Check if units column exists, if not, use the old schema
    const checkUnitsColumn = `SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'units'`
    console.log('PUT /api/products/[id] - Checking for units column...')
    const { data: columns, error: columnError } = await queryAurora(checkUnitsColumn)
    
    if (columnError) {
      console.error('PUT /api/products/[id] - Error checking columns:', columnError)
    }
    console.log('PUT /api/products/[id] - Columns check result:', columns)
    
    let sql: string
    let queryParams: any[]
    
    if (columns && columns.length > 0) {
      // Units column exists, use new schema
      console.log('PUT /api/products/[id] - Using new schema with units column')
      sql = `
        UPDATE products 
        SET name = $1, description = $2, unit_price = $3, units = $4
        WHERE id = $5
        RETURNING *
      `
      queryParams = [name, description || null, unit_price, productUnits, id]
    } else {
      // Units column doesn't exist, use old schema
      console.log('PUT /api/products/[id] - Using old schema without units column')
      sql = `
        UPDATE products 
        SET name = $1, description = $2, unit_price = $3
        WHERE id = $4
        RETURNING *
      `
      queryParams = [name, description || null, unit_price, id]
    }

    console.log('PUT /api/products/[id] - Executing SQL:', sql)
    console.log('PUT /api/products/[id] - Parameters:', queryParams)

    const { data: products, error } = await queryAurora(sql, queryParams)

    if (error) {
      console.error('PUT /api/products/[id] - Database error:', error)
      console.error('PUT /api/products/[id] - Error details:', JSON.stringify(error, null, 2))
      return NextResponse.json({ error: "Failed to update product", details: error.message }, { status: 500 })
    }

    if (!products || products.length === 0) {
      console.log('PUT /api/products/[id] - No product found with ID:', id)
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    console.log('PUT /api/products/[id] - Successfully updated product:', products[0])
    return NextResponse.json({ product: products[0] })
  } catch (error) {
    console.error('PUT /api/products/[id] - Unexpected error:', error)
    console.error('PUT /api/products/[id] - Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const sql = `DELETE FROM products WHERE id = $1 RETURNING *`
    const { data: products, error } = await queryAurora(sql, [id])

    if (error) {
      console.error("Error deleting product:", error)
      return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
    }

    if (!products || products.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error in product deletion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
