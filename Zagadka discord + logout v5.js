// ==UserScript==
// @name         Zagadka discord v5.7 [Fetch + Pos Memory]
// @namespace    http://tampermonkey.net/
// @version      5.7
// @description  Fetch, Fix Drag, Memory Position
// @author       Bocik & Szpinak
// @match        http://*.margonem.pl/
// @match        https://*.margonem.pl/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- KLUCZE ZAPISU ---
    const ADDON_ID = 'puzzle_bot';
    const STORAGE_VISIBLE_KEY = 'bocik_puzzle_gui_visible';
    const STORAGE_POS_KEY = 'bocik_puzzle_gui_pos'; // Nowy klucz pozycji

    // --- KONFIG ---
    const CONFIG = {
        targetText: "Rozwiąż teraz",
        possibleSelectors: ['span', 'div', 'button', '.hud-button'],
        storageKey: "bocik_discord_webhook_url",
        scanInterval: 1000,
        playAudio: false,
        logoutMinTime: 150, logoutMaxTime: 170
    };

    let lastNotificationTime = 0, countdownInterval = null, isPuzzleActive = false;
    let savedWebhookUrl = localStorage.getItem(CONFIG.storageKey) || "";

    // --- CSS ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            /* Startowa pozycja */
            top: 250px; left: 450px;
            width: 200px;
            background-color: #1a1a1a;
            border: 2px solid #b026ff;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(176, 38, 255, 0.2);
            font-family: 'Verdana', sans-serif;
            z-index: 999999;
            color: #fff;
            overflow: hidden;
            display: none;
            flex-direction: column;
            transition: border-color 0.3s, box-shadow 0.3s;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px 12px; font-size: 11px; font-weight: bold; color: #dcb3ff;
            border-bottom: 1px solid #b026ff; cursor: move; display: flex; justify-content: space-between; align-items: center; user-select: none;
        }
        .bocik-content { padding: 12px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
        .status-text { font-size: 11px; text-align: center; color: #ccc; background: #222; padding: 5px; border-radius: 6px; border: 1px solid #333; width: 100%; box-sizing: border-box; }
        .timer-text { font-size: 14px; font-weight: bold; color: #ff4444; text-shadow: 0 0 5px rgba(255, 68, 68, 0.5); display: none; }
        .bocik-btn { width: 100%; padding: 6px; border: none; border-radius: 6px; font-weight: bold; font-size: 10px; cursor: pointer; transition: 0.2s; text-transform: uppercase; color: white; }
        .btn-settings { background: #333; border: 1px solid #555; color: #ccc; }
        .btn-settings:hover { background: #444; color: #fff; }
        .btn-save { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; }
        .btn-test { background: #3a3a1c; color: #ffff7a; border: 1px solid #b8b85c; }
        .config-container { display: none; flex-direction: column; gap: 8px; width: 100%; margin-top: 5px; padding-top: 8px; border-top: 1px solid #333; }
        .bocik-input { background: #111; border: 1px solid #b026ff; color: #fff; padding: 6px; font-size: 10px; border-radius: 4px; width: 100%; box-sizing: border-box; }
        .btn-row { display: flex; gap: 5px; width: 100%; }
        .panel-alarm { border-color: #ff4444 !important; box-shadow: 0 0 20px rgba(255, 68, 68, 0.6) !important; }
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    // --- GUI ---
    const panel = document.createElement('div');
    panel.className = 'bocik-panel';
    panel.innerHTML = `
        <div class="bocik-header" id="dragHandlePuzzle">
            <span>🤖 Zagadka v5.7</span>
            <span id="pinIconPuzzle">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="status-text" id="statusTextPuzzle">Stan: Czuwam 🟢</div>
            <div class="timer-text" id="timerTextPuzzle">0s</div>
            <button class="bocik-btn btn-settings" id="toggleConfigPuzzle">⚙️ Ustawienia / Test</button>
            <div class="config-container" id="configAreaPuzzle">
                <input type="text" class="bocik-input" id="webhookInputPuzzle" placeholder="Wklej link Webhooka...">
                <div class="btn-row">
                    <button class="bocik-btn btn-save" id="saveWebhookPuzzle" style="flex:2">💾 ZAPISZ</button>
                    <button class="bocik-btn btn-test" id="testWebhookPuzzle" style="flex:1">🔔 TEST</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    const dragHandle = document.getElementById('dragHandlePuzzle');
    const pinIcon = document.getElementById('pinIconPuzzle');
    const statusText = document.getElementById('statusTextPuzzle');
    const timerText = document.getElementById('timerTextPuzzle');
    const toggleConfigBtn = document.getElementById('toggleConfigPuzzle');
    const configArea = document.getElementById('configAreaPuzzle');
    const webhookInput = document.getElementById('webhookInputPuzzle');
    const saveBtn = document.getElementById('saveWebhookPuzzle');
    const testBtn = document.getElementById('testWebhookPuzzle');

    webhookInput.value = savedWebhookUrl;
    updateStatusText();

    toggleConfigBtn.onclick = () => { configArea.style.display = (configArea.style.display === 'flex') ? 'none' : 'flex'; };
    saveBtn.onclick = () => {
        const url = webhookInput.value.trim();
        if (url.startsWith("http")) {
            savedWebhookUrl = url; localStorage.setItem(CONFIG.storageKey, savedWebhookUrl);
            alert("✅ Link Webhook zapisany!"); updateStatusText();
        } else { alert("❌ Niepoprawny link!"); }
    };
    testBtn.onclick = () => {
        if (!savedWebhookUrl) { alert("⚠️ Wklej link i Zapisz!"); return; }
        fetch(savedWebhookUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: "Bocik Test", content: "🔔 **Test powiadomienia!**" })
        }).then(r => r.ok ? alert("✅ Wysłano!") : alert("❌ Błąd: " + r.status)).catch(e => alert("❌ Błąd sieci!"));
    };

    function updateStatusText() {
        if (!savedWebhookUrl) { statusText.innerText = '⚠️ BRAK WEBHOOKA!'; statusText.style.color = '#ffcc00'; statusText.style.borderColor = '#ffcc00'; }
        else { statusText.innerText = 'Stan: Czuwam 🟢'; statusText.style.color = '#ccc'; statusText.style.borderColor = '#333'; }
    }
    function updateGUI(state, timeLeft=0) {
        if (state === 'IDLE') {
            panel.classList.remove('panel-alarm'); if(!panel.classList.contains('panel-locked')) panel.style.borderColor = '#b026ff';
            updateStatusText(); timerText.style.display = 'none';
        } else if (state === 'WARNING') {
            panel.classList.add('panel-alarm'); statusText.innerText = '🚨 ZAGADKA! 🚨'; statusText.style.color = '#ff4444';
            timerText.style.display = 'block'; timerText.innerText = `${timeLeft}s do wylogowania`;
        } else if (state === 'LOGOUT') {
            panel.classList.add('panel-alarm'); statusText.innerText = '🔌 WYLOGOWYWANIE'; timerText.innerText = 'PA PA 👋';
        }
    }

    // --- DRAGGABLE Z PAMIĘCIĄ ---
    (function makeDraggable(element, handle) {
        let isPinned = false;
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;

        // 1. Wczytaj pozycję
        const savedPos = localStorage.getItem(STORAGE_POS_KEY);
        if (savedPos) {
            try {
                const pos = JSON.parse(savedPos);
                element.style.top = pos.top;
                element.style.left = pos.left;
                element.style.bottom = 'auto'; element.style.right = 'auto';
            } catch(e) {}
        }

        handle.onmousedown = dragMouseDown;
        handle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) {
                element.classList.add('panel-locked'); handle.style.cursor = "default"; handle.style.background = "#222"; pinIcon.innerText = "🔒";
            } else {
                element.classList.remove('panel-locked'); handle.style.cursor = "move"; handle.style.background = "linear-gradient(90deg, #2a0e36 0%, #4a126b 100%)"; pinIcon.innerText = "🔓";
            }
        };

        function dragMouseDown(e) {
            if (isPinned) return;
            if (['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
            e = e || window.event; e.preventDefault();
            mouseX = e.clientX; mouseY = e.clientY;
            document.addEventListener('mouseup', closeDragElement);
            document.addEventListener('mousemove', elementDrag);
        }
        function elementDrag(e) {
            e = e || window.event; e.preventDefault();
            offsetX = mouseX - e.clientX; offsetY = mouseY - e.clientY;
            mouseX = e.clientX; mouseY = e.clientY;
            element.style.top = (element.offsetTop - offsetY) + "px";
            element.style.left = (element.offsetLeft - offsetX) + "px";
        }
        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
            // 2. Zapisz pozycję
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ top: element.style.top, left: element.style.left }));
        }
    })(panel, dragHandle);

    // --- LOGIKA BOTA ---
    function playAlarm() {
        if (!CONFIG.playAudio) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator(); const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'square'; osc.frequency.value = 880; osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5); setTimeout(() => osc.stop(), 500);
        } catch (e) {}
    }
    function sendDiscordWebhook(msgType = "ALARM") {
        if (!savedWebhookUrl) return;
        let contentText = msgType === "ALARM" ? `🧩 @everyone **ZAGADKA!** "${CONFIG.targetText}"` : `🚨 @everyone **EMERGENCY ESCAPE!**`;
        let username = msgType === "ALARM" ? "Bocik Strażnik" : "Bocik Ratownik";
        fetch(savedWebhookUrl, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: username, content: contentText })
        }).catch(err => console.error(err));
    }
    function performHardLogout() { updateGUI('LOGOUT'); const btn = document.getElementById('logoutbut'); if (btn) btn.click(); setTimeout(() => { window.location.href = "https://margonem.pl/"; }, 7000); }
    function startCountdown() {
        if (countdownInterval) return;
        let remainingTime = Math.floor(Math.random() * (CONFIG.logoutMaxTime - CONFIG.logoutMinTime + 1)) + CONFIG.logoutMinTime;
        updateGUI('WARNING', remainingTime);
        countdownInterval = setInterval(() => {
            remainingTime--; updateGUI('WARNING', remainingTime);
            if (remainingTime <= 0) { clearInterval(countdownInterval); countdownInterval = null; sendDiscordWebhook("LOGOUT"); performHardLogout(); }
        }, 1000);
    }
    function stopCountdown() { if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; updateGUI('IDLE'); } }
    function searchForPuzzle() {
        const elements = document.querySelectorAll(CONFIG.possibleSelectors.join(','));
        let foundNow = false;
        for (let el of elements) { if (el.textContent && el.textContent.includes(CONFIG.targetText) && el.offsetParent !== null) { foundNow = true; break; } }
        if (foundNow) {
            if (!isPuzzleActive) { isPuzzleActive = true; playAlarm(); sendDiscordWebhook("ALARM"); startCountdown(); lastNotificationTime = Date.now(); }
            else if (Date.now() - lastNotificationTime > 60000) { playAlarm(); lastNotificationTime = Date.now(); }
        } else if (isPuzzleActive) { isPuzzleActive = false; stopCountdown(); }
    }
    setInterval(searchForPuzzle, CONFIG.scanInterval);

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
})();