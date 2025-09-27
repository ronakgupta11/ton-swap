import { sequelize } from '../config/database.js';
import Order from './Order.js';

// Define associations here if needed in the future
// Order.belongsTo(User, { foreignKey: 'userId' });

const syncDatabase = async () => {
  try {
    // Use alter: true for development, force: true only for initial setup
    await sequelize.sync({ alter: true });
    console.log('Database tables synchronized successfully.');
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
