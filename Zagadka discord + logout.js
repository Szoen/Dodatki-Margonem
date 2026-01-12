// ==UserScript==
// @name         Zagadka discord v5.3 [GUI + TEST BUTTON]
// @namespace    http://tampermonkey.net/
// @version      5.3
// @description  Wykrywa zagadkę, Panel Neon UI, Konfiguracja przez GUI, Przycisk Testu
// @author       Bocik & Szpinak
// @match        http://*.margonem.pl/
// @match        https://*.margonem.pl/
// @grant        GM_xmlhttpRequest
// @connect      discord.com
// @connect      discordapp.com
// ==/UserScript==

(function() {
    'use strict';

    // --- ID DLA HUBA ---
    const ADDON_ID = 'puzzle_bot';
    const STORAGE_VISIBLE_KEY = 'bocik_puzzle_gui_visible';

    // --- KONFIGURACJA ---
    const CONFIG = {
        targetText: "Rozwiąż teraz",
        possibleSelectors: ['span', 'div', 'button', '.hud-button'],
        storageKey: "bocik_discord_webhook_url", // Klucz zapisu w przeglądarce

        scanInterval: 1000,
        playAudio: true,

        // Czas do wylogowania (w sekundach)
        logoutMinTime: 150,
        logoutMaxTime: 170
    };

    // Zmienne systemowe
    let lastNotificationTime = 0;
    let countdownInterval = null;
    let isPuzzleActive = false;
    let savedWebhookUrl = localStorage.getItem(CONFIG.storageKey) || "";

    // --- STYLIZACJA CSS (NEON THEME) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            bottom: 200px; right: 200px;
            width: 190px;
            background-color: #1a1a1a;
            border: 2px solid #b026ff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(176, 38, 255, 0.3);
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
            padding: 6px 10px;
            font-size: 11px;
            font-weight: bold;
            color: #dcb3ff;
            border-bottom: 1px solid #b026ff;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        }
        .bocik-content {
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: center;
        }
        .status-text {
            font-size: 11px;
            text-align: center;
            color: #aaa;
            font-weight: bold;
        }
        .timer-text {
            font-size: 14px;
            font-weight: bold;
            color: #ff4444;
            text-shadow: 0 0 5px rgba(255, 68, 68, 0.5);
            display: none;
        }
        .settings-btn {
            background: #333;
            color: #ccc;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 10px;
            cursor: pointer;
            width: 100%;
            transition: 0.2s;
        }
        .settings-btn:hover {
            background: #444;
            color: white;
        }
        .config-container {
            display: none;
            flex-direction: column;
            gap: 5px;
            width: 100%;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px solid #333;
        }
        .bocik-input {
            background: #111;
            border: 1px solid #b026ff;
            color: #fff;
            padding: 5px;
            font-size: 10px;
            border-radius: 4px;
            width: 90%;
            align-self: center;
        }
        .btn-row {
            display: flex;
            gap: 5px;
            width: 100%;
        }
        .save-btn {
            background: #1c3a1c;
            color: #7aff7a;
            border: 1px solid #5cb85c;
            border-radius: 4px;
            padding: 4px;
            font-size: 10px;
            cursor: pointer;
            flex: 2;
            font-weight: bold;
        }
        .test-btn {
            background: #3a3a1c;
            color: #ffff7a;
            border: 1px solid #b8b85c;
            border-radius: 4px;
            padding: 4px;
            font-size: 10px;
            cursor: pointer;
            flex: 1;
            font-weight: bold;
        }
        .panel-alarm {
            border-color: #ff4444 !important;
            box-shadow: 0 0 20px rgba(255, 68, 68, 0.6) !important;
        }
        .panel-locked {
            border-color: #555 !important;
            box-shadow: none !important;
        }
    `;
    document.head.appendChild(style);

    // --- TWORZENIE GUI ---
    const panel = document.createElement('div');
    panel.className = 'bocik-panel';
    panel.innerHTML = `
        <div class="bocik-header" id="dragHandle">
            <span>🤖 Zagadka v5.3</span>
            <span id="pinIcon">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="status-text" id="statusText">Stan: Czuwam 🟢</div>
            <div class="timer-text" id="timerText">0s</div>

            <button class="settings-btn" id="toggleConfig">⚙️ Ustawienia / Test</button>

            <div class="config-container" id="configArea">
                <input type="text" class="bocik-input" id="webhookInput" placeholder="Wklej link Webhooka...">
                <div class="btn-row">
                    <button class="save-btn" id="saveWebhook">💾 ZAPISZ</button>
                    <button class="test-btn" id="testWebhook">🔔 TEST</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    // --- ELEMENTY DOM ---
    const dragHandle = document.getElementById('dragHandle');
    const pinIcon = document.getElementById('pinIcon');
    const statusText = document.getElementById('statusText');
    const timerText = document.getElementById('timerText');
    const toggleConfigBtn = document.getElementById('toggleConfig');
    const configArea = document.getElementById('configArea');
    const webhookInput = document.getElementById('webhookInput');
    const saveBtn = document.getElementById('saveWebhook');
    const testBtn = document.getElementById('testWebhook');

    // Wypełnij input zapisanym linkiem
    webhookInput.value = savedWebhookUrl;
    updateStatusText();

    // --- OBSŁUGA INTERFEJSU ---
    toggleConfigBtn.onclick = () => {
        configArea.style.display = (configArea.style.display === 'flex') ? 'none' : 'flex';
    };

    saveBtn.onclick = () => {
        const url = webhookInput.value.trim();
        if (url.startsWith("http")) {
            savedWebhookUrl = url;
            localStorage.setItem(CONFIG.storageKey, savedWebhookUrl);
            alert("✅ Link Webhook zapisany!");
            updateStatusText();
        } else {
            alert("❌ To nie wygląda na poprawny link!");
        }
    };

    testBtn.onclick = () => {
        if (!savedWebhookUrl) {
            alert("⚠️ Najpierw wklej link i kliknij ZAPISZ!");
            return;
        }
        // Wysłanie testu
        GM_xmlhttpRequest({
            method: "POST",
            url: savedWebhookUrl,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({
                username: "Bocik Test",
                content: "🔔 **To jest test powiadomienia!** Jeśli to widzisz, zagadka też zadziała."
            }),
            onload: function(response) {
                if(response.status >= 200 && response.status < 300) {
                    alert("✅ Wysłano! Sprawdź Discorda.");
                } else {
                    alert("❌ Błąd! Kod błędu: " + response.status + ". Sprawdź czy link jest dobry.");
                }
            },
            onerror: function(err) {
                console.error(err);
                alert("❌ Błąd połączenia! Sprawdź konsolę (F12) i uprawnienia Tampermonkey.");
            }
        });
    };

    function updateStatusText() {
        if (!savedWebhookUrl) {
            statusText.innerText = '⚠️ BRAK WEBHOOKA!';
            statusText.style.color = '#ffcc00';
        } else {
            statusText.innerText = 'Stan: Czuwam 🟢';
            statusText.style.color = '#aaa';
        }
    }

    function updateGUI(state, timeLeft = 0) {
        if (state === 'IDLE') {
            panel.classList.remove('panel-alarm');
            if(!panel.style.borderColor.includes('555')) panel.style.borderColor = '#b026ff';
            updateStatusText();
            timerText.style.display = 'none';
        }
        else if (state === 'WARNING') {
            panel.classList.add('panel-alarm');
            statusText.innerText = '🚨 ZAGADKA! 🚨';
            statusText.style.color = '#ff4444';
            timerText.style.display = 'block';
            timerText.innerText = `${timeLeft}s do wylogowania`;
        }
        else if (state === 'LOGOUT') {
            panel.classList.add('panel-alarm');
            statusText.innerText = '🔌 WYLOGOWYWANIE';
            timerText.innerText = 'PA PA 👋';
        }
    }

    // --- DRAG & PIN ---
    (function makeDraggable(element, handle) {
        let isPinned = false;
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
        handle.onmousedown = dragMouseDown;
        handle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) {
                element.classList.add('panel-locked');
                handle.style.cursor = "default";
                handle.style.background = "#222";
                pinIcon.innerText = "🔒";
            } else {
                element.classList.remove('panel-locked');
                handle.style.cursor = "move";
                handle.style.background = "linear-gradient(90deg, #2a0e36 0%, #4a126b 100%)";
                pinIcon.innerText = "🔓";
            }
        };
        function dragMouseDown(e) {
            if (isPinned) return;
            if (['INPUT', 'BUTTON'].includes(e.target.tagName)) return;
            e = e || window.event; e.preventDefault();
            mouseX = e.clientX; mouseY = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            e = e || window.event; e.preventDefault();
            offsetX = mouseX - e.clientX; offsetY = mouseY - e.clientY;
            mouseX = e.clientX; mouseY = e.clientY;
            element.style.top = (element.offsetTop - offsetY) + "px";
            element.style.left = (element.offsetLeft - offsetX) + "px";
            element.style.bottom = "auto"; element.style.right = "auto";
        }
        function closeDragElement() { document.onmouseup = null; document.onmousemove = null; }
    })(panel, dragHandle);

    // --- LOGIKA BOTA ---
    function playAlarm() {
        if (!CONFIG.playAudio) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain); gain.connect(ctx.destination);
            osc.type = 'square'; osc.frequency.value = 880;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
            setTimeout(() => osc.stop(), 500);
        } catch (e) {}
    }

    function sendDiscordWebhook(msgType = "ALARM") {
        if (!savedWebhookUrl) {
            console.error("[Bocik] Brak Webhooka!");
            return;
        }
        let contentText = "";
        let username = "Bocik Strażnik";

        if (msgType === "ALARM") {
            contentText = `🧩 @everyone **ZAGADKA WYKRYTA!**\n👀 Widzę: "${CONFIG.targetText}"\n⏳ Odliczam czas do wylogowania...`;
        } else if (msgType === "LOGOUT") {
            contentText = `🚨 @everyone **EMERGENCY ESCAPE!**\n🔌 Zagadka wisiała za długo.\n🏃‍♂️ **Wymuszono wyjście ze strony gry!**`;
            username = "Bocik Ratownik";
        }

        GM_xmlhttpRequest({
            method: "POST",
            url: savedWebhookUrl,
            headers: { "Content-Type": "application/json" },
            data: JSON.stringify({ username: username, content: contentText }),
            onerror: (e) => console.error(`[Discord] Error:`, e)
        });
    }

    function performHardLogout() {
        updateGUI('LOGOUT');
        const logoutBtn = document.getElementById('logoutbut');
        if (logoutBtn) logoutBtn.click();
        setTimeout(() => { window.location.href = "https://margonem.pl/"; }, 7000);
    }

    function startCountdown() {
        if (countdownInterval) return;
        const randomSeconds = Math.floor(Math.random() * (CONFIG.logoutMaxTime - CONFIG.logoutMinTime + 1)) + CONFIG.logoutMinTime;
        let remainingTime = randomSeconds;
        updateGUI('WARNING', remainingTime);
        countdownInterval = setInterval(() => {
            remainingTime--;
            updateGUI('WARNING', remainingTime);
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                countdownInterval = null;
                sendDiscordWebhook("LOGOUT");
                performHardLogout();
            }
        }, 1000);
    }

    function stopCountdown() {
        if (countdownInterval) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            updateGUI('IDLE');
        }
    }

    function searchForPuzzle() {
        const elements = document.querySelectorAll(CONFIG.possibleSelectors.join(','));
        let foundNow = false;
        for (let el of elements) {
            if (el.textContent && el.textContent.includes(CONFIG.targetText) && el.offsetParent !== null) {
                foundNow = true; break;
            }
        }
        if (foundNow) {
            if (!isPuzzleActive) {
                isPuzzleActive = true;
                playAlarm();
                sendDiscordWebhook("ALARM");
                startCountdown();
                lastNotificationTime = Date.now();
            } else {
                 if (Date.now() - lastNotificationTime > 60000) {
                      playAlarm();
                      lastNotificationTime = Date.now();
                 }
            }
        } else {
            if (isPuzzleActive) {
                isPuzzleActive = false;
                stopCountdown();
            }
        }
    }

    setInterval(searchForPuzzle, CONFIG.scanInterval);
    const savedState = localStorage.getItem(STORAGE_VISIBLE_KEY);
    const shouldBeVisible = savedState === null ? true : (savedState === 'true');
    panel.style.display = shouldBeVisible ? 'flex' : 'none';

    window.addEventListener('bocik:toggle-gui', function(e) {
        if (e.detail.id === ADDON_ID) {
            const isHidden = (panel.style.display === 'none' || panel.style.display === '');
            if (isHidden) {
                panel.style.display = 'flex';
                localStorage.setItem(STORAGE_VISIBLE_KEY, 'true');
            } else {
                panel.style.display = 'none';
                localStorage.setItem(STORAGE_VISIBLE_KEY, 'false');
            }
        }
    });

})();