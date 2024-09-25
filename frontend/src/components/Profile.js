const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser'); // Voor het verwerken van cookies
const app = express();
const PORT = process.env.PORT || 3000;

const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

// PostgreSQL-verbinding instellen
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.use(express.json());
app.use(cookieParser()); // Middleware om cookies te verwerken

// Middleware voor het verifiëren van JWT-tokens
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Gebruikersregistratie met foutafhandeling
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

// Login met foutafhandeling en refresh token
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

    // Access token 15 minuten, refresh token 7 dagen
    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '7d' });

    // Stuur de refresh token via een HTTP-only cookie
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// Refresh token route
app.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.sendStatus(403);
  }

  jwt.verify(refreshToken, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);

    const newAccessToken = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '15m' });
    res.json({ token: newAccessToken });
  });
});

// Uitlogroute: verwijder de refresh token
app.post('/logout', (req, res) => {
  res.clearCookie('refreshToken'); // Verwijder de cookie
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
