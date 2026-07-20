import React from 'react';
import Button from 'react-bootstrap/Button';

export default function MOJButton({ label, isActive, onClickAction }) {
    return (
        <Button
          size='sm' 
          onClick={onClickAction} 
          style={{
              fontFamily: 'monospace',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '12px',
              marginRight: '10px',
              border: '2px solid transparent',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: isActive ? 'rgba(0, 204, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
              color: isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.65)',
              borderColor: isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)',
              boxShadow: isActive ? '0 0 10px rgba(0, 229, 255, 0.25)' : 'none',
          }}
          onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isActive ? 'rgba(0, 204, 255, 0.3)' : 'rgba(255, 255, 255, 0.18)';
              e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isActive ? 'rgba(0, 204, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = isActive ? '#00e5ff' : 'rgba(255, 255, 255, 0.65)';
          }}
        >
            {label}
        </Button>
    );
}
