import React, { useEffect, useRef } from 'react';

export default function CanvasTrail() {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const lastTimeRef = useRef(performance.now()); // Tracks time steps perfectly

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
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;

      // 🌟 THE UN-CRUSHABLE HARDWARE BRIDGE 🌟
      // Instead of popping points out blindly on every single frame tick,
      // we only pop a point out if a stable 16 milliseconds (60Hz equivalent speed) has passed!
      // This stops high-refresh wall power from destroying your line array layers.
      if (deltaTime >= 16) {
        if (points.length > 0) {
          points.pop(); 
        }
        lastTimeRef.current = now; // Reset the clock tick
      }

      // Safe cushion layout guard bounds
      if (points.length < 4) {
        requestAnimationFrame(animate);
        return;
      }

      const isDarkActive = document.body.classList.contains('dark-theme');
      const baseColor = isDarkActive ? 'coral' : 'limegreen'; 

      // Laser-Smooth Quadratic Bezier Curve Painter Engine
      for (let i = 0; i < points.length - 2; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2];
        
        const midPointX1 = (p1.x + p2.x) / 2;
        const midPointY1 = (p1.y + p2.y) / 2;
        const midPointX2 = (p2.x + p3.x) / 2;
        const midPointY2 = (p2.y + p3.y) / 2;

        const ratio = (points.length - i) / points.length; 

        ctx.beginPath();
        ctx.moveTo(midPointX1, midPointY1);
        ctx.quadraticCurveTo(p2.x, p2.y, midPointX2, midPointY2);

        ctx.lineWidth = ratio * 14;       
        ctx.globalAlpha = ratio * 0.85;    
        ctx.strokeStyle = baseColor;
        ctx.lineCap = 'round';           
        ctx.lineJoin = 'round';

        ctx.shadowBlur = isDarkActive ? ratio * 14 : ratio * 3;
        ctx.shadowColor = baseColor;

        ctx.stroke();
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate); 

    const handleMove = (e) => {
      // Your perfect drop-shadow perspective layout offsets!
      const shadowX = e.clientX - 25;
      const shadowY = e.clientY + 30;

      pointsRef.current.unshift({ x: shadowX, y: shadowY });

      // Cleanly manage trail length caps inside your input actions
      const maxTrailLength = 28; 
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
