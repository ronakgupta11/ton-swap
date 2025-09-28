import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Sequelize with Neon database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: true, // Set to false in production
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
    
    // Get database version
    const [results] = await sequelize.query('SELECT version()');
    console.log('PostgreSQL version:', results[0].version);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export { testConnection, sequelize };
