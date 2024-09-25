import React, { useState } from 'react';
import axios from 'axios';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Foutmelding

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://agency.up.railway.app/login', { username, password });
      const token = response.data.token;
      localStorage.setItem('token', token);
      setMessage('Login successful');
      // Hier kun je gebruikers doorverwijzen naar de dashboardpagina na succesvolle login
    } catch (error) {
      if (error.response) {
        // De backend heeft een fout geretourneerd
        if (error.response.status === 400) {
          setMessage('Invalid username or password');
        } else if (error.response.status === 500) {
          setMessage('Server error, please try again later');
        }
      } else {
        // Netwerk- of andere fouten
        setMessage('Network error, please check your connection');
      }
    }
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p>{message}</p>} {/* Foutmelding weergeven */}
    </div>
  );
}

export default Login;
