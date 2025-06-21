'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

const TETROMINOES = {
  I: { shape: [[1, 1, 1, 1]], color: '80, 227, 230' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '36, 95, 223' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '223, 173, 36' },
  O: { shape: [[1, 1], [1, 1]], color: '223, 217, 36' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '48, 211, 56' },
  T: { shape: [[1, 1, 1], [0, 1, 0]], color: '132, 61, 198' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '227, 78, 78' },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);

const createEmptyBoard = () => 
  Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0));

const getRandomTetromino = () => {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  return { key, ...TETROMINOES[key as keyof typeof TETROMINOES] };
};

const isValidPosition = (board: number[][], piece: number[][], x: number, y: number) => {
  for (let py = 0; py < piece.length; py++) {
    for (let px = 0; px < piece[py].length; px++) {
      if (piece[py][px]) {
        const newX = x + px;
        const newY = y + py;
        
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return false;
        }
        
        if (newY >= 0 && board[newY][newX]) {
          return false;
        }
      }
    }
  }
  return true;
};

const rotatePiece = (piece: number[][]) => {
  const rotated = piece[0].map((_, index) => piece.map(row => row[index]).reverse());
  return rotated;
};

// Audio hook for sound management
const useAudio = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isBGMPlaying, setIsBGMPlaying] = useState(false);
  const bgmTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Initialize AudioContext
  useEffect(() => {
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.log('AudioContext not supported');
    }
  }, []);
  
  const playSound = useCallback((frequency: number, duration: number, type: 'sine' | 'square' | 'triangle' = 'sine') => {
    if (isMuted || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.2, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.log('Audio playback error:', error);
    }
  }, [isMuted]);

  const playMoveSound = useCallback(() => {
    playSound(200, 0.1, 'square');
  }, [playSound]);

  const playRotateSound = useCallback(() => {
    playSound(300, 0.1, 'triangle');
  }, [playSound]);

  const playDropSound = useCallback(() => {
    playSound(150, 0.2, 'sine');
  }, [playSound]);

  const playLineClearSound = useCallback(() => {
    // Play ascending notes for line clear
    setTimeout(() => playSound(400, 0.1), 0);
    setTimeout(() => playSound(500, 0.1), 100);
    setTimeout(() => playSound(600, 0.1), 200);
    setTimeout(() => playSound(700, 0.2), 300);
  }, [playSound]);

  const playGameOverSound = useCallback(() => {
    // Play descending notes for game over
    setTimeout(() => playSound(400, 0.3), 0);
    setTimeout(() => playSound(300, 0.3), 300);
    setTimeout(() => playSound(200, 0.5), 600);
  }, [playSound]);

  const playBGMNote = useCallback((frequency: number, duration: number, delay: number) => {
    if (isMuted || !audioContextRef.current) return;
    
    setTimeout(() => {
      if (!isMuted && audioContextRef.current && bgmTimeoutRef.current) {
        try {
          const oscillator = audioContextRef.current.createOscillator();
          const gainNode = audioContextRef.current.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContextRef.current.destination);
          
          oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
          oscillator.type = 'triangle';
          
          gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
          
          oscillator.start(audioContextRef.current.currentTime);
          oscillator.stop(audioContextRef.current.currentTime + duration);
        } catch (error) {
          console.log('BGM note error:', error);
        }
      }
    }, delay);
  }, [isMuted]);

  const startBGM = useCallback(() => {
    if (isMuted || !audioContextRef.current || isBGMPlaying) return;
    
    // Resume AudioContext if suspended (required for user interaction)
    if (audioContextRef.current.state === 'suspended') {
      console.log('Resuming suspended AudioContext...');
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext resumed successfully');
      }).catch((error) => {
        console.log('Failed to resume AudioContext:', error);
      });
    }
    
    console.log('Starting BGM..., AudioContext state:', audioContextRef.current.state);
    setIsBGMPlaying(true);
    
    const playMelodyLoop = () => {
      if (isMuted || !audioContextRef.current) return;
      
      const melody = [
        { freq: 330, duration: 0.4 }, // E
        { freq: 247, duration: 0.2 }, // B
        { freq: 262, duration: 0.2 }, // C
        { freq: 294, duration: 0.4 }, // D
        { freq: 262, duration: 0.2 }, // C
        { freq: 247, duration: 0.2 }, // B
        { freq: 220, duration: 0.4 }, // A
        { freq: 220, duration: 0.2 }, // A
        { freq: 262, duration: 0.2 }, // C
        { freq: 330, duration: 0.4 }, // E
        { freq: 294, duration: 0.2 }, // D
        { freq: 262, duration: 0.2 }, // C
        { freq: 247, duration: 0.8 }, // B
      ];
      
      let currentTime = 0;
      melody.forEach((note) => {
        playBGMNote(note.freq, note.duration, currentTime * 1000);
        currentTime += note.duration;
      });
      
      // Schedule next loop - only if BGM is still supposed to be playing
      bgmTimeoutRef.current = setTimeout(() => {
        // Check the ref directly instead of state to avoid closure issues
        if (bgmTimeoutRef.current && !isMuted && audioContextRef.current) {
          playMelodyLoop();
        }
      }, (currentTime + 1) * 1000);
    };
    
    // Start the melody loop immediately
    playMelodyLoop();
  }, [isMuted]);

  const stopBGM = useCallback(() => {
    console.log('Stopping BGM...');
    setIsBGMPlaying(false);
    if (bgmTimeoutRef.current) {
      clearTimeout(bgmTimeoutRef.current);
      bgmTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopBGM();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopBGM]);

  return {
    isMuted,
    setIsMuted,
    isBGMPlaying,
    playMoveSound,
    playRotateSound,
    playDropSound,
    playLineClearSound,
    playGameOverSound,
    startBGM,
    stopBGM,
  };
};

