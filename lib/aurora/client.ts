import { Pool } from 'pg'
import { DSQLClient, GenerateDbConnectAuthTokenCommand } from '@aws-sdk/client-dsql'

// Aurora DSQL connection configuration
interface AuroraConfig {
  host: string
  port: number
  database: string
  region: string
  iamRoleArn?: string
}

// Get Aurora DSQL configuration from environment variables
const getAuroraConfig = (): AuroraConfig => {
  const host = process.env.AURORA_DSQL_HOST
  const port = parseInt(process.env.AURORA_DSQL_PORT || '5432')
  const database = process.env.AURORA_DSQL_DATABASE || 'postgres'
  const region = process.env.AWS_REGION || process.env.AURORA_DSQL_REGION || 'us-west-2'
  const iamRoleArn = process.env.AURORA_DSQL_IAM_ROLE_ARN

  if (!host) {
    throw new Error('AURORA_DSQL_HOST environment variable is required')
  }

  return { host, port, database, region, iamRoleArn }
}

// Create Aurora DSQL connection pool with IAM authentication using AWS SDK
export const createAuroraPool = async () => {
  const config = getAuroraConfig()
  
  try {
    console.log("Creating Aurora DSQL connection with config:", {
      host: config.host,
      port: config.port,
      database: config.database,
      region: config.region
    })
    
    // Use AWS SDK instead of CLI commands
    const dsqlClient = new DSQLClient({ region: config.region })
    
    const command = new GenerateDbConnectAuthTokenCommand({
      hostname: config.host,
      port: config.port,
      username: 'admin'
    })
    
    console.log("Sending GenerateDbConnectAuthTokenCommand...")
    const response = await dsqlClient.send(command)
    const authToken = response.authToken
    
    if (!authToken) {
      throw new Error('Failed to generate auth token - no token in response')
    }
    
    console.log("Auth token generated successfully")
    
    const poolConfig: any = {
      host: config.host,
      port: config.port,
      database: config.database,
      user: 'admin',
      password: authToken,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

    console.log("Creating PostgreSQL pool...")
    const pool = new Pool(poolConfig)
    
    // Test the connection
    console.log("Testing database connection...")
    const testResult = await pool.query('SELECT NOW() as current_time')
    console.log("Database connection test successful:", testResult.rows[0])
    
    return pool
  } catch (error) {
    console.error('Failed to create Aurora DSQL connection:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    throw error
  }
}

// Singleton pool instance
let pool: Pool | null = null

export const getAuroraPool = async () => {
  if (!pool) {
    pool = await createAuroraPool()
  }
  return pool
}

// Check if Aurora DSQL is configured
export const isAuroraConfigured = () => {
  try {
    getAuroraConfig()
    return true
  } catch {
    return false
  }
}

// Query helper with error handling
export const queryAurora = async (text: string, params?: any[]) => {
  const pool = await getAuroraPool()
  try {
    const result = await pool.query(text, params)
    return { data: result.rows, error: null }
  } catch (error) {
    console.error('Aurora DSQL query error:', error)
    return { data: null, error }
  }
}

// Transaction helper
export const withTransaction = async <T>(
  callback: (client: any) => Promise<T>
): Promise<{ data: T | null; error: any }> => {
  const pool = await getAuroraPool()
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return { data: result, error: null }
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Aurora DSQL transaction error:', error)
    return { data: null, error }
  } finally {
    client.release()
  }
}
