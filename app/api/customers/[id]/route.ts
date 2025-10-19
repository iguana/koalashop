import { type NextRequest, NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const sql = `SELECT * FROM customers WHERE id = $1`
    const { data: customers, error } = await queryAurora(sql, [id])

    if (error) {
      console.error("Error fetching customer:", error)
      return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer: customers[0] })
  } catch (error) {
    console.error("Error in customer fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, phone, address } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const now = new Date().toISOString()

    const sql = `
      UPDATE customers 
      SET name = $1, email = $2, phone = $3, address = $4, updated_at = $5
      WHERE id = $6
      RETURNING *
    `

    const { data: customers, error } = await queryAurora(sql, [
      name,
      email || null,
      phone || null,
      address || null,
      now,
      id,
    ])

    if (error) {
      console.error("Error updating customer:", error)
      return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ customer: customers[0] })
  } catch (error) {
    console.error("Error in customer update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const sql = `DELETE FROM customers WHERE id = $1 RETURNING *`
    const { data: customers, error } = await queryAurora(sql, [id])

    if (error) {
      console.error("Error deleting customer:", error)
      return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 })
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Customer deleted successfully" })
  } catch (error) {
    console.error("Error in customer deletion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
