import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
// Define associations here if needed in the future
// Order.belongsTo(User, { foreignKey: 'userId' });

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('Database tables synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing database tables:', error);
  }
};

export {
  syncDatabase
};
