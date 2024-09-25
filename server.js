const express = require('express');
const { Pool } = require('pg'); // PostgreSQL module
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;

// Haal de secret key op uit de environment variables
const SECRET_KEY = process.env.SECRET_KEY;

// PostgreSQL-verbinding instellen
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.use(express.json());

// Voorbeeld registratie route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Controleer of de gebruiker al bestaat
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Voeg nieuwe gebruiker toe aan de database
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
