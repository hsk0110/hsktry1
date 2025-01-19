import React, { useEffect, useState, useCallback } from 'react';
import { Rocket, Star, Cloud } from 'lucide-react';

interface GameObject {
  x: number;
  y: number;
  id: number;
}

interface GameState {
  player: { x: number; y: number };
  stars: GameObject[];
  obstacles: GameObject[];
  score: number;
  gameOver: boolean;
  level: 'easy' | 'medium' | 'hard';
  isPlaying: boolean;
}

const GAME_HEIGHT = 400;
const GAME_WIDTH = 800;
const PLAYER_SIZE = 40;
const MOVEMENT_SPEED = 12; // Increased from 5 to 12 for faster movement

export default function Game() {
  const [gameState, setGameState] = useState<GameState>({
    player: { x: 100, y: GAME_HEIGHT / 2 },
    stars: [],
    obstacles: [],
    score: 0,
    gameOver: false,
    level: 'easy',
    isPlaying: false,
  });
  const [keysPressed, setKeysPressed] = useState(new Set<string>());

  const difficultySettings = {
    easy: { starSpeed: 3, obstacleSpeed: 2, spawnRate: 50 },
    medium: { starSpeed: 4, obstacleSpeed: 3, spawnRate: 40 },
    hard: { starSpeed: 5, obstacleSpeed: 4, spawnRate: 30 },
  };

  const resetGame = useCallback(() => {
    setGameState({
      player: { x: 100, y: GAME_HEIGHT / 2 },
      stars: [],
      obstacles: [],
      score: 0,
      gameOver: false,
      level: 'easy',
      isPlaying: true,
    });
    setKeysPressed(new Set());
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeysPressed(prev => {
      const next = new Set(prev);
      next.add(e.code);
      return next;
    });
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeysPressed(prev => {
      const next = new Set(prev);
      next.delete(e.code);
      return next;
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (!gameState.isPlaying || gameState.gameOver) return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        if (prev.gameOver) return prev;

        // Handle movement
        let newY = prev.player.y;
        if (keysPressed.has('ArrowUp')) {
          newY = Math.max(0, newY - MOVEMENT_SPEED);
        }
        if (keysPressed.has('ArrowDown')) {
          newY = Math.min(GAME_HEIGHT - PLAYER_SIZE, newY + MOVEMENT_SPEED);
        }

        const settings = difficultySettings[prev.level];
        
        // Generate new objects
        const newStars = [...prev.stars];
        const newObstacles = [...prev.obstacles];

        if (Math.random() * 100 < settings.spawnRate) {
          if (Math.random() > 0.7) {
            newObstacles.push({
              x: GAME_WIDTH,
              y: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
              id: Date.now(),
            });
          } else {
            newStars.push({
              x: GAME_WIDTH,
              y: Math.random() * (GAME_HEIGHT - PLAYER_SIZE),
              id: Date.now(),
            });
          }
        }

        // Move objects
        const moveObjects = (objects: GameObject[], speed: number) =>
          objects
            .map((obj) => ({ ...obj, x: obj.x - speed }))
            .filter((obj) => obj.x > -PLAYER_SIZE);

        const updatedStars = moveObjects(newStars, settings.starSpeed);
        const updatedObstacles = moveObjects(newObstacles, settings.obstacleSpeed);

        // Collision detection
        let newScore = prev.score;
        let gameOver = false;

        updatedStars.forEach((star, index) => {
          if (
            Math.abs(star.x - prev.player.x) < PLAYER_SIZE &&
            Math.abs(star.y - newY) < PLAYER_SIZE
          ) {
            newScore += 10;
            updatedStars.splice(index, 1);
          }
        });

        updatedObstacles.forEach((obstacle) => {
          if (
            Math.abs(obstacle.x - prev.player.x) < PLAYER_SIZE &&
            Math.abs(obstacle.y - newY) < PLAYER_SIZE
          ) {
            gameOver = true;
          }
        });

        // Update difficulty
        let newLevel = prev.level;
        if (newScore >= 200 && prev.level === 'easy') {
          newLevel = 'medium';
        } else if (newScore >= 500 && prev.level === 'medium') {
          newLevel = 'hard';
        }

        return {
          ...prev,
          player: { ...prev.player, y: newY },
          stars: updatedStars,
          obstacles: updatedObstacles,
          score: newScore,
          gameOver,
          level: newLevel,
        };
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState.isPlaying, gameState.gameOver, keysPressed]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-900 to-black p-4">
      {!gameState.isPlaying ? (
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Space Explorer</h1>
          <p className="mb-4">Use UP and DOWN ARROW keys to control your rocket!</p>
          <button
            onClick={() => resetGame()}
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
          >
            Start Game
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="mb-4 text-white">
            <span className="mr-4">Score: {gameState.score}</span>
            <span>Level: {gameState.level}</span>
          </div>
          <div
            className="relative bg-gray-900 rounded-lg overflow-hidden"
            style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
          >
            {/* Player */}
            <div
              className="absolute transition-transform"
              style={{
                transform: `translate(${gameState.player.x}px, ${gameState.player.y}px)`,
              }}
            >
              <Rocket className="text-yellow-400" size={PLAYER_SIZE} />
            </div>

            {/* Stars */}
            {gameState.stars.map((star) => (
              <div
                key={star.id}
                className="absolute"
                style={{
                  transform: `translate(${star.x}px, ${star.y}px)`,
                }}
              >
                <Star className="text-yellow-300" size={PLAYER_SIZE} />
              </div>
            ))}

            {/* Obstacles */}
            {gameState.obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className="absolute"
                style={{
                  transform: `translate(${obstacle.x}px, ${obstacle.y}px)`,
                }}
              >
                <Cloud className="text-red-500" size={PLAYER_SIZE} />
              </div>
            ))}
          </div>

          {gameState.gameOver && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                <p className="mb-4">Final Score: {gameState.score}</p>
                <button
                  onClick={resetGame}
                  className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
                >
                  Play Again
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}