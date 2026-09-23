// --- USTAWIENIA I BAZA DATA SKINÓW ---
const SKINS = [
    { name: "USP-S | Torque", rarity: "Mil-Spec", chance: 70.0, price: 15, color: "#4b69ff" },
    { name: "Desert Eagle | Naga", rarity: "Restricted", chance: 20.0, price: 55, color: "#8847ff" },
    { name: "AK-47 | Frontside Misty", rarity: "Classified", chance: 7.0, price: 240, color: "#d32ce6" },
    { name: "AWP | Asiimov", rarity: "Covert", chance: 2.5, price: 1100, color: "#eb4b4b" },
    { name: "Karambit | Fade", rarity: "Special", chance: 0.5, price: 7500, color: "#ffd700" }
];

// Liczby na ruletce (0 = Zielone, 1-7 Czerwone, 8-14 Czarne)
const ROULETTE_NUMBERS = [
    { n: 0, c: "GREEN" }, { n: 11, c: "BLACK" }, { n: 5, c: "RED" }, { n: 10, c: "BLACK" },
    { n: 6, c: "RED" }, { n: 9, c: "BLACK" }, { n: 7, c: "RED" }, { n: 8, c: "BLACK" },
    { n: 1, c: "RED" }, { n: 14, c: "BLACK" }, { n: 2, c: "RED" }, { n: 13, c: "BLACK" },
    { n: 3, c: "RED" }, { n: 12, c: "BLACK" }, { n: 4, c: "RED" }
];

let balance = 1000;
let isSpinningCase = false;
let isSpinningRoulette = false;

// Syntetyczny generator dźwięku "Tick" (nie potrzebujesz plików .mp3!)
function playTickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); 
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {
        console.log("Audio not allowed yet");
    }
}

// --- ZARZĄDZANIE WIDOKAMI ---
function switchTab(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// --- GENEROWANIE STARTOWYCH KARUZELI ---
function generateInitialCarousels() {
    const caseCarousel = document.getElementById('case-carousel');
    if (caseCarousel) {
        caseCarousel.innerHTML = '';
        for(let i=0; i<30; i++) {
            let skin = SKINS[Math.floor(Math.random() * SKINS.length)];
            caseCarousel.appendChild(createSkinCard(skin));
        }
    }

    const rCarousel = document.getElementById('roulette-carousel');
    if (rCarousel) {
        rCarousel.innerHTML = '';
        for(let i=0; i<40; i++) {
            let numObj = ROULETTE_NUMBERS[i % ROULETTE_NUMBERS.length];
            rCarousel.appendChild(createRouletteCard(numObj));
        }
    }
}

function createSkinCard(skin) {
    const el = document.createElement('div');
    el.className = 'skin-card';
    el.style.borderBottomColor = skin.color;
    el.innerHTML = `<span style="color:${skin.color}">${skin.rarity}</span><br><br>${skin.name.split(' | ').join('<br>')}`;
    return el;
}

function createRouletteCard(numObj) {
    const el = document.createElement('div');
    el.className = `r-card r-${numObj.c}`;
    el.innerText = numObj.n;
    return el;
}

// --- LOSOWANIE SKINÓW (SZANSE CS:GO) ---
function drawSkin() {
    let rand = Math.random() * 100;
    let cumulative = 0;
    for (let skin of SKINS) {
        cumulative += skin.chance;
        if (rand <= cumulative) return skin;
    }
    return SKINS[0];
}

// --- ANIMACJA: OTWIERANIE SKRZYNKI ---
function spinCase() {
    if (isSpinningCase || balance < 100) return;
    isSpinningCase = true;
    balance -= 100;
    document.getElementById('balance').innerText = balance;
    document.getElementById('open-btn').disabled = true;

    const carousel = document.getElementById('case-carousel');
    carousel.style.transition = 'none';
    carousel.style.transform = 'translateX(0px)';

    carousel.innerHTML = '';
    let winningSkin = drawSkin();
    let cardsCount = 60;
    let winningIndex = 45; 

    for(let i = 0; i < cardsCount; i++) {
        let skin = (i === winningIndex) ? winningSkin : SKINS[Math.floor(Math.random() * SKINS.length)];
        carousel.appendChild(createSkinCard(skin));
    }

    setTimeout(() => {
        let cardFullWidth = 118;
        let wrapperWidth = 700;
        let randomOffsetInCard = Math.floor(Math.random() * 80) + 15; 
        let targetX = -(winningIndex * cardFullWidth - (wrapperWidth / 2) + randomOffsetInCard);

        carousel.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)';
        carousel.style.transform = `translateX(${targetX}px)`;

        let currentTick = 0;
        let interval = setInterval(() => {
            currentTick++;
            if(currentTick < 40) playTickSound();
            else clearInterval(interval);
        }, 90);

        setTimeout(() => {
            isSpinningCase = false;
            document.getElementById('open-btn').disabled = false;
            balance += winningSkin.price; 
            document.getElementById('balance').innerText = balance;
            document.getElementById('case-log').innerHTML = `Wylosowano: <span style="color:${winningSkin.color}">${winningSkin.name}</span> (+${winningSkin.price} monet!)`;
        }, 4100);
    }, 50);
}

