import { type NextRequest, NextResponse } from "next/server"
import { queryAurora, withTransaction } from "@/lib/aurora/client"
import { randomUUID } from "crypto"

export async function GET() {
  try {
    const sql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
    `
    const { data: orders, error } = await queryAurora(sql)

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Get order items for each order
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
        customer: {
          id: order.customer_id,
          name: order.customer_name,
          email: order.customer_email
        },
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
    console.error("Error in orders fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customer_id, order_name, order_items, status = "pending" } = body

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
        weight_oz: item.weight_oz || 0,
        unit_price: item.unit_price,
        total_price: item.quantity * item.weight_oz * item.unit_price
      }))

      // Create the order
      const orderResult = await client.query(
        `INSERT INTO orders (id, customer_id, order_name, total_amount, status) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [orderId, customer_id, order_name, total_amount, status]
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
