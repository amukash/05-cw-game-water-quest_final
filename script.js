/* Cleaned script.js with images for water-can and oil-tank */

const DIFFICULTY_SETTINGS = {
  Easy:   { time: 40, spawnMs: 1000, goalPoints: 15, oilPenalty: 3 },
  Normal: { time: 30, spawnMs: 900,  goalPoints: 20, oilPenalty: 5 },
  Hard:   { time: 20, spawnMs: 700,  goalPoints: 25, oilPenalty: 7 }
};

let currentCans = 0;
let score = 0;
let gameActive = false;
let spawnInterval = null;
let countdownInterval = null;
let timeLeft = 30;
let activeSpawnMs = 900;
let winThreshold = 20;
const pointsPerCan = 1;


function createGrid() {
  const grid = document.querySelector('.game-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    cell.setAttribute('role', 'button');
    cell.setAttribute('tabindex', '0');
    grid.appendChild(cell);
  }
}

function clearCells() {
  const cells = Array.from(document.querySelectorAll('.grid-cell'));
  cells.forEach(c => {
    const wrapper = c.querySelector('.water-can-wrapper');
    if (wrapper) {
      wrapper.classList.add('fade-out');
      setTimeout(() => { if (wrapper && wrapper.parentElement) wrapper.parentElement.removeChild(wrapper); }, 280);
    } else {
      c.innerHTML = '';
    }
  });
}

function spawnWaterCan() {
  if (!gameActive) return;
  const cells = Array.from(document.querySelectorAll('.grid-cell'));
  if (!cells.length) return;

  clearCells();

  const randomCell = cells[Math.floor(Math.random() * cells.length)];
  if (!randomCell) return;
  const spawnOil = Math.random() < 0.18;

  if (!spawnOil) {
    randomCell.innerHTML = `
      <div class="water-can-wrapper spawn">
        <button class="water-can" aria-label="Collect can">
          <img class="item-img" src="img/water-can-transparent.png" alt="Water can">
        </button>
      </div>
    `;
    const can = randomCell.querySelector('.water-can');
    const wrapper = randomCell.querySelector('.water-can-wrapper');
    // trigger spawn transition
    requestAnimationFrame(() => { if (wrapper) wrapper.classList.remove('spawn'); });
    if (!can) return;
    let collected = false;
    const collect = (ev) => {
      if (!gameActive || collected) return;
      collected = true;
      currentCans += 1;
      score += pointsPerCan;
      can.classList.add('collected');
      updateStats();
      showScorePopup(ev, '+' + pointsPerCan);
      setTimeout(() => { if (can && can.parentElement) can.parentElement.removeChild(can); }, 300);
      if (currentCans >= winThreshold) endGame(true);
    };
    can.addEventListener('click', collect);
    can.addEventListener('keydown', (ev) => {
      const key = ev.key || ev.code || '';
      if (key === 'Enter' || key === ' ' || key === 'Space' || key === 'Spacebar') { ev.preventDefault(); collect(ev); }
    });
    } else {
    randomCell.innerHTML = `
      <div class="water-can-wrapper spawn">
        <button class="oil-tank" aria-label="Oil tank - avoid">
          <img class="item-img" src="img/oil-tank.png" alt="Oil tank">
        </button>
      </div>
    `;
    const wrapper = randomCell.querySelector('.water-can-wrapper');
    requestAnimationFrame(() => { if (wrapper) wrapper.classList.remove('spawn'); });
    const oil = randomCell.querySelector('.oil-tank');
    if (!oil) return;
    let hit = false;
    const hitOil = (ev) => {
      if (!gameActive || hit) return;
      hit = true;
      const diffEl = document.getElementById('difficulty');
      const difficulty = (diffEl && diffEl.value) ? diffEl.value : 'Normal';
      const penalty = DIFFICULTY_SETTINGS[difficulty].oilPenalty;
      score = Math.max(0, score - penalty);
      oil.classList.add('hit');
      updateStats();
      showScorePopup(ev, '-' + penalty);
      setTimeout(() => { if (oil && oil.parentElement) oil.parentElement.removeChild(oil); }, 360);
    };
    oil.addEventListener('click', hitOil);
    oil.addEventListener('keydown', (ev) => {
      const key = ev.key || ev.code || '';
      if (key === 'Enter' || key === ' ' || key === 'Space' || key === 'Spacebar') { ev.preventDefault(); hitOil(ev); }
    });
  }
}

function updateStats() {
  const currentEl = document.getElementById('current-cans');
  if (currentEl) currentEl.textContent = currentCans;
  const goalEl = document.getElementById('goal-cans');
  if (goalEl) goalEl.textContent = winThreshold;
  const scoreEl = document.getElementById('score');
  if (scoreEl) scoreEl.textContent = score;
  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = timeLeft;
}

