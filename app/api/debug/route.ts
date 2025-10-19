import { NextRequest, NextResponse } from "next/server"
import { isAuroraConfigured } from "@/lib/aurora/client"

export async function GET(request: NextRequest) {
  try {
    console.log("=== DEBUG ENDPOINT ===")
    console.log("Environment variables:")
    console.log("AURORA_DSQL_HOST:", process.env.AURORA_DSQL_HOST)
    console.log("AURORA_DSQL_PORT:", process.env.AURORA_DSQL_PORT)
    console.log("AURORA_DSQL_DATABASE:", process.env.AURORA_DSQL_DATABASE)
    console.log("AURORA_DSQL_REGION:", process.env.AURORA_DSQL_REGION)
    console.log("AURORA_DSQL_IAM_ROLE_ARN:", process.env.AURORA_DSQL_IAM_ROLE_ARN)
    console.log("USE_AURORA_DSQL:", process.env.USE_AURORA_DSQL)
    console.log("FALLBACK_TO_SUPABASE:", process.env.FALLBACK_TO_SUPABASE)
    
    const isConfigured = isAuroraConfigured()
    console.log("Aurora configured:", isConfigured)
    
    return NextResponse.json({
      success: true,
      environment: {
        AURORA_DSQL_HOST: process.env.AURORA_DSQL_HOST,
        AURORA_DSQL_PORT: process.env.AURORA_DSQL_PORT,
        AURORA_DSQL_DATABASE: process.env.AURORA_DSQL_DATABASE,
        AURORA_DSQL_REGION: process.env.AURORA_DSQL_REGION,
        AURORA_DSQL_IAM_ROLE_ARN: process.env.AURORA_DSQL_IAM_ROLE_ARN,
        USE_AURORA_DSQL: process.env.USE_AURORA_DSQL,
        FALLBACK_TO_SUPABASE: process.env.FALLBACK_TO_SUPABASE,
      },
      auroraConfigured: isConfigured,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
