import React, { useEffect, useState } from 'react';
import { Alert, Button, Container, Form, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { apiClient } from './api/client';

const empty = { title: '', content: '', tags: '' };
const tagsFrom = (value) => value.split(',').map((tag) => tag.trim()).filter(Boolean);

export default function BlogManage() {
  const [user, setUser] = useState(null), [blogs, setBlogs] = useState([]), [editing, setEditing] = useState(null), [form, setForm] = useState(empty), [error, setError] = useState(''), [message, setMessage] = useState('');
  const load = async () => { try { const [currentUser, allBlogs] = await Promise.all([apiClient.getCurrentUser(), apiClient.getBlogs()]); setUser(currentUser); setBlogs(allBlogs); } catch (err) { setError(err.message); } };
  useEffect(() => { load(); }, []);
  const visible = user?.role === 'ADMIN' ? blogs : blogs.filter((blog) => blog.author_id === user?.id);
  const edit = (blog) => { setEditing(blog.id); setForm({ title: blog.title, content: blog.content, tags: Array.isArray(blog.tags) ? blog.tags.join(', ') : '' }); setError(''); };
  const save = async (event) => { event.preventDefault(); try { const updated = await apiClient.updateBlog(editing, { ...form, tags: tagsFrom(form.tags) }); setBlogs((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item)); setEditing(null); setForm(empty); setMessage('Blog updated.'); } catch (err) { setError(err.message); } };
  const remove = async (id) => { if (!window.confirm('Delete this blog? This cannot be undone.')) return; try { await apiClient.deleteBlog(id); setBlogs((items) => items.filter((item) => item.id !== id)); setMessage('Blog deleted.'); } catch (err) { setError(err.message); } };
  if (error && !user) return <Container className="p-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!user) return <Container className="p-4">Loading...</Container>;
  if (!['ADMIN', 'AUTHOR'].includes(user.role)) return <Container className="p-4"><Alert variant="danger">403 - Author or administrator access is required.</Alert></Container>;
  return <Container className="p-4"><div className="d-flex justify-content-between align-items-center mb-4"><h2 className="mb-0">{user.role === 'ADMIN' ? 'Manage all blogs' : 'Manage my blogs'}</h2><Button as={Link} to="/blogs/create" style={{backgroundColor:'purple', borderColor:'purple'}}>Create blog</Button></div>{error && <Alert variant="danger">{error}</Alert>}{message && <Alert variant="success" dismissible onClose={() => setMessage('')}>{message}</Alert>}
    {editing && <Form onSubmit={save} className="border rounded p-3 mb-4"><h4>Edit blog</h4><Form.Control className="mb-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /><Form.Control as="textarea" rows={8} className="mb-2" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /><Form.Control className="mb-2" placeholder="Tags, comma separated" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /><Button type="submit" variant="success">Save changes</Button><Button type="button" variant="danger" className="ms-2" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</Button></Form>}
    <Table striped responsive><thead><tr><th>Title</th>{user.role === 'ADMIN' && <th>Author</th>}<th>Created</th><th>Actions</th></tr></thead><tbody>{visible.length === 0 ? <tr><td colSpan={user.role === 'ADMIN' ? 4 : 3}>No blogs to manage.</td></tr> : visible.map((blog) => <tr key={blog.id}><td>{blog.title}</td>{user.role === 'ADMIN' && <td>{blog.authorUsername || blog.author || 'Unknown'}</td>}<td>{new Date(blog.createdAt).toLocaleDateString()}</td><td><Button size="sm" variant="outline-primary" onClick={() => edit(blog)}>Edit</Button><Button size="sm" variant="outline-danger" className="ms-2" onClick={() => remove(blog.id)}>Delete</Button></td></tr>)}</tbody></Table>
  </Container>;
}
