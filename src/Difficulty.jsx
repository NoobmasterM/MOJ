import React from "react";
import './App.css';

function Difficulty({rating,fill,color}) {
    return (
        <div className="difficulty">
            <div className="difficulty-circle" style={{"--fill":`${fill}%`,color:color,}}/>
            <span style={{color}}>{rating}</span>
        </div>
    );
}

export default Difficulty;