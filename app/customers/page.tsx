"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import CustomerForm from "@/components/customer-form"
import type { Customer } from "@/types/database"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    )
    setFilteredCustomers(filtered)
  }, [customers, searchTerm])

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers")
      const data = await response.json()
      if (data.customers) {
        setCustomers(data.customers)
      }
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCustomer = async (customerData: Omit<Customer, "id" | "created_at" | "updated_at">) => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      })
      
      if (response.ok) {
        await fetchCustomers()
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error creating customer:", error)
    }
  }

  const handleUpdateCustomer = async (customerData: Omit<Customer, "id" | "created_at" | "updated_at">) => {
    if (!editingCustomer) return
    
    try {
      const response = await fetch(`/api/customers/${editingCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      })
      
      if (response.ok) {
        await fetchCustomers()
        setEditingCustomer(null)
        setIsDialogOpen(false)
      }
    } catch (error) {
      console.error("Error updating customer:", error)
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        await fetchCustomers()
      }
    } catch (error) {
      console.error("Error deleting customer:", error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading customers...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Customers</h1>
            <p className="text-muted-foreground">Manage your customer database</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCustomer(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>
              </DialogHeader>
              <CustomerForm
                customer={editingCustomer}
                onSubmit={editingCustomer ? handleUpdateCustomer : handleCreateCustomer}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setEditingCustomer(null)
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search customers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold">{customer.name}</CardTitle>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingCustomer(customer)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{customer.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCustomer(customer.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {customer.email && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Email: </span>
                      <span className="text-foreground">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Phone: </span>
                      <span className="text-foreground">{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Address: </span>
                      <span className="text-foreground">{customer.address}</span>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Created: {formatDate(customer.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {searchTerm ? "No customers found matching your search." : "No customers found. Add your first customer to get started."}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
