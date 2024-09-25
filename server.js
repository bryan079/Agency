const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;

const SECRET_KEY = 'your_jwt_secret_key'; // Vervang dit door een veiligere sleutel
app.use(express.json());

// Simpele in-memory "database" voor gebruikers (voor testen)
const users = [];

// Root route
app.get('/', (req, res) => {
  res.send('Backend is live on Railway!');
});

// Registratie route
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  // Controleer of de gebruiker al bestaat
  const userExists = users.find(user => user.username === username);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  // Hash het wachtwoord
  const hashedPassword = await bcrypt.hash(password, 10);

  // Sla de gebruiker op (in-memory)
  users.push({ username, password: hashedPassword });
  res.status(201).json({ message: 'User registered successfully' });
});

// Login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // Vind de gebruiker
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }

  // Controleer of het wachtwoord correct is
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  // Maak een JWT-token
  const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
  res.json({ token });
});

// Beveiligde route: alleen toegankelijk met een geldig token
app.get('/dashboard', (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided!' });
  }

  // Verifieer het token
  jwt.verify(token.split(' ')[1], SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token!' });
    }

    res.json({ message: `Welcome to your dashboard, ${decoded.username}` });
  });
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
