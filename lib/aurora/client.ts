import { Pool } from 'pg'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
  const region = process.env.AWS_REGION || 'us-east-1'
  const iamRoleArn = process.env.AURORA_DSQL_IAM_ROLE_ARN

  if (!host) {
    throw new Error('AURORA_DSQL_HOST environment variable is required')
  }

  return { host, port, database, region, iamRoleArn }
}

// Create Aurora DSQL connection pool with IAM authentication
export const createAuroraPool = async () => {
  const config = getAuroraConfig()
  
  // Generate auth token using AWS CLI
  const clusterId = config.host.split('.')[0]
  const command = `aws dsql generate-db-connect-admin-auth-token --hostname ${config.host} --region ${config.region}`
  
  try {
    const { stdout } = await execAsync(command)
    const authToken = stdout.trim()
    
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

    return new Pool(poolConfig)
  } catch (error) {
    console.error('Failed to generate Aurora DSQL auth token:', error)
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
