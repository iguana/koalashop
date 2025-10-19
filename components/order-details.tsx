"use client"

import { ArrowLeft, Package, Calendar, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Order, Customer } from "@/types/database"

interface OrderDetailsProps {
  order: Order
  customer: Customer
  onBack: () => void
}

export default function OrderDetails({ order, customer, onBack }: OrderDetailsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatWeight = (weightOz: number) => {
    if (weightOz >= 16) {
      const pounds = Math.floor(weightOz / 16)
      const remainingOz = weightOz % 16
      return remainingOz > 0 ? `${pounds} lb ${remainingOz} oz` : `${pounds} lb`
    }
    return `${weightOz} oz`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border p-4 z-40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-foreground truncate">Order Details</h1>
            <p className="text-sm text-muted-foreground truncate">{customer.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {order.order_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Created</span>
              </div>
              <span className="text-sm font-medium">{formatDate(order.created_at)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  order.status === "completed"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : order.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                }`}
              >
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                <DollarSign className="h-5 w-5" />
                <span>Total</span>
              </div>
              <span className="text-lg font-bold">{formatCurrency(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Order Items</h2>

          {order.order_items && order.order_items.length > 0 ? (
            <div className="space-y-3">
              {order.order_items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {item.product?.name || "Unknown Product"}
                          </h3>
                          {item.product?.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.product.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-3">
                          <div className="font-semibold text-foreground">{formatCurrency(item.total_price)}</div>
                          <div className="text-sm text-muted-foreground">{formatCurrency(item.unit_price)} each</div>
                        </div>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Quantity</span>
                          <div className="font-medium">{item.quantity}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight</span>
                          <div className="font-medium">{formatWeight(item.weight_oz)}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">No items found in this order</CardContent>
            </Card>
          )}
        </div>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-muted-foreground text-sm">Name</span>
              <div className="font-medium">{customer.name}</div>
            </div>
            {customer.email && (
              <div>
                <span className="text-muted-foreground text-sm">Email</span>
                <div className="font-medium">{customer.email}</div>
              </div>
            )}
            {customer.phone && (
              <div>
                <span className="text-muted-foreground text-sm">Phone</span>
                <div className="font-medium">{customer.phone}</div>
              </div>
            )}
            {customer.address && (
              <div>
                <span className="text-muted-foreground text-sm">Address</span>
                <div className="font-medium">{customer.address}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
