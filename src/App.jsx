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
//Normal Function definition
  return(
  //A multiline return statement

  <BrowserRouter>
  {/* the root routing wrapper, manages URLs without full page Reloads */}

      <Header/>
      {/* The Header component */}

        <Routes>
        {/* listens to current browser URL paths and finds closest match from its <Route> childrens */}

          {/* A declarative URL definition component: two props: the path (web address) and the element(ex. <Home/> ) that the path
          is mapped to */}

          <Route path='/' element={<Home/>} />
          <Route path='/Problemset' element={<ProblemSet/>} />
          <Route path='/Problems/:id' element={<ProblemDetail/>}/>
          {/* ":id" acts as a dynamic variable placeHolder and will be dealt with in the associated element's .jsx file */}

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
