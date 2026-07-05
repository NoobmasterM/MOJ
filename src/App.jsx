import React from 'react';
import Editor from './Editor'
import Header from './Header'

function App() {
  return (
  <div className='grid grid-rows-10 space-y-1'>
    <Header/>
    <div className='grid grid-cols-2 row-span-9'>
      <div></div>
      <Editor/>
    </div>
  </div>
  );
}

export default App;
