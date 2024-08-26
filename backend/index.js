const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });





// Initial Game State
let gameState = {
  board: [
    ["A-P1", "A-H1", "A-H2", "A-H1", "A-P1"], // Player A's initial row
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    ["B-P1", "B-H1", "B-H2", "B-H1", "B-P1"], // Player B's initial row
  ],
  currentPlayer: "A", // 'A' or 'B'
};

// Helper Functions
function getCharacterType(char) {
  return char.split("-")[1]; // 'P1', 'H1', 'H2'
}

function isWithinBounds(row, col) {
  return row >= 0 && row < 5 && col >= 0 && col < 5;
}

function isValidMove(from, to, player) {
  const piece = gameState.board[from.row][from.col];
  if (!piece || piece[0] !== player) return false;

  const charType = getCharacterType(piece);

  // Determine move validity based on the piece type
  switch (charType) {
    case "P1":
      return (
        Math.abs(to.row - from.row) <= 1 && Math.abs(to.col - from.col) <= 1
      );
    case "H1":
      return (
        (to.row === from.row || to.col === from.col) &&
        Math.abs(to.row - from.row + to.col - from.col) === 2
      );
    case "H2":
      return (
        Math.abs(to.row - from.row) === 2 && Math.abs(to.col - from.col) === 2
      );
    default:
      return false;
  }
}

function applyMove(from, to, player) {
  const piece = gameState.board[from.row][from.col];
  if (!piece || piece[0] !== player) return false; // Check ownership first

  if (!isValidMove(from, to, player) || !isWithinBounds(to.row, to.col)) {
    return false;
  }

  const charType = getCharacterType(piece);

  // Hero1 straight movement logic
  if (charType === "H1") {
    // Check rows
    for (
      let i = Math.min(from.row, to.row) + 1;
      i < Math.max(from.row, to.row);
      i++
    ) {
      if (
        gameState.board[i][from.col] &&
        gameState.board[i][from.col][0] !== player
      ) {
        gameState.board[i][from.col] = null;
      }
    }
    // Check columns
    for (
      let i = Math.min(from.col, to.col) + 1;
      i < Math.max(from.col, to.col);
      i++
    ) {
      if (
        gameState.board[from.row][i] &&
        gameState.board[from.row][i][0] !== player
      ) {
        gameState.board[from.row][i] = null;
      }
    }
  }

  // Hero2 diagonal movement logic
  if (charType === "H2") {
    let stepRow = to.row > from.row ? 1 : -1;
    let stepCol = to.col > from.col ? 1 : -1;
    for (let i = 1; i < 2; i++) {
      let checkRow = from.row + i * stepRow;
      let checkCol = from.col + i * stepCol;
      if (
        gameState.board[checkRow][checkCol] &&
        gameState.board[checkRow][checkCol][0] !== player
      ) {
        gameState.board[checkRow][checkCol] = null;
      }
    }
  }

  // Move the piece
  gameState.board[to.row][to.col] = piece;
  gameState.board[from.row][from.col] = null;

  // Switch turns
  gameState.currentPlayer = gameState.currentPlayer === "A" ? "B" : "A";
  return true;
}

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const { from, to } = JSON.parse(message);
    const player = gameState.currentPlayer;

    const moveSuccess = applyMove(from, to, player);
    if (!moveSuccess) {
      ws.send(JSON.stringify({ error: "Invalid move" }));
    }

    // Broadcast updated game state to all players
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(gameState));
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
