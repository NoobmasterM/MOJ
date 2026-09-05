import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { apiClient } from './api/client';
import AuthorDashboard from './AuthorDashboard';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [contest, setContest] = useState({ title: '', description: '', startTime: '', endTime: '' }), [searchUser, setSearchUser] = useState(''), [searchFocused, setSearchFocused] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setUsers(await apiClient.getUsers());
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const changeRole = async (id, role) => {
    const user = users.find((item) => item.id === id);
    if (user && user.username === 'NoobmasterM') {
      setError('403 - NoobmasterM role cannot be changed.');
      return;
    }

    try {
      await apiClient.updateUser(id, { role });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const createContest = async (event) => {
    event.preventDefault();
    try {
      await apiClient.createContest(contest);
      setContest({ title: '', description: '', startTime: '', endTime: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (!searchUser.trim()) return false;
    return user.username.toLowerCase().includes(searchUser.trim().toLowerCase());
  });

  return (
    <Container className="p-4">
      <h2>Console</h2>
      {error && <Alert variant="danger">{error}</Alert>}

      <h4 className="mt-4">Create contest</h4>
      <Form onSubmit={createContest} className="mb-4">
        <Form.Control className="mb-2" placeholder="Title" value={contest.title} onChange={(e) => setContest({ ...contest, title: e.target.value })} required />
        <Form.Control className="mb-2" placeholder="Description" value={contest.description} onChange={(e) => setContest({ ...contest, description: e.target.value })} />
        <Form.Control className="mb-2" type="datetime-local" value={contest.startTime} onChange={(e) => setContest({ ...contest, startTime: e.target.value })} required />
        <Form.Control className="mb-2" type="datetime-local" value={contest.endTime} onChange={(e) => setContest({ ...contest, endTime: e.target.value })} required />
        <Button type="submit">Create contest</Button>
      </Form>

      <h4>Users</h4>
      <Form.Control
        className="mb-3"
        type="text"
        placeholder="Search by username"
        value={searchUser}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setTimeout(() => setSearchFocused(false), 100)}
        onChange={(e) => setSearchUser(e.target.value)}
      />

      {searchFocused && (
        loading ? (
          <p>Loading users…</p>
        ) : filteredUsers.length === 0 ? (
          <Alert variant="info">No matching username found.</Alert>
        ) : (
          <div className="d-flex flex-column gap-2">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded p-3 d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <div>
                  <strong>{user.username}</strong>
                  <div className="text-muted small">ID: {user.id} · {user.email}</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Form.Select size="sm" value={user.role} onChange={(e) => changeRole(user.id, e.target.value)} disabled={user.username === 'NoobmasterM'} style={{ minWidth: 130 }}>
                    <option value="USER">User</option>
                    <option value="AUTHOR">Author</option>
                    <option value="ADMIN">Admin</option>
                  </Form.Select>
                  {user.username === 'NoobmasterM' && <small className="text-muted">Protected</small>}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <hr className="my-5" />
      <AuthorDashboard embedded />
    </Container>
  );
}

