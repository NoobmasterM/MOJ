import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Container } from 'react-bootstrap';
import { Link, useParams } from 'react-router-dom';
import { MathJax, MathJaxContext } from 'better-react-mathjax';
import { apiClient } from './api/client';

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags !== 'string') return [];

  try {
    const parsed = JSON.parse(tags);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore malformed JSON and fall back to comma-separated values
  }

  return tags.split(',').map((tag) => tag.trim()).filter(Boolean);
};

function BlogDetail() {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [voting, setVoting] = useState(false);
  const currentUser = (() => {
    try {
      const storedUser = localStorage.getItem('mojUser');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getBlog(id);
        setBlog(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  const handleVote = async (type) => {
    if (!id) return;

    if (!currentUser?.id) {
      setError('Please log in to like or dislike this blog.');
      return;
    }

    try {
      setVoting(true);
      const updated = await apiClient.voteOnBlog(id, type);
      setBlog((current) => current ? {
        ...current,
        likes: Number(updated?.likes ?? current.likes ?? 0),
        dislikes: Number(updated?.dislikes ?? current.dislikes ?? 0)
      } : current);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to record your reaction.');
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <Container className="p-4">Loading blog...</Container>;
  if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;
  if (!blog) return <Container className="p-4">Blog not found.</Container>;

  const tags = normalizeTags(blog.tags);

  return (
    <Container className="p-4" style={{ maxWidth: 900 }}>
      <Card>
        <Card.Body className="p-4">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-3">
            <h2 className="mb-0">{blog.title}</h2>
            <span className="text-muted small">{blog.views ?? 0} views</span>
          </div>

          <div className="small text-muted mb-3">
            By {blog.author || blog.authorUsername || 'Unknown'} • {new Date(blog.createdAt).toLocaleDateString()}
          </div>

          <div className="d-flex gap-2 mb-3">
            <Button variant="outline-primary" size="sm" onClick={() => handleVote('like')} disabled={voting || !currentUser?.id}>
              Like ({blog.likes ?? 0})
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => handleVote('dislike')} disabled={voting || !currentUser?.id}>
              Dislike ({blog.dislikes ?? 0})
            </Button>
          </div>

          {tags.length > 0 && (
            <div className="mb-3">
              {tags.map((tag) => (
                <Badge key={tag} bg="info" className="me-1 mb-1">{tag}</Badge>
              ))}
            </div>
          )}

          <MathJaxContext>
            <MathJax>
              {String.raw`
              ${blog.content}
              `}
            </MathJax>
          </MathJaxContext>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default BlogDetail;
