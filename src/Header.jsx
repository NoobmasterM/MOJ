import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Dropdown from 'react-bootstrap/Dropdown';
import Badge from 'react-bootstrap/Badge';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from './api/client';

function Header() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mojUser')); } catch { return null; }
  });
  const [notifications, setNotifications] = useState([]);

  const refreshNotifications = async () => {
    try {
      const items = await apiClient.getNotifications();
      setNotifications(Array.isArray(items) ? items : []);
    } catch {
      setNotifications([]);
    }
  };

  useEffect(() => {
    const syncUser = async () => {
      try {
        const currentUser = await apiClient.getCurrentUser();
        localStorage.setItem('mojUser', JSON.stringify(currentUser));
        setUser(currentUser);
        await refreshNotifications();
      } catch {
        localStorage.removeItem('mojUser');
        setUser(null);
        setNotifications([]);
      }
    };

    syncUser();

    const handler = async () => {
      try {
        const currentUser = await apiClient.getCurrentUser();
        localStorage.setItem('mojUser', JSON.stringify(currentUser));
        setUser(currentUser);
        await refreshNotifications();
      } catch {
        localStorage.removeItem('mojUser');
        setUser(null);
        setNotifications([]);
      }
    };

    window.addEventListener('mojUserChanged', handler);
    return () => window.removeEventListener('mojUserChanged', handler);
  }, []);

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (err) {
      console.warn('Logout request failed', err);
    }
    localStorage.removeItem('mojUser');
    setUser(null);
    setNotifications([]);
    window.dispatchEvent(new CustomEvent('mojUserChanged'));
    navigate('/');
  };

  const clearNotifications = async () => {
    try {
      await apiClient.clearNotifications();
      await refreshNotifications();
    } catch (err) {
      console.warn('Clear notifications failed', err);
    }
  };

  return (
    <Navbar style={{ backgroundColor: 'purple' }} data-bs-theme="dark">
      <Container>
        <Navbar.Brand as={Link} to="/">MOJ</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link as={Link} to="/contests">Contests</Nav.Link>
          <Nav.Link as={Link} to="/Problemset">Problemset</Nav.Link>
          <Nav.Link as={Link} to="/rankings">Ranking</Nav.Link>
          <Nav.Link as={Link} to="/blogs">Blogs</Nav.Link>
        </Nav>
        <Nav className="justify-content-end align-items-center flex-row">
          {user ? (
            <>
              <Dropdown as={Nav.Item} align="end">
                <Dropdown.Toggle variant="link" className="nav-link border-0 position-relative">
                  <span>Notifications</span>
                  {notifications.length > 0 && (
                    <Badge bg="danger" pill className="ms-2">{notifications.length}</Badge>
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu style={{ minWidth: '320px', maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length > 0 ? (
                    <>
                      {notifications.map((notification) => (
                        <Dropdown.ItemText key={notification.id} className="border-bottom px-3 py-2 small text-wrap">
                          <div className="fw-semibold">{notification.senderUsername || 'System'}</div>
                          <div>{notification.message}</div>
                          <div className="text-muted mt-1">{new Date(notification.createdAt).toLocaleString()}</div>
                        </Dropdown.ItemText>
                      ))}
                      <div className="px-3 py-2 border-top">
                        <button type="button" className="btn btn-sm btn-outline-secondary w-100" onClick={clearNotifications}>Clear</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Dropdown.ItemText className="text-muted px-3 py-2">No notifications</Dropdown.ItemText>
                    </>
                  )}
                </Dropdown.Menu>
              </Dropdown>

              <Dropdown as={Nav.Item} align="end">
                <Dropdown.Toggle variant="link" className="nav-link border-0">{user.username || `User ${user.id}`}</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                  {['ADMIN', 'AUTHOR'].includes(user.role) && <Dropdown.Item as={Link} to="/console">Console</Dropdown.Item>}
                  <Dropdown.Item as={Link} to="/settings">Settings</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </>
          ) : (
            <Nav.Link as={Link} to="/login">Login</Nav.Link>
          )}
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Header;
