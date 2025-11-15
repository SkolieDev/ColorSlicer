// -- CONFIG
const TOTAL_ROUNDS = 5;


// state
let bar_pixels = 360;
let round = 1;
let score = 0;
let running = false;
let markerPos = 0;
let speed = 2.6;
let dir = 1;
let targetHue = 0;
let animId = null;
let infiniteMode = false;

// elements
const home = document.getElementById('home');
const mainMenu = document.getElementById('mainMenu');
const playBtn = document.getElementById('playBtn');
const infinityBtn = document.getElementById('infinityBtn');
const howBtn = document.getElementById('howBtn');
const gameArea = document.getElementById('gameArea');
const targetSwatch = document.getElementById('targetSwatch');
const currentSwatch = document.getElementById('currentSwatch');
const barCanvas = document.getElementById('barCanvas');
const ctx = barCanvas.getContext('2d');
const marker = document.getElementById('marker');
const stopBtn = document.getElementById('stopBtn');
const retryBtn = document.getElementById('retryBtn');
const roundNum = document.getElementById('roundNum');
const scoreEl = document.getElementById('score');
const lastPrecision = document.getElementById('lastPrecision');
const highscoreEl = document.getElementById('highscore');
const modal = document.getElementById('modal');
const finalScore = document.getElementById('finalScore');
const finalVerdict = document.getElementById('finalVerdict');
const playAgain = document.getElementById('playAgain');

// init
function init() {
    const visualWidth = document.querySelector('.bar').clientWidth;

    barCanvas.width = visualWidth;
    barCanvas.height = 36;

    bar_pixels = visualWidth;

    drawBar();
    loadHighscore();
    attachEvents();
    logoCS();
}

function logoCS() {
    stopAnimation();
    document.getElementById('targets').classList.add("hidden");
    document.getElementById('controls').classList.add("hidden");
    document.getElementById('meta').classList.add("hidden");
    running = true;
    animate();
}

function drawBar() {
    const w = bar_pixels;
    for (let x = 0; x < w; x++) {
        const hue = Math.round((x / (w - 1)) * 360);
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x, 0, 1, 36);
    }
}

function attachEvents() {
    home.addEventListener('click', homeScreen);
    playBtn.addEventListener('click', startGame);
    infinityBtn.addEventListener('click', startInfinite);
    howBtn.addEventListener('click', () => {
        document.getElementById("howModal").classList.add("open");
    });
    document.getElementById("closeHow").addEventListener("click", () => {
        document.getElementById("howModal").classList.remove("open");
    });

    stopBtn.addEventListener('click', onStop);
    retryBtn.addEventListener('click', resetRound);
    playAgain.addEventListener('click', () => {
        startGame()
    });

    stopBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        onStop();
    });

    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') onStop();
    });

    window.addEventListener('resize', () => {
        drawBar();
    });
}

function homeScreen() {
    retryBtn.classList.add("hidden");
    mainMenu.classList.remove("hidden");
    infiniteMode = false;
    logoCS();
}

function startInfinite() {
    infiniteMode = true;
    startGame();
}

function randomTarget() {
    targetHue = Math.floor(Math.random() * 360);
    targetSwatch.style.background = `hsl(${targetHue},100%,50%)`;
}

function startGame() {
    stopAnimation();
    running = false;
    document.getElementById('targets').classList.remove("hidden");
    document.getElementById('controls').classList.remove("hidden");
    document.getElementById('meta').classList.remove("hidden");
    gameArea.classList.remove("hidden");
    retryBtn.classList.add("hidden");
    mainMenu.classList.add("hidden");
    modal.classList.remove('open');

    round = 1;
    score = 0;
    scoreEl.textContent = score;
    roundNum.textContent = round;
    if (infiniteMode) roundNum.textContent = '∞';
    running = true;

    gameArea.setAttribute('aria-hidden', 'false');
    gameArea.style.display = 'block';
    randomTarget();
    markerPos = 0;
    dir = 1;
    speed = 2.6;
    animate();
}

