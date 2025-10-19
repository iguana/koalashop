"use client"

import { useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"
import type { Order, Customer, Product, OrderItem } from "@/types/database"

const orderItemSchema = z.object({
  product_id: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  weight_oz: z.number().min(0, "Weight must be positive"),
  unit_price: z.number().min(0, "Price must be positive"),
})

const orderSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  order_name: z.string().min(1, "Order name is required"),
  status: z.string().min(1, "Status is required"),
  order_items: z.array(orderItemSchema).min(1, "At least one item is required"),
})

type OrderFormData = z.infer<typeof orderSchema>

interface OrderFormProps {
  order?: Order | null
  customers: Customer[]
  products: Product[]
  onSubmit: (data: OrderFormData) => void
  onCancel: () => void
}

export default function OrderForm({ order, customers, products, onSubmit, onCancel }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      customer_id: order?.customer_id || "",
      order_name: order?.order_name || "",
      status: order?.status || "pending",
      order_items: order?.order_items?.map(item => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        weight_oz: Number(item.weight_oz),
        unit_price: Number(item.unit_price),
      })) || [{ product_id: "", quantity: 1, weight_oz: 0, unit_price: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "order_items",
  })

  const handleSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addOrderItem = () => {
    append({ product_id: "", quantity: 1, weight_oz: 0, unit_price: 0 })
  }

  const removeOrderItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const calculateItemTotal = (item: any) => {
    return item.quantity * item.weight_oz * item.unit_price
  }

  const calculateOrderTotal = () => {
    const items = form.watch("order_items")
    return items.reduce((total, item) => total + calculateItemTotal(item), 0)
  }

  const getUnitLabel = (units: string) => {
    switch (units) {
      case 'oz':
        return 'oz'
      case 'lbs':
        return 'lbs'
      case 'each':
        return 'items'
      case 'grams':
        return 'grams'
      default:
        return 'oz'
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Order Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Order name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Order Items */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Order Items</h3>
            <Button type="button" variant="outline" size="sm" onClick={addOrderItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Item {index + 1}</CardTitle>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOrderItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`order_items.${index}.product_id`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ${product.unit_price}/{product.units}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`order_items.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`order_items.${index}.weight_oz`}
                    render={({ field }) => {
                      const selectedProductId = form.watch(`order_items.${index}.product_id`)
                      const selectedProduct = products.find(p => p.id === selectedProductId)
                      return (
                        <FormItem>
                          <FormLabel>Weight ({getUnitLabel(selectedProduct?.units || 'oz')})</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />

                  <FormField
                    control={form.control}
                    name={`order_items.${index}.unit_price`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit Price *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="text-right text-sm font-medium">
                  Item Total: ${calculateItemTotal(form.watch(`order_items.${index}`)).toFixed(2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-right text-lg font-semibold border-t pt-4">
          Order Total: ${calculateOrderTotal().toFixed(2)}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : order ? "Update Order" : "Create Order"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
