import { NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"

export async function GET() {
  try {
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
