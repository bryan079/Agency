import React, { useState } from 'react';
import axios from 'axios';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // Foutmelding

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://agency.up.railway.app/register', { username, password });
      setMessage('User registered successfully');
    } catch (error) {
      if (error.response) {
        // De backend heeft een fout geretourneerd
        if (error.response.status === 400) {
          setMessage('Username already exists or invalid input');
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
      <h2>Register</h2>
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
        <button type="submit">Register</button>
      </form>
      {message && <p>{message}</p>} {/* Foutmelding weergeven */}
    </div>
  );
}

export default Register;
