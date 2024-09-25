import React, { useEffect, useState } from 'react';
import axios from 'axios';

function ProjectsDashboard() {
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://agency.up.railway.app/projects', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => setProjects(response.data))
    .catch(error => setError('Error fetching projects'));
  }, []);

  return (
    <div>
      <h2>Your Projects</h2>
      {error && <p>{error}</p>}
      <ul>
        {projects.map(project => (
          <li key={project.id}>{project.name} - {project.status}</li>
        ))}
      </ul>
    </div>
  );
}

export default ProjectsDashboard;
