// ==UserScript==
// @name         Bot exp
// @namespace    http://tampermonkey.net/
// @version      36.0
// @description  Naprawa pętli - wymusza start od 0 po zakończeniu trasy (zamiast skoku do środka)
// @author       Szpinak & Bocik
// @match        http*://*.margonem.pl/
// @match        http*://*.margonem.com/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=margonem.pl
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // --- 1. KONFIGURACJA EXPOWISK ---

    const BLACKLIST_IDS = ["npc222580","npc224626","npc224495","npc170533","npc170018","npc169836",
                          "npc169832","npc62366","npc62403","npc170532","npc169837","npc62368","npc62405",
                          "npc169841","npc62348","npc62359","npc170535","npc169845","npc170534","npc62369",
                          "npc170519","npc211717","npc211723","npc298619","npc298515","npc297526","npc297521",
                          "npc297520"];
    const SHOW_MOB_IDS = true;

    const HUNTING_SETS = {

"Niedźwiedzie":
        {whitelist: ["Nieźwiedź szary","Niedźwiedź czarny",],
         maps: [
             { mapName: "Dziewicza Knieja", gateId: "", waypoints: [] },
             { mapName: "Siedlisko Nietoperzy p.5", gateId: "", waypoints: [] },
             { mapName: "Siedlisko Nietoperzy p.4", gateId: "", waypoints: [] },
             { mapName: "Siedlisko Nietoperzy p.3 - sala 1", gateId: "", waypoints: [] },
             { mapName: "Siedlisko Nietoperzy p.3 - sala 2", gateId: "", waypoints: [] },
             { mapName: "Siedlisko Nietoperzy p.3 - sala 1", gateId: "", waypoints: [] },
             { mapName: "Siedlisko Nietoperzy p.2", gateId: "", waypoints: [] },
             { mapName: "Siedlisko Nietoperzy p.1", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
         ]
        },

"Demony":
        {whitelist: ["Paskudny demon","Pomniejszy demon","Mały demon","Nieznośny demon","Kąśliwy demon","Dokuczliwy bies"],
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

"Ghule":
        {whitelist: ["Ghul zwiadowca","Ghul słabeusz","Ghul cmentarny","Ghul nocny","Ghul szaman","Ghul wojownik"],
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

"Zbiry":
        {whitelist: ["Niegodziwy drań","Nikczemny łotr","Podły szabrownik","Podżerka krwawa"],
         maps: [
             { mapName: "Stary Kupiecki Trakt", gateId: "gw24352", waypoints: [] },
             { mapName: "Stukot Widmowych Kół", gateId: "gw24339", waypoints: [] },
             { mapName: "Wertepy Rzezimieszków", gateId: "gw18", waypoints: [] },
             { mapName: "Stukot Widmowych Kół", gateId: "gw32", waypoints: [] },
         ]
        },

"Żądłaki":
        {whitelist: ["Żądłak","Wściekłówka","Żądłak rogaty",],
         maps: [
             { mapName: "Kopalnia Kapiącego Miodu p.1 - sala 1", gateId: "gw3105", waypoints: [] },
             { mapName: "Kopalnia Kapiącego Miodu p.2 - sala 1", gateId: "gw6428", waypoints: [] },
             { mapName: "Kopalnia Kapiącego Miodu p.3", gateId: "gw1031", waypoints: [] },
             { mapName: "Kopalnia Kapiącego Miodu p.2 - sala 2", gateId: "gw13829", waypoints: [] },
             { mapName: "Kopalnia Kapiącego Miodu p.1 - sala 2", gateId: "gw15625", waypoints: [] },
             { mapName: "Porzucone Pasieki", gateId: "gw7221", waypoints: [] },
         ]
        },

"Koboldy":
        {whitelist: ["Kobold","Kobold łucznik","Kobold nożownik",],
         maps: [
             { mapName: "Lazurytowa Grota p.1", gateId: "gw3354", waypoints: [] },
             { mapName: "Lazurytowa Grota p.2", gateId: "gw7209", waypoints: [] },
             { mapName: "Lazurytowa Grota p.3 - sala 2", gateId: "gw1809", waypoints: [] },
             { mapName: "Lazurytowa Grota p.3 - sala 1", gateId: "gw262", waypoints: [] },
             { mapName: "Lazurytowa Grota p.2", gateId: "gw1298", waypoints: [] },
         ]
        },

"Rosomaki/Mrówki":
        {whitelist: ["Rosomak skalny","Rosomak","Mrówka robotnica","Mrówka żołnierz","Mrówka z larwą"],
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

"Mnisi/Magazynierzy":
        {whitelist: ["Członek zakonu","Brat andaryjski","Pokutujący zakonnik","Wojownik w habicie","Zamyślony mnich",
                    "Wytatuowany osiłek","Kawał chłopa","Świątynny kucharz","Nadęty dryblas","Magazynier z halabardą"],
         maps: [
             { mapName: "Świątynia Andarum - podziemia", gateId: "gw8732", waypoints: [] },
             { mapName: "Świątynia Andarum - lokum mnichów", gateId: "gw15109", waypoints: [] },
             { mapName: "Świątynia Andarum - magazyn p.2", gateId: "gw11824", waypoints: [] },
             { mapName: "Świątynia Andarum - magazyn p.1", gateId: "gw5982", waypoints: [] },
         ]
        },

"Margoria":
        {whitelist: ["Krasnoludzki górnik","Krasnoludzki strażnik","Krasnoludzki kowal","Krasnoludzki wojownik"
                    ],
         maps: [
             { mapName: "Margoria", gateId: "gw22792", waypoints: [] },
             { mapName: "Kopalnia Margorii", gateId: "gw3381", waypoints: [] },
             { mapName: "Labirynt Margorii", gateId: "gw2566", waypoints: [] },
         ]
        },

"Południce":
        {whitelist: ["Południca","Wieczornica"],
         maps: [
             { mapName: "Wzgórze Płaczek", gateId: "gw8997", waypoints: [] },
             { mapName: "Płacząca Grota p.1 - sala 1", gateId: "gw7436", waypoints: [] },
             { mapName: "Płacząca Grota p.2", gateId: "gw7481", waypoints: [] },
             { mapName: "Płacząca Grota p.1 - sala 2", gateId: "gw4907", waypoints: [] },
             { mapName: "Wzgórze Płaczek", gateId: "gw5215", waypoints: [] },
             { mapName: "Mglista Polana Vesy", gateId: "gw21248", waypoints: [] },
         ]
        },

"Centaury":
        {whitelist: [],
         maps: [
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
             { mapName: "", gateId: "", waypoints: [] },
         ]
        },

        "Mumie": {
            whitelist: ["Piaskowe chuchro","Mumia wysokiego ka","Zabandażowany zwi","Zasuszony legionista","Skarabeusz Zihanitu","Cheperu","Scarabeaus Gir-tab","Scarabeaus Nangar","Chodzące truchło"],
            maps: [
                { mapName: "Ruiny Pustynnych Burz", gateId: "gw14592", waypoints: [] },
                { mapName: "Złote Piaski", gateId: "gw24365", waypoints: [[12, 16]] },
                { mapName: "Dolina Suchych Łez", gateId: "gw11264", waypoints: [] },
                { mapName: "Ciche Rumowiska", gateId: "gw47", waypoints: [] },
                { mapName: "Oaza Siedmiu Wichrów", gateId: "gw23359", waypoints: [] },
                { mapName: "Złote Piaski", gateId: "gw14655", waypoints: [] }
            ]
        }
    };

    // --- 2. USTAWIENIA ---
    const CLICK_OFFSET_Y = 10;
    const CLICK_RANDOM = 10;
    const MOVE_COOLDOWN = 1200;
    const WAYPOINT_TOLERANCE = 4;

    // --- 3. PAMIĘĆ ---
    const STORAGE_KEY_RUNNING = 'bocik_v36_isRunning';
    const STORAGE_KEY_LOOP = 'bocik_v36_isLooping';
    const STORAGE_KEY_SET = 'bocik_v36_currentSet';
    const STORAGE_KEY_MAP_IDX = 'bocik_v36_mapIndex';

    // --- ZMIENNE ---
    let isRunning = localStorage.getItem(STORAGE_KEY_RUNNING) === 'true';
    let isLooping = localStorage.getItem(STORAGE_KEY_LOOP) === 'true';

    let savedSetKey = localStorage.getItem(STORAGE_KEY_SET);
    let currentSetKey = (savedSetKey && HUNTING_SETS[savedSetKey]) ? savedSetKey : Object.keys(HUNTING_SETS)[0];
    let currentMapIndex = parseInt(localStorage.getItem(STORAGE_KEY_MAP_IDX)) || 0;

    let visitedFlags = [];
    let lastActionTime = 0;
    let lastMapCheck = "";

    // --- GUI ---
    const guiContainer = document.createElement('div');
    Object.assign(guiContainer.style, {
        position: 'fixed', bottom: '10px', right: '10px', padding: '10px',
        background: 'rgba(0, 0, 0, 0.9)', color: 'white', borderRadius: '8px',
        zIndex: '99999', fontFamily: 'Verdana, Arial, sans-serif', fontSize: '11px',
        border: '1px solid #555', minWidth: '180px', display: 'flex',
        flexDirection: 'column', gap: '8px'
    });

    const statusText = document.createElement('div');
    statusText.style.textAlign = 'center';

    const mapInfoText = document.createElement('div');
    mapInfoText.style.textAlign = 'center'; mapInfoText.style.fontSize = '10px'; mapInfoText.style.color = '#aaa';

    const listSelect = document.createElement('select');
    Object.assign(listSelect.style, { width: '100%', padding: '4px', background: '#333', color: 'white', border: '1px solid #555' });

    const refreshSelect = () => {
        listSelect.innerHTML = '';
        for (const name in HUNTING_SETS) {
            const opt = document.createElement('option');
            opt.value = name; opt.innerText = name;
            listSelect.appendChild(opt);
        }
        listSelect.value = currentSetKey;
    };
    refreshSelect();

    listSelect.onchange = function() { zmienZestaw(listSelect.value, 0); };

    // Loop Checkbox
    const loopContainer = document.createElement('div');
    loopContainer.style.display = 'flex'; loopContainer.style.alignItems = 'center'; loopContainer.style.justifyContent = 'center'; loopContainer.style.gap = '5px';
    const loopCheckbox = document.createElement('input');
    loopCheckbox.type = 'checkbox'; loopCheckbox.id = 'bocik-loop-cb'; loopCheckbox.checked = isLooping; loopCheckbox.style.cursor = 'pointer';
    const loopLabel = document.createElement('label');
    loopLabel.innerText = 'Pętla (Loop)'; loopLabel.htmlFor = 'bocik-loop-cb'; loopLabel.style.cursor = 'pointer'; loopLabel.style.fontSize = '10px'; loopLabel.style.color = '#ddd';
    loopCheckbox.onchange = function() { isLooping = loopCheckbox.checked; localStorage.setItem(STORAGE_KEY_LOOP, isLooping); };
    loopContainer.append(loopCheckbox, loopLabel);

    const resetButton = document.createElement('button');
    resetButton.innerText = '↺ RESET TRASY';
    Object.assign(resetButton.style, { width: '100%', padding: '5px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', background: '#555', color: '#fff', fontSize: '10px' });
    resetButton.onclick = function() {
        console.log('[Bocik] Ręczny reset trasy!');
        currentMapIndex = 0; localStorage.setItem(STORAGE_KEY_MAP_IDX, 0); visitedFlags = []; updateGui();
    };

    const toggleButton = document.createElement('button');
    Object.assign(toggleButton.style, { width: '100%', padding: '8px', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' });
    toggleButton.onclick = function() { isRunning = !isRunning; localStorage.setItem(STORAGE_KEY_RUNNING, isRunning); updateGui(); };

    guiContainer.append(statusText, mapInfoText, listSelect, loopContainer, resetButton, toggleButton);
    document.body.appendChild(guiContainer);

    // --- FUNKCJE LOGICZNE ---

    function zmienZestaw(nowySetKey, nowyIndexMapy) {
        if (!HUNTING_SETS[nowySetKey]) return;
        currentSetKey = nowySetKey;
        currentMapIndex = nowyIndexMapy;
        localStorage.setItem(STORAGE_KEY_SET, currentSetKey);
        localStorage.setItem(STORAGE_KEY_MAP_IDX, currentMapIndex);
        visitedFlags = [];
        listSelect.value = currentSetKey;
        updateGui();
    }

    function updateGui() {
        toggleButton.innerText = isRunning ? 'BOT: WŁĄCZONY' : 'BOT: WYŁĄCZONY';
        toggleButton.style.background = isRunning ? '#5cb85c' : '#d9534f';
        if (!isRunning) { statusText.innerText = 'Zatrzymany'; statusText.style.color = '#d9534f'; return; }
        const currentSet = HUNTING_SETS[currentSetKey];
        if (!currentSet) return;
        const currentMap = currentSet.maps[currentMapIndex];
        statusText.innerText = `Exp: ${currentSetKey}`; statusText.style.color = '#fff';
        let realMap = (window.map && window.map.name) ? window.map.name : "???";
        mapInfoText.innerText = `Krok ${currentMapIndex+1}/${currentSet.maps.length}: ${currentMap ? currentMap.mapName : 'Koniec'}\n(Jesteś na: ${realMap})`;
        if (currentMap && realMap === currentMap.mapName) { mapInfoText.style.color = '#5cb85c'; } else { mapInfoText.style.color = '#f0ad4e'; }
    }

    // --- KLUCZOWA POPRAWKA: SMART SEARCH Z PRIORYTETEM STARTU ---
    function znajdzNajblizszyIndeksMapy(mapList, mapName, currentIndex) {
        const candidates = [];
        mapList.forEach((m, idx) => { if (m.mapName === mapName) candidates.push(idx); });

        if (candidates.length === 0) return -1;
        if (candidates.length === 1) return candidates[0];

        // LOGIKA PĘTLI (NOWOŚĆ)
        // Jeśli jesteśmy na ostatnim kroku (lub przedostatnim) I mamy kandydata "0" (Początek)
        // To ZAWSZE wybieramy 0, żeby zamknąć pętlę.
        const isAtEnd = (currentIndex >= mapList.length - 1);
        if (isAtEnd && candidates.includes(0)) {
            console.log("[Bocik Logic] Wykryto koniec trasy i mapę startową - wymuszam pętlę (Index 0).");
            return 0;
        }

        // Standardowa logika (następny/obecny/poprzedni)
        if (candidates.includes(currentIndex + 1)) return currentIndex + 1;
        if (candidates.includes(currentIndex)) return currentIndex;
        if (candidates.includes(currentIndex - 1)) return currentIndex - 1;

        // Sortowanie wg odległości (fallback)
        candidates.sort((a, b) => Math.abs(a - currentIndex) - Math.abs(b - currentIndex));
        return candidates[0];
    }

    // --- SYNCHRONIZACJA ---
    function sprawdzGdzieJestem() {
        if (typeof window.map === 'undefined' || !window.map.name) return;
        const nazwaMapyWGrze = window.map.name;
        if (nazwaMapyWGrze === lastMapCheck) return;
        lastMapCheck = nazwaMapyWGrze;

        const currentSet = HUNTING_SETS[currentSetKey];
        if (currentSet) {
            const currentExpectedMap = currentSet.maps[currentMapIndex];
            // Jeśli jesteśmy tam gdzie trzeba - OK
            if (currentExpectedMap && currentExpectedMap.mapName === nazwaMapyWGrze) return;

            // Używamy ulepszonego Smart Search
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

        // Globalny szukacz
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
                                        statusText.innerText = "KONIEC TRASY"; statusText.style.color = "#5cb85c"; updateGui();
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

    window.addEventListener('load', () => { updateGui(); botLoop(); });
})();