// --- ANIMACJA: RULETKA ---
function spinRoulette(playerBetColor) {
    let betAmount = parseInt(document.getElementById('bet-amount').value);
    if (isSpinningRoulette || isNaN(betAmount) || betAmount <= 0 || balance < betAmount) {
        alert("Nieprawidłowa kwota stawki lub brak środków!");
        return;
    }

    isSpinningRoulette = true;
    balance -= betAmount;
    document.getElementById('balance').innerText = balance;

    const carousel = document.getElementById('roulette-carousel');
    carousel.style.transition = 'none';
    carousel.style.transform = 'translateX(0px)';

    let winningIndex = 50; 
    let winningItem = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];

    carousel.innerHTML = '';
    for(let i = 0; i < 70; i++) {
        let numObj = (i === winningIndex) ? winningItem : ROULETTE_NUMBERS[i % ROULETTE_NUMBERS.length];
        carousel.appendChild(createRouletteCard(numObj));
    }

    setTimeout(() => {
        let cardFullWidth = 64; 
        let wrapperWidth = 700;
        let randomOffsetInCard = Math.floor(Math.random() * 40) + 10;
        let targetX = -(winningIndex * cardFullWidth - (wrapperWidth / 2) + randomOffsetInCard);

        carousel.style.transition = 'transform 4.5s cubic-bezier(0.1, 0.7, 0.1, 1)';
        carousel.style.transform = `translateX(${targetX}px)`;

        let currentTick = 0;
        let interval = setInterval(() => {
            currentTick++;
            if(currentTick < 45) playTickSound();
            else clearInterval(interval);
        }, 90);

        setTimeout(() => {
            isSpinningRoulette = false;
            let winMultiplier = 0;
            if (winningItem.c === playerBetColor) {
                winMultiplier = (winningItem.c === "GREEN") ? 14 : 2;
            }

            let wonAmount = betAmount * winMultiplier;
            balance += wonAmount;
            document.getElementById('balance').innerText = balance;

            if (wonAmount > 0) {
                document.getElementById('roulette-log').innerHTML = `Wypadło: ${winningItem.n} (${winningItem.c}). <span style="color:#44b544">Wygrałeś +${wonAmount} monet!</span>`;
            } else {
                document.getElementById('roulette-log').innerHTML = `Wypadło: ${winningItem.n} (${winningItem.c}). <span style="color:#ff4747">Przegrałeś. Spróbuj ponownie!</span>`;
            }
        }, 4600);
    }, 50);
}

// Inicjalizacja przy starcie strony
document.addEventListener("DOMContentLoaded", generateInitialCarousels);
