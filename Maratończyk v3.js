// ==UserScript==
// @name         Maratończyk v1.7 [Hub Optimized]
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Chodzenie po trasach, Neon UI, Drag&Pin, Integracja z Hubem
// @author       Szpinak & Bocik
// @match        http*://*.margonem.pl/
// @match        http*://*.margonem.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=margonem.pl
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    const ADDON_ID = 'maratonczyk'; // To ID dodaj do REPOSITORY w Hubie
    const STORAGE_VISIBLE_KEY = 'bocik_walker_gui_visible';
    const STORAGE_POS_KEY = 'bocik_walker_gui_pos';

    // --- 1. KONFIGURACJA TRASY ---
    const ROUTES = {
        "Kocha od Vesy": [
            { mapName: "Mglista Polana Vesy", gateId: "gw10253", waypoints: [[44,11],[3,19]] },
            { mapName: "Zagrzybiałe Ścieżki p.1 - sala 3", gateId: "gw11034", waypoints: [[34,11]] },
            { mapName: "Zagrzybiałe Ścieżki p.2", gateId: "gw8963", waypoints: [[31,16],[33,40]] },
            { mapName: "Zagrzybiałe Ścieżki p.1 - sala 2", gateId: "gw11785", waypoints: [] },
            { mapName: "Gadzia Kotlina", gateId: "gw59", waypoints: [[14,34],[40,44],[59,46],[73,20]] },
            { mapName: "Złowrogie Bagna", gateId: "gw13320", waypoints: [[51,21],[23,37]] },
            { mapName: "Zagrzybiałe Ścieżki p.1 - sala 1", gateId: "gw11017", waypoints: [[17,35],[33,18]] },
            { mapName: "Złowrogie Bagna", gateId: "gw21", waypoints: [[10,11]] },
            { mapName: "Błędny Szlak", gateId: "gw6400", waypoints: [[37,45],[26,4],[8,44]] },
            { mapName: "Zawiły Bór", gateId: "gw9728", waypoints: [[85,9],[52,9],[19,47]] },
            { mapName: "Selva Oscura", gateId: "gw59", waypoints: [[25,20],[77,15]] },
            { mapName: "Dolina Centaurów", gateId: "gw9567", waypoints: [[9,51],[68,20],[83,49]] },
            { mapName: "Iglaste Ścieżki", gateId: "gw7775", waypoints: [[20,13],[29,51],[66,49],[85,42],[80,11]] },
            { mapName: "Ostępy Szalbierskich Lasów", gateId: "gw16192", waypoints: [] },
            { mapName: "Błędny Szlak", gateId: "gw16150", waypoints: [] },
            { mapName: "Złowrogie Bagna", gateId: "gw16186", waypoints: [] },
            { mapName: "Gadzia Kotlina", gateId: "gw9055", waypoints: [] }
        ],
        "Kasim od Ozirusa": [
             { mapName: "Piramida Pustynnego Władcy p.3", gateId: "gw9490", waypoints: [] },
             { mapName: "Piramida Pustynnego Władcy p.2", gateId: "gw1559", waypoints: [] },
             { mapName: "Piramida Pustynnego Władcy p.1", gateId: "gw12558", waypoints: [[15,10],[38,31]] },
             { mapName: "Złote Piaski", gateId: "gw14655", waypoints: [[14,32],[16,63],[45,59]] },
             { mapName: "Ruiny Pustynnych Burz", gateId: "gw14592", waypoints: [[23,83],[41,75],[18,30]] },
             { mapName: "Złote Piaski", gateId: "gw22", waypoints: [[42,9]] },
             { mapName: "Płaskowyż Arpan", gateId: "gw4694", waypoints: [[73,50],[71,15]] },
             { mapName: "Skalne Cmentarzysko p.1", gateId: "gw1545", waypoints: [[5,17]] },
             { mapName: "Skalne Cmentarzysko p.2", gateId: "gw11552", waypoints: [[8,40]] },
             { mapName: "Skalne Cmentarzysko p.3", gateId: "gw11317", waypoints: [[35,39],[49,17],[18,38]] },
             { mapName: "Skalne Cmentarzysko p.2", gateId: "gw518", waypoints: [[37,26]] },
             { mapName: "Skalne Cmentarzysko p.1", gateId: "gw7445", waypoints: [] },
             { mapName: "Płaskowyż Arpan", gateId: "gw12800", waypoints: [[37, 32]] },
             { mapName: "Sucha Dolina", gateId: "gw24365", waypoints: [[40,28],[30,33],[36,81]] },
             { mapName: "Stare Sioło", gateId: "gw9823", waypoints: [[86,8],[79,41]] },
             { mapName: "Oaza Siedmiu Wichrów", gateId: "gw24366", waypoints: [[27,71],[37,42],[43,38]] },
             { mapName: "Ciche Rumowiska", gateId: "gw16179", waypoints: [[23,7],[60,45],[25,56]] },
             { mapName: "Wioska Rybacka", gateId: "gw51", waypoints: [[26,19],[83,39],[79,8]] },
             { mapName: "Ciche Rumowiska", gateId: "gw11359", waypoints: [[79,13],[83,45]] },
             { mapName: "Dolina Suchych Łez", gateId: "gw14", waypoints: [[33,55],[68,54],[79,21],[54,18]] },
             { mapName: "Złote Piaski", gateId: "gw8472", waypoints: [] },
             { mapName: "Piramida Pustynnego Władcy p.1", gateId: "gw284", waypoints: [] },
             { mapName: "Piramida Pustynnego Władcy p.2", gateId: "gw10003", waypoints: [] },
             { mapName: "Piramida Pustynnego Władcy p.3", gateId: "", waypoints: [[22,15]] }
        ],
        "Kasim od Ruin": [
             { mapName: "Ruiny Pustynnych Burz", gateId: "gw14592", waypoints: [[23,83],[41,75],[18,30]] },
             { mapName: "Złote Piaski", gateId: "gw8472", waypoints: [[44,55],[18,69],[13,29]] },
             { mapName: "Piramida Pustynnego Władcy p.1", gateId: "gw284", waypoints: [[41,35],[9,11]] },
             { mapName: "Piramida Pustynnego Władcy p.2", gateId: "gw1559", waypoints: [[19,24]] },
             { mapName: "Piramida Pustynnego Władcy p.1", gateId: "gw12558", waypoints: [] },
             { mapName: "Złote Piaski", gateId: "gw22", waypoints: [[44,7]] },
             { mapName: "Płaskowyż Arpan", gateId: "gw4694", waypoints: [[73,50],[71,15]] },
             { mapName: "Skalne Cmentarzysko p.1", gateId: "gw1545", waypoints: [[5,17]] },
             { mapName: "Skalne Cmentarzysko p.2", gateId: "gw11552", waypoints: [[8,40]] },
             { mapName: "Skalne Cmentarzysko p.3", gateId: "gw11317", waypoints: [[35,39],[49,17],[18,38]] },
             { mapName: "Skalne Cmentarzysko p.2", gateId: "gw518", waypoints: [[37,26]] },
             { mapName: "Skalne Cmentarzysko p.1", gateId: "gw7445", waypoints: [] },
             { mapName: "Płaskowyż Arpan", gateId: "gw12800", waypoints: [[37,32]] },
             { mapName: "Sucha Dolina", gateId: "gw24365", waypoints: [[40,28],[30,33],[36,81]] },
             { mapName: "Stare Sioło", gateId: "gw9823", waypoints: [[86,8],[79,41]] },
             { mapName: "Oaza Siedmiu Wichrów", gateId: "gw24366", waypoints: [[27,71],[37,42],[43,38]] },
             { mapName: "Ciche Rumowiska", gateId: "gw16179", waypoints: [[23,7],[60,45],[25,56]] },
             { mapName: "Wioska Rybacka", gateId: "gw51", waypoints: [[26,19],[83,39],[79,8]] },
             { mapName: "Ciche Rumowiska", gateId: "gw11359", waypoints: [[79,13],[83,45]] },
             { mapName: "Dolina Suchych Łez", gateId: "gw14", waypoints: [[33,55],[68,54],[79,21],[54,18]] },
             { mapName: "Złote Piaski", gateId: "gw14655", waypoints: [] }
        ]
    };

    // --- 2. USTAWIENIA CZASOWE ---
    const WALK_DELAY_MIN = 1000;
    const WALK_DELAY_MAX = 3000;
    const ARRIVAL_PAUSE_MIN = 500;
    const ARRIVAL_PAUSE_MAX = 1500;
    const WAYPOINT_TOLERANCE = 3;
    const CLICK_RANDOMNESS = 15;

    // --- 3. PAMIĘĆ WEWNĘTRZNA (stan bota) ---
    const STORAGE_PREFIX = 'bocik_walker_v1_6_';
    let isRunning = localStorage.getItem(STORAGE_PREFIX + 'running') === 'true';
    let isLooping = localStorage.getItem(STORAGE_PREFIX + 'loop') === 'true';
    let currentRouteKey = localStorage.getItem(STORAGE_PREFIX + 'route') || Object.keys(ROUTES)[0];
    let currentMapIndex = parseInt(localStorage.getItem(STORAGE_PREFIX + 'mapIdx')) || 0;

    let visitedFlags = [];
    let lastActionTime = 0;
    let lastMapCheck = "";

    // --- HELPERY ---
    function getRandomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    // --- STYLE CSS (NEON THEME) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            /* Domyślna pozycja startowa */
            top: 150px; left: 150px;
            width: 200px;
            background-color: #1a1a1a;
            border: 2px solid #b026ff;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(176, 38, 255, 0.2);
            font-family: 'Verdana', sans-serif;
            z-index: 99999;
            color: #fff;
            overflow: hidden;
            display: none; /* Ukryte domyślnie, JS steruje */
            flex-direction: column;
            user-select: none;
            transition: border-color 0.3s;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px 12px; font-size: 11px; font-weight: bold; color: #dcb3ff;
            border-bottom: 1px solid #b026ff; cursor: move; display: flex; justify-content: space-between; align-items: center;
        }
        .bocik-content { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .status-box { background: #222; border: 1px solid #333; border-radius: 6px; padding: 6px; text-align: center; font-size: 11px; color: #ccc; }
        .bocik-select { width: 100%; background: #111; border: 1px solid #b026ff; color: #fff; padding: 5px; border-radius: 4px; font-size: 10px; outline: none; }
        .control-row { display: flex; justify-content: space-between; align-items: center; background: #252525; padding: 5px 8px; border-radius: 6px; }
        .bocik-btn { width: 100%; padding: 8px; border: none; border-radius: 6px; font-weight: bold; font-size: 11px; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px; color: white; }
        .btn-start { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; }
        .btn-stop { background: #3a1c1c; color: #ff6b6b; border: 1px solid #d9534f; }
        .btn-reset { background: #333; color: #ccc; border: 1px solid #555; font-size: 9px; padding: 4px; width: auto; margin-left: 5px; }
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
        /* Custom Checkbox */
        .switch { position: relative; display: inline-block; width: 30px; height: 16px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 16px; }
        .slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #b026ff; }
        input:checked + .slider:before { transform: translateX(14px); }
    `;
    document.head.appendChild(style);

    // --- BUDOWA GUI ---
    const panel = document.createElement('div');
    panel.className = 'bocik-panel';
    panel.id = 'bocik-panel-walker';
    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleWalker">
            <span>🏃 Maratończyk</span>
            <span id="pinIconWalker">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="status-box" id="statusLabelWalker">Wczytywanie...</div>
            <select id="routeSelectWalker" class="bocik-select"></select>
            <div class="control-row">
                <div style="display:flex; align-items:center; gap:5px;">
                    <label class="switch">
                        <input type="checkbox" id="loopCheckboxWalker">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size:10px; color:#aaa;">Pętla</span>
                </div>
                <button id="resetBtnWalker" class="bocik-btn btn-reset">↺ Reset</button>
            </div>
            <button id="toggleBtnWalker" class="bocik-btn btn-start">START</button>
        </div>
    `;
    document.body.appendChild(panel);

    // --- ELEMENTY DOM ---
    const dragHandle = document.getElementById('dragHandleWalker');
    const pinIcon = document.getElementById('pinIconWalker');
    const statusLabel = document.getElementById('statusLabelWalker');
    const routeSelect = document.getElementById('routeSelectWalker');
    const loopCheckbox = document.getElementById('loopCheckboxWalker');
    const resetBtn = document.getElementById('resetBtnWalker');
    const toggleBtn = document.getElementById('toggleBtnWalker');

    // --- WYPEŁNIANIE DANYCH ---
    Object.keys(ROUTES).forEach(k => {
        const opt = document.createElement('option');
        opt.value = k; opt.innerText = k;
        routeSelect.appendChild(opt);
    });
    routeSelect.value = currentRouteKey;
    loopCheckbox.checked = isLooping;

    // --- OBSŁUGA ZDARZEŃ ---
    routeSelect.onchange = () => { setRoute(routeSelect.value, 0); };
    loopCheckbox.onchange = () => { isLooping = loopCheckbox.checked; localStorage.setItem(STORAGE_PREFIX + 'loop', isLooping); };
    resetBtn.onclick = () => { currentMapIndex = 0; visitedFlags = []; saveState(); updateGui(); };
    toggleBtn.onclick = () => { isRunning = !isRunning; localStorage.setItem(STORAGE_PREFIX + 'running', isRunning); updateGui(); };

    // --- DRAGGABLE MODULE (WITH MEMORY) ---
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
                element.classList.remove('panel-locked'); handle.style.cursor = "move"; handle.style.background = "linear-gradient(90deg, #2a0e36 0%, #4a126b 100%)"; pinIcon.innerText = "🔓";
            }
        };

        function dragMouseDown(e) {
            if (isPinned) return;
            if (['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;
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

    // --- LOGIKA WALKER (Bez zmian) ---
    function setRoute(key, idx) {
        if (!ROUTES[key]) return;
        currentRouteKey = key; currentMapIndex = idx; visitedFlags = []; saveState(); updateGui();
    }
    function saveState() {
        localStorage.setItem(STORAGE_PREFIX + 'route', currentRouteKey);
        localStorage.setItem(STORAGE_PREFIX + 'mapIdx', currentMapIndex);
    }
    function updateGui() {
        if(isRunning) { toggleBtn.innerText = "STOP"; toggleBtn.className = "bocik-btn btn-stop"; }
        else { toggleBtn.innerText = "START"; toggleBtn.className = "bocik-btn btn-start"; }

        const route = ROUTES[currentRouteKey];
        if (!route) return;
        const mapConfig = route[currentMapIndex];
        const mapName = mapConfig ? mapConfig.mapName : "KONIEC TRASY";

        statusLabel.innerHTML = `
            <div style="font-weight:bold; color:#fff">Mapa: ${currentMapIndex+1} / ${route.length}</div>
            <div style="font-size:9px; color:#aaa; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${mapName}</div>
        `;
    }

    function syncMap() {
        if (!window.map || !window.map.name) return;
        const gameMap = window.map.name;
        if (gameMap === lastMapCheck) return;
        lastMapCheck = gameMap;
        const route = ROUTES[currentRouteKey];
        if (!route) return;
        if (route[currentMapIndex] && route[currentMapIndex].mapName === gameMap) return;
        // Pętla
        if (currentMapIndex === route.length - 1 && route[0].mapName === gameMap) {
            if (isLooping) { currentMapIndex = 0; visitedFlags = []; saveState(); updateGui(); return; }
            else { finishRoute(); return; }
        }
        // Korekta
        const candidates = [currentMapIndex + 1, currentMapIndex, currentMapIndex - 1];
        for (let idx of candidates) {
            if (route[idx] && route[idx].mapName === gameMap) { currentMapIndex = idx; visitedFlags = []; saveState(); updateGui(); return; }
        }
        // Szukanie globalne
        let bestIdx = -1, minDist = 9999;
        route.forEach((step, idx) => {
            if (step.mapName === gameMap) {
                const dist = Math.abs(idx - currentMapIndex);
                if (dist < minDist) { minDist = dist; bestIdx = idx; }
            }
        });
        if (bestIdx !== -1) {
            if (!isLooping && currentMapIndex === route.length - 1 && bestIdx === 0) {}
            else { currentMapIndex = bestIdx; visitedFlags = []; saveState(); updateGui(); }
        }
    }

    function finishRoute() { isRunning = false; localStorage.setItem(STORAGE_PREFIX + 'running', false); statusLabel.innerHTML = "<span style='color:#7aff7a; font-weight:bold'>TRASA UKOŃCZONA</span>"; updateGui(); }
    function walkTo(x, y) { if (window.hero && window.hero.searchPath) window.hero.searchPath(x, y); }
    function getDist(tx, ty) { return Math.sqrt(Math.pow(tx - window.hero.x, 2) + Math.pow(ty - window.hero.y, 2)); }
    function simulateClick(el) {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const evt = new MouseEvent('click', { bubbles: true, clientX: r.left + r.width/2, clientY: r.top + r.height/2 });
        el.dispatchEvent(evt);
    }

    async function mainLoop() {
        if (isRunning && window.map && window.hero) {
            syncMap();
            const route = ROUTES[currentRouteKey];
            const config = route ? route[currentMapIndex] : null;
            if (config && config.mapName === window.map.name) {
                if (visitedFlags.length !== config.waypoints.length) visitedFlags = new Array(config.waypoints.length).fill(false);
                config.waypoints.forEach((wp, i) => {
                    if (wp && wp.length >= 2 && !visitedFlags[i] && getDist(wp[0], wp[1]) <= WAYPOINT_TOLERANCE) {
                        visitedFlags[i] = true;
                        if (Date.now() + getRandomInt(ARRIVAL_PAUSE_MIN, ARRIVAL_PAUSE_MAX) > lastActionTime) lastActionTime = Date.now() + getRandomInt(ARRIVAL_PAUSE_MIN, ARRIVAL_PAUSE_MAX);
                    }
                });
                if (Date.now() > lastActionTime) {
                    const nextWpIdx = visitedFlags.findIndex(f => !f);
                    if (nextWpIdx !== -1) {
                        const [wx, wy] = config.waypoints[nextWpIdx];
                        walkTo(wx, wy); lastActionTime = Date.now() + getRandomInt(WALK_DELAY_MIN, WALK_DELAY_MAX);
                    } else {
                        const gate = document.getElementById(config.gateId);
                        if (gate) {
                             if (getDist(parseInt(gate.style.left)/32, parseInt(gate.style.top)/32) > 1.5) { walkTo(parseInt(gate.style.left)/32, parseInt(gate.style.top)/32); lastActionTime = Date.now() + getRandomInt(WALK_DELAY_MIN, WALK_DELAY_MAX); }
                             else { simulateClick(gate); lastActionTime = Date.now() + 2000; }
                        } else {
                            if (currentMapIndex === route.length - 1) {
                                if (isLooping) { currentMapIndex = 0; visitedFlags = []; saveState(); updateGui(); return; }
                                else { finishRoute(); }
                            } else { lastActionTime = Date.now() + 1000; }
                        }
                    }
                }
            }
        }
        setTimeout(mainLoop, 400);
    }

    // --- HUB LISTENER & START ---
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
        updateGui();
        mainLoop();
    });
})();
