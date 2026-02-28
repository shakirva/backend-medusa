const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://marqa_user:marqa123@localhost:5432/marqa_souq_dev',
});

async function getKeys() {
  try {
    await client.connect();
    // Select all columns to see what we have
    const res = await client.query('SELECT * FROM api_key WHERE revoked_at IS NULL');
    console.log('API Keys:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Error executing query', err);
  } finally {
    await client.end();
  }
}

getKeys();