function showScorePopup(event, text) {
  const popup = document.createElement('div');
  popup.className = 'score-popup' + (text && text.indexOf && text.indexOf('-') === 0 ? ' negative' : '');
  popup.textContent = text;
  document.body.appendChild(popup);

  let x = Math.floor(window.innerWidth / 2);
  let y = Math.floor(window.innerHeight / 2);
  if (event && event.touches && event.touches[0]) {
    x = event.touches[0].clientX; y = event.touches[0].clientY;
  } else if (event && typeof event.clientX !== 'undefined') {
    x = event.clientX; y = event.clientY;
  }
  popup.style.left = (x - 20) + 'px';
  popup.style.top = (y - 30) + 'px';

  requestAnimationFrame(() => { popup.classList.add('visible'); });
  setTimeout(() => { popup.classList.remove('visible'); }, 700);
  setTimeout(() => { if (popup && popup.parentElement) popup.parentElement.removeChild(popup); }, 900);
}

const winMessages = [
  "Amazing! You helped bring water to a community!",
  "You did it — lives are changing because of your speed!",
  "Victory! You're a water hero!"
];
const loseMessages = [
  "Good try — keep practicing to reach more communities!",
  "Almost there — try again and beat your score!",
  "Nice effort — you can do it with one more run!"
];

function endGame(won) {
  if (typeof won === 'undefined') won = false;
  gameActive = false;
  if (spawnInterval) { clearInterval(spawnInterval); spawnInterval = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

  const wrappers = document.querySelectorAll('.water-can-wrapper');
  Array.prototype.forEach.call(wrappers, (n) => { if (n && n.parentElement) n.parentElement.removeChild(n); });

  const achievements = document.getElementById('achievements');
  if (achievements) {
    const msg = won ? winMessages[Math.floor(Math.random() * winMessages.length)] : loseMessages[Math.floor(Math.random() * loseMessages.length)];
    achievements.textContent = msg + ' You scored ' + score + ' points.';
  }

  if (won) fireConfetti();
}

function startGame() {
  if (gameActive) return;
  gameActive = true;
  createGrid();

  const diffEl = document.getElementById('difficulty');
  const difficulty = (diffEl && diffEl.value) ? diffEl.value : 'Normal';
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.Normal;
  activeSpawnMs = settings.spawnMs;
  timeLeft = settings.time;
  winThreshold = settings.goalPoints;

  currentCans = 0;
  score = 0;
  updateStats();

  if (spawnInterval) { clearInterval(spawnInterval); spawnInterval = null; }
  spawnInterval = setInterval(spawnWaterCan, activeSpawnMs);
  spawnWaterCan();

  const timerEl = document.getElementById('timer');
  if (timerEl) timerEl.textContent = timeLeft;
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
  countdownInterval = setInterval(() => {
    timeLeft -= 1;
    if (timerEl) timerEl.textContent = timeLeft;
    if (timeLeft <= 0) endGame(false);
  }, 1000);
}

function resetGame() {
  gameActive = false;
  if (spawnInterval) { clearInterval(spawnInterval); spawnInterval = null; }
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

  currentCans = 0;
  score = 0;
  const diffEl = document.getElementById('difficulty');
  const difficulty = (diffEl && diffEl.value) ? diffEl.value : 'Normal';
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.Normal;
  timeLeft = settings.time;
  winThreshold = settings.goalPoints;
  updateStats();

  const ach = document.getElementById('achievements');
  if (ach) ach.textContent = '';
  clearCells();
}

function fireConfetti() {
  const colors = ['#2E9DF7', '#FF9F1C', '#7ED957', '#FFD6E0', '#6C5CE7'];
  const count = 28;
  for (let i = 0; i < count; i++) {
    (function () {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = (window.innerWidth / 2 + (Math.random() * 200 - 100)) + 'px';
      el.style.top = (window.innerHeight / 3 + (Math.random() * 40 - 20)) + 'px';
      el.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
      document.body.appendChild(el);

      const dx = (Math.random() - 0.5) * 600;
      const dy = 400 + Math.random() * 200;
      const rot = (Math.random() - 0.5) * 720;

      el.animate([
        { transform: 'translate(0px,0px) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx + 'px, ' + dy + 'px) rotate(' + rot + 'deg)', opacity: 0.2 }
      ], { duration: 1500 + Math.random() * 800, easing: 'cubic-bezier(.17,.67,.3,1)' });

      setTimeout(() => { if (el && el.parentElement) el.parentElement.removeChild(el); }, 2200);
    })();
  }
}

function initUI() {
  createGrid();
  const startBtn = document.getElementById('start-game');
  const resetBtn = document.getElementById('reset-game');
  if (startBtn) startBtn.addEventListener('click', startGame);
  if (resetBtn) resetBtn.addEventListener('click', resetGame);

  const diffEl = document.getElementById('difficulty');
  const difficulty = (diffEl && diffEl.value) ? diffEl.value : 'Normal';
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.Normal;
  timeLeft = settings.time;
  winThreshold = settings.goalPoints;

  const goalEl = document.getElementById('goal-cans');
  const timerEl = document.getElementById('timer');
  if (goalEl) goalEl.textContent = winThreshold;
  if (timerEl) timerEl.textContent = timeLeft;

  document.addEventListener('keydown', (e) => {
    const activeId = (document.activeElement && document.activeElement.id) ? document.activeElement.id : '';
    if ((e.key === 'Enter' || e.key === ' ') && !gameActive && activeId === 'start-game') {
      startGame();
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initUI);
} else {
  initUI();
}