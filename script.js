// --- State ---
const state = {
  board: Array(9).fill(null),
  current: 'X',
  gameOver: false,
  scores: { X: 0, O: 0 },
  mode: 'pvp',          // "pvp" or "cpu"
  playerMark: 'X',      // only for vs CPU
  difficulty: 'easy'    // "easy" or "impossible"
};

// --- Elements ---
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const scoreXEl = document.getElementById('scoreX');
const scoreOEl = document.getElementById('scoreO');
const modeSelect = document.getElementById('mode');
const markSelect = document.getElementById('mark');
const difficultySelect = document.getElementById('difficulty');
const resetBtn = document.getElementById('reset');
const newMatchBtn = document.getElementById('newMatch');

// --- Init ---
render();

// --- Event Listeners ---
modeSelect.addEventListener('change', () => { state.mode = modeSelect.value; newMatch(); });
markSelect.addEventListener('change', () => { state.playerMark = markSelect.value; newMatch(); });
difficultySelect.addEventListener('change', () => { state.difficulty = difficultySelect.value; render(); });
resetBtn.addEventListener('click', () => { 
  state.board = Array(9).fill(null); 
  state.current = 'X'; 
  state.gameOver = false; 
  render(); 
});
newMatchBtn.addEventListener('click', newMatch);

// --- Functions ---
function newMatch() {
  state.board = Array(9).fill(null);
  state.current = 'X';
  state.gameOver = false;
  state.scores = { X: 0, O: 0 };
  render();
}

function render() {
  // Render board
  boardEl.innerHTML = '';
  state.board.forEach((val, i) => {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = val || '';
    cell.addEventListener('click', () => handleClick(i));
    boardEl.appendChild(cell);
  });

  // Update status
  if (state.gameOver) {
    statusEl.textContent = "Game Over!";
  } else {
    statusEl.textContent = `Turn: ${state.current} | Mode: ${state.mode.toUpperCase()} ${state.mode==='cpu' ? `| You are ${state.playerMark}` : ''}`;
  }

  // Update score
  scoreXEl.textContent = state.scores.X;
  scoreOEl.textContent = state.scores.O;
}

function handleClick(i) {
  if (state.board[i] || state.gameOver) return;
  if (state.mode === 'cpu' && state.current !== state.playerMark) return;

  state.board[i] = state.current;
  checkGameEnd();

  if (!state.gameOver) {
    state.current = state.current === 'X' ? 'O' : 'X';
    render();

    if (state.mode === 'cpu' && state.current !== state.playerMark && !state.gameOver) {
      setTimeout(cpuMove, 300);
    }
  } else {
    render();
  }
}

function cpuMove() {
  let move;
  if (state.difficulty === 'easy') {
    const empties = state.board.map((v,i)=>v?null:i).filter(v=>v!==null);
    move = empties[Math.floor(Math.random()*empties.length)];
  } else {
    move = bestMove(state.board, state.current).index;
  }

  state.board[move] = state.current;
  checkGameEnd();

  if (!state.gameOver) {
    state.current = state.current === 'X' ? 'O' : 'X';
  }
  render();
}

function checkGameEnd() {
  const res = getWinner(state.board);
  if (res?.winner) {
    state.gameOver = true;
    state.scores[res.winner]++;
    statusEl.textContent = `${res.winner} Wins!`;
  } else if (state.board.every(Boolean)) {
    state.gameOver = true;
    statusEl.textContent = "Draw!";
  }
}

// --- Winner Check ---
function getWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] };
    }
  }
  return null;
}

// --- Best Move (Minimax AI) ---
function bestMove(board, player) {
  const opponent = player === 'X' ? 'O' : 'X';
  const empties = board.map((v,i)=>v?null:i).filter(v=>v!==null);

  // 1. Winning move
  for (const i of empties) {
    const copy = board.slice(); copy[i] = player;
    if (getWinner(copy)?.winner === player) return { index: i };
  }

  // 2. Block opponent
  for (const i of empties) {
    const copy = board.slice(); copy[i] = opponent;
    if (getWinner(copy)?.winner === opponent) return { index: i };
  }

  // 3. Minimax for best play
  const pref = [4,0,2,6,8,1,3,5,7];
  function minimax(b, isMax, depth) {
    const res = getWinner(b);
    if (res?.winner === player) return 10 - depth;
    if (res?.winner && res.winner !== player) return depth - 10;
    if (b.every(Boolean)) return 0;

    const avail = b.map((v,i)=>v?null:i).filter(v=>v!==null);

    if (isMax) {
      let best = -Infinity;
      for (const i of avail) {
        b[i] = player;
        const val = minimax(b, false, depth+1);
        b[i] = null;
        if (val > best) best = val;
      }
      return best;
    } else {
      let best = Infinity;
      const opp = player === 'X' ? 'O' : 'X';
      for (const i of avail) {
        b[i] = opp;
        const val = minimax(b, true, depth+1);
        b[i] = null;
        if (val < best) best = val;
      }
      return best;
    }
  }

  let bestScore = -Infinity;
  let bestIndex = pref.find(i => board[i] === null);
  for (const i of pref) {
    if (board[i] !== null) continue;
    board[i] = player;
    const score = minimax(board, false, 0);
    board[i] = null;
    if (score > bestScore) { bestScore = score; bestIndex = i; }
  }
  return { index: bestIndex, score: bestScore };
}
