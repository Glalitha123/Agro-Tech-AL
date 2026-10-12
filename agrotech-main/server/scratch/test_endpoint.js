import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
  // Let's log in first to get a token
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'farmer@agrotech.com', password: 'farmer123' })
  });
  
  if (!loginRes.ok) {
    console.error('Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Logged in successfully, token received.');

  // Now fetch districts
  const districtsRes = await fetch('http://localhost:3001/api/market/districts?state=Maharashtra', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Districts status:', districtsRes.status);
  const districtsData = await districtsRes.json();
  console.log('Districts data:', districtsData);
};

run();
