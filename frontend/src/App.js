import React, { useState, useEffect } from 'react';
import axios from 'axios';

// SupportTickets component (zoals je die al had)
function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://agency.up.railway.app/tickets', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => setTickets(response.data))
    .catch(error => console.error('Error fetching tickets'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('https://agency.up.railway.app/tickets', { subject, description }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('Ticket created successfully');
    } catch (error) {
      setMessage('Error creating ticket');
    }
  };

  return (
    <div>
      <h2>Support Tickets</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Submit Ticket</button>
      </form>
      {message && <p>{message}</p>}
      <h3>Existing Tickets</h3>
      <ul>
        {tickets.map(ticket => (
          <li key={ticket.id}>{ticket.subject} - {ticket.status}</li>
        ))}
      </ul>
    </div>
  );
}

// Dashboard component voor nieuwe data
function Dashboard() {
  const [stats, setStats] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://agency.up.railway.app/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => setStats(response.data.stats))
    .catch(error => setMessage('Error loading dashboard'));
  }, []);

  return (
    <div>
      <h2>Dashboard</h2>
      {message ? (
        <p>{message}</p>
      ) : (
        <div>
          <p>Total Users: {stats.totalUsers}</p>
          <p>Total Projects: {stats.totalProjects}</p>
          <p>Open Tickets: {stats.openTickets}</p>
          <p>In Progress Tickets: {stats.inProgressTickets}</p>
          <p>Closed Tickets: {stats.closedTickets}</p>
        </div>
      )}
    </div>
  );
}

// Hoofdfunctie van de app
function App() {
  return (
    <div>
      <h1>Welcome to the App</h1>
      <Dashboard />
      <SupportTickets />
    </div>
  );
}

export default App;
