"use client"

import { useState, useEffect, useRef } from "react"
import { Search, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { apiClient, type Customer } from "@/lib/api-client"

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void
}

export default function CustomerSearch({ onCustomerSelect }: CustomerSearchProps) {
  const [query, setQuery] = useState("")
  const [allCustomers, setAllCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadAllCustomers = async () => {
      setIsLoading(true)
      try {
        const data = await apiClient.getCustomers()
        setAllCustomers(data)
        setFilteredCustomers(data)
      } catch (error) {
        console.error("Error loading customers:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadAllCustomers()
  }, [])

  useEffect(() => {
    if (query.length === 0) {
      setFilteredCustomers(allCustomers)
      return
    }

    if (query.length < 2) {
      setFilteredCustomers([])
      return
    }

    // Use local filtering for better performance
    const filtered = allCustomers.filter(customer =>
      customer.name.toLowerCase().includes(query.toLowerCase()) ||
      customer.email?.toLowerCase().includes(query.toLowerCase()) ||
      customer.phone?.includes(query)
    )
    
    setFilteredCustomers(filtered)
  }, [query, allCustomers])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCustomerClick = (customer: Customer) => {
    setQuery(customer.name)
    setShowResults(false)
    onCustomerSelect(customer)
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          className="pl-10 h-12 text-base"
        />
      </div>

      <Card className="mt-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Loading customers...</div>
        ) : filteredCustomers.length > 0 ? (
          <div className="py-2">
            <div className="px-4 py-2 text-sm font-medium text-muted-foreground border-b">
              {query ? `Search Results (${filteredCustomers.length})` : `All Customers (${filteredCustomers.length})`}
            </div>
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                onClick={() => handleCustomerClick(customer)}
                className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
              >
                <div className="flex-shrink-0">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-foreground">{customer.name}</div>
                  {customer.email && <div className="text-sm text-muted-foreground truncate">{customer.email}</div>}
                  {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            {query ? "No customers found" : "No customers available"}
          </div>
        )}
      </Card>

      {showResults && query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto z-50 shadow-lg">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Searching...</div>
          ) : filteredCustomers.length > 0 ? (
            <div className="py-2">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleCustomerClick(customer)}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                >
                  <div className="flex-shrink-0">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{customer.name}</div>
                    {customer.email && <div className="text-sm text-muted-foreground truncate">{customer.email}</div>}
                    {customer.phone && <div className="text-sm text-muted-foreground">{customer.phone}</div>}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">No customers found</div>
          )}
        </Card>
      )}
    </div>
  )
}
