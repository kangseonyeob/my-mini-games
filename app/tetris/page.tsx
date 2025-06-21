'use client';

import { useState, useEffect } from 'react';

// Types
export type STAGECELL = [string | number, string];
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
  collided: boolean;
  tetrominoKey: string | number;
};

const LINE_POINTS = [40, 100, 300, 1200];

// Tetrominoes
const TETROMINOES = {
  0: { shape: [[0]], color: '0, 0, 0' },
  I: {
    shape: [
      [1, 1, 1, 1],
    ],
    color: '80, 227, 230',
  },
  J: {
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    color: '36, 95, 223',
  },
  L: {
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
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

const createStage = (): STAGE => Array.from(Array(STAGE_HEIGHT), () => Array(STAGE_WIDTH).fill([0, 'clear']));


export default function Tetris() {
  const [stage, setStage] = useState(createStage());
  const [player, setPlayer] = useState<PLAYER>({
    pos: { x: 0, y: 0 },
    tetromino: TETROMINOES[0],
    collided: false,
    tetrominoKey: 0,
  });
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dropTime, setDropTime] = useState<number | null>(null);


  const resetPlayer = () => {
    const newTetromino = randomTetromino();
    setPlayer({
      pos: { x: STAGE_WIDTH / 2 - 1, y: 0 },
      tetromino: newTetromino.object,
      collided: false,
      tetrominoKey: newTetromino.key,
    });
  };

  const rotate = (matrix: PLAYER['tetromino']['shape'], dir: number) => {
    // Make the rows to become cols (transpose)
    const transposedMatrix = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    // Reverse each row to get a rotated matrix
    if (dir > 0) return transposedMatrix.map(row => row.reverse());
    return transposedMatrix.reverse();
  };

  const playerRotate = (stage: STAGE, dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.tetromino.shape = rotate(clonedPlayer.tetromino.shape, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (offset > clonedPlayer.tetromino.shape[0].length) {
        // If it's still colliding after checking all offsets, revert the rotation
        clonedPlayer.tetromino.shape = rotate(clonedPlayer.tetromino.shape, -dir);
        clonedPlayer.pos.x = pos;
        return;
      }
    }
    setPlayer(clonedPlayer);
  };

  const checkCollision = (
    player: PLAYER,
    stage: STAGE,
    { x: moveX, y: moveY }: { x: number; y: number }
  ) => {
    for (let y = 0; y < player.tetromino.shape.length; y += 1) {
      for (let x = 0; x < player.tetromino.shape[y].length; x += 1) {
        if (player.tetromino.shape[y][x] !== 0) {
          if (
            !stage[y + player.pos.y + moveY] ||
            !stage[y + player.pos.y + moveY][x + player.pos.x + moveX] ||
            stage[y + player.pos.y + moveY][x + player.pos.x + moveX][1] !==
              'clear'
          ) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: (prev.pos.x += x), y: (prev.pos.y += y) },
      collided,
    }));
  };

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  const startGame = () => {
    setStage(createStage());
    setDropTime(1000);
    resetPlayer();
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(0);
  };

  const drop = () => {
    // Increase level when player has cleared 10 rows
    if (rows > (level + 1) * 10) {
      setLevel(prev => prev + 1);
      // Also increase speed
      setDropTime(1000 / (level + 1) + 200);
    }

    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) {
        console.log('GAME OVER!!!');
        setGameOver(true);
        setDropTime(null);
      }
      updatePlayerPos({ x: 0, y: 0, collided: true });
    }
  };
  
  const dropPlayer = () => {
    drop();
  };

  const move = ({ keyCode }: { keyCode: number }) => {
    if (keyCode === 37) {
      movePlayer(-1);
    } else if (keyCode === 39) {
      movePlayer(1);
    } else if (keyCode === 40) {
      dropPlayer();
    } else if (keyCode === 38) {
      playerRotate(stage, 1);
    }
  };

  useEffect(() => {
    startGame();
  }, []);

  // Drawing effect
  useEffect(() => {
    if (gameOver) return;

    const updateStage = (prevStage: STAGE): STAGE => {
        // Flush non-merged cells
        const stageUpdate = prevStage.map(row => row.map(cell => (cell[1] === 'clear' ? [0, 'clear'] as STAGECELL : cell)));
        // Draw tetromino
        player.tetromino.shape.forEach((row, y) => {
            row.forEach((value, x) => {
                if (value !== 0) {
                    const yPos = y + player.pos.y;
                    const xPos = x + player.pos.x;
                    if (stageUpdate[yPos] && stageUpdate[yPos][xPos]) {
                        stageUpdate[yPos][xPos] = [player.tetrominoKey, 'clear'] as STAGECELL;
                    }
                }
            });
        });
        return stageUpdate;
    };

    setStage(prev => updateStage(prev));

  }, [player.pos, player.tetromino, player.tetrominoKey, gameOver]);

  // Collision and row clearing effect
  useEffect(() => {
    if (!player.collided) {
      return;
    }

    const sweepRows = (stageToSweep: STAGE): STAGE => {
      const ack: STAGE = [];
      let clearedRows = 0;

      for (let i = 0; i < stageToSweep.length; i++) {
        if (stageToSweep[i].findIndex(cell => cell[0] === 0) === -1) {
          clearedRows++;
          ack.unshift(Array(stageToSweep[0].length).fill([0, 'clear'] as STAGECELL));
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

    setStage(prev => {
      const newStage = prev.map(row =>
        row.map(cell => (cell[1] === 'clear' ? [cell[0], 'merged'] as STAGECELL : cell))
      );
      return sweepRows(newStage);
    });

    resetPlayer();
  }, [player.collided]);

  // Game Loop
  useEffect(() => {
    if (dropTime) {
      const interval = setInterval(() => {
        drop();
      }, dropTime);
      return () => clearInterval(interval);
    }
  }, [dropTime, drop]);

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white"
      role="button"
      tabIndex={0}
      onKeyDown={e => move(e)}
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
          {stage.map((row, y) =>
            row.map((cell, x) => (
              <div
                key={`${y}-${x}`}
                className="w-[25px] h-[25px] border border-gray-700"
                style={{
                  backgroundColor: cell[0] !== 0 ? `rgba(${TETROMINOES[cell[0] as keyof typeof TETROMINOES].color}, 0.8)` : 'rgb(31 41 55)',
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