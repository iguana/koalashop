import { type NextRequest, NextResponse } from "next/server"
import { queryAurora, withTransaction } from "@/lib/aurora/client"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    const sql = `
      SELECT 
        o.*,
        c.name as customer_name,
        c.email as customer_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `
    const { data: orders, error } = await queryAurora(sql, [id])

    if (error) {
      console.error("Error fetching order:", error)
      return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 })
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const order = orders[0]

    // Get order items
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
    
    const { data: items, error: itemsError } = await queryAurora(itemsSql, [id])
    
    if (itemsError) {
      console.error("Error fetching order items:", itemsError)
      return NextResponse.json({ error: "Failed to fetch order items" }, { status: 500 })
    }

    const orderWithItems = {
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
    }

    return NextResponse.json({ order: orderWithItems })
  } catch (error) {
    console.error("Error in order fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { customer_id, order_name, order_items, status } = body

    if (!customer_id || !order_name || !order_items || order_items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Use transaction to ensure data consistency
    const { data: order, error } = await withTransaction(async (client) => {
      // Calculate total amount
      const total_amount = order_items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.weight_oz * item.unit_price)
      }, 0)

      // Update the order
      const orderResult = await client.query(
        `UPDATE orders 
         SET customer_id = $1, order_name = $2, total_amount = $3, status = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [customer_id, order_name, total_amount, status || "pending", id]
      )

      if (orderResult.rows.length === 0) {
        throw new Error("Order not found")
      }

      const order = orderResult.rows[0]

      // Delete existing order items
      await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id])

      // Insert new order items
      for (const item of order_items) {
        const itemId = crypto.randomUUID()
        await client.query(
          `INSERT INTO order_items (id, order_id, product_id, quantity, weight_oz, unit_price, total_price) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            itemId,
            id,
            item.product_id,
            item.quantity,
            item.weight_oz || 0,
            item.unit_price,
            item.quantity * item.weight_oz * item.unit_price
          ]
        )
      }

      return order
    })

    if (error) {
      console.error("Error updating order:", error)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error in order update:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    // Use transaction to ensure data consistency
    const { data: order, error } = await withTransaction(async (client) => {
      // Delete order items first
      await client.query(`DELETE FROM order_items WHERE order_id = $1`, [id])
      
      // Delete the order
      const result = await client.query(`DELETE FROM orders WHERE id = $1 RETURNING *`, [id])
      
      if (result.rows.length === 0) {
        throw new Error("Order not found")
      }
      
      return result.rows[0]
    })

    if (error) {
      console.error("Error deleting order:", error)
      return NextResponse.json({ error: "Failed to delete order" }, { status: 500 })
    }

    return NextResponse.json({ message: "Order deleted successfully" })
  } catch (error) {
    console.error("Error in order deletion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
