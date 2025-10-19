#!/usr/bin/env node

// Simple migration script using the same connection as the app
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function runMigrationViaAPI() {
  try {
    console.log('🚀 Running migration via API...');
    
    // Try the migration endpoint
    const response = await fetch('http://localhost:3001/api/migrate-units', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('✅ Migration successful!');
      console.log('📋 Message:', result.message);
      if (result.sampleProducts) {
        console.log('📋 Sample products:');
        result.sampleProducts.forEach(product => {
          console.log(`  - ${product.name}: $${product.unit_price}/${product.units}`);
        });
      }
    } else {
      console.log('❌ Migration failed:', result.error);
      console.log('📋 Details:', result.details);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the migration
runMigrationViaAPI();
