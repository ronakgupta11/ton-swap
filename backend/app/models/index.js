import { sequelize } from '../config/database.js';
import Order from './Order.js';

// Define associations here if needed in the future
// Order.belongsTo(User, { foreignKey: 'userId' });

const syncDatabase = async () => {
  try {
    // First, check if the orders table exists
    const tableExists = await sequelize.getQueryInterface().tableExists('orders');
    
    if (!tableExists) {
      // If table doesn't exist, use force: true to create it fresh
      await sequelize.sync({ force: true });
      console.log('Database tables created successfully.');
    } else {
      // If table exists, use a more conservative approach
      // First try to sync without altering
      try {
        await sequelize.sync();
        console.log('Database tables synchronized successfully.');
      } catch (syncError) {
        console.log('Standard sync failed, attempting to handle enum conversion...');
        
        // Handle the enum conversion manually
        const queryInterface = sequelize.getQueryInterface();
        
        // Check if the enum type exists
        const enumExists = await queryInterface.sequelize.query(
          "SELECT 1 FROM pg_type WHERE typname = 'enum_orders_status'",
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
        
        if (enumExists.length === 0) {
          // Create the enum type
          await queryInterface.sequelize.query(
            "CREATE TYPE enum_orders_status AS ENUM ('pending', 'depositing', 'withdrawing', 'completed', 'failed', 'expired', 'cancelled')"
          );
        }
        
        // Convert the status column to use the enum
        await queryInterface.sequelize.query(
          "ALTER TABLE orders ALTER COLUMN status TYPE enum_orders_status USING status::enum_orders_status"
        );
        
        // Set the default value
        await queryInterface.sequelize.query(
          "ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending'"
        );
        
        // Now sync the rest of the model
        await sequelize.sync();
        console.log('Database tables synchronized successfully with enum conversion.');
      }
    }
  } catch (error) {
    console.error('Error synchronizing database tables:', error);
    throw error;
  }
};

export {
  sequelize,
  Order,
  syncDatabase
};
