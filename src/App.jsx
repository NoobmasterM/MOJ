import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from './Header';
import ProblemSet from './Problemset';
import Ptemp from './Problems/Ptemplate';
import Home from './Home';
import CanvasTrail from './CanvasTrail';

function App() {
  const [trailOn, setTrail] = useState(true);
  const [light, setLight] = useState(true);

  useEffect(() => {
    const body = document.body;
    if (light) {
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    } else {
      body.classList.add('dark-theme');
      body.classList.remove('light-theme');
    }
  }, [light]);

  return (
    <BrowserRouter>
      {trailOn && <CanvasTrail />}
      
      <Header 
        trailOn={trailOn} 
        setTrail={setTrail} 
        light={light} 
        setLight={setLight} 
      />
      
      <Routes>
        <Route path='/' element={<Home />} /> 
        <Route path='/Problemset' element={<ProblemSet />} />
        <Route path='/Problems/:ID' element={<Ptemp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
