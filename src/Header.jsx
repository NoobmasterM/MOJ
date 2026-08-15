import React, { useEffect, useState } from 'react';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from './api/client';


function Header(){
  // The main function having the same name as the file

  const navigate = useNavigate();
  // useNavigate returns a function allowing programmatic (logical/ not user click_on_link events) routing within the site

  const [user, setUser] = useState(()=>{
   // * useState(): Declares a reactive variable container.
   // - Syntax: const [stateName, setStateName] = useState(initialValue);

    try { return JSON.parse(localStorage.getItem('mojUser')) } catch { return null } //Overall 11
    // LocalStorage saves raw data directly inside the user's internet browser cache. 
    // The data persists permanently unless manually wiped or cleared by code logic.
    //   * Core Command Rules:
    // 1. Save Data    : localStorage.setItem('keyName', 'string_value');
    // 2. Retrieve Data: localStorage.getItem('keyName');
    // 3. Delete Data  : localStorage.removeItem('keyName');

    //JSON.parse converts the string value to an object to be returned as the useState initial value. This/null is our user and setUser 
    //is the setter method.
  });

   
  useEffect(()=>{
  //   * useEffect(): Synchronizes your component layout with external systems (APIs).
  // - Syntax: useEffect(() => { ... }, [dependencies]);
  // - Rule: If dependencies array is empty '[]', the internal code executes 
  //   exactly once when the page finishes its initial browser paint step.

    const syncUser = async () => {

      try {
        const currentUser = await apiClient.getCurrentUser();
        //Asynchronous JS (Interacting with the database server)--API Client?

        localStorage.setItem('mojUser', JSON.stringify(currentUser));
        setUser(currentUser);
        //Loads in the user and sets him up

      } catch {
        const stored = localStorage.getItem('mojUser');
        //If user exists
        if (stored) {

          try {
          
            setUser(JSON.parse(stored));
            //set that

          } catch {
            setUser(null);
            //else

          }
        } else {
          setUser(null);
          //else

        }
      }
    };

    syncUser();
    //calling after declaring

    //Similar set up code---But why?

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

  },[]); //No dependencies

  const logout = async () => {
    try {
      await apiClient.logout();
      //

    } catch (err) {
      console.warn('Logout request failed', err);

    }
    localStorage.removeItem('mojUser');
    setUser(null);

    window.dispatchEvent(new CustomEvent('mojUserChanged'));
    navigate('/'); //Once
    //go home
  }

  return(
      <Navbar style={{backgroundColor:'purple'}} data-bs-theme="dark">
      {/* The navigation titles */}

        <Container>
        {/* ?? */}

          <Navbar.Brand as={Link} to="/">MOJ</Navbar.Brand>
          {/* The MOJ Brand in display is a "Link" to the homescreen ("/") */}

          <Nav className="me-auto">
          {/* "auto?" */}

            {/* The link texts on display tied to their associated pages */}
            <Nav.Link as={Link} to="/contests">Contests</Nav.Link>
            <Nav.Link as={Link} to='/Problemset'>Problemset</Nav.Link>
            <Nav.Link href="">Ranking</Nav.Link>
            <Nav.Link as={Link} to="/blogs">Blogs</Nav.Link>
          </Nav>
           <Nav className='justify-content-end'>
           {/* The right side login button */}

             {/* The conditional rendering */}
             {
             user ? 
             (
               <>
                 <Nav.Link as={Link} to="/profile">{user.username || `User ${user.id}`}</Nav.Link>
                 {/* The profile page and another clickable logout link */}
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
