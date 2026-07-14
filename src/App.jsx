import React from 'react';
import Header from './Header'
import { Container, Row, Col} from 'react-bootstrap';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProblemSet from './Problemset';
import P1 from './Problems/1';
import Home from './Home';

function App() {
  return(
  <BrowserRouter>
      <Header/>
        <Routes>
          <Route path='/Problemset' element={<ProblemSet/>} />
          <Route path='/Problems/1' element={<P1/>}/>
         </Routes>
    </BrowserRouter>
  );
}

export default App;
