import React from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import ProblemSet from './Problemset';
import { useNavigate, Link } from "react-router-dom";

function Header(){
return(
      <Navbar style={{backgroundColor:'purple'}} data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="/">MOJ</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="">Contests</Nav.Link>
            <Nav.Link as={Link} to='/Problemset'>Problemset</Nav.Link>
            <Nav.Link href="">Ranking</Nav.Link>
            <Nav.Link href="">Blogs</Nav.Link>
          </Nav>
           <Nav className='justify-content-end'><Nav.Link>Login</Nav.Link></Nav>
        </Container>
      </Navbar>
 )
}

export default Header