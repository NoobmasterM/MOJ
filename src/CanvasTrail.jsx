import React, { useEffect, useRef } from 'react';

export default function CanvasTrail() {
  const canvasRef = useRef(null);
  const pointsRef = useRef([]);
  const poppedDotsRef = useRef({});
  const particlesRef = useRef([]);
  const lastTimeRef = useRef(performance.now());
  const lastMouseRef = useRef({ x: null, y: null });

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

    const checkLineIntersection = (x1, y1, x2, y2, cx, cy, r) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len === 0) return Math.hypot(x1 - cx, y1 - cy) < r;

      const u = ((cx - x1) * dx + (cy - y1) * dy) / (len * len);
      const clampedU = Math.max(0, Math.min(1, u));
      
      const closestX = x1 + clampedU * dx;
      const closestY = y1 + clampedU * dy;
      
      return Math.hypot(closestX - cx, closestY - cy) < r;
    };

    const processSlice = (x, y) => {
      const prev = lastMouseRef.current;
      const x1 = prev.x !== null ? prev.x : x;
      const y1 = prev.y !== null ? prev.y : y;

       if (y < 105) {
        lastMouseRef.current = { x, y };
        return;
      }
      
      const elementUnderCursor = document.elementFromPoint(x, y);
      if (elementUnderCursor) {

        const isInsideGlass = elementUnderCursor.closest('header, .navbar, .nav-link, main, section, table, .table, .accordion-item, .card');

        if (isInsideGlass) {
          lastMouseRef.current = { x, y };
          return;
        }
      }

       

      const gridSize = 80;
      const offsets = [
        { dx: 0, dy: 0 },
        { dx: 40, dy: 40 },
        { dx: 20, dy: 60 },
        { dx: 60, dy: 20 }
      ];

      const minX = Math.min(x1, x) - 50;
      const maxX = Math.max(x1, x) + 50;
      const minY = Math.min(y1, y) - 50;
      const maxY = Math.max(y1, y) + 50;

      const startX = Math.floor(minX / gridSize) * gridSize;
      const endX = Math.ceil(maxX / gridSize) * gridSize;
      const startY = Math.floor(minY / gridSize) * gridSize;
      const endY = Math.ceil(maxY / gridSize) * gridSize;

      for (let gx = startX; gx <= endX; gx += gridSize) {
        for (let gy = startY; gy <= endY; gy += gridSize) {
          offsets.forEach((offset, idx) => {
            const dotX = gx + offset.dx;
            const dotY = gy + offset.dy;
            const dotKey = `${dotX}_${dotY}_${idx}`;

            if (poppedDotsRef.current[dotKey]) return;

            if (checkLineIntersection(x1, y1, x, y, dotX, dotY, 28)) {
             
               let cooldownDuration = 1500; 
              const elAtDot = document.elementFromPoint(dotX, dotY);
              if (elAtDot && elAtDot.closest('main, section, table, .table, .accordion-item, .card')) {
                cooldownDuration = 10; 
              }

              poppedDotsRef.current[dotKey] = Date.now() + cooldownDuration;

              const isDarkActive = document.body.classList.contains('dark-theme');
              const burstColor = isDarkActive ? '#22c55e' : '#c2410c';

              for (let i = 0; i < 8; i++) {
                particlesRef.current.push({
                  x: dotX,
                  y: dotY,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  radius: Math.random() * 3.5 + 1,
                  alpha: 1,
                  color: burstColor
                });
              }
            }
          });
        }
      }
      lastMouseRef.current = { x, y };
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const points = pointsRef.current;
      const now = performance.now();
      const deltaTime = now - lastTimeRef.current;

      if (deltaTime >= 16) {
        if (points.length > 0) {
          points.pop(); 
        }
        lastTimeRef.current = now;
      }

      const isDarkActive = document.body.classList.contains('dark-theme');
      const baseColor = isDarkActive ? 'coral' : '#4b0aff'; 
      const currentBgColor = isDarkActive ? '#1e1e24' : '#fff7ed';

      const activePopped = poppedDotsRef.current;
      const currentTime = Date.now();
      
      ctx.save();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      for (let key in activePopped) {
        const targetTime = activePopped[key];
        if (currentTime > targetTime) {
          delete activePopped[key];
        } else {
          const [px, py] = key.split('_');
          const dotX = parseFloat(px);
          const dotY = parseFloat(py);

          ctx.beginPath();
          ctx.arc(dotX, dotY, 14, 0, Math.PI * 2);
          ctx.fillStyle = currentBgColor;
          ctx.globalAlpha = 1.0;
          ctx.fill();

          const timeLeft = targetTime - currentTime;
          if (timeLeft > 9500) {
            const scale = (10000 - timeLeft) / 500;
            ctx.beginPath();
            ctx.arc(dotX, dotY, 5 * (1 + scale * 2), 0, Math.PI * 2);
            ctx.fillStyle = isDarkActive ? `rgba(34,197,94,${(1 - scale) * 0.5})` : `rgba(194,65,12,${(1 - scale) * 0.5})`;
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1.0;
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) return false;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        return true;
      });
      ctx.restore();

      if (points.length >= 4) {
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

          ctx.shadowBlur = isDarkActive ? ratio * 14 : ratio * 8;
          ctx.shadowColor = isDarkActive ? baseColor : 'rgba(15, 23, 42, 0.2)';

          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate); 

    const handleMove = (e) => {
      const shadowX = e.clientX;
      const shadowY = e.clientY;

      pointsRef.current.unshift({ x: shadowX, y: shadowY });
      processSlice(shadowX, shadowY);

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
        zIndex: 9999999,
        isolation: 'isolate'
      }}
    />
  );
}
