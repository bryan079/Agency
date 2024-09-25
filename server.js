// server.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Root route (dit kun je aanpassen of uitbreiden)
app.get('/', (req, res) => {
  res.send('Backend is live on Railway!');
});

// Voorbeeld van een login route (dummy data)
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Hier kun je later echte login logica toevoegen
  if (username === 'admin' && password === 'password') {
    return res.json({ message: 'Login success!' });
  } else {
    return res.status(401).json({ message: 'Invalid credentials!' });
  }
});

// Start de server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
