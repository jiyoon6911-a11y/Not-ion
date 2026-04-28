import React, { useEffect, useState, useRef } from 'react';

export default function BossGame() {
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  // Game state
  const player = useRef({ x: 0, y: 0, size: 20 });
  const enemies = useRef<{x: number, y: number, vx: number, vy: number, size: number}[]>([]);
  const lastTime = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full screen
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (player.current.x === 0) {
        player.current.x = canvas.width / 2;
        player.current.y = canvas.height / 2;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e: MouseEvent) => {
      player.current.x = e.clientX;
      player.current.y = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Initial enemies
    for (let i = 0; i < 20; i++) {
      enemies.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        size: Math.random() * 20 + 10
      });
    }

    const gameLoop = (time: number) => {
      if (!lastTime.current) lastTime.current = time;
      const deltaTime = time - lastTime.current;
      lastTime.current = time;

      if (!gameOver) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Score text
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.font = 'bold 200px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('뒷공부 적발!!!', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(`SCORE: ${Math.floor(score)}`, canvas.width / 2, 100);

        setScore(s => s + deltaTime * 0.01);

        // Add more enemies over time
        if (Math.random() < 0.1) {
          enemies.current.push({
            x: Math.random() < 0.5 ? 0 : canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            size: Math.random() * 20 + 10
          });
        }

        // Draw and update enemies
        ctx.fillStyle = 'red';
        for (let i = 0; i < enemies.current.length; i++) {
          const e = enemies.current[i];
          e.x += e.vx;
          e.y += e.vy;

          // Bounce
          if (e.x < 0 || e.x > canvas.width) e.vx *= -1;
          if (e.y < 0 || e.y > canvas.height) e.vy *= -1;

          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
          ctx.fill();

          // Collision
          const dx = player.current.x - e.x;
          const dy = player.current.y - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < player.current.size + e.size) {
            setGameOver(true);
          }
        }

        // Draw Player
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(player.current.x, player.current.y, player.current.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0f0';
      } else {
        // Game Over
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'red';
        ctx.font = 'bold 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('당신은 파멸했습니다.', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText(`최종 버틴 시간: ${Math.floor(score)}점`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('다시 하려면 클릭하세요. 항복은 ESC', canvas.width / 2, canvas.height / 2 + 100);
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameOver, score]);

  const handleClick = () => {
    if (gameOver) {
      setGameOver(false);
      setScore(0);
      enemies.current = [];
      for (let i = 0; i < 20; i++) {
        enemies.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          size: Math.random() * 20 + 10
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black cursor-none" onClick={handleClick}>
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
