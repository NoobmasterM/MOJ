import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import 'bootstrap/dist/css/bootstrap.min.css';



createRoot(
  //injects project tree <App/> into it and create the runnable DOM

  document.getElementById('root')
  //empty single container element in the index base template

  ).render( //Overall 17;
//handover between the physical HTML template file and the React engine compilation system.

  <StrictMode>
  {/* utility wrapper to mount elements twice and checks for scripting bugs   */}

    <App />
    {/* our stuff */}

  </StrictMode>
)

/* Every standard React functional component file must follow this structural layout:

// --- SECTION A: IMPORTS ---
import React from 'react';                   // React library base engine
import MyComponentStyle from './Styles.css'; // Optional local styles
import ChildComponent from './Child';        // Sub-elements used in layout

// --- SECTION B: FUNCTION COMPONENT DEFINITION ---
function MyComponent() {
  // 1. JavaScript logic, Local State variables, and Hooks live here
  // 2. Data calculation/manipulation triggers before rendering

  // 3. The Return Statement (Must return exactly ONE top-level parent wrapper)
  return (
    <div className="component-wrapper">
      <h1>Title Element</h1>
      <ChildComponent />
    </div>
  );
}

// --- SECTION C: EXPORT STATEMENT ---
export default MyComponent; // Exposes file for application-wide imports
*/
