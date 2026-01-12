// ==UserScript==
// @name         Bot Ozirus
// @namespace    http://tampermonkey.net/
// @version      4.5
// @author       Szpinak & Bocik
// @match        http*://*.margonem.pl/
// @match        http*://*.margonem.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=margonem.pl
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- UNIKALNE ID DLA HUBA ---
    const ADDON_ID = 'ozirus_bot'; // To ID musi być takie samo w Hubie!

    // --- 1. ID MOBA ---
    const TARGET_ID = 'npc297224'; // ID Twojego E2

    // --- 2. KONFIGURACJA HITBOXA MOBA (E2) ---
    const MOB_OFFSET_X = 0;
    const MOB_OFFSET_Y = 20;
    const MOB_RANDOM_X = 15;
    const MOB_RANDOM_Y = 8;

    // --- 3. KONFIGURACJA HITBOXA PRZYCISKU ---
    const BTN_OFFSET_X = 0;
    const BTN_OFFSET_Y = 0;
    const BTN_RANDOM_X = 40;
    const BTN_RANDOM_Y = 6;

    // --- 4. CZASY ---
    const ATTACK_COOLDOWN = 4500;

    // --- ZMIENNE ROBOCZE ---
    let isRunning = false;
    let isGroupMode = false;
    let lastAttackTime = 0;

    // --- STYLE CSS (NEON THEME) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            bottom: 50px; right: 50px;
            width: 220px;
            background-color: #1a1a1a;
            border: 2px solid #b026ff;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(176, 38, 255, 0.2);
            font-family: 'Verdana', sans-serif;
            z-index: 99999;
            color: #fff;
            overflow: hidden;
            display: none; /* DOMYŚLNIE UKRYTE - Czekamy na sygnał Huba */
            flex-direction: column;
            user-select: none;
            transition: border-color 0.3s, box-shadow 0.3s;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px 12px;
            font-size: 12px;
            font-weight: bold;
            color: #dcb3ff;
            border-bottom: 1px solid #b026ff;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .bocik-content {
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .bocik-status {
            font-size: 11px;
            text-align: center;
            color: #ccc;
            background: #222;
            padding: 5px;
            border-radius: 6px;
            border: 1px solid #333;
        }
        .bocik-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #252525;
            padding: 8px;
            border-radius: 6px;
        }
        .bocik-checkbox-label {
            font-size: 11px;
            cursor: pointer;
            color: #eee;
        }
        /* Custom Checkbox */
        .bocik-checkbox {
            appearance: none;
            width: 16px;
            height: 16px;
            background: #333;
            border: 1px solid #555;
            border-radius: 4px;
            cursor: pointer;
            position: relative;
        }
        .bocik-checkbox:checked {
            background: #b026ff;
            border-color: #b026ff;
        }
        .bocik-checkbox:checked::after {
            content: '✔';
            position: absolute;
            font-size: 10px;
            color: white;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
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
            box-shadow: 0 0 10px rgba(92, 184, 92, 0.3);
        }
    `;
    document.head.appendChild(style);

    // --- BUDOWA GUI ---
    const gui = document.createElement('div');
    gui.className = 'bocik-panel';
    gui.innerHTML = `
        <div class="bocik-header" id="bocikHeader">
            <span>Bocik E2 - Ozirus</span>
            <span id="pinIcon">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="bocik-status" id="bocikStatus">Status: Oczekiwanie...</div>

            <div class="bocik-row">
                <label class="bocik-checkbox-label" for="botGroupMode">Tryb Grupowy</label>
                <input type="checkbox" id="botGroupMode" class="bocik-checkbox">
            </div>

            <button id="bocikToggle" class="bocik-btn btn-off">START (OFF)</button>
        </div>
    `;
    document.body.appendChild(gui);

    // --- ELEMENTY DOM ---
    const statusText = document.getElementById('bocikStatus');
    const groupCheckbox = document.getElementById('botGroupMode');
    const toggleButton = document.getElementById('bocikToggle');
    const header = document.getElementById('bocikHeader');
    const pinIcon = document.getElementById('pinIcon');

    // --- OBSŁUGA ZDARZEŃ ---

    groupCheckbox.onchange = function() {
        isGroupMode = groupCheckbox.checked;
        if (!isRunning) statusText.innerText = isGroupMode ? 'Tryb: GRUPOWY' : 'Tryb: SOLO';
    };

    toggleButton.onclick = function() {
        isRunning = !isRunning;
        if (isRunning) {
            toggleButton.innerText = 'STOP (ON)';
            toggleButton.className = 'bocik-btn btn-on';
            statusText.innerText = 'Status: Szukam celu...';
        } else {
            toggleButton.innerText = 'START (OFF)';
            toggleButton.className = 'bocik-btn btn-off';
            statusText.innerText = 'Status: Zatrzymany';
        }
    };

    // --- DRAGGABLE & PIN MODULE ---
    (function makeDraggable(element, dragHandle) {
        let isPinned = false;
        let offsetX = 0, offsetY = 0, mouseX = 0, mouseY = 0;

        dragHandle.onmousedown = dragMouseDown;

        // Podwójne kliknięcie -> KOTWICA
        dragHandle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) {
                element.style.borderColor = "#444"; // Szara ramka = zablokowane
                element.style.boxShadow = "none";
                dragHandle.style.cursor = "default";
                dragHandle.style.background = "#222";
                pinIcon.innerText = "🔒";
            } else {
                element.style.borderColor = "#b026ff"; // Fioletowa ramka = ruchome
                element.style.boxShadow = "0 0 15px rgba(176, 38, 255, 0.2)";
                dragHandle.style.cursor = "move";
                dragHandle.style.background = "linear-gradient(90deg, #2a0e36 0%, #4a126b 100%)";
                pinIcon.innerText = "🔓";
            }
        };

        function dragMouseDown(e) {
            if (isPinned) return;
            e = e || window.event;
            e.preventDefault();
            mouseX = e.clientX;
            mouseY = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            offsetX = mouseX - e.clientX;
            offsetY = mouseY - e.clientY;
            mouseX = e.clientX;
            mouseY = e.clientY;
            element.style.top = (element.offsetTop - offsetY) + "px";
            element.style.left = (element.offsetLeft - offsetX) + "px";
            element.style.bottom = "auto";
            element.style.right = "auto";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    })(gui, header);


    // --- LOGIKA BOTA (Bez zmian, tylko update statusu) ---

    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    function isVisible(elem) {
        if (!elem) return false;
        const style = window.getComputedStyle(elem);
        return style && style.display !== 'none' && style.visibility !== 'hidden' && elem.offsetWidth > 0;
    }

    function simulateNaturalClick(element, offX, offY, randX, randY) {
        if (!element) return;
        var rect = element.getBoundingClientRect();
        var centerX = rect.left + (rect.width / 2);
        var centerY = rect.top + (rect.height / 2);
        var targetBaseX = centerX + offX;
        var targetBaseY = centerY + offY;
        var noiseX = (Math.random() - 0.5) * 2 * randX;
        var noiseY = (Math.random() - 0.5) * 2 * randY;
        var finalX = targetBaseX + noiseX;
        var finalY = targetBaseY + noiseY;

        ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(eventType => {
            var event = new MouseEvent(eventType, {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: finalX,
                clientY: finalY
            });
            element.dispatchEvent(event);
        });
    }

    function getBattleButton() {
        if (isGroupMode) {
            let btn = document.getElementById('autobattleAllButton');
            return (btn && isVisible(btn)) ? btn : null;
        } else {
            let btn = document.getElementById('autobattleButton');
            return (btn && isVisible(btn)) ? btn : null;
        }
    }

    async function botLoop() {
        if (isRunning) {
            let battleBtn = getBattleButton();

            if (battleBtn) {
                statusText.innerText = 'Status: Walka!';
                statusText.style.color = '#f0ad4e';

                await sleep(getRandomDelay(400, 900));
                simulateNaturalClick(battleBtn, BTN_OFFSET_X, BTN_OFFSET_Y, BTN_RANDOM_X, BTN_RANDOM_Y);
                lastAttackTime = 0;
                await sleep(getRandomDelay(1000, 2000));

            } else {
                var mob = document.getElementById(TARGET_ID);

                if (mob && isVisible(mob)) {
                    if (Date.now() - lastAttackTime > ATTACK_COOLDOWN) {
                        statusText.innerText = 'Status: Podchodzę...';
                        statusText.style.color = '#5bc0de';
                        await sleep(getRandomDelay(300, 1000));
                        simulateNaturalClick(mob, MOB_OFFSET_X, MOB_OFFSET_Y, MOB_RANDOM_X, MOB_RANDOM_Y);
                        await sleep(getRandomDelay(2000, 2500));

                        if(isVisible(mob)) {
                            statusText.innerText = 'Status: Atakuję!';
                            statusText.style.color = '#bd42ff'; // Fioletowy w stylu UI
                            simulateNaturalClick(mob, MOB_OFFSET_X, MOB_OFFSET_Y, MOB_RANDOM_X, MOB_RANDOM_Y);
                            await sleep(getRandomDelay(900, 1200));

                            let checkBattleBtn = getBattleButton();
                            if (checkBattleBtn) {
                                lastAttackTime = Date.now();
                            } else {
                                statusText.innerText = 'Status: Poprawiam!';
                                lastAttackTime = 0;
                            }
                        }
                    } else {
                        statusText.innerText = 'Status: Cooldown...';
                        statusText.style.color = '#999';
                    }
                } else {
                    statusText.innerText = 'Status: Skanowanie...';
                    statusText.style.color = '#ccc';
                }
            }
        }
        let loopDelay = isRunning ? getRandomDelay(400, 800) : 2000;
        setTimeout(botLoop, loopDelay);
    }

    window.addEventListener('load', function() {
        // --- 5. ODBIORNIK SYGNAŁU Z HUBA ---
        // Na start ukrywamy (CSS ma display:none, ale dla pewności możemy wymusić)

        // Pokaż panel jeśli Hub wyśle sygnał
        window.addEventListener('bocik:toggle-gui', function(e) {
            if (e.detail.id === ADDON_ID) {
                if (gui.style.display === 'none' || gui.style.display === '') {
                    gui.style.display = 'flex';
                } else {
                    gui.style.display = 'none';
                }
            }
        });

        // Wymuś pokazanie przy starcie (opcjonalnie, jeśli chcesz by był widoczny od razu po włączeniu w hubie)
        // Ale zgodnie z Twoim życzeniem "Hub" ma tym zarządzać, więc domyślnie czekamy.
        gui.style.display = 'none'; // Zmień na 'none' jeśli ma być ukryty po odświeżeniu

        botLoop();
    });

})();
