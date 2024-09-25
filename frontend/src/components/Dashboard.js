import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://agency.up.railway.app/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => setStats(response.data.stats))
    .catch(error => setMessage('Error loading dashboard'));
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      {message ? <p>{message}</p> : <p>Total Users: {stats.totalUsers}</p>}
    </div>
  );
}

export default Dashboard;
  
