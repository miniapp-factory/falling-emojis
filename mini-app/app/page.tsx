"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, ArrowRightIcon, ArrowDownIcon, ArrowUpIcon, PauseIcon, PlayIcon, ShareIcon } from "lucide-react";

export const dynamic = "force-dynamic";

/* Removed generateMetadata export to avoid client/server conflict */

type Stage = "welcome" | "game" | "results";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY_CELL = 0;
const EMOJI = "😎";

const SHAPES: number[][][] = [
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O
  [
    [2, 2],
    [2, 2],
  ],
  // T
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  // S
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  // Z
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  // J
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
];

function rotateMatrix(matrix: number[][]): number[][] {
  const size = matrix.length;
  const result: number[][] = Array.from({ length: size }, () => Array(size).fill(EMPTY_CELL));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      result[c][size - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

export default function Page() {
  /* ---------- Component State ---------- */
  const [stage, setStage] = useState<Stage>("welcome");
  const [board, setBoard] = useState<number[][]>(Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(EMPTY_CELL)));
  const [currentPiece, setCurrentPiece] = useState<{ shape: number[][]; x: number; y: number } | null>(null);
  const [nextPiece, setNextPiece] = useState<number[][] | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------- Game Logic ---------- */
  const spawnPiece = () => {
    const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
    const y = -shape.length; // start above the board
    setCurrentPiece({ shape, x, y });
    const nextShape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    setNextPiece(nextShape);
  };

  const startGame = () => {
    const emptyBoard = Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(EMPTY_CELL));
    setBoard(emptyBoard);
    setScore(0);
    setPaused(false);
    spawnPiece();
    setStage("game");
  };

  const rotatePiece = () => {
    if (!currentPiece) return;
    const rotated = rotateMatrix(currentPiece.shape);
    if (!checkCollision(rotated, currentPiece.x, currentPiece.y)) {
      setCurrentPiece({ ...currentPiece, shape: rotated });
    }
  };

  const movePiece = (dx: number, dy: number) => {
    if (!currentPiece) return;
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    if (!checkCollision(currentPiece.shape, newX, newY)) {
      setCurrentPiece({ ...currentPiece, x: newX, y: newY });
    } else if (dy === 1) {
      // collision when moving down -> lock piece
      lockPiece();
    }
  };

  const dropPiece = () => {
    if (!currentPiece) return;
    let newY = currentPiece.y;
    while (!checkCollision(currentPiece.shape, currentPiece.x, newY + 1)) {
      newY += 1;
    }
    setCurrentPiece({ ...currentPiece, y: newY });
    lockPiece();
  };

  const hardDrop = () => {
    if (!currentPiece) return;
    let newY = currentPiece.y;
    while (!checkCollision(currentPiece.shape, currentPiece.x, newY + 1)) {
      newY += 1;
    }
    setCurrentPiece({ ...currentPiece, y: newY });
    lockPiece();
  };

  const checkCollision = (shape: number[][], x: number, y: number) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === EMPTY_CELL) continue;
        const boardX = x + c;
        const boardY = y + r;
        if (boardX < 0 || boardX >= BOARD_WIDTH) return true;
        if (boardY >= BOARD_HEIGHT) return true;
        if (boardY >= 0 && board[boardY][boardX] !== EMPTY_CELL) return true;
      }
    }
    return false;
  };

  const lockPiece = () => {
    if (!currentPiece) return;
    const newBoard = board.map(row => [...row]);
    currentPiece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell === EMPTY_CELL) return;
        const boardX = currentPiece.x + c;
        const boardY = currentPiece.y + r;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY][boardX] = cell;
        }
      });
    });
    const cleared = clearLines(newBoard);
    setBoard(newBoard);
    setScore(prev => prev + cleared);
    spawnPiece();
  };

  const clearLines = (boardToCheck: number[][]) => {
    const newBoard = boardToCheck.filter(row => row.some(cell => cell === EMPTY_CELL));
    const linesCleared = BOARD_HEIGHT - newBoard.length;
    const emptyRows = Array.from({ length: linesCleared }, () => Array(BOARD_WIDTH).fill(EMPTY_CELL));
    const finalBoard = [...emptyRows, ...newBoard];
    return linesCleared * 100;
  };

  const shareScore = () => {
    const url = `https://warpcast.com/~/compose?text=I+scored+${score}+points+in+Falling+Emojis!`;
    window.open(url, "_blank");
  };

  /* ---------- Rendering Helpers ---------- */
  const renderCell = (cell: number) => {
    return cell !== EMPTY_CELL ? EMOJI : "";
  };

  const renderBoard = () => {
    const displayBoard = board.map(row => [...row]);
    if (currentPiece) {
      currentPiece.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell === EMPTY_CELL) return;
          const boardX = currentPiece.x + c;
          const boardY = currentPiece.y + r;
          if (boardY < 0 || boardY >= BOARD_HEIGHT || boardX < 0 || boardX >= BOARD_WIDTH) return;
          displayBoard[boardY][boardX] = cell;
        });
      });
    }
    return (
      <div className="grid grid-cols-10 gap-0.5">
        {displayBoard.flat().map((cell, idx) => (
          <div
            key={idx}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-sm",
              cell !== EMPTY_CELL ? "bg-yellow-400 text-black" : "bg-transparent"
            )}
          >
            {renderCell(cell)}
          </div>
        ))}
      </div>
    );
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    return (
      <div className="grid grid-cols-4 gap-0.5">
        {Array.from({ length: 4 }, (_, r) =>
          Array.from({ length: 4 }, (_, c) => {
            const cell = nextPiece[r]?.[c] ?? EMPTY_CELL;
            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-sm",
                  cell !== EMPTY_CELL ? "bg-yellow-400 text-black" : "bg-transparent"
                )}
              >
                {renderCell(cell)}
              </div>
            );
          })
        )}
      </div>
    );
  };

  /* ---------- Effects ---------- */
  // Load high score from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("tetris-emoji-highscore");
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  // Persist high score
  useEffect(() => {
    localStorage.setItem("tetris-emoji-highscore", highScore.toString());
  }, [highScore]);

  // Game loop
  useEffect(() => {
    if (stage !== "game" || paused) return;
    intervalRef.current = setInterval(() => {
      movePiece(0, 1);
    }, 500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage, paused]);

  // End game when piece cannot spawn
  useEffect(() => {
    if (!currentPiece) return;
    if (checkCollision(currentPiece.shape, currentPiece.x, currentPiece.y)) {
      setStage("results");
      if (score > highScore) setHighScore(score);
    }
  }, [currentPiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== "game") return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          movePiece(-1, 0);
          break;
        case "ArrowRight":
          e.preventDefault();
          movePiece(1, 0);
          break;
        case "ArrowDown":
          e.preventDefault();
          movePiece(0, 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          rotatePiece();
          break;
        case " ":
          e.preventDefault();
          hardDrop();
          break;
        case "p":
        case "P":
          e.preventDefault();
          setPaused(prev => !prev);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, currentPiece]);

  /* ---------- UI ---------- */
  const motivationalMessage = () => {
    if (score >= 1000) return "You're a Tetris master!";
    if (score >= 500) return "Great job!";
    if (score >= 200) return "Nice work!";
    return "Keep going!";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white">
      {stage === "welcome" && (
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Falling Emojis</h1>
          <p className="mb-6">A mobile‑friendly emoji‑based game built with Next.js, Shadcn UI, and Tailwind CSS.</p>
          <Button size="lg" onClick={startGame} className="w-full">
            <PlayIcon className="mr-2 h-4 w-4" /> Start Game
          </Button>
        </Card>
      )}

      {stage === "game" && (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-start space-x-8">
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-2">Score: {score}</h2>
              <div className="w-80 h-96 border-2 border-white rounded-md p-1">{renderBoard()}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaused(prev => !prev)}
                className="mt-2"
              >
                {paused ? <PlayIcon className="h-4 w-4" /> : <PauseIcon className="h-4 w-4" />}
                {paused ? "Resume" : "Pause"}
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-2">Next</h3>
              <div className="w-24 h-24 border-2 border-white rounded-md p-1">{renderNextPiece()}</div>
            </div>
          </div>
        </div>
      )}

      {stage === "results" && (
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-3xl font-bold mb-4">Game Over</h1>
          <p className="mb-2">Score: {score}</p>
          <p className="mb-2">High Score: {highScore}</p>
          <p className="mb-4">{motivationalMessage()}</p>
          <div className="flex flex-col space-y-2">
            <Button
              size="lg"
              onClick={shareScore}
              className="w-full"
              variant="outline"
            >
              <ShareIcon className="mr-2 h-4 w-4" /> Share on Warpcast
            </Button>
            <Button size="lg" onClick={startGame} className="w-full">
              <PlayIcon className="mr-2 h-4 w-4" /> Play Again
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
