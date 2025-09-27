import { testConnection, sequelize } from './config/database.js';
import { Order } from './models/index.js';

async function testSequelizeConnection() {
  try {
    console.log('Testing Sequelize connection to Neon...');
    
    // Test basic connection
    await testConnection();
    
    // Test model operations
    console.log('\nTesting Order model...');
    const orderCount = await Order.count();
    console.log(`Total orders in database: ${orderCount}`);
    
    // Test creating a sample order
    console.log('\nTesting order creation...');
    const sampleOrder = await Order.create({
      fromChain: 'EVM',
      toChain: 'Cardano',
      fromToken: 'USDC',
      toToken: 'ADA',
      fromAmount: '1000000', // 1 USDC (6 decimals)
      toAmount: '5000000000', // 5000 ADA (6 decimals)
      makerSrcAddress: '0x1234567890123456789012345678901234567890',
      makerDstAddress: 'addr1q9rl0...',
      hashlock: '0x' + 'a'.repeat(64),
      salt: 12345,
      orderHash: '0x' + 'b'.repeat(64),
      signature: '0x' + 'c'.repeat(130),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    });
    
    console.log('Sample order created successfully:', sampleOrder.id);
    
    // Clean up test data
    await sampleOrder.destroy();
    console.log('Test order cleaned up');
    
    console.log('\n✅ All tests passed! Sequelize is working correctly with Neon.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await sequelize.close();
  }
}

testSequelizeConnection();
