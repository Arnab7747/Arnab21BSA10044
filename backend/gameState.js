// gameLogic.js

const BOARD_SIZE = 5;

const INITIAL_POSITIONS = {
  A: 0, // Player A's row (top of the board)
  B: BOARD_SIZE - 1 // Player B's row (bottom of the board)
};

// Utility function to calculate new position
const calculateNewPosition = (x, y, dx, dy) => {
  return { x: x + dx, y: y + dy };
};

// Character movement rules
const moveOffsets = {
  Pawn: {
    L: { dx: 0, dy: -1 },
    R: { dx: 0, dy: 1 },
    F: { dx: -1, dy: 0 },
    B: { dx: 1, dy: 0 },
  },
  Hero1: {
    L: { dx: 0, dy: -2 },
    R: { dx: 0, dy: 2 },
    F: { dx: -2, dy: 0 },
    B: { dx: 2, dy: 0 },
  },
  Hero2: {
    FL: { dx: -2, dy: -2 },
    FR: { dx: -2, dy: 2 },
    BL: { dx: 2, dy: -2 },
    BR: { dx: 2, dy: 2 },
  }
};

// Initialize an empty board
const createEmptyBoard = () => {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
};

// Place the characters on the board during the initial setup
const placeCharacters = (player, characters) => {
  const board = createEmptyBoard();
  const row = INITIAL_POSITIONS[player];

  characters.forEach((character, index) => {
    board[row][index] = {
      type: character.type,
      player: player,
      x: row,
      y: index,
      name: `${player}-${character.name}`
    };
  });

  return board;
};

// Determine if a move is valid
const isMoveValid = (board, move, player) => {
  const { character, direction } = move;
  const { x, y, type } = character;

  // Ensure the character belongs to the player
  if (character.player !== player) return false;

  // Get movement offsets for the character type and direction
  const offset = moveOffsets[type][direction];
  if (!offset) return false;

  // Calculate the new position
  const { dx, dy } = offset;
  const { x: newX, y: newY } = calculateNewPosition(x, y, dx, dy);

  // Check if the move is within bounds
  if (newX < 0 || newY < 0 || newX >= BOARD_SIZE || newY >= BOARD_SIZE) return false;

  // Additional rules: can't move into own character, check path for Hero1 and Hero2
  if (board[newX][newY] && board[newX][newY].player === player) return false;

  // Path checking for Hero1 and Hero2
  if (type === 'Hero1' || type === 'Hero2') {
    const steps = Math.abs(dx || dy);
    for (let i = 1; i < steps; i++) {
      const midX = x + (dx / steps) * i;
      const midY = y + (dy / steps) * i;
      if (board[midX][midY]) return false; // Obstruction in the path
    }
  }

  return true;
};

// Apply a valid move to the board
const applyMove = (board, move, player) => {
  const { character, direction } = move;
  const { x, y, type } = character;

  const { dx, dy } = moveOffsets[type][direction];
  const { x: newX, y: newY } = calculateNewPosition(x, y, dx, dy);

  // Remove opponent's character if present
  if (board[newX][newY] && board[newX][newY].player !== player) {
    board[newX][newY] = null; // Capture the character
  }

  // Path checking for Hero1 and Hero2
  if (type === 'Hero1' || type === 'Hero2') {
    const steps = Math.abs(dx || dy);
    for (let i = 1; i <= steps; i++) {
      const midX = x + (dx / steps) * i;
      const midY = y + (dy / steps) * i;
      if (board[midX][midY] && board[midX][midY].player !== player) {
        board[midX][midY] = null; // Remove opponent's character in the path
      }
    }
  }

  // Move the character
  board[newX][newY] = { ...character, x: newX, y: newY };
  board[x][y] = null; // Clear old position
};

// Check if the game is over (one player has no characters left)
const checkGameOver = (board) => {
  const players = { A: 0, B: 0 };
  for (let row of board) {
    for (let cell of row) {
      if (cell) {
        players[cell.player]++;
      }
    }
  }
  if (players.A === 0) return 'B';
  if (players.B === 0) return 'A';
  return null;
};

module.exports = {
  createEmptyBoard,
  placeCharacters,
  isMoveValid,
  applyMove,
  checkGameOver,
};
