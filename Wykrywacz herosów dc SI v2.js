// ==UserScript==
// @name         Margonem Mob Detector v5.2 [Hub Optimized]
// @namespace    http://tampermonkey.net/
// @version      5.2
// @description  Wykrywa moby, Fetch (Discord), GUI Memory, Hub Integration
// @author       Bocik & Szpinak
// @match        https://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    const ADDON_ID = 'mob_detector'; // Pamiętaj, żeby dodać to ID do REPOSITORY w Hubie!
    const STORAGE_VISIBLE_KEY = 'bocik_mob_gui_visible';
    const STORAGE_POS_KEY = 'bocik_mob_gui_pos';

    // --- KONFIGURACJA ---
    const CONFIG = {
        webhookUrl: "https://discord.com/api/webhooks/1460330805216936201/nX485Ou6xwskXRSA236oEElSO5TBqn42iT8nvF5Wo9f9d00jGz3j67XSOMmKO7ftLeCn",
        discordRoleId: "1244910638543929477",
        cooldownMinutes: 3,
        targetMobs: [
            "Kochanka Nocy",
            "Książe Kasim",
            "Renegat Baulus",
        ]
    };

    // --- ZMIENNE STANU ---
    let isRunning = false;
    let lastAlertTimes = {};

    // --- STYLIZACJA CSS (Mini Neon) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-mini-panel {
            position: fixed;
            /* Domyślna pozycja startowa */
            top: 100px; left: 100px;
            width: 160px;
            background-color: #1a1a1a;
            border: 2px solid #b026ff;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(176, 38, 255, 0.3);
            font-family: 'Verdana', sans-serif;
            z-index: 999999;
            color: #fff;
            overflow: hidden;
            display: none; /* Ukryte, sterowane przez JS */
            flex-direction: column;
            user-select: none;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px;
            font-size: 11px;
            font-weight: bold;
            color: #dcb3ff;
            border-bottom: 1px solid #b026ff;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .bocik-content {
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            align-items: center;
        }
        .bocik-btn {
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 12px;
            cursor: pointer;
            transition: 0.2s;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: white;
        }
        .btn-off {
            background: #3a1c1c;
            color: #ff6b6b;
            border: 1px solid #d9534f;
        }
        .btn-on {
            background: #1c3a1c;
            color: #7aff7a;
            border: 1px solid #5cb85c;
            box-shadow: 0 0 10px rgba(92, 184, 92, 0.4);
        }
        .panel-locked {
            border-color: #444 !important;
            box-shadow: none !important;
        }
    `;
    document.head.appendChild(style);

    // --- BUDOWA GUI ---
    const panel = document.createElement('div');
    panel.className = 'bocik-mini-panel';
    panel.id = 'bocik-panel-mob'; // Unikalne ID
    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleMob">
            <span>👾 Mob Notifier</span>
            <span id="pinIconMob">🔓</span>
        </div>
        <div class="bocik-content">
            <button id="toggleBtnMob" class="bocik-btn btn-off">OFF</button>
        </div>
    `;
    document.body.appendChild(panel);

    // --- ELEMENTY DOM ---
    const toggleBtn = document.getElementById('toggleBtnMob');
    const dragHandle = document.getElementById('dragHandleMob');
    const pinIcon = document.getElementById('pinIconMob');

    // --- OBSŁUGA PRZYCISKU ---
    toggleBtn.onclick = () => {
        isRunning = !isRunning;
        if (isRunning) {
            toggleBtn.innerText = "ON";
            toggleBtn.className = "bocik-btn btn-on";
        } else {
            toggleBtn.innerText = "OFF";
            toggleBtn.className = "bocik-btn btn-off";
        }
    };

    // --- MODUŁ PRZESUWANIA Z PAMIĘCIĄ ---
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
                element.classList.add('panel-locked');
                handle.style.cursor = "default"; handle.style.background = "#222"; pinIcon.innerText = "🔒";
            } else {
                element.classList.remove('panel-locked');
                handle.style.cursor = "move"; handle.style.background = "linear-gradient(90deg, #2a0e36 0%, #4a126b 100%)"; pinIcon.innerText = "🔓";
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
            // 2. Zapisz pozycję
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({
                top: element.style.top,
                left: element.style.left
            }));
        }
    })(panel, dragHandle);


    // --- LOGIKA WYKRYWANIA (POPRAWIONA NA FETCH) ---

    function sendDiscordAlert(mobName, mapName, x, y) {
        let contentMessage = "";
        if (CONFIG.discordRoleId && CONFIG.discordRoleId !== "") {
            contentMessage = `<@&${CONFIG.discordRoleId}> Znaleziono potwora!`;
        }

        const payload = {
            content: contentMessage,
            embeds: [
                {
                    title: "⚔️ MAM CIE CHUJU!",
                    color: 15158332,
                    fields: [
                        { name: "Nazwa", value: `**${mobName}**`, inline: true },
                        { name: "Mapa", value: mapName, inline: true },
                        { name: "Koordynaty", value: `(${x}, ${y})`, inline: true }
                    ],
                    footer: { text: "Szpinak Mob Notificator" },
                    timestamp: new Date().toISOString()
                }
            ]
        };

        // ZMIANA: fetch zamiast GM_xmlhttpRequest
        fetch(CONFIG.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (response.ok) console.log(`[Bocik] Wysłano ping: ${mobName}`);
            else console.error(`[Bocik] Błąd Discord: ${response.status}`);
        })
        .catch(error => console.error("[Bocik] Błąd sieci:", error));
    }

    function scanForMobs() {
        if (!isRunning) return;
        if (typeof g === 'undefined' || !g.npc) return;

        let now = Date.now();
        let cooldownMs = CONFIG.cooldownMinutes * 60 * 1000;

        for (let id in g.npc) {
            let npc = g.npc[id];
            if (!npc.nick) continue;

            if (CONFIG.targetMobs.includes(npc.nick)) {
                let lastTime = lastAlertTimes[npc.nick] || 0;

                if (now - lastTime > cooldownMs) {
                    let currentMap = (typeof map !== 'undefined' && map.name) ? map.name : "Nieznana mapa";
                    console.log(`[Bocik] Wykryto: ${npc.nick} (${npc.x},${npc.y}). Wysyłam.`);

                    sendDiscordAlert(npc.nick, currentMap, npc.x, npc.y);
                    lastAlertTimes[npc.nick] = now;
                }
            }
        }
    }

    setInterval(scanForMobs, 1000);
    console.log(`[Bocik] Mob Detector GUI: Ready.`);

    // --- INTEGRACJA Z HUBEM ---
    window.addEventListener('load', function() {
        const savedState = localStorage.getItem(STORAGE_VISIBLE_KEY);
        // Jeśli nie ma zapisu, domyślnie POKAŻ panel
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