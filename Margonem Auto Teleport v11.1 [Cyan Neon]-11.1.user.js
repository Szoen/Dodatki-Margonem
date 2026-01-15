// ==UserScript==
// @name         Margonem Auto Teleport v11.2 [Hub Optimized]
// @namespace    http://tampermonkey.net/
// @version      11.2
// @description  Wymusza solidny dwuklik, Cyan Neon UI, ON/OFF, Safe Drag, Hub Integration.
// @author       Bocik & Szpinak
// @match        https://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    const ADDON_ID = 'auto_teleport'; // To ID dodaj do REPOSITORY w Hubie
    const STORAGE_VISIBLE_KEY = 'bocik_tp_gui_visible';
    const STORAGE_POS_KEY = 'bocik_tp_gui_pos';
    const STORAGE_KEY_RUNNING = "bocik_tp_running";
    const STORAGE_KEY_COOLDOWN = "bocik_tp_last_time_v11";

    // --- KONFIGURACJA ---
    const CONFIG = {
        itemName: "Zwój teleportacji na Kwieciste Przejście",
        triggerBagId: "bs2",
        cooldownMinutes: 5,
        checkInterval: 500
    };

    // --- ZMIENNE STANU ---
    let isRunning = localStorage.getItem(STORAGE_KEY_RUNNING) === 'true';
    let storedTime = localStorage.getItem(STORAGE_KEY_COOLDOWN);
    let lastTeleportTime = storedTime ? parseInt(storedTime, 10) : 0;
    let isBusy = false;

    // --- STYLIZACJA CSS (CYAN NEON THEME - FIXED) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            /* Usunięto sztywne top/left, aby nie psuć layoutu */
            width: 210px;
            background-color: #1a1a1a; border: 2px solid #00e5ff;
            border-radius: 12px; box-shadow: 0 0 15px rgba(0, 229, 255, 0.3);
            font-family: 'Verdana', sans-serif; z-index: 999999;
            color: #fff; display: none; /* Ukryte domyślnie, sterowane przez JS */
            flex-direction: column; overflow: hidden;
            transition: border-color 0.3s;
        }
        .bocik-header {
            background: linear-gradient(90deg, #0e2a36 0%, #124a6b 100%);
            padding: 8px 12px; font-size: 11px; font-weight: bold; color: #b3faff;
            border-bottom: 1px solid #00e5ff; cursor: move; display: flex;
            justify-content: space-between; align-items: center; user-select: none;
        }
        .bocik-content { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .status-row { display: flex; justify-content: space-between; font-size: 10px; color: #ccc; }
        .status-val { font-weight: bold; }
        .val-ok { color: #00e5ff; } .val-bad { color: #ff4444; } .val-warn { color: #ffcc00; }
        
        .main-status {
            background: #222; border: 1px solid #333; border-radius: 6px; padding: 6px;
            text-align: center; font-size: 11px; color: #ccc; font-weight: bold; margin-bottom: 5px;
        }
        
        .btn-row { display: flex; gap: 5px; }
        .bocik-btn {
            width: 100%; padding: 6px; border: none; border-radius: 6px;
            font-weight: bold; font-size: 10px; cursor: pointer; transition: 0.2s;
            text-transform: uppercase; letter-spacing: 0.5px; color: white;
        }
        .btn-start { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; }
        .btn-stop { background: #3a1c1c; color: #ff6b6b; border: 1px solid #d9534f; }
        .btn-test { background: #005f73; color: #b3faff; border: 1px solid #00e5ff; }
        .btn-reset { background: #444; color: #ccc; border: 1px solid #666; font-size: 9px; }
        
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    // --- GUI HTML ---
    const panel = document.createElement('div');
    panel.className = 'bocik-panel';
    panel.id = 'bocik-panel-tp';
    // Domyślna pozycja startowa
    panel.style.top = "300px";
    panel.style.left = "300px";

    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleTp">
            <span>🌀 Auto Teleport v11.2</span>
            <span id="pinIconTp">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="main-status" id="mainStatusTp">Czuwam...</div>
            
            <div class="status-row">
                <span>Torba (BS2):</span>
                <span id="bs2ValTp" class="status-val">---</span>
            </div>
            <div class="status-row">
                <span>Zwój:</span>
                <span id="itemValTp" class="status-val">---</span>
            </div>

            <div class="btn-row">
                <button id="testBtnTp" class="bocik-btn btn-test" style="flex:2">⚡ TESTUJ</button>
                <button id="resetBtnTp" class="bocik-btn btn-reset" style="flex:1">RESET</button>
            </div>
            
            <button id="toggleBtnTp" class="bocik-btn btn-start">BOT: START</button>
        </div>
    `;
    document.body.appendChild(panel);

    const dragHandle = document.getElementById('dragHandleTp');
    const pinIcon = document.getElementById('pinIconTp');
    const mainStatus = document.getElementById('mainStatusTp');
    const bs2Val = document.getElementById('bs2ValTp');
    const itemVal = document.getElementById('itemValTp');
    const testBtn = document.getElementById('testBtnTp');
    const resetBtn = document.getElementById('resetBtnTp');
    const toggleBtn = document.getElementById('toggleBtnTp');

    // --- OBSŁUGA GUI ---
    function updateGuiState() {
        if(isRunning) {
            toggleBtn.innerText = "BOT: WŁĄCZONY";
            toggleBtn.className = "bocik-btn btn-start";
        } else {
            toggleBtn.innerText = "BOT: WYŁĄCZONY";
            toggleBtn.className = "bocik-btn btn-stop";
            mainStatus.innerText = "Zatrzymany";
            mainStatus.style.color = "#888";
        }
    }
    updateGuiState();

    toggleBtn.onclick = () => {
        isRunning = !isRunning;
        localStorage.setItem(STORAGE_KEY_RUNNING, isRunning);
        updateGuiState();
    };

    resetBtn.onclick = () => {
        lastTeleportTime = 0;
        localStorage.removeItem(STORAGE_KEY_COOLDOWN);
        alert("✅ Czas cooldownu zresetowany!");
    };

    testBtn.onclick = () => {
        if(!executeTeleport(true)) alert("❌ Nie widzę zwoju w ekwipunku!");
    };

    // --- DRAGGABLE (SAFE & MEMORY) ---
    (function makeDraggable(element, handle) {
        let isPinned = false;
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;
        const savedPos = localStorage.getItem(STORAGE_POS_KEY);
        if (savedPos) {
            try {
                const pos = JSON.parse(savedPos);
                element.style.top = pos.top;
                element.style.left = pos.left;
                // Reset bottom/right
                element.style.bottom = 'auto'; element.style.right = 'auto';
            } catch(e) {}
        }

        handle.onmousedown = dragMouseDown;
        handle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) { element.classList.add('panel-locked'); handle.style.cursor = "default"; handle.style.background = "#222"; pinIcon.innerText = "🔒"; }
            else { element.classList.remove('panel-locked'); handle.style.cursor = "move"; handle.style.background = "linear-gradient(90deg, #0e2a36 0%, #124a6b 100%)"; pinIcon.innerText = "🔓"; }
        };

        function dragMouseDown(e) {
            if (isPinned || e.target.tagName === 'BUTTON') return;
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
            element.style.bottom = 'auto'; element.style.right = 'auto';
        }
        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ top: element.style.top, left: element.style.left }));
        }
    })(panel, dragHandle);

    // --- LOGIKA BOTA (BEZ ZMIAN) ---

    function decodeHtml(html) {
        const txt = document.createElement("textarea");
        txt.innerHTML = html;
        return txt.value;
    }

    function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function findItemElement() {
        const items = document.querySelectorAll('.item');
        for (let item of items) {
            const rawTip = item.getAttribute('tip');
            if (rawTip) {
                const decodedTip = decodeHtml(rawTip);
                if (decodedTip.includes(CONFIG.itemName)) {
                    const rect = item.getBoundingClientRect();
                    if (rect.width > 0) return item;
                }
            }
        }
        return null;
    }

    function triggerMouseEvent(element, type, x, y) {
        const event = new MouseEvent(type, {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y, screenX: x, screenY: y
        });
        element.dispatchEvent(event);
    }

    function performDoubleClickSequence(item) {
        const rect = item.getBoundingClientRect();
        const x = getRandomInt(rect.left + 5, rect.right - 5);
        const y = getRandomInt(rect.top + 5, rect.bottom - 5);
        console.log(`[Bocik] Wykonuję DWUKLIK: ${x},${y}`);

        triggerMouseEvent(item, 'mousedown', x, y);
        triggerMouseEvent(item, 'mouseup', x, y);
        triggerMouseEvent(item, 'click', x, y);

        setTimeout(() => {
            triggerMouseEvent(item, 'mousedown', x, y);
            triggerMouseEvent(item, 'mouseup', x, y);
            triggerMouseEvent(item, 'click', x, y);
            triggerMouseEvent(item, 'dblclick', x, y);
        }, 80);
    }

    function executeTeleport(isTest = false) {
        const item = findItemElement();
        if (!item) return false;

        if (isTest) {
            performDoubleClickSequence(item);
            return true;
        }
        const now = Date.now();
        lastTeleportTime = now;
        localStorage.setItem(STORAGE_KEY_COOLDOWN, now);
        isBusy = true;
        performDoubleClickSequence(item);
        setTimeout(() => { isBusy = false; }, 3000);
        return true;
    }

    // --- PĘTLA SPRAWDZAJĄCA ---
    function checkLoop() {
        // Statusy GUI
        const bs2El = document.getElementById(CONFIG.triggerBagId);
        let bs2Space = (bs2El) ? parseInt(bs2El.textContent.trim(), 10) : null;
        
        bs2Val.innerText = (bs2Space !== null) ? bs2Space : "?";
        bs2Val.className = (bs2Space === 0) ? "status-val val-ok" : "status-val val-bad";

        const item = findItemElement();
        const hasItem = !!item;
        itemVal.innerText = hasItem ? "JEST" : "BRAK";
        itemVal.className = hasItem ? "status-val val-ok" : "status-val val-bad";

        if (!isRunning) return;

        const now = Date.now();
        const onCooldown = (now - lastTeleportTime < CONFIG.cooldownMinutes * 60 * 1000);

        if (isBusy) {
            mainStatus.innerText = "⚡ KLIKAM...";
            mainStatus.style.color = "#00e5ff";
        } else if (onCooldown) {
            const timeLeft = Math.ceil((CONFIG.cooldownMinutes * 60000 - (now - lastTeleportTime)) / 1000);
            mainStatus.innerText = `Cooldown: ${timeLeft}s`;
            mainStatus.style.color = "#ffcc00";
        } else {
            mainStatus.innerText = "Czuwam 🟢";
            mainStatus.style.color = "#ccc";

            if (bs2Space === 0 && !isNaN(bs2Space)) {
                if (hasItem) {
                    mainStatus.innerText = "AKTYWACJA! 🚀";
                    mainStatus.style.color = "#00e5ff";
                    console.log("[Bocik] BS2=0 -> TP!");
                    executeTeleport(false);
                } else {
                    mainStatus.innerText = "BRAK ZWOJU! ❌";
                    mainStatus.style.color = "#ff4444";
                }
            }
        }
    }

    setInterval(checkLoop, CONFIG.checkInterval);

    // --- INTEGRACJA Z HUBEM ---
    window.addEventListener('load', function() {
        const savedState = localStorage.getItem(STORAGE_VISIBLE_KEY);
        // Domyślnie ukryty, chyba że zapisano inaczej
        const shouldBeVisible = savedState === 'true';
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