import React from 'react';
import Header from './Header'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProblemSet from './Problemset';
import ProblemDetail from './ProblemDetail';
import Home from './Home';
import Contests from './Contests';
import ContestDetail from './ContestDetail';
import ContestStandings from './ContestStandings';
import Blogs from './Blogs';
import BlogDetail from './BlogDetail';
import BlogCreate from './BlogCreate';
import BlogManage from './BlogManage';
import Settings from './Settings';
import LoginRegister from './LoginRegister';
import Profile from './Profile';
import AdminDashboard from './AdminDashboard';
import AuthorDashboard from './AuthorDashboard';
import Console from './Console';
import Rankings from './Rankings';
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
          <Route path='/contests/:id/standings' element={<ContestStandings/>}/>
          <Route path='/blogs' element={<Blogs/>}/>
          <Route path='/blogs/:id' element={<BlogDetail/>}/>
          <Route path='/blogs/create' element={<BlogCreate/>}/>
          <Route path='/blogs/manage' element={<BlogManage/>}/>
          <Route path='/login' element={<LoginRegister/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/settings' element={<Settings/>}/>
          <Route path='/admin' element={<AdminDashboard/>}/>
          <Route path='/author' element={<AuthorDashboard/>}/>
          <Route path='/console' element={<Console/>}/>
          <Route path='/rankings' element={<Rankings/>}/>
          <Route path='*' element={<NotFound />} />
         </Routes>
    </BrowserRouter>
  );
}

export default App;
