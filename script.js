// Game configuration and state variables
const GOAL_CANS = 25;        // Total items needed to collect
let currentCans = 0;         // Current number of items collected
let score = 0;               // Player score (can differ from cans if you want weighted points)
let gameActive = false;      // Tracks if game is currently running
let spawnInterval;           // Holds the interval for spawning items
let countdownInterval;       // Holds the timer interval
const GAME_SECONDS = 30;     // Total time per game
let timeLeft = GAME_SECONDS;

// Creates the 3x3 game grid where items will appear
function createGrid() {
  const grid = document.querySelector('.game-grid');
  grid.innerHTML = ''; // Clear any existing grid cells
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell'; // Each cell represents a grid square
    grid.appendChild(cell);
  }
}

// Ensure the grid is created when the page loads
createGrid();

// Spawns a new item in a random grid cell
function spawnWaterCan() {
  if (!gameActive) return; // Stop if the game is not active
  const cells = document.querySelectorAll('.grid-cell');
  
  // Clear all cells before spawning a new water can
  cells.forEach(cell => (cell.innerHTML = ''));

  // Select a random cell from the grid to place the water can
  const randomCell = cells[Math.floor(Math.random() * cells.length)];

  // Decide whether to spawn a positive water can or a negative oil tank
  const spawnOil = Math.random() < 0.18; // ~18% chance of oil tank
  if (!spawnOil) {
    // Spawn water can
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <button class="water-can" aria-label="Collect can"></button>
      </div>
    `;

    const can = randomCell.querySelector('.water-can');
    let collected = false; // per-can guard to avoid double-collect
    const collect = (e) => {
      if (!gameActive || collected) return;
      collected = true;
      // Increase counters
      currentCans += 1;
      score += 10; // each can gives 10 points
      // Visual feedback: pulse and tint
      can.classList.add('collected');
      updateStats();
      // Small score pop animation
      showScorePopup(e, "+10");
      // Remove can after a short delay to show feedback
      setTimeout(() => {
        if (can && can.parentElement) can.parentElement.removeChild(can);
      }, 300);

      // Check win
      if (currentCans >= GOAL_CANS) {
        endGame(true);
      }
    };

    can.addEventListener('click', collect);
    // support keyboard accessibility
    can.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') collect(ev);
    });
  } else {
    // Spawn oil tank obstacle
    randomCell.innerHTML = `
      <div class="water-can-wrapper">
        <button class="oil-tank" aria-label="Oil tank - avoid"></button>
      </div>
    `;
    const oil = randomCell.querySelector('.oil-tank');
    let hit = false;
    const hitOil = (e) => {
      if (!gameActive || hit) return;
      hit = true;
      // Penalize score
      score = Math.max(0, score - 15);
      // Visual feedback
      oil.classList.add('hit');
      updateStats();
      // Negative popup
      showScorePopup(e, "-15");
      // Remove oil tank shortly after
      setTimeout(() => { if (oil && oil.parentElement) oil.parentElement.removeChild(oil); }, 400);
    };
    oil.addEventListener('click', hitOil);
    oil.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') hitOil(ev);
    });
  }
}

// Initializes and starts a new game
function startGame() {
  if (gameActive) return; // Prevent starting a new game if one is already active
  gameActive = true;
  createGrid(); // Set up the game grid
  // Reset counters and UI
  currentCans = 0;
  score = 0;
  timeLeft = GAME_SECONDS;
  updateStats();

  spawnInterval = setInterval(spawnWaterCan, 900); // Spawn water cans ~every 0.9s

  // Timer
  countdownInterval = setInterval(() => {
    timeLeft -= 1;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame(false);
  }, 1000);
}

function endGame() {
  // Allow optional parameter to indicate win (true) or timeout (false)
  const won = arguments[0] === true;
  gameActive = false; // Mark the game as inactive
  clearInterval(spawnInterval); // Stop spawning water cans
  clearInterval(countdownInterval);
  // Clear remaining cans
  document.querySelectorAll('.water-can').forEach(c => c.remove());
  // Show result
  const achievements = document.getElementById('achievements');
  achievements.textContent = won ? `You collected ${currentCans} cans — You win!` : `Time's up — You collected ${currentCans} cans.`;
  if (won) {
    fireConfetti();
  }
}

// Set up click handler for the start button
document.getElementById('start-game').addEventListener('click', startGame);

// Reset game: stop timers, clear cans and messages, reset counters and UI
function resetGame() {
  // Stop game if active
  gameActive = false;
  clearInterval(spawnInterval);
  clearInterval(countdownInterval);
  // Reset counters
  currentCans = 0;
  score = 0;
  timeLeft = GAME_SECONDS;
  updateStats();
  // Clear UI
  document.getElementById('timer').textContent = timeLeft;
  document.getElementById('achievements').textContent = '';
  // Remove any remaining can elements
  document.querySelectorAll('.water-can').forEach(c => c.remove());
}

// Wire reset button
const resetBtn = document.getElementById('reset-game');
if (resetBtn) resetBtn.addEventListener('click', resetGame);

// Update the UI stats display
function updateStats() {
  document.getElementById('current-cans').textContent = currentCans;
  document.getElementById('goal-cans').textContent = GOAL_CANS;
  document.getElementById('score').textContent = score;
}

// Show a small floating score popup near the click/tap location
function showScorePopup(event, text) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = text;
  document.body.appendChild(popup);

  // Position the popup
  let x = 0, y = 0;
  if (event.touches && event.touches[0]) {
    x = event.touches[0].clientX;
    y = event.touches[0].clientY;
  } else if (event.clientX !== undefined) {
    x = event.clientX;
    y = event.clientY;
  }
  popup.style.left = (x - 20) + 'px';
  popup.style.top = (y - 30) + 'px';

  // animate and remove
  requestAnimationFrame(() => popup.classList.add('visible'));
  setTimeout(() => popup.classList.remove('visible'), 700);
  setTimeout(() => popup.remove(), 900);
}

// Initialize goal display and timer on load
document.getElementById('goal-cans').textContent = GOAL_CANS;
document.getElementById('timer').textContent = timeLeft;

// Confetti effect: small burst of colorful pieces
function fireConfetti() {
  const count = 40;
  const colors = ['#2E9DF7', '#8BD1CB', '#FFC907', '#FF902A', '#4FCB53'];
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    // randomize size and position
    const size = Math.floor(Math.random() * 8) + 6; // 6-14px
    piece.style.width = size + 'px';
    piece.style.height = (size * 0.6) + 'px';
    piece.style.left = (50 + (Math.random() - 0.5) * 60) + '%';
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    // delay and animation speed
    piece.style.animationDelay = (Math.random() * 0.3) + 's';
    piece.style.animationDuration = (1 + Math.random() * 1.2) + 's';
    container.appendChild(piece);
  }

  // cleanup after animation
  setTimeout(() => { container.remove(); }, 2200);
}
