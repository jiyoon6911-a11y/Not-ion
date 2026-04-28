import React, { useEffect, useState, useRef } from 'react';

interface BossGameProps {
  onWin: () => void;
}

export default function BossGame({ onWin }: BossGameProps) {
  const [gameState, setGameState] = useState<'starting' | 'playing' | 'gameover' | 'win'>('starting');
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

    // Initial enemies (EASIER: max 10 instead of 20, slower)
    if (enemies.current.length === 0) {
      for (let i = 0; i < 10; i++) {
        enemies.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          size: Math.random() * 15 + 10
        });
      }
    }

    const gameLoop = (time: number) => {
      if (!lastTime.current) lastTime.current = time;
      const deltaTime = time - lastTime.current;
      lastTime.current = time;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (gameState === 'starting') {
        ctx.fillStyle = 'red';
        ctx.font = 'bold 100px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('너 뒷공부 해?', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText('클릭하여 결백을 증명하라.', canvas.width / 2, canvas.height / 2 + 50);
      } else if (gameState === 'playing') {
        // Score text
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.font = 'bold 160px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('뒷공부 적발!!!', canvas.width / 2, canvas.height / 2);

        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(`SCORE: ${Math.floor(score)}`, canvas.width / 2, 100);

        setScore(s => {
          const newScore = s + deltaTime * 0.01;
          if (newScore >= 500 && gameState === 'playing') {
            setGameState('win');
            setTimeout(() => onWin(), 3000);
          }
          return newScore;
        });

        // Add more enemies over time (EASIER: 0.03 instead of 0.1)
        if (Math.random() < 0.03) {
          enemies.current.push({
            x: Math.random() < 0.5 ? 0 : canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
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
            setGameState('gameover');
          }
        }

        // Draw Player
        ctx.fillStyle = '#0f0';
        ctx.beginPath();
        ctx.arc(player.current.x, player.current.y, player.current.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#0f0';
      } else if (gameState === 'gameover') {
        // Game Over
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'red';
        ctx.font = 'bold 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('당신은 신뢰를 잃었습니다.', canvas.width / 2, canvas.height / 2 - 80);
        ctx.font = 'bold 40px sans-serif';
        ctx.fillText('스코어 500을 넘어 신뢰를 다시 얻으세요.', canvas.width / 2, canvas.height / 2 - 10);
        
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = 'white';
        ctx.fillText(`최종 버틴 시간: ${Math.floor(score)}점`, canvas.width / 2, canvas.height / 2 + 50);
        ctx.fillText('다시 하려면 클릭하세요. 항복은 ESC', canvas.width / 2, canvas.height / 2 + 100);
      } else if (gameState === 'win') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'green';
        ctx.font = 'bold 80px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('결백 증명 완료!', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = 'bold 30px sans-serif';
        ctx.fillStyle = 'black';
        ctx.fillText('진정한 공부의 길로 안내합니다...', canvas.width / 2, canvas.height / 2 + 50);
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    requestRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, score]);

  const handleClick = () => {
    if (gameState === 'starting') {
      setGameState('playing');
    } else if (gameState === 'gameover') {
      setGameState('playing');
      setScore(0);
      enemies.current = [];
      for (let i = 0; i < 10; i++) {
        enemies.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          size: Math.random() * 15 + 10
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
