import { cache } from "react"
import { getAuroraPool, queryAurora, withTransaction, isAuroraConfigured } from "./client"

// Create a cached version of the Aurora client for Server Components
export const createAuroraServerClient = cache(() => {
  if (!isAuroraConfigured()) {
    console.warn("Aurora DSQL environment variables are not set. Using dummy client.")
    return {
      query: () => Promise.resolve({ data: [], error: null }),
      transaction: () => Promise.resolve({ data: null, error: null }),
    }
  }

  return {
    query: queryAurora,
    transaction: withTransaction,
    pool: getAuroraPool(),
  }
})

// Helper functions to mimic Supabase API for easier migration
export const createAuroraQueryBuilder = (table: string) => {
  const client = createAuroraServerClient()
  
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
            // Parse Supabase-style OR conditions
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
}

// Main Aurora client that mimics Supabase API
export const aurora = {
  from: createAuroraQueryBuilder
}
