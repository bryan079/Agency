import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';

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

  // Maak een dataset voor de gebruikersstatistieken
  const userChartData = {
    labels: ['Gebruikers'],
    datasets: [
      {
        label: 'Totaal aantal gebruikers',
        data: [stats.totalUsers],
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
    ],
  };

  // Maak een dataset voor de projecten
  const projectChartData = {
    labels: ['Projecten'],
    datasets: [
      {
        label: 'Totaal aantal projecten',
        data: [stats.totalProjects],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
    ],
  };

  // Maak een dataset voor de support tickets
  const ticketChartData = {
    labels: ['Open', 'In Behandeling', 'Gesloten'],
    datasets: [
      {
        label: 'Support Tickets',
        data: [
          stats.openTickets,
          stats.inProgressTickets,
          stats.closedTickets
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
      },
    ],
  };

  return (
    <div>
      <h2>Dashboard</h2>
      {message ? <p>{message}</p> : (
        <>
          <p>Totaal aantal gebruikers: {stats.totalUsers}</p>
          <p>Totaal aantal projecten: {stats.totalProjects}</p>
          <p>Open tickets: {stats.openTickets}</p>
          <p>Tickets in behandeling: {stats.inProgressTickets}</p>
          <p>Gesloten tickets: {stats.closedTickets}</p>

          {/* Voeg de grafieken toe */}
          <div>
            <h3>Gebruikersstatistieken</h3>
            <Bar data={userChartData} />
          </div>

          <div>
            <h3>Projectstatistieken</h3>
            <Bar data={projectChartData} />
          </div>

          <div>
            <h3>Support Tickets Status</h3>
            <Bar data={ticketChartData} />
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
