'use client';

import { useState, useEffect, useCallback } from 'react';

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

export default function Tetris() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(() => getRandomTetromino());
  const [position, setPosition] = useState({ x: 3, y: -1 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  const clearLines = useCallback((newBoard: number[][]) => {
    const fullLines: number[] = [];
    
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== 0)) {
        fullLines.push(y);
      }
    }
    
    if (fullLines.length > 0) {
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
  }, [level, lines]);

  const placePiece = useCallback(() => {
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
      return;
    }
    
    setCurrentPiece(newPiece);
    setPosition(newPosition);
  }, [board, currentPiece, position, clearLines]);

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
      }
    }
  }, [board, currentPiece.shape, position, gameOver, isPaused, placePiece]);

  const move = useCallback((dx: number) => {
    if (gameOver || isPaused) return;
    
    const newX = position.x + dx;
    
    if (isValidPosition(board, currentPiece.shape, newX, position.y)) {
      setPosition(prev => ({ ...prev, x: newX }));
    }
  }, [board, currentPiece.shape, position, gameOver, isPaused]);

  const rotate = useCallback(() => {
    if (gameOver || isPaused) return;
    
    const rotated = rotatePiece(currentPiece.shape);
    
    if (isValidPosition(board, rotated, position.x, position.y)) {
      setCurrentPiece(prev => ({ ...prev, shape: rotated }));
    }
  }, [board, currentPiece.shape, position, gameOver, isPaused]);

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
  }, []);

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
        setIsPaused(prev => !prev);
        break;
    }
  }, [gameOver, move, moveDown, rotate]);

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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-4xl font-bold mb-4">Tetris</h1>
      
      <div className="flex gap-8 items-start">
        <div 
          className="grid border-2 border-gray-500 bg-gray-900"
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
        
        <div className="flex flex-col gap-4 min-w-[200px]">
          <div className="p-4 border border-gray-500 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Score</h2>
            <p className="text-2xl">{score}</p>
          </div>
          
          <div className="p-4 border border-gray-500 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Lines</h2>
            <p className="text-2xl">{lines}</p>
          </div>
          
          <div className="p-4 border border-gray-500 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Level</h2>
            <p className="text-2xl">{level}</p>
          </div>
          
          {gameOver && (
            <div className="p-4 border border-red-500 rounded-lg bg-red-900/20">
              <h2 className="text-xl font-bold text-red-400">Game Over!</h2>
            </div>
          )}
          
          {isPaused && !gameOver && (
            <div className="p-4 border border-yellow-500 rounded-lg bg-yellow-900/20">
              <h2 className="text-xl font-bold text-yellow-400">Paused</h2>
            </div>
          )}
          
          <button 
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
          >
            {gameOver ? 'New Game' : 'Start Game'}
          </button>
          
          <div className="p-4 border border-gray-500 rounded-lg text-sm">
            <h3 className="font-bold mb-2">조작법</h3>
            <p>← → : 이동</p>
            <p>↑ : 회전</p>
            <p>↓ : 빠르게 내리기</p>
            <p>Space : 일시정지</p>
          </div>
        </div>
      </div>
    </div>
  );
} 