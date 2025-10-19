import { createClient } from "@supabase/supabase-js"
import { cache } from "react"
import { getAuroraPool, queryAurora, withTransaction, isAuroraConfigured } from "./aurora/client"

// Configuration flags
const USE_AURORA_DSQL = process.env.USE_AURORA_DSQL === 'true'
const FALLBACK_TO_SUPABASE = process.env.FALLBACK_TO_SUPABASE === 'true'

// Supabase configuration check
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0

// Create Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Hybrid database client that can switch between Aurora DSQL and Supabase
export const createHybridServerClient = cache(() => {
  const useAurora = USE_AURORA_DSQL && isAuroraConfigured()
  const useSupabase = !useAurora && isSupabaseConfigured

  if (useAurora) {
    console.log("Using Aurora DSQL for database operations")
    return {
      type: 'aurora' as const,
      query: queryAurora,
      transaction: withTransaction,
      pool: getAuroraPool(),
    }
  } else if (useSupabase) {
    console.log("Using Supabase for database operations")
    return {
      type: 'supabase' as const,
      client: createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!, 
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      ),
    }
  } else {
    console.warn("No database configured. Using dummy client.")
    return {
      type: 'dummy' as const,
      query: () => Promise.resolve({ data: [], error: null }),
      transaction: () => Promise.resolve({ data: null, error: null }),
    }
  }
})

// Query builder that works with both Aurora DSQL and Supabase
export const createHybridQueryBuilder = (table: string) => {
  const client = createHybridServerClient()
  
  if (client.type === 'aurora') {
    // Aurora DSQL query builder
    return {
      select: (columns = '*') => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const { data, error } = await client.query(
              `SELECT ${columns} FROM ${table} WHERE ${column} = $1 LIMIT 1`,
              [value]
            )
            return { data: data?.[0] || null, error }
          },
          order: (orderBy: string) => ({
            limit: (limit: number) => ({
              execute: async () => {
                const { data, error } = await client.query(
                  `SELECT ${columns} FROM ${table} WHERE ${column} = $1 ORDER BY ${orderBy} LIMIT $2`,
                  [value, limit]
                )
                return { data: data || [], error }
              }
            }),
            execute: async () => {
              const { data, error } = await client.query(
                `SELECT ${columns} FROM ${table} WHERE ${column} = $1 ORDER BY ${orderBy}`,
                [value]
              )
              return { data: data || [], error }
            }
          }),
          execute: async () => {
            const { data, error } = await client.query(
              `SELECT ${columns} FROM ${table} WHERE ${column} = $1`,
              [value]
            )
            return { data: data || [], error }
          }
        }),
        ilike: (pattern: string) => ({
          execute: async () => {
            const { data, error } = await client.query(
              `SELECT ${columns} FROM ${table} WHERE ${pattern} ILIKE $1`,
              [`%${pattern}%`]
            )
            return { data: data || [], error }
          }
        }),
        or: (conditions: string) => ({
          limit: (limit: number) => ({
            execute: async () => {
              const orConditions = conditions.split(',').map(cond => {
                const [col, op, val] = cond.split('.')
                if (op === 'ilike') {
                  return `${col} ILIKE $1`
                }
                return `${col} = $1`
              })
              
              const { data, error } = await client.query(
                `SELECT ${columns} FROM ${table} WHERE ${orConditions.join(' OR ')} LIMIT $2`,
                [conditions.split(',')[0].split('.')[2], limit]
              )
              return { data: data || [], error }
            }
          }),
          execute: async () => {
            const orConditions = conditions.split(',').map(cond => {
              const [col, op, val] = cond.split('.')
              if (op === 'ilike') {
                return `${col} ILIKE $1`
              }
              return `${col} = $1`
            })
            
            const { data, error } = await client.query(
              `SELECT ${columns} FROM ${table} WHERE ${orConditions.join(' OR ')}`,
              [conditions.split(',')[0].split('.')[2]]
            )
            return { data: data || [], error }
          }
        }),
        order: (orderBy: string) => ({
          limit: (limit: number) => ({
            execute: async () => {
              const { data, error } = await client.query(
                `SELECT ${columns} FROM ${table} ORDER BY ${orderBy} LIMIT $1`,
                [limit]
              )
              return { data: data || [], error }
            }
          }),
          execute: async () => {
            const { data, error } = await client.query(
              `SELECT ${columns} FROM ${table} ORDER BY ${orderBy}`
            )
            return { data: data || [], error }
          }
        }),
        limit: (limit: number) => ({
          execute: async () => {
            const { data, error } = await client.query(
              `SELECT ${columns} FROM ${table} LIMIT $1`,
              [limit]
            )
            return { data: data || [], error }
          }
        }),
        execute: async () => {
          const { data, error } = await client.query(
            `SELECT ${columns} FROM ${table}`
          )
          return { data: data || [], error }
        }
      }),
      
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            const columns = Object.keys(data).join(', ')
            const values = Object.values(data)
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')
            
            const { data: result, error } = await client.query(
              `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`,
              values
            )
            return { data: result?.[0] || null, error }
          }
        })
      }),
      
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: async () => {
              const setClause = Object.keys(data)
                .map((key, i) => `${key} = $${i + 2}`)
                .join(', ')
              
              const values = Object.values(data)
              
              const { data: result, error } = await client.query(
                `UPDATE ${table} SET ${setClause} WHERE ${column} = $1 RETURNING *`,
                [value, ...values]
              )
              return { data: result?.[0] || null, error }
            }
          })
        })
      }),
      
      delete: () => ({
        eq: (column: string, value: any) => ({
          execute: async () => {
            const { data, error } = await client.query(
              `DELETE FROM ${table} WHERE ${column} = $1`,
              [value]
            )
            return { data: data || [], error }
          }
        })
      })
    }
  } else if (client.type === 'supabase') {
    // Supabase query builder
    return client.client.from(table)
  } else {
    // Dummy query builder
    return {
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
          execute: () => Promise.resolve({ data: [], error: null })
        }),
        execute: () => Promise.resolve({ data: [], error: null })
      }),
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: null, error: null })
        })
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: null, error: null })
          })
        })
      }),
      delete: () => ({
        eq: () => ({
          execute: () => Promise.resolve({ data: [], error: null })
        })
      })
    }
  }
}

// Main hybrid client
export const hybridDb = {
  from: createHybridQueryBuilder
}

// Legacy compatibility - use this for gradual migration
export const createServerClient = createHybridServerClient
