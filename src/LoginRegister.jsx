import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Container, Form, Row, Tab, Tabs } from "react-bootstrap";
import { apiClient } from "./api/client";

function LoginRegister() {
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({ username: "", email: "", password: "", role: "USER" }); 

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  const saveUser = async (user) => {

    localStorage.setItem("mojUser", JSON.stringify(user));

    setMessage(`Welcome, ${user.username}!`);

    setError("");

    window.dispatchEvent(new CustomEvent('mojUserChanged')); //dispatch?
  };

  const handleLogin = async (event) => {

    event.preventDefault();

    setLoading(true);
    try {
      const user = await apiClient.login(loginForm);

      saveUser(user);

      navigate('/'); //Home

    } catch (err) {

      setError(err.message);
      setMessage("");

    } finally {

      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();

    setLoading(true);
    try {
      const user = await apiClient.register(registerForm);

      saveUser(user);

      navigate('/');
    } catch (err) {

      setError(err.message);
      setMessage("");
    } finally {

      setLoading(false);
    }
  };

  return (
    <Container className="p-4">
     {/*  */}
      <Row className="justify-content-center">
      {/*  */}
        <Col md={7} lg={5}>
        {/*  */}
          <Card>
           {/*  */}
            <Card.Body>
            {/*  */}
              <h2 className="mb-3">Login / Register</h2>

              {message && <Alert variant="success">{message}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}

              {/*  */}

              <Tabs defaultActiveKey="login" className="mb-3">
                {/*  */}
                <Tab eventKey="login" title="Login">
                  {/*  */}
                  <Form onSubmit={handleLogin}>
                    {/* A row */}
                    <Form.Group className="mb-3">

                      <Form.Label>Email</Form.Label>

                      <Form.Control type="email" value={loginForm.email} onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })} required />

                    </Form.Group>

                    {/* Another one */}
                    <Form.Group className="mb-3">

                      <Form.Label>Password</Form.Label>

                      <Form.Control type="password" value={loginForm.password} onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })} required />

                    </Form.Group>

                    {/* A button */}
                    <Button type="submit" disabled={loading}>Login</Button>

                  </Form>

                </Tab>
                {/* The Login Tab */}
                {/* Same logic for the Register Tab */}

                <Tab eventKey="register" title="Register">

                  <Form onSubmit={handleRegister}>

                    <Form.Group className="mb-3">

                      <Form.Label>Username</Form.Label>
                      <Form.Control value={registerForm.username} onChange={(event) => setRegisterForm({ ...registerForm, username: event.target.value })} required />
                    
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email</Form.Label>
                      <Form.Control type="email" value={registerForm.email} onChange={(event) => setRegisterForm({ ...registerForm, email: event.target.value })} required />
                    </Form.Group>
                   
                    <Form.Group className="mb-3">
                      <Form.Label>Password</Form.Label>
                      <Form.Control type="password" value={registerForm.password} onChange={(event) => setRegisterForm({ ...registerForm, password: event.target.value })} required />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Role</Form.Label>
                      
                      <Form.Select value={registerForm.role} onChange={(event) => setRegisterForm({ ...registerForm, role: event.target.value })}>
                        <option value="USER">User</option>
                        <option value="ADMIN">Admin</option>
                      </Form.Select>
                   
                    </Form.Group>
                    
                    <Button type="submit" disabled={loading}>Register</Button>

                  </Form>

                </Tab>

              </Tabs>

            </Card.Body>

          </Card>

        </Col>

      </Row>
      
    </Container>
  );
}

export default LoginRegister;
