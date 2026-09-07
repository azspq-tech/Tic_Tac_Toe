// Game state
const gameState = {
    board: Array(9).fill(null),
    currentPlayer: 'X', // Player is always X
    gameActive: true,
    scores: {
        player: 0,
        ai: 0,
        draws: 0
    },
    difficulty: 'medium'
};

// DOM Elements
const cells = document.querySelectorAll('.cell');
const statusDisplay = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');
const difficultySelect = document.getElementById('difficulty');
const playerScoreEl = document.getElementById('player-score');
const aiScoreEl = document.getElementById('ai-score');
const drawScoreEl = document.getElementById('draw-score');

// Winning combinations
const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Initialize game
function initGame() {
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });
    resetBtn.addEventListener('click', resetGame);
    difficultySelect.addEventListener('change', (e) => {
        gameState.difficulty = e.target.value;
        resetGame();
    });
}

// Handle cell click
function handleCellClick(e) {
    const cell = e.target;
    const index = parseInt(cell.getAttribute('data-index'));

    if (gameState.board[index] !== null || !gameState.gameActive || gameState.currentPlayer !== 'X') {
        return;
    }

    makeMove(index, 'X');
    
    if (gameState.gameActive) {
        gameState.currentPlayer = 'O';
        statusDisplay.textContent = "AI is thinking...";
        
        // Add a small delay to make it feel more human-like
        setTimeout(() => {
            aiMove();
        }, 500 + Math.random() * 500); // 500-1000ms delay
    }
}

// Make a move
function makeMove(index, player) {
    gameState.board[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add('taken', player.toLowerCase());

    if (checkWin(player)) {
        endGame(player === 'X' ? 'player' : 'ai');
    } else if (checkDraw()) {
        endGame('draw');
    }
}

// AI Move with human-like behavior
function aiMove() {
    if (!gameState.gameActive) return;

    let moveIndex;
    const difficulty = gameState.difficulty;

    // Error prevention: ensure there are available moves
    const availableMoves = gameState.board.filter(cell => cell === null);
    if (availableMoves.length === 0) return;

    if (difficulty === 'easy') {
        // Easy: Random move with occasional mistakes
        moveIndex = getRandomMove();
    } else if (difficulty === 'medium') {
        // Medium: Mix of strategy and randomness (70% smart, 30% random)
        if (Math.random() < 0.7) {
            moveIndex = getBestMove(false); // Don't play perfectly
        } else {
            moveIndex = getRandomMove();
        }
    } else {
        // Hard: Minimax algorithm (nearly unbeatable)
        moveIndex = getBestMove(true);
    }

    // Fallback to random move if something goes wrong
    if (moveIndex === null || moveIndex === undefined || gameState.board[moveIndex] !== null) {
        moveIndex = getRandomMove();
    }

    makeMove(moveIndex, 'O');
    
    if (gameState.gameActive) {
        gameState.currentPlayer = 'X';
        statusDisplay.textContent = "Your turn!";
    }
}

// Get random available move
function getRandomMove() {
    const availableMoves = gameState.board
        .map((cell, index) => cell === null ? index : null)
        .filter(index => index !== null);
    
    if (availableMoves.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
}

// Get best move using minimax (for hard difficulty)
function getBestMove(perfect = false) {
    // First, check if AI can win
    for (let i = 0; i < gameState.board.length; i++) {
        if (gameState.board[i] === null) {
            gameState.board[i] = 'O';
            if (checkWin('O')) {
                gameState.board[i] = null;
                return i;
            }
            gameState.board[i] = null;
        }
    }

    // Then, check if player is about to win and block
    for (let i = 0; i < gameState.board.length; i++) {
        if (gameState.board[i] === null) {
            gameState.board[i] = 'X';
            if (checkWin('X')) {
                gameState.board[i] = null;
                return i;
            }
            gameState.board[i] = null;
        }
    }

    // If perfect play, use minimax
    if (perfect) {
        return minimax(gameState.board, 'O').index;
    }

    // Otherwise, prefer center, then corners, then sides
    const center = 4;
    const corners = [0, 2, 6, 8];
    const sides = [1, 3, 5, 7];

    if (gameState.board[center] === null) {
        return center;
    }

    const availableCorners = corners.filter(i => gameState.board[i] === null);
    if (availableCorners.length > 0) {
        return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    const availableSides = sides.filter(i => gameState.board[i] === null);
    if (availableSides.length > 0) {
        return availableSides[Math.floor(Math.random() * availableSides.length)];
    }

    return getRandomMove();
}

// Minimax algorithm
function minimax(board, player) {
    const availableMoves = board.map((cell, index) => cell === null ? index : null).filter(i => i !== null);

    if (checkWinWithBoard(board, 'X')) {
        return { score: -10 };
    }
    if (checkWinWithBoard(board, 'O')) {
        return { score: 10 };
    }
    if (availableMoves.length === 0) {
        return { score: 0 };
    }

    const moves = [];

    for (let i = 0; i < availableMoves.length; i++) {
        const move = {};
        move.index = availableMoves[i];
        board[availableMoves[i]] = player;

        if (player === 'O') {
            const result = minimax(board, 'X');
            move.score = result.score;
        } else {
            const result = minimax(board, 'O');
            move.score = result.score;
        }

        board[availableMoves[i]] = null;
        moves.push(move);
    }

    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = moves[i];
            }
        }
    }

    return bestMove;
}

// Check win
function checkWin(player) {
    return checkWinWithBoard(gameState.board, player);
}

function checkWinWithBoard(board, player) {
    return winningCombinations.some(combination => {
        return combination.every(index => board[index] === player);
    });
}

// Check draw
function checkDraw() {
    return gameState.board.every(cell => cell !== null);
}

// End game
function endGame(result) {
    gameState.gameActive = false;

    if (result === 'player') {
        statusDisplay.textContent = "🎉 You won!";
        gameState.scores.player++;
        highlightWinner('X');
    } else if (result === 'ai') {
        statusDisplay.textContent = "🤖 AI wins!";
        gameState.scores.ai++;
        highlightWinner('O');
    } else {
        statusDisplay.textContent = "🤝 It's a draw!";
        gameState.scores.draws++;
    }

    updateScoreboard();
}

// Highlight winning cells
function highlightWinner(player) {
    winningCombinations.forEach(combination => {
        if (combination.every(index => gameState.board[index] === player)) {
            combination.forEach(index => {
                cells[index].classList.add('winner');
            });
        }
    });
}

// Update scoreboard
function updateScoreboard() {
    playerScoreEl.textContent = gameState.scores.player;
    aiScoreEl.textContent = gameState.scores.ai;
    drawScoreEl.textContent = gameState.scores.draws;
}

// Reset game
function resetGame() {
    gameState.board = Array(9).fill(null);
    gameState.gameActive = true;
    gameState.currentPlayer = 'X';
    statusDisplay.textContent = "Your turn!";

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });
}

// Initialize the game on load
initGame();
