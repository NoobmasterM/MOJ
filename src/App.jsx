import React from 'react';
import Header from './Header'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProblemSet from './Problemset';
import ProblemDetail from './ProblemDetail';
import Home from './Home';
import Contests from './Contests';
import ContestDetail from './ContestDetail';
import Blogs from './Blogs';
import LoginRegister from './LoginRegister';
import Profile from './Profile';
import AdminDashboard from './AdminDashboard';
import AuthorDashboard from './AuthorDashboard';
import Console from './Console';
import Ranking from './Rankings';
import BlogsDash from './BlogsDashboard';
import { Container, Alert } from 'react-bootstrap';

function NotFound() {
  return (
    <Container className="p-4">
      <Alert variant="danger">404 - Page not found.</Alert>
    </Container>
  );
}

function App() {
  return(
  <BrowserRouter>
      <Header/>
        <Routes>
          <Route path='/' element={<Home/>} />
          <Route path='/Problemset' element={<ProblemSet/>} />
          <Route path='/Problems/:id' element={<ProblemDetail/>}/>
          <Route path='/contests' element={<Contests/>}/>
          <Route path='/contests/:id' element={<ContestDetail/>}/>
          <Route path='/blogs' element={<Blogs/>}/>
          <Route path='/login' element={<LoginRegister/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/admin' element={<AdminDashboard/>}/>
          <Route path='/author' element={<AuthorDashboard/>}/>
          <Route path='/console' element={<Console/>}/>
          <Route path='/Rankings' element = {<Ranking/>}/> 
          <Route path='/BlogsDashboard' element = {<BlogsDash/>}/>
          <Route path='*' element={<NotFound />} />
         </Routes>
    </BrowserRouter>
  );
}

export default App;
