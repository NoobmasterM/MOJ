import React from 'react';
import { Button, Container } from "react-bootstrap";
import { Link } from "react-router-dom";

function Home(){
    return(
        <Container className="p-4">

            <h1>MOJ Online Judge</h1>

            <p className="text-muted">Practice problems, submit solutions, join contests, and read updates.</p>

            <Button as={Link} to="/Problemset" style={{backgroundColor:'purple', borderColor:'purple'}}>

                Open Problemset
            </Button>
            
        </Container>
    )
}

export default Home;