export default function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(() => getRandomTetromino());
  const [position, setPosition] = useState({ x: 3, y: -1 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const {
    isMuted,
    setIsMuted,
    isBGMPlaying,
    playMoveSound,
    playRotateSound,
    playDropSound,
    playLineClearSound,
    playGameOverSound,
    startBGM,
    stopBGM,
  } = useAudio();

  const clearLines = useCallback((newBoard: number[][]) => {
    const fullLines: number[] = [];
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        fullLines.push(y);
      }
    }
    
    if (fullLines.length > 0) {
      playLineClearSound();
      
      fullLines.forEach(lineIndex => {
        newBoard.splice(lineIndex, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
      });
      
      setLines(prev => prev + fullLines.length);
      setScore(prev => prev + fullLines.length * 100 * level);
      
      if (lines + fullLines.length >= level * 10) {
        setLevel(prev => prev + 1);
      }
    }
    
    return newBoard;
  }, [level, lines, playLineClearSound]);

  const placePiece = useCallback(() => {
    playDropSound();
    
    const newBoard = board.map(row => [...row]);
    
    currentPiece.shape.forEach((row, py) => {
      row.forEach((cell, px) => {
        if (cell) {
          const x = position.x + px;
          const y = position.y + py;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            newBoard[y][x] = 1;
          }
        }
      });
    });
    
    const clearedBoard = clearLines(newBoard);
    setBoard(clearedBoard);
    
    const newPiece = getRandomTetromino();
    const newPosition = { x: 3, y: -1 };
    
    if (!isValidPosition(clearedBoard, newPiece.shape, newPosition.x, newPosition.y)) {
      setGameOver(true);
      setIsPaused(true);
      stopBGM();
      playGameOverSound();
      return;
    }
    
    setCurrentPiece(newPiece);
    setPosition(newPosition);
  }, [board, currentPiece, position, clearLines, playDropSound, stopBGM, playGameOverSound]);

  const moveDown = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const newY = position.y + 1;
    
    if (isValidPosition(board, currentPiece.shape, position.x, newY)) {
      setPosition(prev => ({ ...prev, y: newY }));
    } else {
      if (position.y >= -1) {
        placePiece();
      } else {
        setGameOver(true);
        setIsPaused(true);
        stopBGM();
        playGameOverSound();
      }
    }
  }, [board, currentPiece.shape, position, gameOver, isPaused, placePiece, stopBGM, playGameOverSound]);

  const move = useCallback((dx: number) => {
    if (gameOver || isPaused) return;
    
    const newX = position.x + dx;
    
    if (isValidPosition(board, currentPiece.shape, newX, position.y)) {
      setPosition(prev => ({ ...prev, x: newX }));
      playMoveSound();
    }
  }, [board, currentPiece.shape, position, gameOver, isPaused, playMoveSound]);

  const rotate = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const rotated = rotatePiece(currentPiece.shape);
    
    if (isValidPosition(board, rotated, position.x, position.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }));
      playRotateSound();
    }
  }, [board, currentPiece.shape, position, gameOver, isPaused, playRotateSound]);

  const hardDrop = useCallback(() => {
    if (gameOver || isPaused) return;
    
    let dropDistance = 0;
    let newY = position.y;
    
    // 블록이 바닥이나 다른 블록에 닿을 때까지 계속 내려가기
    while (isValidPosition(board, currentPiece.shape, position.x, newY + 1)) {
      newY++;
      dropDistance++;
    }
    
    if (dropDistance > 0) {
      setPosition(prev => ({ ...prev, y: newY }));
      // 하드 드롭 점수 추가 (거리 * 2)
      setScore(prev => prev + dropDistance * 2);
      playDropSound();
      
      // 즉시 블록을 고정시키기 위해 moveDown 호출
      setTimeout(() => {
        if (isValidPosition(board, currentPiece.shape, position.x, newY + 1)) {
          return;
        }
        
        // 블록을 보드에 고정
        const newBoard = board.map(row => [...row]);
        currentPiece.shape.forEach((row, py) => {
          row.forEach((cell, px) => {
            if (cell) {
              const x = position.x + px;
              const y = newY + py;
              if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
                newBoard[y][x] = 1;
              }
            }
          });
        });
        
        // 완성된 라인 찾기
        const completedLines = [];
        for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
          if (newBoard[y].every(cell => cell === 1)) {
            completedLines.push(y);
          }
        }
        
        // 완성된 라인 제거
        if (completedLines.length > 0) {
          completedLines.forEach(lineY => {
            newBoard.splice(lineY, 1);
            newBoard.unshift(Array(BOARD_WIDTH).fill(0));
          });
          
          const lineScore = [0, 100, 300, 500, 800][completedLines.length] * level;
          setScore(prev => prev + lineScore);
          setLines(prev => prev + completedLines.length);
          setLevel(prev => Math.floor((prev * 10 + completedLines.length) / 10) + 1);
          playLineClearSound();
        }
        
        setBoard(newBoard);
        
        // 새로운 테트로미노 생성
        const newPiece = getRandomTetromino();
        const newPosition = { x: 3, y: -1 };
        
        if (!isValidPosition(newBoard, newPiece.shape, newPosition.x, newPosition.y)) {
          setGameOver(true);
          stopBGM();
          playGameOverSound();
        } else {
          setCurrentPiece(newPiece);
          setPosition(newPosition);
        }
      }, 50);
    }
  }, [board, currentPiece.shape, position, gameOver, isPaused, level, playDropSound, playLineClearSound, playGameOverSound, stopBGM]);

  const startGame = useCallback(() => {
    const newBoard = createEmptyBoard();
    const newPiece = getRandomTetromino();
    const newPosition = { x: 3, y: -1 };
    
    setBoard(newBoard);
    setCurrentPiece(newPiece);
    setPosition(newPosition);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    
    console.log('Game started, isMuted:', isMuted);
    if (!isMuted) {
      console.log('Attempting to start BGM...');
      startBGM();
    }
  }, [isMuted, startBGM]);

  const togglePause = useCallback(() => {
    if (gameOver) return;
    
    setIsPaused(prev => {
      const newPaused = !prev;
      if (newPaused) {
        stopBGM();
      } else if (!isMuted) {
        startBGM();
      }
      return newPaused;
    });
  }, [gameOver, isMuted, startBGM, stopBGM]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOver) return;
    
    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        move(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveDown();
        break;
      case 'ArrowUp':
        e.preventDefault();
        rotate();
        break;
      case 'Space':
        e.preventDefault();
        hardDrop();
        break;
      case 'Escape':
        e.preventDefault();
        togglePause();
        break;
    }
  }, [gameOver, move, moveDown, rotate, hardDrop, togglePause]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!gameOver && !isPaused) {
      const interval = setInterval(moveDown, Math.max(100, 1000 - (level - 1) * 100));
      return () => clearInterval(interval);
    }
  }, [moveDown, gameOver, isPaused, level]);

  const displayBoard = board.map(row => [...row]);
  
  if (!gameOver && !isPaused && position.y > -2) {
    currentPiece.shape.forEach((row, py) => {
      row.forEach((cell, px) => {
        if (cell) {
          const x = position.x + px;
          const y = position.y + py;
          if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
            displayBoard[y][x] = 2;
          }
        }
      });
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col justify-center items-center text-white p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Tetris
        </h1>
        <p className="text-xl text-gray-400">
          전설적인 블록 퍼즐 게임을 즐겨보세요!
        </p>
      </div>

      {/* Game Container */}
      <div className="w-full max-w-6xl bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-700 p-8">
        <div className="flex gap-8 items-start justify-center">
          {/* Game Board */}
          <div className="flex flex-col items-center">
            <div 
              className="grid border-2 border-gray-500 bg-gray-900 rounded-lg overflow-hidden shadow-lg"
              style={{
                gridTemplateColumns: `repeat(${BOARD_WIDTH}, 30px)`,
                gridTemplateRows: `repeat(${BOARD_HEIGHT}, 30px)`,
              }}
            >
              {displayBoard.map((row, y) =>
                row.map((cell, x) => (
                  <div
                    key={`${y}-${x}`}
                    className="w-[30px] h-[30px] border border-gray-700"
                    style={{
                      backgroundColor: cell === 1 ? '#4A90E2' : cell === 2 ? '#E24A4A' : '#1F2937',
                    }}
                  />
                ))
              )}
            </div>
          </div>
          
          {/* Game Info Panel */}
          <div className="flex flex-col gap-4 min-w-[250px]">
            {/* Score Cards */}
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-gray-700 bg-opacity-60 rounded-xl border border-gray-600">
                <h2 className="text-lg font-bold mb-2 text-blue-400">점수</h2>
                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">{score.toLocaleString()}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-700 bg-opacity-60 rounded-xl border border-gray-600">
                  <h2 className="text-sm font-bold mb-2 text-purple-400">라인</h2>
                  <p className="text-2xl font-bold text-white">{lines}</p>
                </div>
                
                <div className="p-4 bg-gray-700 bg-opacity-60 rounded-xl border border-gray-600">
                  <h2 className="text-sm font-bold mb-2 text-yellow-400">레벨</h2>
                  <p className="text-2xl font-bold text-white">{level}</p>
                </div>
              </div>
            </div>
            
            {/* Status Messages */}
            {gameOver && (
              <div className="p-4 border border-red-500 rounded-xl bg-red-900/30 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-red-400 text-center">🎮 Game Over!</h2>
                <p className="text-center text-red-300 mt-2">다시 도전해보세요!</p>
              </div>
            )}
            
            {isPaused && !gameOver && (
              <div className="p-4 border border-yellow-500 rounded-xl bg-yellow-900/30 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-yellow-400 text-center">⏸️ 일시정지</h2>
                <p className="text-center text-yellow-300 mt-2">ESC를 눌러 계속하세요</p>
              </div>
            )}
            
            {/* Control Buttons */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={startGame}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl font-bold transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
                {gameOver ? '🎮 새 게임' : '🚀 게임 시작'}
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 ${
                    isMuted 
                      ? 'bg-red-600 hover:bg-red-700 text-white' 
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isMuted ? '🔇' : '🔊'}
                </button>
                
                <button 
                  onClick={() => {
                    if (isBGMPlaying) {
                      stopBGM();
                    } else {
                      startBGM();
                    }
                  }}
                  className={`px-4 py-2 rounded-xl font-bold transition-all duration-200 ${
                    isBGMPlaying 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                  disabled={isMuted}
                >
                  {isBGMPlaying ? '🎵' : '🎵'}
                </button>
              </div>
            </div>
            
            {isBGMPlaying && (
              <div className="p-3 border border-purple-500 rounded-xl bg-purple-900/30 backdrop-blur-sm text-center">
                <span className="text-purple-400 text-sm">🎵 BGM 재생 중...</span>
              </div>
            )}
            
            {/* Controls Guide */}
            <div className="p-4 bg-gray-700 bg-opacity-60 rounded-xl border border-gray-600">
              <h3 className="font-bold mb-3 text-center text-blue-400">🎮 조작법</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-300">← → 이동</div>
                <div className="text-gray-300">↑ 회전</div>
                <div className="text-gray-300">↓ 빠른낙하</div>
                <div className="text-gray-300">Space 하드드롭</div>
                <div className="text-gray-300 col-span-2 text-center mt-2">ESC 일시정지</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center">
        <Link href="/" className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all duration-200 transform hover:scale-105">
          🏠 홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
} 