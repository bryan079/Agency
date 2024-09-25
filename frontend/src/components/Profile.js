import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Profile() {
  const [profile, setProfile] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('https://agency.up.railway.app/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then(response => setProfile(response.data))
    .catch(error => setMessage('Error loading profile'));
  }, []);

  return (
    <div>
      <h2>Profile</h2>
      {message ? <p>{message}</p> : <p>Username: {profile.username}</p>}
    </div>
  );
}

export default Profile;
