import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';
import { Signer } from '@aws-sdk/rds-signer';

// Database connection
let pool: Pool | null = null;

const getAuroraConfig = () => {
  const host = process.env.AURORA_DSQL_HOST;
  const port = parseInt(process.env.AURORA_DSQL_PORT || '5432');
  const database = process.env.AURORA_DSQL_DATABASE;
  const region = process.env.AURORA_DSQL_REGION || 'us-west-1';

  if (!host || !database) {
    throw new Error('Missing required Aurora DSQL configuration');
  }

  return { host, port, database, region };
};

const createAuroraPool = async () => {
  if (pool) return pool;
  
  const config = getAuroraConfig();
  try {
    console.log("Creating Aurora DSQL connection with config:", {
      host: config.host,
      port: config.port,
      database: config.database,
      region: config.region
    });
    
    const signer = new Signer({
      region: config.region,
      hostname: config.host,
      port: config.port,
      username: 'admin'
    });
    
    console.log("Generating auth token...");
    const authToken = await signer.getAuthToken();
    
    if (!authToken) {
      throw new Error('Failed to generate auth token');
    }
    
    console.log("Auth token generated successfully");
    
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
    };
    
    console.log("Creating PostgreSQL pool...");
    pool = new Pool(poolConfig);
    
    console.log("Testing database connection...");
    const testResult = await pool.query('SELECT NOW() as current_time');
    console.log("Database connection test successful:", testResult.rows[0]);
    
    return pool;
  } catch (error) {
    console.error('Failed to create Aurora DSQL connection:', error);
    throw error;
  }
};

const queryAurora = async (query: string, params: any[] = []) => {
  const pool = await createAuroraPool();
  try {
    const result = await pool.query(query, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('Database query error:', error);
    return { data: null, error: error instanceof Error ? error : new Error('Unknown database error') };
  }
};

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getUnitLabel = (units: string) => {
  switch (units) {
    case 'oz':
      return 'oz';
    case 'lbs':
      return 'lbs';
    case 'each':
      return 'items';
    case 'grams':
      return 'grams';
    default:
      return 'oz';
  }
};

// API Route Handlers
const handleProducts = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'GET') {
      const { data, error } = await queryAurora('SELECT * FROM products ORDER BY name');
      if (error) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message }),
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, description, unit_price, units } = body;

      if (!name || !unit_price || !units) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      const { data, error } = await queryAurora(
        'INSERT INTO products (name, description, unit_price, units) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, description, unit_price, units]
      );

      if (error) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data[0]),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in handleProducts:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

const handleCustomers = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'GET') {
      const { data, error } = await queryAurora('SELECT * FROM customers ORDER BY name');
      if (error) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message }),
        };
      }
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { name, email, phone, address } = body;

      if (!name || !email) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      const { data, error } = await queryAurora(
        'INSERT INTO customers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, phone, address]
      );

      if (error) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message }),
        };
      }

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data[0]),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in handleCustomers:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

const handleOrders = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'GET') {
      const { data, error } = await queryAurora(`
        SELECT o.*, c.name as customer_name, c.email as customer_email
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.created_at DESC
      `);
      
      if (error) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: error.message }),
        };
      }
      
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { customer_id, order_items } = body;

      if (!customer_id || !order_items || !Array.isArray(order_items)) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing required fields' }),
        };
      }

      // Calculate total amount
      const total_amount = order_items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.weight_oz * item.unit_price);
      }, 0);

      // Create order
      const { data: orderData, error: orderError } = await queryAurora(
        'INSERT INTO orders (customer_id, total_amount) VALUES ($1, $2) RETURNING *',
        [customer_id, total_amount]
      );

      if (orderError) {
        return {
          statusCode: 500,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: orderError.message }),
        };
      }

      const order = orderData[0];

      // Create order items
      for (const item of order_items) {
        const { error: itemError } = await queryAurora(
          'INSERT INTO order_items (order_id, product_id, quantity, weight_oz, unit_price) VALUES ($1, $2, $3, $4, $5)',
          [order.id, item.product_id, item.quantity, item.weight_oz, item.unit_price]
        );

        if (itemError) {
          console.error('Error creating order item:', itemError);
        }
      }

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Error in handleOrders:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

const handleDebug = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const envVars = {
      AURORA_DSQL_HOST: process.env.AURORA_DSQL_HOST,
      AURORA_DSQL_PORT: process.env.AURORA_DSQL_PORT,
      AURORA_DSQL_DATABASE: process.env.AURORA_DSQL_DATABASE,
      AURORA_DSQL_REGION: process.env.AURORA_DSQL_REGION,
      AURORA_DSQL_IAM_ROLE_ARN: process.env.AURORA_DSQL_IAM_ROLE_ARN,
      USE_AURORA_DSQL: process.env.USE_AURORA_DSQL,
      FALLBACK_TO_SUPABASE: process.env.FALLBACK_TO_SUPABASE,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      AWS_REGION: process.env.AWS_REGION,
    };

    let dbStatus = "Not configured";
    let dbError = null;
    let dbTime = null;

    try {
      const { data, error } = await queryAurora('SELECT NOW() as current_time');
      if (error) {
        dbStatus = `Error: ${error.message || 'Unknown DB error'}`;
        dbError = error;
      } else {
        dbStatus = "Connected successfully";
        dbTime = data?.[0]?.current_time;
      }
    } catch (e: any) {
      dbStatus = `Connection attempt failed: ${e.message || 'Unknown error'}`;
      dbError = { message: e.message, stack: e.stack };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Debug Info",
        environment_variables: envVars,
        database_connection_status: dbStatus,
        database_current_time: dbTime,
        database_error_details: dbError,
      }),
    };
  } catch (error: any) {
    console.error("Error in debug endpoint:", error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: "Failed to retrieve debug info",
        details: error.message,
        stack: error.stack,
      }),
    };
  }
};

// Main Lambda handler
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Lambda event:', JSON.stringify(event, null, 2));

  const { path, httpMethod } = event;
  
  // Route to appropriate handler
  if (path === '/api/products' || path === '/api/products/') {
    return handleProducts(event);
  }
  
  if (path === '/api/customers' || path === '/api/customers/') {
    return handleCustomers(event);
  }
  
  if (path === '/api/orders' || path === '/api/orders/') {
    return handleOrders(event);
  }
  
  if (path === '/api/debug' || path === '/api/debug/') {
    return handleDebug(event);
  }

  // Handle dynamic routes
  if (path.startsWith('/api/products/') && path !== '/api/products/') {
    return handleProducts(event);
  }
  
  if (path.startsWith('/api/customers/') && path !== '/api/customers/') {
    return handleCustomers(event);
  }
  
  if (path.startsWith('/api/orders/') && path !== '/api/orders/') {
    return handleOrders(event);
  }

  return {
    statusCode: 404,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Not found' }),
  };
};
