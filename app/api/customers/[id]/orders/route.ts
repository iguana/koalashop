import { type NextRequest, NextResponse } from "next/server"
import { queryAurora } from "@/lib/aurora/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // First get the orders
    const ordersSql = `
      SELECT * FROM orders 
      WHERE customer_id = $1 
      ORDER BY created_at DESC 
      LIMIT 10
    `

    const { data: orders, error: ordersError } = await queryAurora(ordersSql, [id])

    if (ordersError) {
      console.error("Error fetching customer orders:", ordersError)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Then get order items for each order
    const ordersWithItems = []
    for (const order of orders || []) {
      const itemsSql = `
        SELECT 
          oi.*,
          p.name as product_name,
          p.description as product_description,
          p.unit_price as product_unit_price
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `
      
      const { data: items, error: itemsError } = await queryAurora(itemsSql, [order.id])
      
      if (itemsError) {
        console.error("Error fetching order items:", itemsError)
        continue
      }

      ordersWithItems.push({
        ...order,
        order_items: items?.map((item: any) => ({
          ...item,
          product: {
            id: item.product_id,
            name: item.product_name,
            description: item.product_description,
            unit_price: item.product_unit_price
          }
        })) || []
      })
    }

    return NextResponse.json({ orders: ordersWithItems })
  } catch (error) {
    console.error("Error in customer orders fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
