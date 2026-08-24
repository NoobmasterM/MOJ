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
        </Routes>
    </BrowserRouter>
  );
}

export default App;
