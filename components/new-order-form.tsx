"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Plus, Minus, Trash2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import type { Customer, Product } from "@/types/database"

interface OrderItem {
  id: string
  product_id: string
  product?: Product
  quantity: number
  weight_oz: number
  unit_price: number
}

interface NewOrderFormProps {
  customer: Customer
  onBack: () => void
  onOrderCreated: () => void
}

export default function NewOrderForm({ customer, onBack, onOrderCreated }: NewOrderFormProps) {
  const [orderName, setOrderName] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/products")
        const data = await response.json()
        if (data.products) {
          setProducts(data.products)
        }
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
      product_id: "",
      quantity: 1,
      weight_oz: 8,
      unit_price: 0,
    }
    setOrderItems([...orderItems, newItem])
  }

  const removeOrderItem = (id: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== id))
  }

  const updateOrderItem = (id: string, field: keyof OrderItem, value: any) => {
    setOrderItems(
      orderItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }

          // If product changed, update unit price and product reference
          if (field === "product_id") {
            const product = products.find((p) => p.id === value)
            updatedItem.unit_price = product?.unit_price || 0
            updatedItem.product = product
          }

          return updatedItem
        }
        return item
      }),
    )
  }

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.weight_oz * item.unit_price, 0)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const handleSaveOrder = async () => {
    if (!orderName.trim()) {
      alert("Please enter an order name")
      return
    }

    if (orderItems.length === 0) {
      alert("Please add at least one item to the order")
      return
    }

    const invalidItems = orderItems.filter((item) => !item.product_id || item.quantity <= 0 || item.weight_oz <= 0)
    if (invalidItems.length > 0) {
      alert("Please complete all order items with valid quantities and weights")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_id: customer.id,
          order_name: orderName.trim(),
          order_items: orderItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            weight_oz: item.weight_oz,
            unit_price: item.unit_price,
          })),
        }),
      })

      if (response.ok) {
        onOrderCreated()
      } else {
        const error = await response.json()
        alert(`Failed to create order: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Failed to create order. Please try again.")
    } finally {
      setIsSaving(false)
    }
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
            <h1 className="font-semibold text-foreground truncate">New Order</h1>
            <p className="text-sm text-muted-foreground truncate">{customer.name}</p>
          </div>
          <Button onClick={handleSaveOrder} disabled={isSaving} className="h-9">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderName">Order Name</Label>
              <Input
                id="orderName"
                placeholder="e.g., Weekly Order, Holiday Special"
                value={orderName}
                onChange={(e) => setOrderName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <div className="p-3 bg-muted rounded-md">
                <div className="font-medium">{customer.name}</div>
                {customer.email && <div className="text-sm text-muted-foreground">{customer.email}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Products</h2>
            <Button onClick={addOrderItem} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">Loading products...</CardContent>
            </Card>
          ) : orderItems.length > 0 ? (
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Item {index + 1}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOrderItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Product</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => updateOrderItem(item.id, "product_id", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                <div className="flex items-center justify-between w-full">
                                  <span>{product.name}</span>
                                  <span className="ml-2 text-muted-foreground">
                                    {formatCurrency(product.unit_price)}/oz
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Quantity</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderItem(item.id, "quantity", Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateOrderItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)
                              }
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateOrderItem(item.id, "quantity", item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Weight (oz)</Label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.weight_oz}
                            onChange={(e) =>
                              updateOrderItem(item.id, "weight_oz", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                        </div>
                      </div>

                      {item.product_id && (
                        <>
                          <Separator />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Unit Price:</span>
                            <span>{formatCurrency(item.unit_price)}/oz</span>
                          </div>
                          <div className="flex items-center justify-between font-medium">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(item.quantity * item.weight_oz * item.unit_price)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No items added yet. Click "Add Item" to get started.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Total */}
        {orderItems.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
