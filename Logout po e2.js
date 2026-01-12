// ==UserScript==
// @name         AutoLogout po Mobie v1.2 [Hub Optimized]
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Wylogowuje postać po zniknięciu moba. Hub Integration + Memory.
// @author       Bocik & Szpinak
// @match        http://*.margonem.pl/
// @match        https://*.margonem.pl/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    const ADDON_ID = 'autologout'; // To ID dodaj do REPOSITORY w Hubie
    const STORAGE_VISIBLE_KEY = 'bocik_logout_gui_visible';
    const STORAGE_POS_KEY = 'bocik_logout_gui_pos';
    const STORAGE_RUNNING_KEY = 'bocik_logout_running';
    const STORAGE_MOB_KEY = 'bocik_logout_mob_name';

    // --- KONFIGURACJA ---
    let config = {
        mobName: localStorage.getItem(STORAGE_MOB_KEY) || "Pełzacz",
        minDelay: 3000,
        maxDelay: 8000
    };

    // --- ZMIENNE STANU ---
    // Wczytaj stan ON/OFF z pamięci
    let isEnabled = localStorage.getItem(STORAGE_RUNNING_KEY) === 'true';
    let mobWasSeen = false;
    let logoutTimer = null;

    // --- STYLIZACJA CSS (RED NEON THEME) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            /* Domyślna pozycja startowa */
            top: 250px; left: 250px;
            width: 200px;
            background-color: #1a1a1a;
            border: 2px solid #ff4444; /* Czerwony akcent */
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(255, 68, 68, 0.2);
            font-family: 'Verdana', sans-serif;
            z-index: 999999;
            color: #fff;
            display: none; /* Ukryte domyślnie, sterowane przez JS */
            flex-direction: column;
            overflow: hidden;
            transition: border-color 0.3s;
        }
        .bocik-header {
            background: linear-gradient(90deg, #360e0e 0%, #6b1212 100%);
            padding: 8px 12px; font-size: 11px; font-weight: bold; color: #ffb3b3;
            border-bottom: 1px solid #ff4444; cursor: move; display: flex; justify-content: space-between; align-items: center; user-select: none;
        }
        .bocik-content { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .status-box { background: #222; border: 1px solid #333; border-radius: 6px; padding: 6px; text-align: center; font-size: 11px; color: #ccc; font-weight: bold; }
        .input-group { display: flex; flex-direction: column; gap: 4px; }
        .input-label { font-size: 9px; color: #aaa; margin-left: 2px; }
        .bocik-input { width: 100%; box-sizing: border-box; background: #111; border: 1px solid #ff4444; color: #fff; padding: 6px; border-radius: 4px; font-size: 10px; outline: none; }
        .bocik-btn { width: 100%; padding: 8px; border: none; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px; color: white; }
        .btn-on { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; }
        .btn-off { background: #3a1c1c; color: #ff7a7a; border: 1px solid #d9534f; }
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    // --- BUDOWA GUI ---
    const panel = document.createElement('div');
    panel.className = 'bocik-panel';
    panel.id = 'bocik-panel-logout';
    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleLogout">
            <span>🔌 Trzymajcie się</span>
            <span id="pinIconLogout">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="status-box" id="statusTextLogout">Szukam celu... 🔎</div>
            <div class="input-group">
                <label class="input-label">Nazwa potwora:</label>
                <input type="text" class="bocik-input" id="mobNameInputLogout" value="${config.mobName}">
            </div>
            <button class="bocik-btn btn-off" id="toggleBtnLogout">WYŁĄCZONY</button>
        </div>
    `;
    document.body.appendChild(panel);

    // --- ELEMENTY DOM ---
    const dragHandle = document.getElementById('dragHandleLogout');
    const pinIcon = document.getElementById('pinIconLogout');
    const statusText = document.getElementById('statusTextLogout');
    const mobInput = document.getElementById('mobNameInputLogout');
    const toggleBtn = document.getElementById('toggleBtnLogout');

    // --- SYNCHRONIZACJA STANU ---
    if (isEnabled) {
        toggleBtn.innerText = "Bot: WŁĄCZONY";
        toggleBtn.className = "bocik-btn btn-on";
        updateStatus("Szukam celu... 🔎", "#ccc");
    } else {
        updateStatus("Zatrzymano 🛑", "#888");
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
            } catch(e) {}
        }

        handle.onmousedown = dragMouseDown;
        handle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) {
                element.classList.add('panel-locked'); handle.style.cursor = "default"; handle.style.background = "#222"; pinIcon.innerText = "🔒";
            } else {
                element.classList.remove('panel-locked'); handle.style.cursor = "move"; handle.style.background = "linear-gradient(90deg, #360e0e 0%, #6b1212 100%)"; pinIcon.innerText = "🔓";
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
    mobInput.addEventListener('input', function() {
        config.mobName = this.value;
        localStorage.setItem(STORAGE_MOB_KEY, config.mobName);
        mobWasSeen = false;
        updateStatus("Zmieniono nazwę", "#ccc");
    });

    toggleBtn.onclick = () => {
        isEnabled = !isEnabled;
        // Zapisz stan ON/OFF
        localStorage.setItem(STORAGE_RUNNING_KEY, isEnabled);

        if (isEnabled) {
            toggleBtn.innerText = "Bot: WŁĄCZONY";
            toggleBtn.className = "bocik-btn btn-on";
            updateStatus("Szukam celu... 🔎", "#ccc");
        } else {
            toggleBtn.innerText = "WYŁĄCZONY";
            toggleBtn.className = "bocik-btn btn-off";
            updateStatus("Zatrzymano 🛑", "#888");
            clearTimeout(logoutTimer);
        }
    };

    function updateStatus(text, color) {
        statusText.innerText = text;
        statusText.style.color = color;
        statusText.style.borderColor = color === '#ccc' ? '#333' : color;
    }

    function performHardLogout() {
        updateStatus("🔌 WYLOGOWYWANIE...", "#ff4444");
        console.log("[AutoLogout] Papa!");
        const btn = document.getElementById('logoutbut');
        if (btn) btn.click();
        else if(typeof _g !== 'undefined') _g('logout');
        setTimeout(() => { window.location.href = "https://margonem.pl/"; }, 2000);
    }

    function checkMobStatus() {
        if (!isEnabled) return;
        if (typeof g === 'undefined' || !g.npc) return;

        let isMobPresent = false;
        for (let id in g.npc) {
            if (g.npc[id].nick === config.mobName) {
                isMobPresent = true;
                break;
            }
        }

        if (isMobPresent) {
            if (!mobWasSeen) {
                updateStatus(`Widzę cel: ${config.mobName} 👀`, "#00ccff");
                mobWasSeen = true;
            }
        } else {
            if (mobWasSeen) {
                mobWasSeen = false;
                let delay = Math.floor(Math.random() * (config.maxDelay - config.minDelay + 1)) + config.minDelay;
                let delaySeconds = (delay / 1000).toFixed(1);
                updateStatus(`Mob padł! Log out za ${delaySeconds}s ⏳`, "#ff4444");
                logoutTimer = setTimeout(() => {
                    if (isEnabled) performHardLogout();
                }, delay);
            }
        }
    }

    setInterval(checkMobStatus, 500);

    // --- INTEGRACJA Z HUBEM ---
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