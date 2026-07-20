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
              
              backgroundColor: isActive ? 'var(--btn-active-bg)' : 'var(--btn-inactive-bg)',
              color: isActive ? 'var(--btn-active-text)' : 'var(--btn-inactive-text)',
              borderColor: isActive ? 'var(--btn-active-border)' : 'var(--btn-inactive-border)',
              boxShadow: isActive ? '0 0 10px rgba(250, 204, 21, 0.25)' : 'none',
          }}
          onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isActive ? 'var(--btn-hover-active-bg)' : 'var(--btn-hover-inactive-bg)';
          }}
          onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isActive ? 'var(--btn-active-bg)' : 'var(--btn-inactive-bg)';
          }}
        >
            {label}
        </Button>
    );
}
