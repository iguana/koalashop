import { type NextRequest, NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"
import { randomUUID } from "crypto"

export async function GET() {
  try {
    const sql = `SELECT * FROM customers ORDER BY name`
    const { data: customers, error } = await queryAurora(sql)

    if (error) {
      console.error("Error fetching customers:", error)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    return NextResponse.json({ customers: customers || [] })
  } catch (error) {
    console.error("Error in customers fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, address } = body

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const id = randomUUID()
    const now = new Date().toISOString()

    const sql = `
      INSERT INTO customers (id, name, email, phone, address, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `

    const { data: customer, error } = await queryAurora(sql, [
      id,
      name,
      email || null,
      phone || null,
      address || null,
      now,
      now,
    ])

    if (error) {
      console.error("Error creating customer:", error)
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
    }

    return NextResponse.json({ customer: customer?.[0] })
  } catch (error) {
    console.error("Error in customer creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
