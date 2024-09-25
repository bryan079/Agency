import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

export default SupportTickets;
