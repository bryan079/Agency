const express = require('express');
const { Pool } = require('pg'); // PostgreSQL client
const bcrypt = require('bcryptjs'); // Wachtwoord hashing
const jwt = require('jsonwebtoken'); // JWT voor authenticatie
const cookieParser = require('cookie-parser'); // Voor cookies zoals refresh tokens
const cors = require('cors'); // Eventueel nodig voor cross-origin requests

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

// Instellen van de PostgreSQL databaseverbinding
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());
app.use(cookieParser()); // Voor het verwerken van cookies
app.use(cors()); // Indien nodig om front-end requests te ondersteunen

// Middleware om JWT-tokens te verifiëren
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401); // Geen token aanwezig

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // Token is niet meer geldig
    req.user = user;
    next();
  });
}

// Gebruikersregistratie met wachtwoord hashing
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// Login met JWT-token en refresh token via HTTP-only cookie
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '15m' }); // Access token
    const refreshToken = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '7d' }); // Refresh token

    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true }); // Stuur de refresh token via een cookie
    res.json({ token }); // Stuur access token naar de client
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// Refresh token endpoint
app.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(403);

  jwt.verify(refreshToken, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);

    const newAccessToken = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '15m' });
    res.json({ token: newAccessToken });
  });
});

// Uitloggen en het verwijderen van de refresh token
app.post('/logout', (req, res) => {
  res.clearCookie('refreshToken'); // Verwijder de refresh token cookie
  res.json({ message: 'Logged out successfully' });
});

// Beveiligde route voor het ophalen van profielgegevens
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT username FROM users WHERE username = $1', [req.user.username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: result.rows[0].username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Beveiligde route voor het ophalen van profielgegevens inclusief email, naam en adres
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT username, email, name, address FROM users WHERE username = $1',
      [req.user.username]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

