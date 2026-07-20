import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import MOJButton from './Button'; 
import { Link } from "react-router-dom";

function Header({ trailOn, setTrail, light, setLight }) {
  return (
    <Navbar style={{ backgroundColor: 'purple' }} data-bs-theme="dark">
      <Container>
        <Navbar.Brand as={Link} to="/">MOJ</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="">Contests</Nav.Link>
          <Nav.Link as={Link} to='/Problemset'>Problemset</Nav.Link>
          <Nav.Link href="">Ranking</Nav.Link>
          <Nav.Link href="">Blogs</Nav.Link>
        </Nav>

        <Nav className='justify-content-end' style={{ alignItems: 'center', display: 'flex' }}>
          <MOJButton
            label={trailOn ? "Trail: ON" : "Trail: OFF"}
            isActive={trailOn}
            onClickAction={() => setTrail(!trailOn)}
          />

          <MOJButton
            label={light ? "☀️ Light" : "🌙 Dark"}
            isActive={light}
            onClickAction={() => setLight(!light)}
          />
          
          <Nav.Link href="">Login</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
}

export default Header;
