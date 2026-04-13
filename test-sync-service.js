// Simple test to verify sync service works
require('dotenv').config();

async function testOdooSync() {
  try {
    // Import the service 
    console.log('🔍 Testing Odoo Sync Service...');
    
    const { OdooSyncService } = require('./src/modules/odoo-sync/service.ts');
    const odoo = new OdooSyncService();
    
    console.log('📋 Configuration:', odoo.getConfig());
    console.log('✅ Is Configured:', odoo.isConfigured());
    
    if (!odoo.isConfigured()) {
      console.log('❌ Service not properly configured');
      return;
    }
    
    console.log('🔌 Testing connection...');
    const connectionTest = await odoo.testConnection();
    
    console.log('📊 Connection Result:', connectionTest);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOdooSync();