"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Product } from "@/types/database"

const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  unit_price: z.coerce.number().min(0, "Price must be positive"),
  units: z.enum(['oz', 'each', 'lbs', 'grams']).default('oz'),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: ProductFormData) => void
  onCancel: () => void
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      unit_price: product?.unit_price || 0,
      units: product?.units || 'oz',
    },
  })

  const handleSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true)
    try {
      console.log('Product form submitting with data:', data)
      console.log('Data types:', {
        name: typeof data.name,
        description: typeof data.description,
        unit_price: typeof data.unit_price,
        units: typeof data.units
      })
      await onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name *</FormLabel>
              <FormControl>
                <Input placeholder="Product name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Product description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="unit_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit Price *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => {
                    const value = e.target.value
                    field.onChange(value === '' ? 0 : parseFloat(value))
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="units"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Units *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select units" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="oz">Ounces (oz)</SelectItem>
                  <SelectItem value="each">Each</SelectItem>
                  <SelectItem value="lbs">Pounds (lbs)</SelectItem>
                  <SelectItem value="grams">Grams</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