function animate() {
    if (!running) return;

    const barWidth = bar_pixels;
    const markerWidth = 12;

    markerPos += speed * dir;

    if (markerPos < 0) {
        markerPos = 0;
        dir = 1;
    }
    if (markerPos > barWidth - markerWidth) {
        markerPos = barWidth - markerWidth;
        dir = -1;
    }

    marker.style.left = markerPos + "px";

    const centre = markerPos + markerWidth / 2;

    const hue = Math.round((centre / (barWidth - 1)) * 360);
    currentSwatch.style.background = `hsl(${hue},100%,50%)`;

    animId = requestAnimationFrame(animate);
}

function stopAnimation() {
    running = false;
    if (animId) cancelAnimationFrame(animId);
}

function hueDistance(h1, h2) {
    let d = Math.abs(h1 - h2);
    if (d > 180) d = 360 - d;
    return d;
}

function onStop() {
    if (!running) return;
    stopAnimation();

    const centre = Math.round((markerPos + 6));
    const hue = Math.round((centre / (bar_pixels - 1)) * 360);
    const dist = hueDistance(hue, targetHue);

    const precision = Math.max(0, Math.round((1 - (dist / 180)) * 100));
    lastPrecision.textContent = precision + '%';

    const gained = Math.round(precision / 10) + Math.max(0, 10 - Math.floor(dist / 10));
    score += gained;
    scoreEl.textContent = score;

    currentSwatch.animate([{
            transform: 'scale(1)'
        },
        {
            transform: 'scale(1.06)'
        },
        {
            transform: 'scale(1)'
        }
    ], {
        duration: 320,
        easing: 'ease-out'
    });

    // --- INFINITE MODE ---
    if (infiniteMode) {
        if (precision >= 98) speed += 1.2;
        else if (precision >= 90) speed += 0.7;
        else if (precision >= 65) speed += 0.3;
        else if (precision <= 20) speed -= 0.7;
        else if (precision <= 50) speed -= 0.3;

        speed = Math.max(0.8, Math.min(speed, 10));

        setTimeout(() => {
            randomTarget();
            markerPos = 0;
            dir = 1;
            running = true;
            animate();
        }, 700);
        return;
    } else if (round < TOTAL_ROUNDS) {
        round++;
        roundNum.textContent = round;
        setTimeout(() => {
            speed = Math.min(6, speed + 0.6);
            randomTarget();
            markerPos = 0;
            dir = 1;
            running = true;
            animate();
        }, 700);
    } else {
        setTimeout(() => showResult(), 600);
    }

    updateHighscore(score);
}

function resetRound() {
    if (running) return;
    markerPos = 0;
    dir = 1;
    running = true;
    animate();
}

function showResult() {
    finalScore.textContent = score;
    let v = t('good');
    if (score >= 120) v = t('legendary');
    else if (score >= 80) v = t('excellent');
    else if (score >= 40) v = t('decent');
    else v = t('needsPractice');
    finalVerdict.textContent = v;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
}

function updateHighscore(s) {
    const prev = Number(localStorage.getItem('cs_highscore') || 0);
    if (s > prev) {
        localStorage.setItem('cs_highscore', s);
        highscoreEl.textContent = s;
    }
}

function loadHighscore() {
    highscoreEl.textContent = localStorage.getItem('cs_highscore') || 0;
}

// === LANGUAGE ===
async function loadLanguage(lang) {
    const response = await fetch('./lang.json');
    translations = await response.json();
    currentLang = lang;
    localStorage.setItem('language', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = translations[lang][key] || key;
    });
}

document.getElementById('language-selector').addEventListener('change', e => {
    loadLanguage(e.target.value);
});

window.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('language') || 'es';
    document.getElementById('language-selector').value = savedLang;
    loadLanguage(savedLang);
});

function t(key) {
    return translations[currentLang]?.[key] || key;
}

// Start
init();