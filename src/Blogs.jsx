import React, { useEffect, useState } from "react";
import { Badge, Button, Card, Col, Container, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import { apiClient } from "./api/client";
import { MathJax, MathJaxContext } from 'better-react-mathjax';

function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        setBlogs(await apiClient.getBlogs());
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
    apiClient.getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  if (loading) return <Container className="p-4">Loading blogs...</Container>;
  if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;

  return (
    <Container className="p-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="mb-0">Blogs</h2>
        {['ADMIN', 'AUTHOR'].includes(user?.role) && <div>
          <Button as={Link} to="/blogs/create"  style={{backgroundColor:'purple', borderColor:'purple'}}>Create blog</Button>
          <Button as={Link} to="/blogs/manage" className="ms-2" style={{backgroundColor:'purple', borderColor:'purple'}}>Manage blogs</Button>
        </div>}
      </div>
      <Row className="g-3">
        {blogs.map((blog) => (
          <Col md={6} key={blog.id}>
            <Card as={Link} to={`/blogs/${blog.id}`} className="h-100 text-decoration-none text-reset">
              <Card.Body>
                <Card.Title>{blog.title}</Card.Title>
                <div className="small text-muted mb-2">
                  By {blog.author} • {new Date(blog.createdAt).toLocaleDateString()} • {blog.views} views
                </div>
                <Card.Text>
                  <MathJaxContext>
                   <MathJax>
                   {String.raw`
              ${blog.content}
              `}
                   </MathJax>
                   </MathJaxContext>
                  </Card.Text>
                {Array.isArray(blog.tags) && blog.tags.map((tag) => (
                  <Badge key={tag} bg="info" className="me-1">{tag}</Badge>
                ))}
              </Card.Body>
            </Card>
          </Col>
        ))}
        {blogs.length === 0 && <Col>No blogs available.</Col>}
      </Row>
    </Container>
  );
}

export default Blogs;
