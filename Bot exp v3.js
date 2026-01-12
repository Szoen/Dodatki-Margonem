// ==UserScript==
// @name         Bot Exp v36.3 [Layout Fix]
// @namespace    http://tampermonkey.net/
// @version      36.3
// @description  Bot do expienia. Naprawiono konflikt stylów (rozciąganie innych okien).
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
    const ADDON_ID = 'bot_exp';
    const STORAGE_VISIBLE_KEY = 'bocik_exp_gui_visible';
    const STORAGE_POS_KEY = 'bocik_exp_gui_pos';

    // --- PAMIĘĆ STANU BOTA ---
    const STORAGE_KEY_RUNNING = 'bocik_exp_isRunning';
    const STORAGE_KEY_LOOP = 'bocik_exp_isLooping';
    const STORAGE_KEY_SET = 'bocik_exp_currentSet';
    const STORAGE_KEY_MAP_IDX = 'bocik_exp_mapIndex';

    // --- 1. KONFIGURACJA EXPOWISK ---
    const BLACKLIST_IDS = ["npc222580","npc224626","npc224495","npc170533","npc170018","npc169836",
                           "npc169832","npc62366","npc62403","npc170532","npc169837","npc62368","npc62405",
                           "npc169841","npc62348","npc62359","npc170535","npc169845","npc170534","npc62369",
                           "npc170519","npc211717","npc211723","npc298619","npc298515","npc297526","npc297521",
                           "npc297520","npc268255","npc283198","npc207710","npc207711","npc207712","npc207761",
                           "npc279861"];
    const SHOW_MOB_IDS = true;

    const HUNTING_SETS = {
        "Demony": {
            whitelist: ["Paskudny demon","Pomniejszy demon","Mały demon","Nieznośny demon","Kąśliwy demon","Dokuczliwy bies"],
            maps: [
                { mapName: "Przeklęta Strażnica", gateId: "gw523", waypoints: [] },
                { mapName: "Przeklęta Strażnica p.1", gateId: "gw5127", waypoints: [] },
                { mapName: "Przeklęta Strażnica", gateId: "gw4098", waypoints: [] },
                { mapName: "Przeklęta Strażnica - podziemia p.1 s.1", gateId: "gw9765", waypoints: [] },
                { mapName: "Przeklęta Strażnica - podziemia p.2 s.1", gateId: "gw784", waypoints: [] },
                { mapName: "Przeklęta Strażnica - podziemia p.1 s.1", gateId: "gw531", waypoints: [] },
                { mapName: "Przeklęta Strażnica", gateId: "gw4115", waypoints: [] },
                { mapName: "Przeklęta Strażnica - podziemia p.1 s.2", gateId: "gw9252", waypoints: [] },
                { mapName: "Przeklęta Strażnica - podziemia p.2 s.2", gateId: "gw1043", waypoints: [] },
                { mapName: "Przeklęta Strażnica - podziemia p.1 s.2", gateId: "gw6402", waypoints: [] },
            ]
        },
        "Ghule": {
            whitelist: ["Ghul zwiadowca","Ghul słabeusz","Ghul cmentarny","Ghul nocny","Ghul szaman","Ghul wojownik"],
            maps: [
                { mapName: "Ghuli Mogilnik", gateId: "gw16151", waypoints: [] },
                { mapName: "Polana Ścierwojadów", gateId: "gw23", waypoints: [] },
                { mapName: "Ghuli Mogilnik", gateId: "gw5407", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.1", gateId: "gw2075", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.2", gateId: "gw13597", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.3", gateId: "gw8506", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.4", gateId: "gw15916", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.5", gateId: "gw776", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.4", gateId: "gw1311", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.3", gateId: "gw7456", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.2", gateId: "gw2871", waypoints: [] },
                { mapName: "Zapomniany Grobowiec p.1", gateId: "gw7696", waypoints: [] },
            ]
        },
        "Gobliny": {
            whitelist: ["Zły goblin","Goblin traper","Pancerny goblin","Mistrz fechtunku","Władca krzegów"],
            maps: [
                { mapName: "Las Goblinów", gateId: "gw43", waypoints: [] },
                { mapName: "Podmokła Dolina", gateId: "gw33", waypoints: [] },
                { mapName: "Morwowe Przejście", gateId: "gw16160", waypoints: [] },
                { mapName: "Podmokła Dolina", gateId: "gw16170", waypoints: [] },
            ]
        },
        "Zbiry": {
            whitelist: ["Niegodziwy drań","Nikczemny łotr","Podły szabrownik","Podżerka krwawa"],
            maps: [
                { mapName: "Stary Kupiecki Trakt", gateId: "gw24352", waypoints: [] },
                { mapName: "Stukot Widmowych Kół", gateId: "gw24339", waypoints: [] },
                { mapName: "Wertepy Rzezimieszków", gateId: "gw18", waypoints: [] },
                { mapName: "Stukot Widmowych Kół", gateId: "gw32", waypoints: [] },
            ]
        },
        "Galarety": {
            whitelist: ["Zgniła galareta","Trująca galareta","Pąsowa galareta","Wodna galareta","Przeźroczysta galareta","Morska galareta"],
            maps: [
                { mapName: "Mokra Grota p.1", gateId: "gw2855", waypoints: [] },
                { mapName: "Mokra Grota p.1 - przełaz", gateId: "gw771", waypoints: [] },
                { mapName: "Mokra Grota p.1 - boczny korytarz", gateId: "gw15628", waypoints: [] },
            ]
        },
        "Żądłaki": {
            whitelist: ["Żądłak","Wściekłówka","Żądłak rogaty",],
            maps: [
                { mapName: "Kopalnia Kapiącego Miodu p.1 - sala 1", gateId: "gw3105", waypoints: [] },
                { mapName: "Kopalnia Kapiącego Miodu p.2 - sala 1", gateId: "gw6428", waypoints: [] },
                { mapName: "Kopalnia Kapiącego Miodu p.3", gateId: "gw1031", waypoints: [] },
                { mapName: "Kopalnia Kapiącego Miodu p.2 - sala 2", gateId: "gw13829", waypoints: [] },
                { mapName: "Kopalnia Kapiącego Miodu p.1 - sala 2", gateId: "gw15625", waypoints: [] },
                { mapName: "Porzucone Pasieki", gateId: "gw7221", waypoints: [] },
            ]
        },
        "Koboldy": {
            whitelist: ["Kobold","Kobold łucznik","Kobold nożownik",],
            maps: [
                { mapName: "Lazurytowa Grota p.1", gateId: "gw3354", waypoints: [] },
                { mapName: "Lazurytowa Grota p.2", gateId: "gw7209", waypoints: [] },
                { mapName: "Lazurytowa Grota p.3 - sala 2", gateId: "gw1809", waypoints: [] },
                { mapName: "Lazurytowa Grota p.3 - sala 1", gateId: "gw262", waypoints: [] },
                { mapName: "Lazurytowa Grota p.2", gateId: "gw1298", waypoints: [] },
            ]
        },
        "Rosomaki/Mrówki": {
            whitelist: ["Rosomak skalny","Rosomak","Mrówka robotnica","Mrówka żołnierz","Mrówka z larwą"],
            maps: [
                { mapName: "Leśny Bród", gateId: "gw13827", waypoints: [] },
                { mapName: "Mrówcza Kolonia p.1 - lewy tunel", gateId: "gw7451", waypoints: [] },
                { mapName: "Mrówcza Kolonia p.2 - lewe korytarze", gateId: "gw12298", waypoints: [] },
                { mapName: "Mrówcza Kolonia p.3 - lewa komora jaj", gateId: "gw12333", waypoints: [] },
                { mapName: "Mrówcza Kolonia p.4 - królewskie gniazdo", gateId: "gw566", waypoints: [] },
                { mapName: "Mrówcza Kolonia p.3 - prawa komora jaj", gateId: "gw555", waypoints: [] },
                { mapName: "Mrówcza Kolonia p.2 - prawe korytarze", gateId: "gw1028", waypoints: [] },
                { mapName: "Mrówcza Kolonia p.1 - prawy tunel", gateId: "gw5657", waypoints: [] },
            ]
        },
        "Mnisi/Magazynierzy": {
            whitelist: ["Członek zakonu","Brat andaryjski","Pokutujący zakonnik","Wojownik w habicie","Zamyślony mnich","Zakapturzony mędrzec",
                        "Wytatuowany osiłek","Kawał chłopa","Świątynny kucharz","Nadęty dryblas","Magazynier z halabardą"],
            maps: [
                { mapName: "Świątynia Andarum", gateId: "gw4613", waypoints: [] },
                { mapName: "Świątynia Andarum - zejście lewe", gateId: "gw8197", waypoints: [] },
                { mapName: "Świątynia Andarum - podziemia", gateId: "gw5889", waypoints: [] },
                { mapName: "Świątynia Andarum - magazyn p.1", gateId: "gw13104", waypoints: [] },
                { mapName: "Świątynia Andarum - magazyn p.2", gateId: "gw6238", waypoints: [] },
                { mapName: "Świątynia Andarum - lokum mnichów", gateId: "gw525", waypoints: [] },
                { mapName: "Świątynia Andarum - podziemia", gateId: "gw310", waypoints: [] },
                { mapName: "Świątynia Andarum - zejście prawe", gateId: "gw264", waypoints: [] },
            ]
        },
        "Margoria": {
            whitelist: ["Krasnoludzki górnik","Krasnoludzki strażnik","Krasnoludzki kowal","Krasnoludzki wojownik"],
            maps: [
                { mapName: "Margoria", gateId: "gw22792", waypoints: [] },
                { mapName: "Kopalnia Margorii", gateId: "gw3381", waypoints: [[30,92]] },
                { mapName: "Labirynt Margorii", gateId: "gw2566", waypoints: [[75,10]] },
            ]
        },
        "Południce": {
            whitelist: ["Południca","Wieczornica"],
            maps: [
                { mapName: "Wzgórze Płaczek", gateId: "gw8997", waypoints: [] },
                { mapName: "Płacząca Grota p.1 - sala 1", gateId: "gw7436", waypoints: [] },
                { mapName: "Płacząca Grota p.2", gateId: "gw7481", waypoints: [] },
                { mapName: "Płacząca Grota p.1 - sala 2", gateId: "gw4907", waypoints: [] },
                { mapName: "Wzgórze Płaczek", gateId: "gw5215", waypoints: [] },
                { mapName: "Mglista Polana Vesy", gateId: "gw21248", waypoints: [] },
            ]
        },
        "Centaury": {
            whitelist: ["Centaur zwiadowca","Centaur łowca","Centaur łucznik","Centaur obrońca","Centaur tropiciel","Centaur wojownik"],
            maps: [
                { mapName: "Błędny Szlak", gateId: "gw6400", waypoints: [] },
                { mapName: "Zawiły bór", gateId: "gw9728", waypoints: [] },
                { mapName: "Selva Oscura", gateId: "gw59", waypoints: [] },
                { mapName: "Dolina Centaurów", gateId: "gw9567", waypoints: [] },
                { mapName: "Iglaste Ścieżki", gateId: "gw7775", waypoints: [] },
                { mapName: "Ostępy Szalbierskich Lasów", gateId: "gw16192", waypoints: [] },
            ]
        },
        "Mumie": {
            whitelist: ["Piaskowe chuchro","Mumia wysokiego ka","Zabandażowany zwi","Zasuszony legionista","Skarabeusz Zihanitu","Cheperu","Scarabeaus Gir-tab","Scarabeaus Nangar","Chodzące truchło"],
            maps: [
                { mapName: "Ruiny Pustynnych Burz", gateId: "gw14592", waypoints: [] },
                { mapName: "Złote Piaski", gateId: "gw24365", waypoints: [[12,16]] },
                { mapName: "Dolina Suchych Łez", gateId: "gw11264", waypoints: [] },
                { mapName: "Ciche Rumowiska", gateId: "gw47", waypoints: [] },
                { mapName: "Oaza Siedmiu Wichrów", gateId: "gw23359", waypoints: [] },
                { mapName: "Złote Piaski", gateId: "gw14655", waypoints: [] }
            ]
        }
    };

    // --- 2. USTAWIENIA ---
    const MOVE_COOLDOWN = 1200;
    const WAYPOINT_TOLERANCE = 4;

    // --- ZMIENNE STANU ---
    // Wczytanie z pamięci
    let isRunning = localStorage.getItem(STORAGE_KEY_RUNNING) === 'true';
    let isLooping = localStorage.getItem(STORAGE_KEY_LOOP) === 'true';

    let savedSetKey = localStorage.getItem(STORAGE_KEY_SET);
    let currentSetKey = (savedSetKey && HUNTING_SETS[savedSetKey]) ? savedSetKey : Object.keys(HUNTING_SETS)[0];
    let currentMapIndex = parseInt(localStorage.getItem(STORAGE_KEY_MAP_IDX)) || 0;

    let visitedFlags = [];
    let lastActionTime = 0;
    let lastMapCheck = "";

    // --- STYLIZACJA CSS (FIXED: Usunięto pozycjonowanie globalne) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-panel {
            position: fixed;
            /* Usunięto top/bottom/left/right stąd, by nie psuć innych okien */
            width: 220px;
            background-color: #1a1a1a;
            border: 2px solid #b026ff;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(176, 38, 255, 0.2);
            font-family: 'Verdana', sans-serif;
            z-index: 99999;
            color: #fff;
            display: none;
            flex-direction: column;
            overflow: hidden;
            transition: border-color 0.3s;
        }
        .bocik-header {
            background: linear-gradient(90deg, #2a0e36 0%, #4a126b 100%);
            padding: 8px 12px; font-size: 11px; font-weight: bold; color: #dcb3ff;
            border-bottom: 1px solid #b026ff; cursor: move; display: flex;
            justify-content: space-between; align-items: center; user-select: none;
        }
        .bocik-content { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
        .status-box {
            background: #222; border: 1px solid #333; border-radius: 6px; padding: 6px;
            text-align: center; font-size: 11px; color: #ccc;
        }
        .bocik-select {
            width: 100%; background: #111; border: 1px solid #b026ff; color: #fff;
            padding: 5px; border-radius: 4px; font-size: 10px; outline: none;
        }
        .control-row {
            display: flex; justify-content: space-between; align-items: center;
            background: #252525; padding: 5px 8px; border-radius: 6px;
        }
        .bocik-btn {
            width: 100%; padding: 8px; border: none; border-radius: 6px;
            font-weight: bold; font-size: 11px; cursor: pointer; transition: 0.2s;
            text-transform: uppercase; letter-spacing: 0.5px; color: white;
        }
        .btn-start { background: #1c3a1c; color: #7aff7a; border: 1px solid #5cb85c; }
        .btn-stop { background: #3a1c1c; color: #ff6b6b; border: 1px solid #d9534f; }
        .btn-reset {
            background: #333; color: #ccc; border: 1px solid #555;
            font-size: 9px; padding: 4px; width: auto; margin-left: 5px;
        }
        .switch { position: relative; display: inline-block; width: 30px; height: 16px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider {
            position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
            background-color: #ccc; transition: .4s; border-radius: 16px;
        }
        .slider:before {
            position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px;
            background-color: white; transition: .4s; border-radius: 50%;
        }
        input:checked + .slider { background-color: #b026ff; }
        input:checked + .slider:before { transform: translateX(14px); }
        .panel-locked { border-color: #444 !important; box-shadow: none !important; }
    `;
    document.head.appendChild(style);

    // --- GUI HTML ---
    const panel = document.createElement('div');
    panel.className = 'bocik-panel';
    panel.id = 'bocik-panel-exp';
    // Domyślna pozycja ustawiona w JS
    panel.style.bottom = "50px";
    panel.style.right = "50px";

    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleExp">
            <span>⚔️ Zapierdalać czeba</span>
            <span id="pinIconExp">🔓</span>
        </div>
        <div class="bocik-content">
            <div class="status-box" id="statusLabelExp">Wczytywanie...</div>
            <select id="setSelectExp" class="bocik-select"></select>

            <div class="control-row">
                <div style="display:flex; align-items:center; gap:5px;">
                    <label class="switch">
                        <input type="checkbox" id="loopCheckboxExp">
                        <span class="slider"></span>
                    </label>
                    <span style="font-size:10px; color:#aaa;">Pętla</span>
                </div>
                <button id="resetBtnExp" class="bocik-btn btn-reset">↺ Reset</button>
            </div>

            <button id="toggleBtnExp" class="bocik-btn btn-start">START</button>
        </div>
    `;
    document.body.appendChild(panel);

    // --- ELEMENTY DOM ---
    const dragHandle = document.getElementById('dragHandleExp');
    const pinIcon = document.getElementById('pinIconExp');
    const statusLabel = document.getElementById('statusLabelExp');
    const setSelect = document.getElementById('setSelectExp');
    const loopCheckbox = document.getElementById('loopCheckboxExp');
    const resetBtn = document.getElementById('resetBtnExp');
    const toggleBtn = document.getElementById('toggleBtnExp');

    // --- INICJALIZACJA DANYCH ---
    for (const name in HUNTING_SETS) {
        const opt = document.createElement('option');
        opt.value = name; opt.innerText = name;
        setSelect.appendChild(opt);
    }
    setSelect.value = currentSetKey;
    loopCheckbox.checked = isLooping;

    // --- OBSŁUGA UI ---
    setSelect.onchange = () => zmienZestaw(setSelect.value, 0);
    loopCheckbox.onchange = () => { isLooping = loopCheckbox.checked; localStorage.setItem(STORAGE_KEY_LOOP, isLooping); };

    resetBtn.onclick = () => {
        console.log('[Bocik] Ręczny reset trasy!');
        currentMapIndex = 0; localStorage.setItem(STORAGE_KEY_MAP_IDX, 0); visitedFlags = []; updateGui();
    };

    toggleBtn.onclick = () => {
        isRunning = !isRunning;
        localStorage.setItem(STORAGE_KEY_RUNNING, isRunning);
        updateGui();
    };

    // --- FUNKCJE LOGICZNE ---
    function zmienZestaw(nowySetKey, nowyIndexMapy) {
        if (!HUNTING_SETS[nowySetKey]) return;
        currentSetKey = nowySetKey;
        currentMapIndex = nowyIndexMapy;
        localStorage.setItem(STORAGE_KEY_SET, currentSetKey);
        localStorage.setItem(STORAGE_KEY_MAP_IDX, currentMapIndex);
        visitedFlags = [];
        setSelect.value = currentSetKey;
        updateGui();
    }

    function updateGui() {
        if(isRunning) {
            toggleBtn.innerText = "STOP"; toggleBtn.className = "bocik-btn btn-stop";
        } else {
            toggleBtn.innerText = "START"; toggleBtn.className = "bocik-btn btn-start";
        }

        const currentSet = HUNTING_SETS[currentSetKey];
        if (!currentSet) return;
        const currentMap = currentSet.maps[currentMapIndex];
        let realMap = (window.map && window.map.name) ? window.map.name : "???";

        statusLabel.innerHTML = `
            <div style="font-weight:bold; color:#fff">Krok: ${currentMapIndex+1}/${currentSet.maps.length}</div>
            <div style="font-size:9px; color:#aaa; margin-top:2px;">${currentMap ? currentMap.mapName : 'Koniec'}</div>
            <div style="font-size:9px; color:${(currentMap && realMap === currentMap.mapName) ? '#5cb85c' : '#f0ad4e'}">
                (Aktualnie: ${realMap})
            </div>
        `;
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
                // Resetujemy bottom/right, bo teraz używamy top/left
                element.style.bottom = 'auto';
                element.style.right = 'auto';
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
            if (isPinned || ['INPUT', 'SELECT', 'BUTTON'].includes(e.target.tagName)) return;
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
            // Ważne: Usuwamy bottom/right podczas przesuwania, żeby nie blokowało
            element.style.bottom = 'auto';
            element.style.right = 'auto';
        }
        function closeDragElement() {
            document.removeEventListener('mouseup', closeDragElement);
            document.removeEventListener('mousemove', elementDrag);
            // 2. Zapisz pozycję
            localStorage.setItem(STORAGE_POS_KEY, JSON.stringify({ top: element.style.top, left: element.style.left }));
        }
    })(panel, dragHandle);

    // --- LOGIKA EXPIENIA ---

    function znajdzNajblizszyIndeksMapy(mapList, mapName, currentIndex) {
        const candidates = [];
        mapList.forEach((m, idx) => { if (m.mapName === mapName) candidates.push(idx); });

        if (candidates.length === 0) return -1;
        if (candidates.length === 1) return candidates[0];

        const isAtEnd = (currentIndex >= mapList.length - 1);
        if (isAtEnd && candidates.includes(0)) {
            console.log("[Bocik Logic] Wykryto koniec trasy i mapę startową - wymuszam pętlę (Index 0).");
            return 0;
        }

        if (candidates.includes(currentIndex + 1)) return currentIndex + 1;
        if (candidates.includes(currentIndex)) return currentIndex;
        if (candidates.includes(currentIndex - 1)) return currentIndex - 1;

        candidates.sort((a, b) => Math.abs(a - currentIndex) - Math.abs(b - currentIndex));
        return candidates[0];
    }

    function sprawdzGdzieJestem() {
        if (typeof window.map === 'undefined' || !window.map.name) return;
        const nazwaMapyWGrze = window.map.name;
        if (nazwaMapyWGrze === lastMapCheck) return;
        lastMapCheck = nazwaMapyWGrze;

        const currentSet = HUNTING_SETS[currentSetKey];
        if (currentSet) {
            const currentExpectedMap = currentSet.maps[currentMapIndex];
            if (currentExpectedMap && currentExpectedMap.mapName === nazwaMapyWGrze) return;

            const smartIndex = znajdzNajblizszyIndeksMapy(currentSet.maps, nazwaMapyWGrze, currentMapIndex);
            if (smartIndex !== -1) {
                if (currentMapIndex !== smartIndex) {
                    console.log(`[Bocik] SmartSync: Korekta kroku z ${currentMapIndex} na ${smartIndex} (${nazwaMapyWGrze})`);
                    currentMapIndex = smartIndex;
                    visitedFlags = [];
                    localStorage.setItem(STORAGE_KEY_MAP_IDX, currentMapIndex);
                    updateGui();
                }
                return;
            }
        }
        for (const [setKey, setData] of Object.entries(HUNTING_SETS)) {
            const indexFound = setData.maps.findIndex(m => m.mapName === nazwaMapyWGrze);
            if (indexFound !== -1) { zmienZestaw(setKey, indexFound); return; }
        }
    }

    function rysujIdMobow() {
        if (!SHOW_MOB_IDS) return;
        const allMobs = document.querySelectorAll('.npc');
        allMobs.forEach(mob => {
            if (!isVisible(mob) || mob.querySelector('.bocik-id-label')) return;
            const idLabel = document.createElement('div');
            idLabel.className = 'bocik-id-label'; idLabel.innerText = mob.id;
            Object.assign(idLabel.style, { position: 'absolute', top: '-15px', left: '0', width: '100%', textAlign: 'center', color: 'yellow', fontSize: '9px', fontWeight: 'bold', textShadow: '1px 1px 1px #000', zIndex: '100', pointerEvents: 'none' });
            mob.appendChild(idLabel);
        });
    }

    // --- STANDARD ---
    function getRandomDelay(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    function isVisible(elem) { const s = window.getComputedStyle(elem); return s && s.display !== 'none' && s.visibility !== 'hidden' && elem.offsetWidth > 0; }
    function simulateClick(el) { if (!el) return; const r = el.getBoundingClientRect(); const x = r.left+r.width/2+(Math.random()-.5)*10; const y = r.top+r.height/2+(Math.random()-.5)*10; ['mouseover','mousedown','mouseup','click'].forEach(t => el.dispatchEvent(new MouseEvent(t,{bubbles:true,clientX:x,clientY:y}))); }
    function walkTo(x, y) { if (window.hero && window.hero.searchPath) window.hero.searchPath(x, y); }
    function getMobName(mob) { const t = mob.getAttribute('tip'); return t ? (t.match(/<b>(.*?)<\/b>/) || ["",""])[1] : ""; }
    function getDistanceTiles(tx, ty) { return window.hero ? Math.sqrt(Math.pow(tx-window.hero.x,2)+Math.pow(ty-window.hero.y,2)) : 999; }

    // --- PĘTLA ---
    async function botLoop() {
        if (isRunning && window.map && window.map.name) {
            sprawdzGdzieJestem();
            rysujIdMobow();

            const currentSet = HUNTING_SETS[currentSetKey];
            const currentMapConfig = currentSet.maps[currentMapIndex];

            if (currentMapConfig && currentMapConfig.mapName === window.map.name) {
                if (visitedFlags.length !== currentMapConfig.waypoints.length) visitedFlags = new Array(currentMapConfig.waypoints.length).fill(false);

                const battleBtn = document.getElementById('autobattleButton');
                if (battleBtn && isVisible(battleBtn)) {
                    await sleep(300); simulateClick(battleBtn); lastActionTime = Date.now();
                } else {
                    currentMapConfig.waypoints.forEach((wp, i) => { if (!visitedFlags[i] && getDistanceTiles(wp[0], wp[1]) <= WAYPOINT_TOLERANCE) visitedFlags[i] = true; });
                    updateGui();

                    const allMobs = Array.from(document.querySelectorAll('.npc')).filter(isVisible);
                    const validMobs = allMobs.filter(m => {
                        if (BLACKLIST_IDS.includes(m.id)) return false;
                        return currentSet.whitelist.some(name => getMobName(m).includes(name));
                    });

                    if (validMobs.length > 0) {
                        if (Date.now() - lastActionTime > MOVE_COOLDOWN) {
                            validMobs.sort((a, b) => {
                                const r1 = a.getBoundingClientRect(), r2 = b.getBoundingClientRect(), h = document.getElementById('hero').getBoundingClientRect();
                                return Math.hypot(r1.x-h.x, r1.y-h.y) - Math.hypot(r2.x-h.x, r2.y-h.y);
                            });
                            simulateClick(validMobs[0]); lastActionTime = Date.now();
                        }
                    } else {
                        const nextWpIdx = visitedFlags.findIndex(v => !v);
                        if (nextWpIdx !== -1) {
                            if (Date.now() - lastActionTime > MOVE_COOLDOWN) { walkTo(currentMapConfig.waypoints[nextWpIdx][0], currentMapConfig.waypoints[nextWpIdx][1]); lastActionTime = Date.now(); }
                        } else {
                            const gate = document.getElementById(currentMapConfig.gateId);
                            if (gate && isVisible(gate)) {
                                if (Date.now() - lastActionTime > MOVE_COOLDOWN) {
                                    const isLastMap = (currentMapIndex === currentSet.maps.length - 1);
                                    if (isLastMap && !isLooping) {
                                        console.log('[Bocik] Koniec trasy (Loop OFF).');
                                        isRunning = false; localStorage.setItem(STORAGE_KEY_RUNNING, false);
                                        updateGui();
                                        return;
                                    }
                                    walkTo(parseInt(gate.style.left)/32, parseInt(gate.style.top)/32);
                                    await sleep(400); simulateClick(gate); lastActionTime = Date.now();
                                    console.log('[Bocik] Kliknięto przejście...');
                                    await sleep(3000);
                                }
                            }
                        }
                    }
                }
            }
        }
        setTimeout(botLoop, isRunning ? getRandomDelay(400, 700) : 1000);
    }

    // --- HUB LISTENER & START ---
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
        updateGui();
        botLoop();
    });
})();