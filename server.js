const express = require('express');
const { Pool } = require('pg'); // PostgreSQL module
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;

const SECRET_KEY = process.env.SECRET_KEY; // Secret key voor JWT

// PostgreSQL-verbinding instellen
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Zorg ervoor dat je deze env-variable hebt ingesteld
  ssl: {
    rejectUnauthorized: false // Dit is nodig voor SSL-verbindingen zoals Railway
  }
});

app.use(express.json());

// Gebruikersregistratie met validatie
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Validatie van gebruikersinvoer
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (result.rows.length > 0) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login route met JWT-token generatie
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

    const token = jwt.sign({ username: user.username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware om JWT te verifiëren
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

// Gebruikersprofielroute (beveiligd met JWT)
app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT username FROM users WHERE username = $1', [req.user.username]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: result.rows[0].username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Beveiligde route voor het dashboard met statistieken
app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userCountResult = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = userCountResult.rows[0].count;

    res.json({
      message: `Welcome to your dashboard, ${req.user.username}`,
      stats: {
        totalUsers: userCount,
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Wachtwoordwijziging route (beveiligd met JWT)
app.post('/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Old and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [req.user.username]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE username = $2', [hashedNewPassword, req.user.username]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
