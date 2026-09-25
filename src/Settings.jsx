import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiClient } from './api/client';

export default function Settings() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ username: '', profilePic: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiClient.getCurrentUser()
      .then((current) => {
        setUser(current);
        setForm({ username: current.username || '', profilePic: current.profilePic || '', password: '' });
      })
      .catch((err) => setError(err.message));
  }, []);

  const handleProfileImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setForm((current) => ({ ...current, profilePic: result }));
      setError('');
      setMessage('Profile image selected. Save to apply it.');
    };
    reader.onerror = () => setError('Could not read the selected image.');
    reader.readAsDataURL(file);
  };

  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = { username: form.username, profilePic: form.profilePic };
      if (form.password) payload.password = form.password;

      const updated = await apiClient.updateUser(user.id, payload);
      localStorage.setItem('mojUser', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mojUserChanged'));
      setUser(updated);
      setForm((value) => ({ ...value, password: '' }));
      setMessage('Settings saved.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (error && !user) return <Container className="p-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!user) return <Container className="p-4">Loading settings...</Container>;

  return (
    <Container className="p-4" style={{ maxWidth: 640 }}>
      <h2>Settings</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <Form onSubmit={save}>
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Profile image</Form.Label>
          <div className="d-flex align-items-center gap-3 mb-2">
            <Image
              src={form.profilePic || 'https://via.placeholder.com/80'}
              roundedCircle
              width={64}
              height={64}
              alt="Profile preview"
              style={{ objectFit: 'cover', background: '#f1f1f1' }}
            />
            <div className="text-muted small">Choose a local image or paste a URL below.</div>
          </div>
          <Form.Control type="file" accept="image/*" onChange={handleProfileImageSelect} />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Profile image URL</Form.Label>
          <Form.Control
            value={form.profilePic}
            onChange={(e) => setForm({ ...form, profilePic: e.target.value })}
            placeholder="https://example.com/avatar.png"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>New password <small className="text-muted">(optional)</small></Form.Label>
          <Form.Control
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Form.Group>

        <Button type="submit" variant="success">Save</Button>
        <Button type="button" variant="danger" className="ms-2" onClick={() => navigate('/profile')}>Cancel</Button>
      </Form>
    </Container>
  );
}
