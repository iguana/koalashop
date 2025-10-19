import { type NextRequest, NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")

  try {
    let sql: string
    let params: any[] = []

    if (query && query.length >= 2) {
      // Search across name, email, and phone using ILIKE
      sql = `
        SELECT * FROM customers 
        WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1 
        ORDER BY name 
        LIMIT 10
      `
      params = [`%${query}%`]
    } else if (!query) {
      // Return all customers with limit
      sql = `SELECT * FROM customers ORDER BY name LIMIT 50`
      params = []
    } else {
      return NextResponse.json({ customers: [] })
    }

    const { data: customers, error } = await queryAurora(sql, params)

    if (error) {
      console.error("Error searching customers:", error)
      return NextResponse.json({ error: "Failed to search customers" }, { status: 500 })
    }

    return NextResponse.json({ customers: customers || [] })
  } catch (error) {
    console.error("Error in customer search:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
