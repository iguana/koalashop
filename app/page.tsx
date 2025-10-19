"use client"

import { useState } from "react"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import CustomerSearch from "@/components/customer-search"
import OrderDetails from "@/components/order-details"
import NewOrderForm from "@/components/new-order-form"
import type { Customer, Order } from "@/types/database"

export default function HomePage() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerOrders, setCustomerOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [showNewOrder, setShowNewOrder] = useState(false)

  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer)
    setIsLoadingOrders(true)

    try {
      const response = await fetch(`/api/customers/${customer.id}/orders`)
      const data = await response.json()

      if (data.orders) {
        setCustomerOrders(data.orders)
      }
    } catch (error) {
      console.error("Error fetching customer orders:", error)
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const handleBackToSearch = () => {
    setSelectedCustomer(null)
    setCustomerOrders([])
    setSelectedOrder(null)
    setShowNewOrder(false)
  }

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order)
  }

  const handleBackToOrders = () => {
    setSelectedOrder(null)
    setShowNewOrder(false)
  }

  // Added handler for new order creation completion
  const handleOrderCreated = async () => {
    setShowNewOrder(false)
    // Refresh the customer's orders
    if (selectedCustomer) {
      setIsLoadingOrders(true)
      try {
        const response = await fetch(`/api/customers/${selectedCustomer.id}/orders`)
        const data = await response.json()
        if (data.orders) {
          setCustomerOrders(data.orders)
        }
      } catch (error) {
        console.error("Error refreshing customer orders:", error)
      } finally {
        setIsLoadingOrders(false)
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Added new order form view
  if (showNewOrder && selectedCustomer) {
    return <NewOrderForm customer={selectedCustomer} onBack={handleBackToOrders} onOrderCreated={handleOrderCreated} />
  }

  if (selectedOrder && selectedCustomer) {
    return <OrderDetails order={selectedOrder} customer={selectedCustomer} onBack={handleBackToOrders} />
  }

  if (!selectedCustomer) {
    return (
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Smoked Fish Orders</h1>
            <p className="text-muted-foreground">Search for a customer to view or create orders</p>
          </div>

          <CustomerSearch onCustomerSelect={handleCustomerSelect} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="sticky top-16 bg-background border-b border-border p-4 z-40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBackToSearch} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">{selectedCustomer.name}</h1>
            {selectedCustomer.email && (
              <p className="text-sm text-muted-foreground truncate">{selectedCustomer.email}</p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto">
        {/* New Order Button */}
        <Button onClick={() => setShowNewOrder(true)} className="w-full mb-6 h-12 text-base font-medium">
          <Plus className="h-5 w-5 mr-2" />
          New Order
        </Button>

        {/* Recent Orders */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>

          {isLoadingOrders ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">Loading orders...</CardContent>
            </Card>
          ) : customerOrders.length > 0 ? (
            customerOrders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleOrderSelect(order)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">{order.order_name}</CardTitle>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{formatDate(order.created_at)}</span>
                    <span className="font-semibold text-foreground">{formatCurrency(order.total_amount)}</span>
                  </div>
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {order.order_items.length} item{order.order_items.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No orders found for this customer
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
