'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  speed: number;
}

interface Block {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  destroyed: boolean;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const BoundGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'paused' | 'victory' | 'gameOver'>('ready');
  const [ball, setBall] = useState<Ball>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 60,
    vx: 3,
    vy: -3,
    radius: 8,
    color: 'red',
    speed: 4
  });
  const [paddle, setPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH / 2 - 60,
    y: CANVAS_HEIGHT - 30,
    width: 120,
    height: 15
  });
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [keys, setKeys] = useState({ left: false, right: false, space: false });


  // 사운드 시스템
  const playSound = useCallback((frequency: number, duration: number, type: 'beep' | 'pop' | 'boom' | 'win' | 'lose' = 'beep') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // 소리 타입별 설정
      switch (type) {
        case 'beep': // 벽 충돌
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          oscillator.type = 'square';
          gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
          break;
        case 'pop': // 블록 파괴
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 2, ctx.currentTime + duration);
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'boom': // 패들 충돌
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          oscillator.type = 'triangle';
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
          break;
        case 'win': // 레벨 클리어
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 3, ctx.currentTime + duration);
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          break;
        case 'lose': // 생명 잃음
          oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.5, ctx.currentTime + duration);
          oscillator.type = 'sawtooth';
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          break;
      }
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.log('사운드 재생 실패:', error);
    }
  }, []);

  // 블록 생성
  const createBlocks = useCallback((level: number) => {
    const newBlocks: Block[] = [];
    const rows = 4 + Math.floor(level / 2); // 레벨에 따라 증가
    const cols = 8;
    const blockWidth = CANVAS_WIDTH / cols;
    const blockHeight = 30;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // 일부 블록만 생성하여 패턴 만들기
        if (Math.random() < 0.8) {
          newBlocks.push({
            x: col * blockWidth,
            y: 50 + row * blockHeight,
            width: blockWidth - 2,
            height: blockHeight - 2,
            color: COLORS[Math.floor(Math.random() * COLORS.length)], // 다양한 색깔
            destroyed: false
          });
        }
      }
    }
    return newBlocks;
  }, []);

  // 게임 초기화
  const initGame = useCallback(() => {
    setBall({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 60,
      vx: 2,
      vy: -3,
      radius: 8,
      color: COLORS[Math.floor(Math.random() * COLORS.length)], // 랜덤 색깔
      speed: 3
    });
    setPaddle({
      x: CANVAS_WIDTH / 2 - 60,
      y: CANVAS_HEIGHT - 30,
      width: 120,
      height: 15
    });
    setBlocks(createBlocks(level));
    setGameState('ready');
    
  }, [level, createBlocks]);

  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setKeys(prev => ({ ...prev, left: true }));
          break;
        case 'ArrowRight':
          setKeys(prev => ({ ...prev, right: true }));
          break;
        case ' ':
          e.preventDefault();
          setKeys(prev => ({ ...prev, space: true }));
          if (gameState === 'ready') {
            console.log('게임 시작! 공 위치 초기화');
            playSound(250, 0.3, 'beep'); // 게임 시작 소리
            // 게임 시작 시 공을 안전한 위치에 재배치
            setBall({
              x: CANVAS_WIDTH / 2,
              y: CANVAS_HEIGHT - 60,
              vx: 3,
              vy: -3,
              radius: 8,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              speed: 3
            });
            setGameState('playing');
          } else if (gameState === 'playing') {
            setGameState('paused');
          } else if (gameState === 'paused') {
            setGameState('playing');
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          setKeys(prev => ({ ...prev, left: false }));
          break;
        case 'ArrowRight':
          setKeys(prev => ({ ...prev, right: false }));
          break;
        case ' ':
          setKeys(prev => ({ ...prev, space: false }));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // 패들 움직임
  useEffect(() => {
    const movePaddle = () => {
      setPaddle(prev => {
        let newX = prev.x;
        if (keys.left && newX > 0) {
          newX -= 8;
        }
        if (keys.right && newX < CANVAS_WIDTH - prev.width) {
          newX += 8;
        }
        return { ...prev, x: newX };
      });
    };

    if (gameState === 'playing' || gameState === 'ready') {
      const interval = setInterval(movePaddle, 16);
      return () => clearInterval(interval);
    }
  }, [keys, gameState]);

  // 충돌 감지
  const checkCollisions = useCallback((ball: Ball, paddle: Paddle, blocks: Block[]) => {
    let newBall = { ...ball };
    let newBlocks = [...blocks];
    let scoreIncrease = 0;

    // 벽 충돌 (좌우)
    if (newBall.x - newBall.radius <= 0) {
      newBall.x = newBall.radius;
      newBall.vx = Math.abs(newBall.vx);
      playSound(300, 0.1, 'beep'); // 벽 충돌 소리
    } else if (newBall.x + newBall.radius >= CANVAS_WIDTH) {
      newBall.x = CANVAS_WIDTH - newBall.radius;
      newBall.vx = -Math.abs(newBall.vx);
      playSound(300, 0.1, 'beep'); // 벽 충돌 소리
    }

    // 천장 충돌
    if (newBall.y - newBall.radius <= 0) {
      newBall.y = newBall.radius;
      newBall.vy = Math.abs(newBall.vy);
      playSound(400, 0.1, 'beep'); // 천장 충돌 소리
    }

    // 바닥 충돌 (생명 감소) - 게임 진행 중일 때만
    if (newBall.y + newBall.radius >= CANVAS_HEIGHT) {
      console.log('바닥 충돌! 생명 -1');
      playSound(150, 0.8, 'lose'); // 생명 잃음 소리
      // 게임 상태 체크 후 한 번만 목숨 차감
      setGameState(currentState => {
        if (currentState === 'playing') {
          setLives(prev => {
            console.log('현재 생명:', prev, '→', prev - 1);
            return prev - 1;
          });
          return 'ready'; // 즉시 게임 상태 변경으로 중복 방지
        }
        return currentState;
      });
      // 공을 안전한 시작 위치로 리셋
      const resetBall = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - 60,
        vx: 3,
        vy: -3,
        radius: 8,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        speed: 3
      };
      return { ball: resetBall, blocks: newBlocks, scoreIncrease, ballLost: true };
    }

    // 패들 충돌
    if (newBall.y + newBall.radius >= paddle.y &&
        newBall.y + newBall.radius <= paddle.y + paddle.height + 5 &&
        newBall.x >= paddle.x - newBall.radius &&
        newBall.x <= paddle.x + paddle.width + newBall.radius &&
        newBall.vy > 0) {
      
      newBall.y = paddle.y - newBall.radius;
      newBall.vy = -Math.abs(newBall.vy);
      playSound(200, 0.2, 'boom'); // 패들 충돌 소리
      
      // 패들의 위치에 따른 각도 조정
      const hitPos = (newBall.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
      newBall.vx = hitPos * 3; // -3 ~ 3 사이의 속도
    }

    // 블록 충돌 (같은 색깔만)
    for (let i = 0; i < newBlocks.length; i++) {
      const block = newBlocks[i];
      if (block.destroyed) continue;

      // 블록과 공의 중심점 거리 계산
      const ballCenterX = newBall.x;
      const ballCenterY = newBall.y;
      const blockCenterX = block.x + block.width / 2;
      const blockCenterY = block.y + block.height / 2;

      // 블록의 경계 확장 (공의 반지름만큼)
      const expandedLeft = block.x - newBall.radius;
      const expandedRight = block.x + block.width + newBall.radius;
      const expandedTop = block.y - newBall.radius;
      const expandedBottom = block.y + block.height + newBall.radius;

                    // 충돌 감지
       if (ballCenterX >= expandedLeft && ballCenterX <= expandedRight &&
           ballCenterY >= expandedTop && ballCenterY <= expandedBottom) {
         
          // 충돌 방향 계산
          const distanceX = Math.abs(ballCenterX - blockCenterX);
          const distanceY = Math.abs(ballCenterY - blockCenterY);
          
          // 어느 면에 충돌했는지 판단
          if (distanceX / (block.width / 2 + newBall.radius) > distanceY / (block.height / 2 + newBall.radius)) {
            // 좌우 면 충돌
            newBall.vx = -newBall.vx;
            if (ballCenterX < blockCenterX) {
              newBall.x = block.x - newBall.radius;
            } else {
              newBall.x = block.x + block.width + newBall.radius;
            }
          } else {
            // 상하 면 충돌
            newBall.vy = -newBall.vy;
            if (ballCenterY < blockCenterY) {
              newBall.y = block.y - newBall.radius;
            } else {
              newBall.y = block.y + block.height + newBall.radius;
            }
          }

          // 모든 블록 파괴! 💥
          newBlocks[i] = { ...block, destroyed: true };
          scoreIncrease += 10;
          console.log('블록 파괴! 점수 +10');
          playSound(500, 0.2, 'pop'); // 블록 파괴 소리
          
          // 이 블록 파괴 후 남은 블록 확인
          const remainingAfterDestroy = newBlocks.filter(b => !b.destroyed);
          console.log('남은 블록 수:', remainingAfterDestroy.length);
          
          // 모든 블록이 파괴되었는지 즉시 확인 (중복 방지)
          if (remainingAfterDestroy.length === 0) {
            console.log('🎉 레벨 클리어! 모든 블록 파괴됨');
            playSound(440, 1.0, 'win'); // 레벨 클리어 소리
            // 한 번만 실행되도록 체크
            setGameState(currentState => {
              if (currentState === 'playing') {
                console.log('게임 상태를 victory로 변경');
                setTimeout(() => {
                  setLevel(prev => {
                    console.log('레벨 업!', prev, '→', prev + 1);
                    return prev + 1;
                  });
                }, 500);
                return 'victory';
              }
              return currentState;
            });
          }
          
          break;
       }
    }

    return { ball: newBall, blocks: newBlocks, scoreIncrease, ballLost: false };
  }, [playSound]);

  // 게임 루프
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return;

    // 공의 새로운 위치 계산
    setBall(currentBall => {
      const tentativeBall = {
        ...currentBall,
        x: currentBall.x + currentBall.vx,
        y: currentBall.y + currentBall.vy
      };

      // 충돌 감지 및 처리
      const { ball: finalBall, blocks: updatedBlocks, scoreIncrease, ballLost } = 
        checkCollisions(tentativeBall, paddle, blocks);

      // 블록 상태 업데이트
      setBlocks(updatedBlocks);

      // 점수 업데이트
      if (scoreIncrease > 0) {
        setScore(prev => prev + scoreIncrease);
      }

                   // 공 잃음 처리는 이미 checkCollisions에서 처리됨 (중복 방지)

      // 승리 조건 확인은 블록 파괴 시점에서 처리함 (중복 방지)

      return finalBall; // 충돌 처리된 공 반환
    });
  }, [gameState, paddle, blocks, checkCollisions]);

  // 게임 오버 확인
  useEffect(() => {
    if (lives <= 0) {
      setGameState('gameOver');
    }
  }, [lives]);

  // 다음 레벨로
  useEffect(() => {
    if (gameState === 'victory') {
      setTimeout(() => {
        initGame();
      }, 2000);
    }
  }, [gameState, initGame]);

  // 애니메이션 루프
  useEffect(() => {
    if (gameState === 'playing') {
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // 렌더링
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 배경
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 블록 그리기
    blocks.forEach(block => {
      if (!block.destroyed) {
        ctx.fillStyle = block.color;
        ctx.fillRect(block.x, block.y, block.width, block.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(block.x, block.y, block.width, block.height);
      }
    });

    // 패들 그리기
    ctx.fillStyle = '#fff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // 공 그리기
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // UI 텍스트
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`점수: ${score}`, 20, 30);
    ctx.fillText(`레벨: ${level}`, 200, 30);
    ctx.fillText(`생명: ${lives}`, 350, 30);

    // 게임 상태 메시지
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    if (gameState === 'ready') {
      ctx.fillText('스페이스바를 눌러 시작하세요!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (gameState === 'paused') {
      ctx.fillText('일시정지 - 스페이스바로 계속', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (gameState === 'victory') {
      ctx.fillText(`레벨 ${level - 1} 클리어!`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '20px Arial';
      ctx.fillText('다음 레벨로...', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    } else if (gameState === 'gameOver') {
      ctx.fillText('게임 오버!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.font = '20px Arial';
      ctx.fillText('F5를 눌러 다시 시작하세요', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
    }
    ctx.textAlign = 'left';
  }, [ball, paddle, blocks, score, level, lives, gameState]);

  // 게임 리셋
  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setLives(3);
    initGame();
  };

  // 초기화
  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4">
          <Link 
            href="/"
            className="inline-block px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-all duration-200 mb-4"
          >
            ← 메인 페이지로 돌아가기
          </Link>
        </div>
        
        <h1 className="text-4xl font-bold text-center mb-8 text-cyan-400">
          💥 BOUND - 벽돌깨기 게임
        </h1>

        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="border-2 border-cyan-400 rounded-lg shadow-2xl"
            tabIndex={0}
          />
        </div>

        <div className="text-center mb-6">
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-all duration-200 mr-4"
          >
            🔄 게임 리셋
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">🎮 게임 조작법</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• <strong>← → 방향키:</strong> 패들 좌우 이동</li>
            <li>• <strong>스페이스바:</strong> 게임 시작/일시정지</li>
          </ul>
          
                     <h3 className="text-lg font-bold mt-6 mb-3 text-cyan-400">💥 게임 규칙</h3>
           <ul className="space-y-2 text-gray-300">
             <li>• <strong>목표:</strong> 모든 블록을 부수세요! 어떤 색깔이든 상관없어요!</li>
             <li>• <strong>생명:</strong> 공이 바닥에 떨어지면 생명이 하나 감소합니다</li>
             <li>• <strong>승리:</strong> 모든 블록을 부수면 다음 레벨로 진행합니다</li>
             <li>• <strong>게임오버:</strong> 생명이 모두 소진되면 게임이 끝납니다</li>
             <li>• <strong>팁:</strong> 패들로 공의 방향을 조절해보세요!</li>
           </ul>
        </div>
      </div>
    </div>
  );
};

export default BoundGame; 