import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const [profile, setProfile] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to view this page');
      return;
    }

    axios.get('https://agency.up.railway.app/profile', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => setProfile(response.data))
    .catch(error => {
      if (error.response && error.response.status === 401) {
        setError('Unauthorized, please log in again');
      } else {
        setError('Error fetching profile data');
      }
    });
  }, []);

  return (
    <div>
      <h2>Profile</h2>
      {error ? <p>{error}</p> : <p>Username: {profile.username}</p>}
    </div>
  );
}

export default Profile;
