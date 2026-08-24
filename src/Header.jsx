import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from './api/client';


function Header(){
  
  const navigate = useNavigate();
  const [user, setUser] = useState(()=>{

    try { return JSON.parse(localStorage.getItem('mojUser')) } catch { return null } 
   
  });

  useEffect(()=>{
  
    const syncUser = async () => {

      try {
        const currentUser = await apiClient.getCurrentUser();
    
        localStorage.setItem('mojUser', JSON.stringify(currentUser));
        setUser(currentUser);
        
      } catch {
        const stored = localStorage.getItem('mojUser');
        if (stored) {
          try { 
            setUser(JSON.parse(stored));
           
          } catch {
            setUser(null);
          
          }
        } else {
          setUser(null);
        }
      }
    };

    syncUser();
    

    const handler = async () => {
      try {
        const currentUser = await apiClient.getCurrentUser();
        localStorage.setItem('mojUser', JSON.stringify(currentUser));
        setUser(currentUser);

      } catch {
        const stored = localStorage.getItem('mojUser');
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    };

    window.addEventListener('mojUserChanged', handler);
    return () => window.removeEventListener('mojUserChanged', handler);

  },[]); 
  
  const logout = async () => {
    try {
      await apiClient.logout();
     

    } catch (err) {
      console.warn('Logout request failed', err);

    }
    localStorage.removeItem('mojUser');
    setUser(null);

    window.dispatchEvent(new CustomEvent('mojUserChanged'));
    navigate('/'); 
    
  }

  return(
      <Navbar style={{backgroundColor:'purple'}} data-bs-theme="dark">
    
        <Container>
        
          <Navbar.Brand as={Link} to="/">MOJ</Navbar.Brand>
          <Nav className="me-auto">
         
            <Nav.Link as={Link} to="/contests">Contests</Nav.Link>
            <Nav.Link as={Link} to='/Problemset'>Problemset</Nav.Link>
            <Nav.Link href="">Ranking</Nav.Link>
            <Nav.Link as={Link} to="/blogs">Blogs</Nav.Link>
          </Nav>
           <Nav className='justify-content-end'>
          
             {
             user ? 
             (
               <>
                 <Nav.Link as={Link} to="/profile">{user.username || `User ${user.id}`}</Nav.Link>
                
                 <Nav.Link onClick={logout}>Logout</Nav.Link>
               </>

             ) : (
               <Nav.Link as={Link} to="/login">Login</Nav.Link>
             )
             }

           </Nav>
        </Container>
      </Navbar>
  )
}

export default Header
