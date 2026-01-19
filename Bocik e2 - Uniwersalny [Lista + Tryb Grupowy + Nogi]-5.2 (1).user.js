// ==UserScript==
// @name         Bocik e2 - Uniwersalny v5.3 [Hub Optimized]
// @namespace    http://tampermonkey.net/
// @version      5.3
// @author       Szpinak & Bocik
// @match        http*://*.margonem.pl/
// @match        http*://*.margonem.com/
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    const ADDON_ID = 'bocik_e2_uni'; // To ID dodaj do REPOSITORY w Hubie
    const STORAGE_VISIBLE_KEY = 'bocik_uni_gui_visible';
    const STORAGE_POS_KEY = 'bocik_uni_gui_pos';
    const STORAGE_RUNNING_KEY = 'bocik_uni_running';
    const STORAGE_GROUP_KEY = 'bocik_uni_group';

    // --- LISTA ID MOBÓW (Uzupełnij ID w cudzysłowach) ---
    const TARGET_IDS = [
        'npc146914', // Mushita
        '', // Kotołak Tropiciel
        '', // Shae Phu
        '', // Zorg Jednooki Baron
        '', // Władca rzek
        '', // Gobbos
        '', // Tyrtajos
        '', // Tollok Shimger
        '', // Szczęt alias Gładki
        '', // Agar
        '', // Razuglag Oklash
        '', // Foverk Turrim
        '', // Owadzia Matka
        '', // Furruk Kozug
        '', // Vari Kruger
        '', // Jotun
        '', // Tollok Utumutu
        '', // Tollok Atamatu
        '', // Lisz
        '', // Grabarz świątynny
        '', // Wielka Stopa
        '', // Podły zbrojmistrz
        '', // Choukker
        '', // Nadzorczyni krasnoludów
        '', // Morthen
        '', // Leśne Widmo
        '', // Żelazoręki Ohydziarz
        '', // Goplana
        '', // Gnom Figlid
        '', // Centaur Zyfryd
        '', // Kambion
        '', // Jertek Moxos
        '', // Miłośnik rycerzy
        '', // Miłośnik magii
        '', // Miłośnik łowców
        '', // Łowca czaszek
        'npc297224','npc297225', // Ozirus Władca Hieroglifów
        '', // Morski potwór
        '', // Krab pustelnik
        '', // Borgoros Garamir III
        '', // Stworzyciel
        '', // Ifryt
        '', // Młody Jack Truciciel
        '', // Helga Opiekunka Rumu
        '', // Henry Kaprawe Oko
        '', // Eol
        '', // Grubber Ochlaj
        '', // Mistrz Worundriel
        '', // Wójt Fistuła
        '', // Teściowa Rumcajsa
        '', // Berserker Amuno
        '', // Fodug Zolash
        '', // Goons Asterus
    ].filter(id => id.length > 0);

    // --- KONFIGURACJA ---
    const ATTACK_COOLDOWN = 4500;

    // Wczytanie z pamięci
    let isRunning = localStorage.getItem(STORAGE_RUNNING_KEY) === 'true';
    let isGroupMode = localStorage.getItem(STORAGE_GROUP_KEY) === 'true';
    let lastAttackTime = 0;

    // --- GUI CSS (FIXED: Usunięto sztywne pozycjonowanie) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            /* Usunięto sztywne top/left, aby nie psuć layoutu */
            width: 210px;
            background: #111; border: 2px solid #b026ff; border-radius: 10px;
            font-family: 'Verdana', sans-serif; z-index: 999999; color: #fff;
            box-shadow: 0 0 15px rgba(176, 38, 255, 0.3);
            display: none; /* Ukryte domyślnie, sterowane przez JS */
            flex-direction: column;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px; font-size: 11px; font-weight: bold;
            cursor: move; text-align: center; border-bottom: 1px solid #b026ff;
            border-radius: 8px 8px 0 0;
        }
        .bocik-content { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
        .bocik-status {
            font-size: 10px; text-align: center; background: #000;
            padding: 6px; border-radius: 5px; color: #dcb3ff; border: 1px solid #333;
        }
        .bocik-row {
            display: flex; align-items: center; justify-content: space-between;
            background: #1a1a1a; padding: 6px; border-radius: 5px; border: 1px solid #222;
        }
        .bocik-label { font-size: 10px; cursor: pointer; }
        .bocik-check { cursor: pointer; width: 14px; height: 14px; }
        .bocik-btn {
            width: 100%; padding: 8px; border: none; border-radius: 5px;
            font-weight: bold; cursor: pointer; text-transform: uppercase; font-size: 11px; transition: 0.2s;
        }
        .btn-off { background: #3a1c1c; color: #ff6b6b; border: 1px solid #d9534f; }
        .btn-on { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; }
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    // --- BUDOWA GUI ---
    const gui = document.createElement('div');
    gui.className = 'bocik-panel';
    gui.id = 'bocik-panel-uni';
    // Domyślna pozycja startowa
    gui.style.top = "200px";
    gui.style.left = "200px";

    gui.innerHTML = `
        <div class="bocik-header" id="bocikDragUni">BOCIK E2 - UNIWERSALNY</div>
        <div class="bocik-content">
            <div class="bocik-status" id="bocikStatUni">Gotowy</div>
            <div class="bocik-row">
                <label class="bocik-label" for="bocikGroupUni">Tryb Grupowy</label>
                <input type="checkbox" id="bocikGroupUni" class="bocik-check" ${isGroupMode ? 'checked' : ''}>
            </div>
            <button id="bocikTglUni" class="bocik-btn ${isRunning ? 'btn-on' : 'btn-off'}">${isRunning ? 'STOP (ON)' : 'START (OFF)'}</button>
        </div>
    `;
    document.body.appendChild(gui);

    const statusText = document.getElementById('bocikStatUni');
    const toggleButton = document.getElementById('bocikTglUni');
    const groupCheck = document.getElementById('bocikGroupUni');
    const dragHeader = document.getElementById('bocikDragUni');

    // --- OBSŁUGA UI ---
    if (isRunning) statusText.innerText = "Szukam celu...";

    toggleButton.onclick = () => {
        isRunning = !isRunning;
        localStorage.setItem(STORAGE_RUNNING_KEY, isRunning);
        toggleButton.innerText = isRunning ? 'STOP (ON)' : 'START (OFF)';
        toggleButton.className = `bocik-btn ${isRunning ? 'btn-on' : 'btn-off'}`;
        statusText.innerText = isRunning ? "Szukam celu..." : "Zatrzymany";
    };

    groupCheck.onchange = () => {
        isGroupMode = groupCheck.checked;
        localStorage.setItem(STORAGE_GROUP_KEY, isGroupMode);
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
        // Opcjonalne blokowanie (podwójne kliknięcie)
        handle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) { element.classList.add('panel-locked'); handle.style.cursor = "default"; }
            else { element.classList.remove('panel-locked'); handle.style.cursor = "move"; }
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
            element.style.bottom = 'auto'; element.style.right = 'auto';
        }
        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ top: element.style.top, left: element.style.left }));
        }
    })(gui, dragHeader);

    // --- LOGIKA ---
    function isVisible(elem) {
        const s = window.getComputedStyle(elem);
        return s && s.display !== 'none' && s.visibility !== 'hidden' && elem.offsetWidth > 0;
    }

    function getNearestMob() {
        let nearest = null;
        let minDistance = Infinity;

        TARGET_IDS.forEach(id => {
            const mob = document.getElementById(id);
            if (mob && isVisible(mob)) {
                const rect = mob.getBoundingClientRect();
                const dist = Math.hypot(rect.x - (window.innerWidth/2), rect.y - (window.innerHeight/2));
                if (dist < minDistance) {
                    minDistance = dist;
                    nearest = mob;
                }
            }
        });
        return nearest;
    }

    function clickMobLegs(element) {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + (rect.width / 2);
        const legsTop = rect.top + (rect.height * 0.75); // Celujemy nisko w nogi
        const legsHeight = rect.height * 0.15;

        const finalX = centerX + ((Math.random() - 0.5) * (rect.width * 0.3));
        const finalY = legsTop + (Math.random() * legsHeight);

        ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(type => {
            element.dispatchEvent(new MouseEvent(type, {
                bubbles: true, cancelable: true, view: window, clientX: finalX, clientY: finalY
            }));
        });
    }

    async function botLoop() {
        if (!isRunning) {
            setTimeout(botLoop, 1000);
            return;
        }

        // 1. Walka (Tryb Solo/Grupowy)
        const battleBtn = isGroupMode ? document.getElementById('autobattleAllButton') : document.getElementById('autobattleButton');

        if (battleBtn && isVisible(battleBtn)) {
            statusText.innerText = "Status: WALKA (" + (isGroupMode ? "GRP" : "SOLO") + ")";
            setTimeout(() => battleBtn.click(), Math.random() * 300 + 300);
        } else {
            // 2. Szukanie moba
            const target = getNearestMob();
            if (target) {
                if (Date.now() - lastAttackTime > ATTACK_COOLDOWN) {
                    statusText.innerText = "Atakuję: " + target.id;
                    clickMobLegs(target);
                    lastAttackTime = Date.now();
                } else {
                    statusText.innerText = "Status: Cooldown...";
                }
            } else {
                statusText.innerText = "Status: Skanowanie listy...";
            }
        }

        setTimeout(botLoop, Math.random() * 300 + 500);
    }

    // --- INTEGRACJA Z HUBEM ---
    window.addEventListener('load', function() {
        const savedState = localStorage.getItem(STORAGE_VISIBLE_KEY);
        // Jeśli nie ma zapisu, domyślnie ukryty
        const shouldBeVisible = savedState === 'true';
        gui.style.display = shouldBeVisible ? 'flex' : 'none';

        window.addEventListener('bocik:toggle-gui', function(e) {
            if (e.detail.id === ADDON_ID) {
                const isHidden = (gui.style.display === 'none' || gui.style.display === '');
                gui.style.display = isHidden ? 'flex' : 'none';
                localStorage.setItem(STORAGE_VISIBLE_KEY, isHidden ? 'true' : 'false');
            }
        });
        botLoop();
    });

})();