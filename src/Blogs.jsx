import React, { useEffect, useState } from "react";
import { Badge, Card, Col, Container, Row } from "react-bootstrap";
import { apiClient } from "./api/client";

function Blogs() {
  const [blogs, setBlogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      try {

        setLoading(true);
        setBlogs(await apiClient.getBlogs());
        //
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) return <Container className="p-4">Loading blogs...</Container>;

  if (error) return <Container className="p-4 text-danger">Error: {error}</Container>;


  return (
    <Container className="p-4">

      <h2 className="mb-4">Blogs</h2>

      <Row className="g-3">
        
        {
        blogs.map((blog) => (
          <Col md={6} key={blog.id}>
            <Card className="h-100">
              <Card.Body>
                <Card.Title>{blog.title}</Card.Title>

                <div className="small text-muted mb-2">

                  By {blog.author} • {new Date(blog.createdAt).toLocaleDateString()} • {blog.views} views
                </div>

                <Card.Text>{blog.content}</Card.Text>

                {
                Array.isArray(blog.tags) && blog.tags.map((tag) => (

                  <Badge key={tag} bg="info" text="dark" className="me-1">{tag}</Badge>
                ))
                }
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
