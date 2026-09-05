import React, { useEffect, useState } from 'react';
import { Alert, Container } from 'react-bootstrap';
import { apiClient } from './api/client';
import AdminDashboard from './AdminDashboard';
import AuthorDashboard from './AuthorDashboard';

export default function Console() {
  const [user, setUser] = useState(null), [error, setError] = useState('');
  useEffect(() => { apiClient.getCurrentUser().then(setUser).catch((err) => setError(err.message)); }, []);
  if (error) return <Container className="p-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!user) return <Container className="p-4">Loading console…</Container>;
  if (user.role === 'ADMIN') return <AdminDashboard />;
  if (user.role === 'AUTHOR') return <AuthorDashboard />;
  return <Container className="p-4"><Alert variant="danger">403 - Author or administrator access is required.</Alert></Container>;
}
