// ==UserScript==
// @name         AntyDuch
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Wykrywa zniknięcie NPC, czeka, a potem robi krok i wraca na miejsce. (Sztywna pozycja GUI)
// @author       Bocik
// @match        *://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- KONFIGURACJA ---
    const config = {
        targetMobID: 'npc297224', // ID potwora
        minTimeMinutes: 12,       // Min czas oczekiwania (minuty)
        maxTimeMinutes: 13,       // Max czas oczekiwania (minuty)

        // Konfiguracja ruchu
        stepDurationMin: 100,     // Ile ms trzymać klawisz (krótki krok)
        stepDurationMax: 300,
        pauseBetweenStepsMin: 1000, // Pauza między krokiem w przód a powrotem (ms)
        pauseBetweenStepsMax: 2000,

        checkInterval: 500        // Częstotliwość sprawdzania moba (ms)
    };

    // Zmienne stanu
    let timerInterval = null;
    let isEnabled = true;
    let mobWasSeen = false;

    // --- GUI (STYL Z BOCIKA E2) ---
    const gui = document.createElement('div');
    gui.innerHTML = `
        <div id="bocik-header" style="color: white; padding: 5px; font-weight: bold; border-bottom: 1px solid #555;">
            AntyDuch
            <span id="bocik-toggle" style="float: right; cursor: pointer; color: #5cb85c;">[ON]</span>
        </div>
        <div style="padding: 10px; color: #ddd; font-size: 11px;">
            Cel ID: <span style="color:orange">${config.targetMobID}</span><br>
            Status: <span id="bocik-status" style="color: yellow;">Szukanie celu...</span><br>
            Timer: <span id="bocik-timer" style="font-size: 14px; font-weight: bold;">--:--</span>
        </div>
    `;

    // Tutaj zastosowałem style z Twojego drugiego skryptu (Bocik e2)
    Object.assign(gui.style, {
        position: 'fixed',
        bottom: '10px',      // Przypięcie do dołu (jak w Bocik e2)
        right: '180px',       // Przypięcie do prawej (jak w Bocik e2)
        width: '220px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // Ciemne tło jak w Bocik e2
        border: '1px solid #555',
        borderRadius: '8px',
        zIndex: '99999',
        fontFamily: 'Verdana, Arial, sans-serif',
        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    });
    document.body.appendChild(gui);

    const statusEl = document.getElementById('bocik-status');
    const timerEl = document.getElementById('bocik-timer');
    const toggleEl = document.getElementById('bocik-toggle');

    // --- FUNKCJE POMOCNICZE ---
    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    // Funkcja pomocnicza do symulacji wciśnięcia
    function pressKey(keyChar, duration, callback) {
        const keyCodeMap = { 'w': 87, 'a': 65, 's': 83, 'd': 68 };
        const keyCode = keyCodeMap[keyChar];

        const eventDown = new KeyboardEvent('keydown', { key: keyChar, code: `Key${keyChar.toUpperCase()}`, keyCode: keyCode, which: keyCode, bubbles: true });
        document.dispatchEvent(eventDown);

        setTimeout(() => {
            const eventUp = new KeyboardEvent('keyup', { key: keyChar, code: `Key${keyChar.toUpperCase()}`, keyCode: keyCode, which: keyCode, bubbles: true });
            document.dispatchEvent(eventUp);
            if (callback) callback();
        }, duration);
    }

    // --- LOGIKA RUCHU (TAM I Z POWROTEM) ---
    function triggerReturnMovement() {
        if (!isEnabled) return;

        // 1. Losujemy pierwszy kierunek
        const keys = ['w', 'a', 's', 'd'];
        const startKey = keys[randomInt(0, keys.length - 1)];

        // 2. Ustalamy przeciwny kierunek
        const oppositeMap = { 'w': 's', 's': 'w', 'a': 'd', 'd': 'a' };
        const returnKey = oppositeMap[startKey];

        // Czasy
        const step1Time = randomInt(config.stepDurationMin, config.stepDurationMax);
        const pauseTime = randomInt(config.pauseBetweenStepsMin, config.pauseBetweenStepsMax);
        const step2Time = randomInt(config.stepDurationMin, config.stepDurationMax);

        statusEl.innerHTML = `Ruch: <b>${startKey.toUpperCase()}</b> ...czekaj...`;
        statusEl.style.color = '#00ff00';

        // KROK 1
        pressKey(startKey, step1Time, () => {
            // PAUZA
            setTimeout(() => {
                if (!isEnabled) return;
                statusEl.innerHTML = `Powrót: <b>${returnKey.toUpperCase()}</b>`;

                // KROK 2 (POWRÓT)
                pressKey(returnKey, step2Time, () => {
                    statusEl.innerText = "Cykl zakończony. Czuwanie...";
                    statusEl.style.color = "yellow";
                    mobWasSeen = false; // Reset, gotowy na nowe pojawienie się moba
                });
            }, pauseTime);
        });
    }

    // --- LOGIKA TIMERA ---
    function startTimer() {
        if (!isEnabled) return;
        if (timerInterval) clearInterval(timerInterval);

        const minSec = config.minTimeMinutes * 60;
        const maxSec = config.maxTimeMinutes * 60;
        let remainingSeconds = randomInt(minSec, maxSec);

        statusEl.innerText = "NPC zniknął! Odliczanie...";
        statusEl.style.color = "#00ccff";

        timerInterval = setInterval(() => {
            if (!isEnabled) { clearInterval(timerInterval); return; }

            timerEl.innerText = formatTime(remainingSeconds);

            if (remainingSeconds <= 0) {
                clearInterval(timerInterval);
                timerEl.innerText = "AKCJA!";
                triggerReturnMovement(); // Odpalamy nową funkcję ruchu
            }
            remainingSeconds--;
        }, 1000);
    }

    // --- PĘTLA SPRAWDZAJĄCA ---
    setInterval(() => {
        if (!isEnabled) return;

        const mobElement = document.getElementById(config.targetMobID);
        const isPresent = !!mobElement && mobElement.offsetParent !== null;

        if (isPresent) {
            // Mob jest na ekranie
            if (!mobWasSeen) {
                console.log(`Bocik: Wykryto cel ${config.targetMobID}`);
                statusEl.innerText = "Cel na mapie! Czekam na zbicie...";
                statusEl.style.color = "#ff3333";
                if (timerInterval) {
                    clearInterval(timerInterval);
                    timerEl.innerText = "--:--";
                }
            }
            mobWasSeen = true;
        } else {
            // Mob zniknął
            if (mobWasSeen) {
                console.log(`Bocik: Cel zniknął. Start timera.`);
                startTimer();
                mobWasSeen = false;
            }
        }
    }, config.checkInterval);

    // --- GUI TOGGLE (BEZ DRAG & DROP) ---
    toggleEl.addEventListener('click', () => {
        isEnabled = !isEnabled;
        toggleEl.innerText = isEnabled ? '[ON]' : '[OFF]';
        toggleEl.style.color = isEnabled ? '#5cb85c' : '#d9534f'; // Kolory z Bocika e2
        if (!isEnabled) {
            statusEl.innerText = "Zatrzymano.";
            if (timerInterval) clearInterval(timerInterval);
        } else {
            statusEl.innerText = "Wznawianie...";
            mobWasSeen = false;
        }
    });

})();