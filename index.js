const express = require('express');
const app = express();
const port = 3000;

// Database connection configuration
/* const pool = new Pool({
  user: 'postgres',    // replace with your database username
  host: 'localhost',
  database: 'postgres',
  password: 'postgres',  // replace with your database password
  port: 5432,
});
 */

/* app.get('/users', async (req, res) => {
  
  try {
    const client = await pool.connect();
    
    const result = await client.query('SELECT * FROM users');
    client.release();
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
 */

app.get('/', async (req, res) => {
  res.status(200).send("Hello there!");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
