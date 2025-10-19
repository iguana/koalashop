import { type NextRequest, NextResponse } from "next/server"
import { withTransaction } from "@/lib/aurora/client"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, order_name, order_items } = body

    if (!customer_id || !order_name || !order_items || order_items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use transaction to ensure data consistency
    const { data: order, error } = await withTransaction(async (client) => {
      // Calculate total amount
      const total_amount = order_items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.weight_oz * item.unit_price)
      }, 0)

      // Generate UUIDs for the order and order items
      const orderId = randomUUID()
      const orderItemsWithIds = order_items.map((item: any) => ({
        id: randomUUID(),
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        weight_oz: item.weight_oz,
        unit_price: item.unit_price,
        total_price: item.quantity * item.weight_oz * item.unit_price
      }))

      // Create the order
      const orderResult = await client.query(
        `INSERT INTO orders (id, customer_id, order_name, total_amount, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [orderId, customer_id, order_name, total_amount, "pending"]
      )

      const order = orderResult.rows[0]

      // Insert all order items
      for (const item of orderItemsWithIds) {
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, quantity, weight_oz, unit_price, total_price) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.id, item.order_id, item.product_id, item.quantity, item.weight_oz, item.unit_price, item.total_price]
        )
      }

      return order
    })

    if (error) {
      console.error("Error creating order:", error)
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error in order creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
