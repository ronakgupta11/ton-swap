require("dotenv").config();

const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const testConnection = async () => {
  try {
    const result = await sql`SELECT version()`;
    console.log('Database connection successful!');
    console.log('PostgreSQL version:', result[0].version);
    
    // Test creating a simple table
    await sql`
      CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Test table created successfully');
    
    // Test inserting data
    const insertResult = await sql`
      INSERT INTO test_table (name) VALUES ('test') RETURNING *
    `;
    console.log('Test data inserted:', insertResult[0]);
    
    // Test querying data
    const queryResult = await sql`SELECT * FROM test_table`;
    console.log('Test data queried:', queryResult);
    
    // Clean up
    await sql`DROP TABLE test_table`;
    console.log('Test table cleaned up');
    
  } catch (error) {
    console.error('Database connection failed:', error);
  }
};

testConnection();
