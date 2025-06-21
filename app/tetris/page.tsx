'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
export type STAGECELL = string | number;
export type STAGE = STAGECELL[][];

export type PLAYER = {
  pos: {
    x: number;
    y: number;
  };
  tetromino: {
    shape: number[][];
    color: string;
  };
  tetrominoKey: string | number;
};

const LINE_POINTS = [40, 100, 300, 1200];

// Tetrominoes
const TETROMINOES = {
  0: { shape: [[0]], color: '0, 0, 0' },
  I: {
    shape: [[1, 1, 1, 1]],
    color: '80, 227, 230',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '36, 95, 223',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '223, 173, 36',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '223, 217, 36',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '48, 211, 56',
  },
  T: {
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: '132, 61, 198',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '227, 78, 78',
  },
};

const randomTetromino = () => {
  const tetrominoes = 'IJLOSTZ';
  const randTetromino =
    tetrominoes[Math.floor(Math.random() * tetrominoes.length)];
  return {
    key: randTetromino,
    object: TETROMINOES[randTetromino as keyof typeof TETROMINOES],
  };
};

const STAGE_WIDTH = 12;
const STAGE_HEIGHT = 20;

const createStage = (): STAGE =>
  Array.from(Array(STAGE_HEIGHT), () => Array(STAGE_WIDTH).fill(0));

export default function Tetris() {
  const [stage, setStage] = useState(createStage());
  const [player, setPlayer] = useState<PLAYER>({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOES[0],
    tetrominoKey: 0,
  });
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);

  const resetPlayer = useCallback(() => {
    const newTetromino = randomTetromino();
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
      tetromino: newTetromino.object,
      tetrominoKey: newTetromino.key,
    });
  }, []);

  const checkCollision = (
    playerState: PLAYER,
    gameStage: STAGE,
    { x: moveX, y: moveY }: { x: number; y: number }
  ) => {
    for (let y = 0; y < playerState.tetromino.shape.length; y += 1) {
      for (let x = 0; x < playerState.tetromino.shape[y].length; x += 1) {
        if (playerState.tetromino.shape[y][x] !== 0) {
          const newY = y + playerState.pos.y + moveY;
          const newX = x + playerState.pos.x + moveX;
          if (
            !gameStage[newY] ||
            !gameStage[newY][newX] ||
            gameStage[newY][newX] !== 0
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };
  
  const startGame = useCallback(() => {
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(0);
  }, [resetPlayer]);

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x + dir, y: prev.pos.y } }));
    }
  };

  const drop = () => {
    if (rows > (level + 1) * 10) {
      setLevel(prev => prev + 1);
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      setPlayer(prev => ({ ...prev, pos: { x: prev.pos.x, y: prev.pos.y + 1 } }));
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        return;
      }

      setStage(prevStage => {
        const newStage = prevStage.map(row => [...row]);
        player.tetromino.shape.forEach((row, y) => {
          row.forEach((value, x) => {
            if (value !== 0) {
              newStage[y + player.pos.y][x + player.pos.x] = player.tetrominoKey;
            }
          });
        });

        const sweepRows = (stageToSweep: STAGE) => {
          const ack: STAGE = [];
          let clearedRows = 0;
          for (let i = 0; i < stageToSweep.length; i++) {
            if (stageToSweep[i].findIndex(cell => cell === 0) === -1) {
              clearedRows++;
              ack.unshift(Array(stageToSweep[0].length).fill(0));
              continue;
            }
            ack.push(stageToSweep[i]);
          }
          if (clearedRows > 0) {
            setScore(prev => prev + LINE_POINTS[clearedRows - 1] * (level + 1));
            setRows(prev => prev + clearedRows);
          }
          return ack;
        };
        return sweepRows(newStage);
      });
      resetPlayer();
    }
  };

  const dropPlayer = () => {
    setDropTime(null);
    drop();
  };
  
  const keyUp = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver) {
      if (keyCode === 40) {
        setDropTime(1000 / (level + 1) + 200);
      }
    }
  };
  
  const rotate = (matrix: number[][]) => {
    const transposedMatrix = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    return transposedMatrix.map(row => row.reverse());
  };

  const playerRotate = (gameStage: STAGE) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino.shape = rotate(clonedPlayer.tetromino.shape);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, gameStage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino.shape[0].length) {
        clonedPlayer.tetromino.shape = rotate(rotate(rotate(clonedPlayer.tetromino.shape)));
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
  };
  
  const move = ({ keyCode }: { keyCode: number }) => {
    if (!gameOver) {
      if (keyCode === 37) {
        movePlayer(-1);
      } else if (keyCode === 39) {
        movePlayer(1);
      } else if (keyCode === 40) {
        dropPlayer();
      } else if (keyCode === 38) {
        playerRotate(stage);
      }
    }
  };

  useEffect(() => {
    startGame();
  }, [startGame]);

  useEffect(() => {
    if (!gameOver) {
        const interval = setInterval(() => {
            if(dropTime) drop();
        }, dropTime || 0);

        return () => clearInterval(interval);
    }
}, [gameOver, dropTime, drop]);

  const displayStage = stage.map(row => [...row]) as STAGE;
  if (player.tetrominoKey !== 0) {
    player.tetromino.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const yPos = y + player.pos.y;
                const xPos = x + player.pos.x;
                if(displayStage[yPos]){
                    displayStage[yPos][xPos] = player.tetrominoKey;
                }
            }
        });
    });
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white"
      role="button"
      tabIndex={0}
      onKeyDown={e => move(e)}
      onKeyUp={keyUp}
      autoFocus
    >
      <h1 className="text-4xl font-bold mb-4">Tetris</h1>
      <div className="flex gap-8">
        <div
          className="grid border-2 border-gray-500"
          style={{
            gridTemplateColumns: `repeat(${STAGE_WIDTH}, 25px)`,
            gridTemplateRows: `repeat(${STAGE_HEIGHT}, 25px)`,
          }}
        >
          {displayStage.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="w-[25px] h-[25px] border border-gray-700"
                style={{
                  backgroundColor: cell !== 0 ? `rgba(${TETROMINOES[cell as keyof typeof TETROMINOES].color}, 0.8)` : 'rgb(31 41 55)',
                }}
              />
            ))
          )}
        </div>
        <div className="flex flex-col gap-4">
            {gameOver ? (
                <div className='text-red-500 font-bold'>GAME OVER</div>
            ) : (
                <>
                    <div className='p-4 border border-gray-500 rounded-lg'>
                        <h2 className="text-xl font-bold">Score</h2>
                        <p className="text-2xl">{score}</p>
                    </div>
                    <div className='p-4 border border-gray-500 rounded-lg'>
                        <h2 className="text-xl font-bold">Rows</h2>
                        <p className="text-2xl">{rows}</p>
                    </div>
                    <div className='p-4 border border-gray-500 rounded-lg'>
                        <h2 className="text-xl font-bold">Level</h2>
                        <p className="text-2xl">{level}</p>
                    </div>
                </>
            )}
            <button onClick={startGame} className="mt-4 px-4 py-2 bg-blue-500 rounded">Start Game</button>
            <div className='mt-4 p-4 border border-gray-500 rounded-lg text-sm'>
              <h2 className="text-lg font-bold mb-2">조작법</h2>
              <p>이동: ← →</p>
              <p>회전: ↑</p>
              <p>내리기: ↓</p>
            </div>
        </div>
      </div>
    </div>
  );
} 