// ==UserScript==
// @name         Margonem Universal Mob Detector v6.4 [Hub Optimized]
// @namespace    http://tampermonkey.net/
// @version      6.4
// @description  Wykrywa TYLKO Herosów i Tytanów. Integracja z Hubem + Memory.
// @author       Bocik & Szpinak
// @match        https://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    // WAŻNE: Upewnij się, że w Hubie masz wpisane to samo ID (np. 'heros_detector')
    const ADDON_ID = 'heros_detector';
    const STORAGE_VISIBLE_KEY = 'bocik_uni_gui_visible';
    const STORAGE_POS_KEY = 'bocik_uni_gui_pos';
    const STORAGE_RUNNING_KEY = 'bocik_uni_running';

    // --- KONFIGURACJA ---
    const CONFIG = {
        webhookUrl: "https://discord.com/api/webhooks/1460330805216936201/nX485Ou6xwskXRSA236oEElSO5TBqn42iT8nvF5Wo9f9d00jGz3j67XSOMmKO7ftLeCn",
        discordRoleId: "1244910638543929477",
        cooldownMinutes: 3,
        minWT: 80, // 80 = Heros, 99+ = Tytan
    };

    // --- ZMIENNE STANU ---
    let isRunning = localStorage.getItem(STORAGE_RUNNING_KEY) === 'true';
    let lastAlertTimes = {};

    // --- STYLIZACJA CSS (FIXED) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-mini-panel {
            position: fixed;
            /* Usunięto sztywne top/left, aby nie psuć layoutu */
            width: 170px;
            background-color: #1a1a1a;
            border: 2px solid #b026ff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(176, 38, 255, 0.3);
            font-family: 'Verdana', sans-serif;
            z-index: 999999;
            color: #fff;
            display: none; /* Ukryte domyślnie, sterowane przez JS */
            flex-direction: column;
            user-select: none;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px; font-size: 11px; font-weight: bold;
            color: #dcb3ff; border-bottom: 1px solid #b026ff;
            cursor: move; display: flex; justify-content: space-between; align-items: center;
        }
        .bocik-content { padding: 10px; display: flex; flex-direction: column; gap: 5px; align-items: center; }
        .bocik-btn {
            width: 100%; padding: 8px; border: none; border-radius: 6px;
            font-weight: bold; font-size: 12px; cursor: pointer; transition: 0.2s;
            text-transform: uppercase; letter-spacing: 1px; color: white;
        }
        .btn-off { background: #3a1c1c; color: #ff6b6b; border: 1px solid #d9534f; }
        .btn-on { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; box-shadow: 0 0 10px rgba(92, 184, 92, 0.4); }
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    // --- BUDOWA GUI ---
    const panel = document.createElement('div');
    panel.className = 'bocik-mini-panel';
    panel.id = 'bocik-panel-uni';
    // Domyślna pozycja startowa (jeśli brak w pamięci)
    panel.style.top = "120px";
    panel.style.left = "120px";

    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleUni">
            <span>😈 Heros Detector</span>
            <span id="pinIconUni">🔓</span>
        </div>
        <div class="bocik-content">
            <button id="toggleBtnUni" class="bocik-btn btn-off">OFF</button>
        </div>
    `;
    document.body.appendChild(panel);

    const toggleBtn = document.getElementById('toggleBtnUni');
    const dragHandle = document.getElementById('dragHandleUni');
    const pinIcon = document.getElementById('pinIconUni');

    // --- OBSŁUGA UI ---
    function updateButtonState() {
        if (isRunning) {
            toggleBtn.innerText = "ON";
            toggleBtn.className = "bocik-btn btn-on";
        } else {
            toggleBtn.innerText = "OFF";
            toggleBtn.className = "bocik-btn btn-off";
        }
    }
    updateButtonState();

    toggleBtn.onclick = () => {
        isRunning = !isRunning;
        localStorage.setItem(STORAGE_RUNNING_KEY, isRunning);
        updateButtonState();
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
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ top: element.style.top, left: element.style.left }));
        }
    })(panel, dragHandle);

    // --- LOGIKA UNIWERSALNA ---

    function getMapName() {
        if (typeof Engine !== 'undefined' && Engine.map && Engine.map.d) return Engine.map.d.name;
        if (typeof map !== 'undefined' && map.name) return map.name;
        return "Nieznana mapa";
    }

    function getMobs() {
        let mobs = [];
        if (typeof Engine !== 'undefined' && Engine.npcs && Engine.npcs.check) {
            let npcList = Engine.npcs.check();
            for (let id in npcList) { if (npcList[id] && npcList[id].d) mobs.push(npcList[id].d); }
        }
        else if (typeof g !== 'undefined' && g.npc) {
            for (let id in g.npc) { if (g.npc[id]) mobs.push(g.npc[id]); }
        }
        return mobs;
    }

    function showGameMessage(text) {
        if (typeof message === 'function') { message(text); }
        else { console.log("[Bocik] " + text); }
    }

    function sendDiscordAlert(mobName, mapName, x, y, lvl, typeLabel) {
        let contentMessage = "";
        if (CONFIG.discordRoleId && CONFIG.discordRoleId !== "") {
            contentMessage = `<@&${CONFIG.discordRoleId}> ${typeLabel} na horyzoncie!`;
        }
        const payload = {
            content: contentMessage,
            embeds: [{
                title: `⚔️ MAM CIĘ CHUJU: ${mobName}`,
                color: 10181046,
                fields: [
                    { name: "Ranga", value: typeLabel, inline: true },
                    { name: "Poziom", value: `${lvl}`, inline: true },
                    { name: "Lokalizacja", value: `${mapName} (${x}, ${y})`, inline: false }
                ],
                footer: { text: "Bocik Detector v6.4" },
                timestamp: new Date().toISOString()
            }]
        };
        fetch(CONFIG.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(error => console.error("[Bocik] Błąd sieci:", error));
    }

    // --- PĘTLA SKANOWANIA ---
    function scanForMobs() {
        if (!isRunning) return;

        let now = Date.now();
        let cooldownMs = CONFIG.cooldownMinutes * 60 * 1000;
        let mobs = getMobs();

        for (let mob of mobs) {
            // Sprawdzamy czy mob ma rangę większą lub równą minWT (80)
            if ((mob.type == 2 || mob.type == 3) && mob.wt >= CONFIG.minWT) {
                let uniqueKey = `${mob.id}_${mob.nick}`;
                let lastTime = lastAlertTimes[uniqueKey] || 0;

                if (now - lastTime > cooldownMs) {
                    let mapName = getMapName();

                    let typeLabel = "Heros";
                    if (mob.wt > 99) typeLabel = "Tytan/Kolos";

                    console.log(`[Bocik] Wykryto: ${mob.nick} (${typeLabel}).`);
                    showGameMessage(`Wykryto: ${mob.nick} (${typeLabel})!`);
                    sendDiscordAlert(mob.nick, mapName, mob.x, mob.y, mob.lvl, typeLabel);

                    lastAlertTimes[uniqueKey] = now;
                }
            }
        }
    }

    setInterval(scanForMobs, 1000);

    // --- INTEGRACJA Z HUBEM ---
    window.addEventListener('load', function() {
        const savedState = localStorage.getItem(STORAGE_VISIBLE_KEY);
        // Jeśli nie ma zapisu, domyślnie ukryty (żeby nie wyskakiwał przy starcie, póki nie klikniesz w Hubie)
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