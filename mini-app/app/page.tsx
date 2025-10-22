import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { url, title, description } from "@/lib/metadata";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    other: {
      "fc:miniapp": JSON.stringify({
        version: "next",
        imageUrl: `${url}/icon.png`,
        ogTitle: title,
        ogDescription: description,
        ogImageUrl: `${url}/icon.png`,
        button: {
          title: "Launch Mini App",
          action: {
            type: "launch_miniapp",
            name: title,
            url: url,
            splashImageUrl: `${url}/icon.png`,
            iconUrl: `${url}/icon.png`,
            splashBackgroundColor: "#000000",
            description: description,
            primaryCategory: "utility",
            tags: [],
          },
        },
      }),
    },
  };
}

const ROWS = 20;
const COLS = 10;

// Tetromino shapes (4x4 matrices)
const SHAPES = [
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O
  [
    [0, 0, 0, 0],
    [0, 2, 2, 0],
    [0, 2, 2, 0],
    [0, 0, 0, 0],
  ],
  // T
  [
    [0, 0, 0, 0],
    [3, 3, 3, 0],
    [0, 3, 0, 0],
    [0, 0, 0, 0],
  ],
  // S
  [
    [0, 0, 0, 0],
    [0, 4, 4, 0],
    [4, 4, 0, 0],
    [0, 0, 0, 0],
  ],
  // Z
  [
    [0, 0, 0, 0],
    [5, 5, 0, 0],
    [0, 5, 5, 0],
    [0, 0, 0, 0],
  ],
  // J
  [
    [0, 0, 0, 0],
    [6, 6, 6, 0],
    [6, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // L
  [
    [0, 0, 0, 0],
    [7, 7, 7, 0],
    [0, 0, 7, 0],
    [0, 0, 0, 0],
  ],
];

// Colors for each tetromino type (index+1)
const COLORS = [
  "bg-cyan-400",
  "bg-yellow-400",
  "bg-purple-400",
  "bg-green-400",
  "bg-red-400",
  "bg-blue-400",
  "bg-orange-400",
];

type Stage = "welcome" | "game" | "results";

export default function Home() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [board, setBoard] = useState<number[][]>(
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState<{
    shape: number[][];
    type: number;
    x: number;
    y: number;
  } | null>(null);
  const [nextPiece, setNextPiece] = useState<{
    shape: number[][];
    type: number;
  } | null>(null);
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [level, setLevel] = useState(1);
  const [dropInterval, setDropInterval] = useState(1000);
  const [isPaused, setIsPaused] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  // Load high score from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("tetris-emoji-highscore");
    if (stored) setHighScore(parseInt(stored, 10));
  }, []);

  // Save high score when it changes
  useEffect(() => {
    localStorage.setItem("tetris-emoji-highscore", highScore.toString());
  }, [highScore]);

  // Start game loop
  useEffect(() => {
    if (stage !== "game") return;
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      dropPiece();
    }, dropInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stage, dropInterval, isPaused, currentPiece]);

  // Key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage !== "game") return;
      if (isPaused) return;
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
          dropPiece();
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
          setIsPaused((p) => !p);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [stage, isPaused, currentPiece]);

  // Touch handling
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (stage !== "game") return;
      const touch = e.touches[0];
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (stage !== "game") return;
      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartX.current;
      const dy = touch.clientY - touchStartY.current;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDx < 10 && absDy < 10) {
        // tap -> rotate
        rotatePiece();
      } else if (absDx > absDy) {
        if (dx > 0) movePiece(1, 0);
        else movePiece(-1, 0);
      } else {
        if (dy > 0) dropPiece();
        else rotatePiece();
      }
    };
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [stage, currentPiece]);

  // Game over detection
  useEffect(() => {
    if (stage !== "game") return;
    if (board[0].some((cell) => cell !== 0)) {
      // Game over
      setStage("results");
      if (score > highScore) setHighScore(score);
    }
  }, [board, stage, score, highScore]);

  // Initialize new game
  const startGame = () => {
    setBoard(Array.from({ length: ROWS }, () => Array(COLS).fill(0)));
    setScore(0);
    setLinesCleared(0);
    setLevel(1);
    setDropInterval(1000);
    setIsPaused(false);
    setCurrentPiece(null);
    setNextPiece(null);
    spawnPiece();
    setStage("game");
  };

  const spawnPiece = () => {
    const type = Math.floor(Math.random() * SHAPES.length) + 1;
    const shape = SHAPES[type - 1];
    const newPiece = {
      shape,
      type,
      x: Math.floor(COLS / 2) - 2,
      y: 0,
    };
    setCurrentPiece(newPiece);
    // Generate next piece
    const nextType = Math.floor(Math.random() * SHAPES.length) + 1;
    setNextPiece({
      shape: SHAPES[nextType - 1],
      type: nextType,
    });
  };

  const rotateMatrix = (matrix: number[][]) => {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        result[j][N - 1 - i] = matrix[i][j];
      }
    }
    return result;
  };

  const rotatePiece = () => {
    if (!currentPiece) return;
    const rotated = rotateMatrix(currentPiece.shape);
    const newPiece = { ...currentPiece, shape: rotated };
    if (!checkCollision(newPiece, currentPiece.x, currentPiece.y)) {
      setCurrentPiece(newPiece);
    }
  };

  const movePiece = (dx: number, dy: number) => {
    if (!currentPiece) return;
    const newX = currentPiece.x + dx;
    const newY = currentPiece.y + dy;
    if (!checkCollision(currentPiece, newX, newY)) {
      setCurrentPiece({ ...currentPiece, x: newX, y: newY });
    }
  };

  const dropPiece = () => {
    if (!currentPiece) return;
    const newY = currentPiece.y + 1;
    if (!checkCollision(currentPiece, currentPiece.x, newY)) {
      setCurrentPiece({ ...currentPiece, y: newY });
    } else {
      lockPiece();
    }
  };

  const hardDrop = () => {
    if (!currentPiece) return;
    let newY = currentPiece.y;
    while (!checkCollision(currentPiece, currentPiece.x, newY + 1)) {
      newY++;
    }
    setCurrentPiece({ ...currentPiece, y: newY });
    lockPiece();
  };

  const checkCollision = (
    piece: { shape: number[][]; x: number; y: number },
    x: number,
    y: number
  ) => {
    const { shape } = piece;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] === 0) continue;
        const boardX = x + j;
        const boardY = y + i;
        if (
          boardX < 0 ||
          boardX >= COLS ||
          boardY >= ROWS ||
          (boardY >= 0 && board[boardY][boardX] !== 0)
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const lockPiece = () => {
    if (!currentPiece) return;
    const newBoard = board.map((row) => row.slice());
    const { shape, type, x, y } = currentPiece;
    for (let i = 0; i < shape.length; i++) {
      for (let j = 0; j < shape[i].length; j++) {
        if (shape[i][j] === 0) continue;
        const boardX = x + j;
        const boardY = y + i;
        if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
          newBoard[boardY][boardX] = type;
        }
      }
    }
    setBoard(newBoard);
    clearLines(newBoard);
    spawnPiece();
  };

  const clearLines = (newBoard: number[][]) => {
    const fullRows: number[] = [];
    for (let i = 0; i < ROWS; i++) {
      if (newBoard[i].every((cell) => cell !== 0)) {
        fullRows.push(i);
      }
    }
    if (fullRows.length === 0) return;
    const cleared = fullRows.length;
    const newRows = Array.from({ length: cleared }, () => Array(COLS).fill(0));
    const remaining = newBoard.filter((_, idx) => !fullRows.includes(idx));
    const updatedBoard = [...newRows, ...remaining];
    setBoard(updatedBoard);
    const points = cleared * 10 * level;
    setScore((s) => s + points);
    setLinesCleared((l) => l + cleared);
    if ((linesCleared + cleared) % 10 === 0) {
      setLevel((lvl) => lvl + 1);
      setDropInterval((interval) => Math.max(200, interval - 100));
    }
  };

  const shareScore = () => {
    const text = `I scored ${score} in Tetris Emoji! 🧱 Try it: ${url}`;
    window.open(`https://warpcast.com/compose?text=${encodeURIComponent(text)}`, "_blank");
  };

  // Render helpers
  const renderCell = (value: number, row: number, col: number) => {
    const colorClass = value ? COLORS[value - 1] : "bg-white/20";
    return (
      <div
        key={`${row}-${col}`}
        className={`w-full h-full border border-white/10 rounded-sm ${colorClass} flex items-center justify-center`}
      >
        {value ? "😎" : null}
      </div>
    );
  };

  const renderBoard = () => {
    return (
      <div
        className="grid grid-cols-10 gap-0.5 w-full h-full"
        style={{ gridTemplateRows: `repeat(${ROWS}, 1fr)` }}
      >
        {board.flatMap((row, rIdx) =>
          row.map((cell, cIdx) => renderCell(cell, rIdx, cIdx))
        )}
      </div>
    );
  };

  const renderNextPiece = () => {
    if (!nextPiece) return null;
    const { shape, type } = nextPiece;
    return (
      <Card className="p-2">
        <div className="text-center font-bold mb-1">Next</div>
        <div
          className="grid grid-cols-4 gap-0.5"
          style={{ gridTemplateRows: `repeat(4, 1fr)` }}
        >
          {shape.flatMap((row, rIdx) =>
            row.map((cell, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className={`w-full h-full border border-white/10 rounded-sm ${
                  cell ? COLORS[type - 1] : "bg-white/20"
                } flex items-center justify-center`}
              >
                {cell ? "😎" : null}
              </div>
            ))
          )}
        </div>
      </Card>
    );
  };

  // UI
  if (stage === "welcome") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <h1 className="text-5xl font-extrabold text-white mb-4">
          Tetris Emoji! 🧱
        </h1>
        <p className="text-lg text-white/80 mb-8">
          Stack the emoji blocks! Use arrows/swipe to move, up/rotate tap to rotate, space/down swipe to drop.
        </p>
        <Button
          variant="destructive"
          size="lg"
          className="bg-red-600 text-yellow-400 hover:bg-red-700 transition-colors"
          onClick={startGame}
        >
          Start Game
        </Button>
      </main>
    );
  }

  if (stage === "game") {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="flex flex-col items-center gap-4 w-full max-w-md">
          <div className="flex justify-between w-full items-center">
            <div className="text-2xl font-bold text-white">Tetris Emoji</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused((p) => !p)}
            >
              {isPaused ? "Resume" : "Pause"}
            </Button>
          </div>
          <div className="flex gap-4 w-full">
            <div className="flex-1 bg-white/80 backdrop-blur-md rounded-lg shadow-lg p-2">
              <div className="grid grid-cols-10 gap-0.5 w-full h-96">
                {renderBoard()}
              </div>
            </div>
            <div className="w-32 flex flex-col gap-4">
              {renderNextPiece()}
              <Card className="p-2">
                <div className="text-center font-bold mb-1">Score</div>
                <div className="text-3xl font-mono">{score}</div>
              </Card>
              <Card className="p-2">
                <div className="text-center font-bold mb-1">Level</div>
                <div className="text-3xl font-mono">{level}</div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // results
  const motivational = score > 1000 ? "Tetris Master! 🇵🇭" : "Great Job!";

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-5xl font-extrabold text-white mb-4">Game Over! 🧱</h1>
      <p className="text-2xl text-white mb-2">Score: {score}</p>
      <p className="text-xl text-white mb-4">High Score: {highScore}</p>
      <p className="text-lg text-yellow-400 mb-8">{motivational}</p>
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={startGame}
          className="bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          Play Again
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={shareScore}
          className="bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          Share
        </Button>
      </div>
    </main>
  );
}
