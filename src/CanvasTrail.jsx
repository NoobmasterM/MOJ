import React, { useEffect, useRef } from 'react';

export default function CanvasTrail() {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current; 
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); 
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize); 

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const points = pointsRef.current;

      if (points.length > 0) {
        points.pop(); 
      }

      if (points.length < 4) {
        requestAnimationFrame(animate);
        return;
      }

      const isDarkActive = document.body.classList.contains('dark-theme');
      const baseColor = isDarkActive ? '#ff007f' : '#4f46e5'; 

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const ratio = (points.length - i) / points.length; 

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        ctx.lineWidth = ratio * 12;       
        ctx.globalAlpha = ratio * 0.70;    
        ctx.strokeStyle = baseColor;
        ctx.lineCap = 'round';           
        ctx.lineJoin = 'round';

        ctx.shadowBlur = isDarkActive ? ratio * 12 : ratio * 3;
        ctx.shadowColor = baseColor;

        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate); 

    const handleMove = (e) => {
      const cleanX = e.clientX  - 20;
      const cleanY = e.clientY + 30;

      pointsRef.current.unshift({ x: cleanX, y: cleanY });

      const maxTrailLength = 45; 
      if (pointsRef.current.length > maxTrailLength) {
        pointsRef.current.pop(); 
      }
    };

    window.addEventListener('mousemove', handleMove);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,              
        left: 0,
        width: '100vw',  
        height: '100vh', 
        pointerEvents: 'none', 
        zIndex: 999999, 
      }}
    />
  );
}
