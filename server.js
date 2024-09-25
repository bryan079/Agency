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

// PUT endpoint voor het bijwerken van profielgegevens
app.put('/profile', authenticateToken, async (req, res) => {
  const { email, name, address } = req.body;

  if (!email || !name || !address) {
    return res.status(400).json({ message: 'All fields (email, name, address) are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET email = $1, name = $2, address = $3 WHERE username = $4 RETURNING username, email, name, address',
      [email, name, address, req.user.username]
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

// Projectbeheer routes

// POST route voor het aanmaken van een project
app.post('/projects', authenticateToken, async (req, res) => {
  const { projectName, description } = req.body;

  if (!projectName || !description) {
    return res.status(400).json({ message: 'Project name and description are required' });
  }

  try {
    await pool.query(
      'INSERT INTO projects (user_id, project_name, description) VALUES ($1, $2, $3)',
      [req.user.username, projectName, description]
    );
    res.status(201).json({ message: 'Project created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// GET route voor het ophalen van alle projecten van de gebruiker
app.get('/projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE user_id = $1', [req.user.username]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// PUT route voor het bijwerken van een project
app.put('/projects/:projectId', authenticateToken, async (req, res) => {
  const { projectName, description } = req.body;
  const { projectId } = req.params;

  if (!projectName || !description) {
    return res.status(400).json({ message: 'Project name and description are required' });
  }

  try {
    const result = await pool.query(
      'UPDATE projects SET project_name = $1, description = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [projectName, description, projectId, req.user.username]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// DELETE route voor het verwijderen van een project
app.delete('/projects/:projectId', authenticateToken, async (req, res) => {
  const { projectId } = req.params;

  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [projectId, req.user.username]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    // Haal statistieken op, bijvoorbeeld totalUsers, totalProjects, etc.
    const totalUsersResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalUsers = totalUsersResult.rows[0].count;

    const totalProjectsResult = await pool.query('SELECT COUNT(*) FROM projects WHERE user_id = $1', [req.user.username]);
    const totalProjects = totalProjectsResult.rows[0].count;

    const openTicketsResult = await pool.query('SELECT COUNT(*) FROM tickets WHERE status = $1 AND user_id = $2', ['open', req.user.username]);
    const inProgressTicketsResult = await pool.query('SELECT COUNT(*) FROM tickets WHERE status = $1 AND user_id = $2', ['in behandeling', req.user.username]);
    const closedTicketsResult = await pool.query('SELECT COUNT(*) FROM tickets WHERE status = $1 AND user_id = $2', ['gesloten', req.user.username]);

    const openTickets = openTicketsResult.rows[0].count;
    const inProgressTickets = inProgressTicketsResult.rows[0].count;
    const closedTickets = closedTicketsResult.rows[0].count;

    res.json({
      stats: {
        totalUsers,
        totalProjects,
        openTickets,
        inProgressTickets,
        closedTickets
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, please try again later' });
  }
});
