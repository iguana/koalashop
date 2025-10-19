#!/usr/bin/env node

// Simple migration script to add units column
const https = require('https');
const http = require('http');

async function runMigration() {
  console.log('🚀 Starting units column migration...');
  
  try {
    // Try to call the migration API endpoint
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/migrate-units',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.success) {
            console.log('✅ Migration completed successfully!');
            console.log('📋 Response:', response.message);
            if (response.sampleProducts) {
              console.log('📋 Sample products:');
              response.sampleProducts.forEach(product => {
                console.log(`  - ${product.name}: $${product.unit_price}/${product.units}`);
              });
            }
          } else {
            console.log('❌ Migration failed:', response.error);
            console.log('📋 Details:', response.details);
          }
        } catch (e) {
          console.log('❌ Failed to parse response:', data);
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Connection error:', error.message);
      console.log('💡 Make sure your Next.js server is running on port 3000');
    });

    req.end();
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

// Run the migration
runMigration();
