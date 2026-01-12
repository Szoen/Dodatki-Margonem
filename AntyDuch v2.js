// ==UserScript==
// @name         AntyDuch v3.4 [Anti-AFK + Hub]
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Wykrywa zniknięcie NPC lub działa jako Anti-AFK (gdy brak nazwy). Hub Integration + Memory.
// @author       Bocik & Szpinak
// @match        http*://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    const ADDON_ID = 'antyduch';
    const STORAGE_KEY = 'bocik_antyduch_settings';
    const STORAGE_VISIBLE_KEY = 'bocik_antyduch_gui_visible';
    const STORAGE_POS_KEY = 'bocik_antyduch_gui_pos';
    const STORAGE_RUNNING_KEY = 'bocik_antyduch_running';

    // --- USTAWIENIA DOMYŚLNE ---
    let settings = {
        mobName: localStorage.getItem(STORAGE_KEY + '_mob') || "", // Domyślnie puste = Anti-AFK
        minTime: parseInt(localStorage.getItem(STORAGE_KEY + '_min')) || 12,
        maxTime: parseInt(localStorage.getItem(STORAGE_KEY + '_max')) || 15,
        stepDurationMin: 100,
        stepDurationMax: 300,
        pauseMin: 1000,
        pauseMax: 2000
    };

    function saveSettings() {
        localStorage.setItem(STORAGE_KEY + '_mob', settings.mobName);
        localStorage.setItem(STORAGE_KEY + '_min', settings.minTime);
        localStorage.setItem(STORAGE_KEY + '_max', settings.maxTime);
    }

    // --- ZMIENNE STANU ---
    let timerInterval = null;
    let isEnabled = localStorage.getItem(STORAGE_RUNNING_KEY) === 'true';
    let mobWasSeen = false;
    let isMoving = false; // Blokada, żeby timer nie startował podczas ruchu

    // --- STYLIZACJA CSS ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed; top: 200px; left: 50px; width: 220px;
            background-color: #1a1a1a; border: 2px solid #b026ff; border-radius: 12px;
            box-shadow: 0 0 15px rgba(176, 38, 255, 0.2); font-family: 'Verdana', sans-serif;
            z-index: 99999; color: #fff; overflow: hidden; display: none;
            flex-direction: column; user-select: none; transition: border-color 0.3s;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px 12px; font-size: 11px; font-weight: bold; color: #dcb3ff;
            border-bottom: 1px solid #b026ff; cursor: move; display: flex; justify-content: space-between; align-items: center;
        }
        .bocik-content { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .status-box { background: #222; border: 1px solid #333; border-radius: 6px; padding: 8px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
        .status-text { font-size: 10px; color: #ccc; }
        .timer-text { font-size: 18px; font-weight: bold; color: #fff; letter-spacing: 1px; text-shadow: 0 0 5px rgba(255,255,255,0.2); }
        .input-group { display: flex; flex-direction: column; gap: 4px; }
        .input-label { font-size: 9px; color: #aaa; margin-left: 2px; }
        .bocik-input { width: 100%; box-sizing: border-box; background: #111; border: 1px solid #b026ff; color: #fff; padding: 6px; border-radius: 4px; font-size: 10px; outline: none; }
        .row { display: flex; gap: 8px; }
        .bocik-btn { width: 100%; padding: 8px; border: none; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px; color: white; }
        .btn-off { background: #3a1c1c; color: #ff6b6b; border: 1px solid #d9534f; }
        .btn-on { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; box-shadow: 0 0 8px rgba(92, 184, 92, 0.4); }
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    // --- GUI ---
    const panel = document.createElement('div');
    panel.className = 'bocik-panel';
    panel.id = 'bocik-panel-antyduch';
    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleAnty">
            <span>👻 Lecimy lecimy nie śpimy</span>
            <span id="pinIconAnty">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="status-box">
                <div class="status-text" id="statusLabelAnty">Zatrzymany</div>
                <div class="timer-text" id="timerLabelAnty">--:--</div>
            </div>
            <div class="input-group">
                <label class="input-label">Nazwa (Puste = Anti-AFK):</label>
                <input type="text" id="inpMobName" class="bocik-input" value="${settings.mobName}" placeholder="np. Łowca Czaszek">
            </div>
            <div class="row">
                <div class="input-group" style="flex:1">
                    <label class="input-label">Min (min):</label>
                    <input type="number" id="inpMin" class="bocik-input" value="${settings.minTime}">
                </div>
                <div class="input-group" style="flex:1">
                    <label class="input-label">Max (min):</label>
                    <input type="number" id="inpMax" class="bocik-input" value="${settings.maxTime}">
                </div>
            </div>
            <button id="toggleBtnAnty" class="bocik-btn btn-off">START</button>
        </div>
    `;
    document.body.appendChild(panel);

    const dragHandle = document.getElementById('dragHandleAnty');
    const pinIcon = document.getElementById('pinIconAnty');
    const statusLabel = document.getElementById('statusLabelAnty');
    const timerLabel = document.getElementById('timerLabelAnty');
    const inpMobName = document.getElementById('inpMobName');
    const inpMin = document.getElementById('inpMin');
    const inpMax = document.getElementById('inpMax');
    const toggleBtn = document.getElementById('toggleBtnAnty');

    // --- SYNCHRONIZACJA GUI ---
    if (isEnabled) {
        toggleBtn.innerText = "STOP";
        toggleBtn.className = "bocik-btn btn-on";
        statusLabel.innerText = "Wznawianie...";
    }

    // --- DRAGGABLE ---
    (function makeDraggable(element, handle) {
        let isPinned = false, offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
        const savedPos = localStorage.getItem(STORAGE_POS_KEY);
        if (savedPos) { try { const pos = JSON.parse(savedPos); element.style.top = pos.top; element.style.left = pos.left; } catch(e) {} }

        handle.onmousedown = dragMouseDown;
        handle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) { element.classList.add('panel-locked'); handle.style.cursor = "default"; handle.style.background = "#222"; pinIcon.innerText = "🔒"; }
            else { element.classList.remove('panel-locked'); handle.style.cursor = "move"; handle.style.background = "linear-gradient(90deg, #2a0e36 0%, #4a126b 100%)"; pinIcon.innerText = "🔓"; }
        };
        function dragMouseDown(e) {
            if (isPinned || ['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
            e.preventDefault(); mouseX = e.clientX; mouseY = e.clientY;
            document.addEventListener('mouseup', closeDragElement); document.addEventListener('mousemove', elementDrag);
        }
        function elementDrag(e) {
            e.preventDefault(); offsetX = mouseX - e.clientX; offsetY = mouseY - e.clientY; mouseX = e.clientX; mouseY = e.clientY;
            element.style.top = (element.offsetTop - offsetY) + "px"; element.style.left = (element.offsetLeft - offsetX) + "px";
        }
        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement); document.removeEventListener('mousemove', elementDrag);
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ top: element.style.top, left: element.style.left }));
        }
    })(panel, dragHandle);

    // --- LOGIKA ---

    inpMobName.oninput = () => { settings.mobName = inpMobName.value; saveSettings(); };
    inpMin.onchange = () => { settings.minTime = parseInt(inpMin.value); saveSettings(); };
    inpMax.onchange = () => { settings.maxTime = parseInt(inpMax.value); saveSettings(); };

    toggleBtn.onclick = () => {
        isEnabled = !isEnabled;
        localStorage.setItem(STORAGE_RUNNING_KEY, isEnabled);
        if (isEnabled) {
            toggleBtn.innerText = "STOP"; toggleBtn.className = "bocik-btn btn-on";
            statusLabel.innerText = "Start..."; statusLabel.style.color = "#ccc";
            mobWasSeen = false; isMoving = false;
        } else {
            toggleBtn.innerText = "START"; toggleBtn.className = "bocik-btn btn-off";
            statusLabel.innerText = "Zatrzymany"; statusLabel.style.color = "#888";
            timerLabel.innerText = "--:--"; timerLabel.style.color = "#fff";
            if (timerInterval) clearInterval(timerInterval); timerInterval = null;
        }
    };

    function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    function formatTime(seconds) { const m = Math.floor(seconds / 60); const s = seconds % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }

    function pressKey(keyChar, duration, callback) {
        const keyCodeMap = { 'w': 87, 'a': 65, 's': 83, 'd': 68 };
        const keyCode = keyCodeMap[keyChar];
        document.dispatchEvent(new KeyboardEvent('keydown', { key: keyChar, code: `Key${keyChar.toUpperCase()}`, keyCode: keyCode, which: keyCode, bubbles: true }));
        setTimeout(() => {
            document.dispatchEvent(new KeyboardEvent('keyup', { key: keyChar, code: `Key${keyChar.toUpperCase()}`, keyCode: keyCode, which: keyCode, bubbles: true }));
            if (callback) callback();
        }, duration);
    }

    function triggerReturnMovement() {
        if (!isEnabled) return;
        isMoving = true;
        const keys = ['w', 'a', 's', 'd'];
        const startKey = keys[randomInt(0, keys.length - 1)];
        const oppositeMap = { 'w': 's', 's': 'w', 'a': 'd', 'd': 'a' };
        const returnKey = oppositeMap[startKey];

        statusLabel.innerHTML = `Ruch: <b style="color:#0f0">${startKey.toUpperCase()}</b>`;

        pressKey(startKey, randomInt(settings.stepDurationMin, settings.stepDurationMax), () => {
            setTimeout(() => {
                if (!isEnabled) { isMoving = false; return; }
                statusLabel.innerHTML = `Powrót: <b style="color:#0f0">${returnKey.toUpperCase()}</b>`;
                pressKey(returnKey, randomInt(settings.stepDurationMin, settings.stepDurationMax), () => {
                    isMoving = false;
                    // PO RUCHU:
                    // Jeśli Anti-AFK (puste pole) -> Wznów timer od razu
                    if (settings.mobName.trim() === "") {
                        startTimer();
                    } else {
                        // Jeśli tryb Polowania -> Czekaj na moba
                        statusLabel.innerText = "Czuwanie..."; statusLabel.style.color = "yellow";
                        mobWasSeen = false;
                        timerLabel.innerText = "--:--"; timerLabel.style.color = "#fff";
                    }
                });
            }, randomInt(settings.pauseMin, settings.pauseMax));
        });
    }

    function startTimer() {
        if (!isEnabled || isMoving) return;
        if (timerInterval) clearInterval(timerInterval);

        const minSec = settings.minTime * 60;
        const maxSec = settings.maxTime * 60;
        let remainingSeconds = randomInt(minSec, maxSec);

        const modeText = (settings.mobName.trim() === "") ? "Anti-AFK" : "Respawn";
        statusLabel.innerText = `Odliczam (${modeText})`;
        statusLabel.style.color = "#00ccff";
        timerLabel.style.color = "#00ccff";

        timerInterval = setInterval(() => {
            if (!isEnabled) { clearInterval(timerInterval); timerInterval = null; return; }
            timerLabel.innerText = formatTime(remainingSeconds);
            if (remainingSeconds <= 0) {
                clearInterval(timerInterval); timerInterval = null;
                timerLabel.innerText = "RUCH!";
                timerLabel.style.color = "#ff4444";
                triggerReturnMovement();
            }
            remainingSeconds--;
        }, 1000);
    }

    function mainLoop() {
        if (!isEnabled) return;

        // 1. Tryb Anti-AFK (Puste pole)
        if (settings.mobName.trim() === "") {
            // Jeśli timer nie chodzi i bot się nie rusza -> startuj timer
            if (!timerInterval && !isMoving) {
                startTimer();
            }
            return;
        }

        // 2. Tryb Polowania (Jest nazwa moba)
        if (typeof g === 'undefined' || !g.npc) return;

        let isPresent = false;
        for (let id in g.npc) {
            if (g.npc[id].nick === settings.mobName.trim()) { isPresent = true; break; }
        }

        if (isPresent) {
            if (!mobWasSeen) {
                console.log(`[AntyDuch] Widzę cel: ${settings.mobName}`);
                statusLabel.innerText = "Cel widoczny"; statusLabel.style.color = "#ff4444";
                timerLabel.innerText = "CZEKAM"; timerLabel.style.color = "#ff4444";
                if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
            }
            mobWasSeen = true;
        } else {
            // Jeśli mob zniknął, a wcześniej był -> Start Timer
            if (mobWasSeen) {
                startTimer();
                mobWasSeen = false;
            }
        }
    }

    setInterval(mainLoop, 500);

    // --- INTEGRACJA ---
    window.addEventListener('load', function() {
        const savedState = localStorage.getItem(STORAGE_VISIBLE_KEY);
        const shouldBeVisible = savedState === null ? true : (savedState === 'true');
        panel.style.display = shouldBeVisible ? 'flex' : 'none';

        window.addEventListener('bocik:toggle-gui', function(e) {
            if (e.detail.id === ADDON_ID) {
                const isHidden = (panel.style.display === 'none' || panel.style.display === '');
                panel.style.display = isHidden ? 'flex' : 'none';
                localStorage.setItem(STORAGE_VISIBLE_KEY, isHidden ? 'true' : 'false');
            }
        });
    });
})();