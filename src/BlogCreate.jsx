import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { apiClient } from './api/client';

const tagsFrom = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean);

export default function BlogCreate() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null), [error, setError] = useState(''), [saving, setSaving] = useState(false);
  const [blog, setBlog] = useState({ title: '', content: '', tags: '' });
  useEffect(() => { apiClient.getCurrentUser().then(setUser).catch((err) => setError(err.message)); }, []);
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try { await apiClient.createBlog({ ...blog, tags: tagsFrom(blog.tags) }); navigate('/blogs/manage'); }
    catch (err) { setError(err.message); } finally { setSaving(false); }
  };
  if (error && !user) return <Container className="p-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!user) return <Container className="p-4">Loading...</Container>;
  if (!['ADMIN', 'AUTHOR'].includes(user.role)) return <Container className="p-4"><Alert variant="danger">403 - Author or administrator access is required.</Alert></Container>;
  return <Container className="p-4" style={{ maxWidth: 800 }}><h2>Create blog</h2>{error && <Alert variant="danger">{error}</Alert>}
    <Form onSubmit={submit}><Form.Group className="mb-3"><Form.Label>Title</Form.Label><Form.Control value={blog.title} onChange={(e) => setBlog({ ...blog, title: e.target.value })} required /></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Content</Form.Label><Form.Control as="textarea" rows={10} value={blog.content} onChange={(e) => setBlog({ ...blog, content: e.target.value })} required /></Form.Group>
      <Form.Group className="mb-3"><Form.Label>Tags <small className="text-muted">(comma separated)</small></Form.Label><Form.Control value={blog.tags} onChange={(e) => setBlog({ ...blog, tags: e.target.value })} /></Form.Group>
      <Button type="submit" variant="success" disabled={saving}>{saving ? 'Publishing...' : 'Publish blog'}</Button><Button type="button" variant="danger" className="ms-2" onClick={() => navigate('/blogs')}>Cancel</Button>
    </Form></Container>;
}
