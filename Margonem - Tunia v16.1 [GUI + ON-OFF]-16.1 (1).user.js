// ==UserScript==
// @name         Margonem - Tunia v16.2 [Hub Optimized]
// @namespace    http://tampermonkey.net/
// @version      16.2
// @description  Chodzenie -> Zakupy -> Zamknij -> Item. Integracja z Hubem + Memory.
// @author       Bocik
// @match        http://*.margonem.pl/*
// @match        https://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- INTEGRACJA Z HUBEM ---
    const ADDON_ID = 'tunia_bot'; // To ID dodaj do REPOSITORY w Hubie
    const STORAGE_VISIBLE_KEY = 'bocik_tunia_gui_visible';
    const STORAGE_POS_KEY = 'bocik_tunia_gui_pos';
    const STORAGE_RUNNING_KEY = 'bocik_tunia_running';

    // ===========================
    // === KONFIGURACJA HANDLU ===
    // ===========================
    const ID_NPC = "npc16366";
    const TEKST_DIALOGU = "Pokaż mi, co masz na sprzedaż";
    const KLASA_NUMEROW = "gargonem-button";
    const ID_AKCEPTUJ = "shop_accept";
    const ID_ZAMKNIJ = "shop_close";
    const NAZWA_ITEMU = "Chalcedon pustynnej";

    // Sekwencja zakupów
    const SEKWENCJA_KROKOW = [
        { typ: 'numer', wartosc: '1' }, { typ: 'akceptuj' },
        { typ: 'numer', wartosc: '1' }, { typ: 'akceptuj' },
        { typ: 'numer', wartosc: '2' }, { typ: 'akceptuj' },
        { typ: 'numer', wartosc: '2' }, { typ: 'akceptuj' },
        { typ: 'numer', wartosc: '3' }, { typ: 'akceptuj' },
        { typ: 'numer', wartosc: '3' }, { typ: 'akceptuj' }
    ];

    // Czasy ogólne
    const CLICK_MIN = 500;
    const CLICK_MAX = 1000;

    // Czasy dla Double Click (Item)
    const DBL_CLICK_MIN = 100;
    const DBL_CLICK_MAX = 500;

    const MARGINES = 4;

    // ==============================
    // === KONFIGURACJA CHODZENIA ===
    // ==============================
    const MAPA_CHODZENIA = "Kwieciste Przejście";
    const CZAS_HOLD_MIN = 3000;
    const CZAS_HOLD_MAX = 6000;

    // --- ZMIENNE STANU ---
    // Wczytaj stan ON/OFF z pamięci
    let isRunning = localStorage.getItem(STORAGE_RUNNING_KEY) === 'true';
    let aktualnyKrok = 0;
    let jestemZajety = false;
    let fazaZamykaniaSklepu = false;
    let fazaUzyciaItemu = false;
    let czyTrzymamA = false;
    let timerTrzymaniaA = null;

    // --- GUI CSS (FIXED: Usunięto sztywne pozycjonowanie) ---
    const style = document.createElement('style');
    style.innerHTML = `
        .bocik-mini-panel {
            position: fixed;
            /* Usunięto sztywne top/left, aby nie psuć layoutu */
            width: 150px;
            background-color: #1a1a1a; border: 2px solid #b026ff;
            border-radius: 10px; box-shadow: 0 0 10px rgba(176, 38, 255, 0.3);
            font-family: 'Verdana', sans-serif; z-index: 999999;
            color: #fff; display: none; /* Ukryte domyślnie, sterowane przez JS */
            flex-direction: column; user-select: none;
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
    panel.id = 'bocik-panel-tunia';
    // Domyślna pozycja startowa
    panel.style.top = "150px";
    panel.style.left = "150px";

    panel.innerHTML = `
        <div class="bocik-header" id="dragHandleTunia">
            <span>👱‍♀️ Tunia v16.2</span>
            <span id="pinIconTunia">🔓</span>
        </div>
        <div class="bocik-content">
            <button id="toggleBtnTunia" class="bocik-btn btn-off">OFF</button>
        </div>
    `;
    document.body.appendChild(panel);

    const toggleBtn = document.getElementById('toggleBtnTunia');
    const dragHandle = document.getElementById('dragHandleTunia');
    const pinIcon = document.getElementById('pinIconTunia');

    // --- OBSŁUGA UI ---
    function updateButtonState() {
        if (isRunning) {
            toggleBtn.innerText = "ON";
            toggleBtn.className = "bocik-btn btn-on";
        } else {
            toggleBtn.innerText = "OFF";
            toggleBtn.className = "bocik-btn btn-off";
            puscKlawiszA(); // Zatrzymaj chodzenie przy wyłączeniu
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
                // Reset bottom/right
                element.style.bottom = 'auto'; element.style.right = 'auto';
            } catch(e) {}
        }

        handle.onmousedown = dragMouseDown;
        handle.ondblclick = function() {
            isPinned = !isPinned;
            if (isPinned) { element.classList.add('panel-locked'); handle.style.cursor = "default"; handle.style.background = "#222"; pinIcon.innerText = "🔒"; }
            else { element.classList.remove('panel-locked'); handle.style.cursor = "move"; handle.style.background = "linear-gradient(90deg, #2a0e36 0%, #4a126b 100%)"; pinIcon.innerText = "🔓"; }
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

    // ===============================
    // === LOGIKA (BEZ ZMIAN) ===
    // ===============================

    function symulujKlawisz(typ, kod, litera) {
        const event = new KeyboardEvent(typ, {
            bubbles: true, cancelable: true, key: litera,
            code: `Key${litera.toUpperCase()}`, keyCode: kod, which: kod, view: window
        });
        document.body.dispatchEvent(event);
    }

    function puscKlawiszA() {
        if (czyTrzymamA) {
            symulujKlawisz('keyup', 65, 'a');
            czyTrzymamA = false;
            clearTimeout(timerTrzymaniaA);
            timerTrzymaniaA = null;
        }
    }

    function wcisnijKlawiszA() {
        if (!czyTrzymamA) {
            const czas = Math.floor(Math.random() * (CZAS_HOLD_MAX - CZAS_HOLD_MIN + 1) + CZAS_HOLD_MIN);
            symulujKlawisz('keydown', 65, 'a');
            czyTrzymamA = true;
            timerTrzymaniaA = setTimeout(() => { puscKlawiszA(); }, czas);
        }
    }

    // --- FUNKCJE SZUKAJĄCE ---

    function znajdzPrzyciskNumer(numer) {
        const przyciski = document.querySelectorAll(`button.${KLASA_NUMEROW}`);
        for (let btn of przyciski) {
            const rect = btn.getBoundingClientRect();
            if (btn.innerText.trim() === numer && rect.width > 0) return btn;
        }
        return null;
    }

    function znajdzPrzyciskAkceptuj() {
        const btn = document.getElementById(ID_AKCEPTUJ);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && btn.style.display !== 'none') return btn;
        }
        return null;
    }

    function znajdzPrzyciskZamknij() {
        const btn = document.getElementById(ID_ZAMKNIJ);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && btn.style.display !== 'none') return btn;
        }
        return null;
    }

    function znajdzOpcjeDialogowa() {
        const kontener = document.getElementById('replies');
        if (!kontener) return null;
        const opcje = kontener.querySelectorAll('li');
        for (let opcja of opcje) {
            const rect = opcja.getBoundingClientRect();
            if (opcja.innerText.includes(TEKST_DIALOGU) && rect.width > 0) return opcja;
        }
        return null;
    }

    function znajdzItemWTorbie() {
        const items = document.querySelectorAll('.item');
        for (let item of items) {
            const tip = item.getAttribute('tip');
            if (tip && tip.includes(NAZWA_ITEMU)) {
                const rect = item.getBoundingClientRect();
                if (rect.width > 0) return item;
            }
        }
        return null;
    }

    // --- KLIKANIE ---

    function generujKordy(element) {
        const rect = element.getBoundingClientRect();
        let x, y;
        if (rect.width <= MARGINES * 2) {
            x = rect.left + (rect.width / 2);
            y = rect.top + (rect.height / 2);
        } else {
            x = rect.left + MARGINES + Math.random() * (rect.width - MARGINES * 2);
            y = rect.top + MARGINES + Math.random() * (rect.height - MARGINES * 2);
        }
        return { x: Math.floor(x), y: Math.floor(y) };
    }

    function pojedynczyKlik(element, x, y, typ) {
        element.dispatchEvent(new MouseEvent(typ, {
            bubbles: true, cancelable: true, view: window,
            clientX: x, clientY: y, buttons: 1
        }));
    }

    function kliknijLosowo(element, opis, typAkcji) {
        const kordy = generujKordy(element);
        console.log(`[Bocik] >>> KLIK: ${opis} <<<`);
        ['mousedown', 'mouseup', 'click'].forEach(typ => { pojedynczyKlik(element, kordy.x, kordy.y, typ); });

        if (typAkcji === 'SEKWENCJA') {
            aktualnyKrok++;
            if (aktualnyKrok >= SEKWENCJA_KROKOW.length) {
                console.log("[Bocik] Koniec zakupów. Następny krok: ZAMKNIJ SKLEP.");
                aktualnyKrok = 0;
                fazaZamykaniaSklepu = true;
            }
        }
        else if (typAkcji === 'ZAMYKANIE') {
            console.log("[Bocik] Sklep zamknięty. Następny krok: UŻYJ ITEMU.");
            fazaZamykaniaSklepu = false;
            fazaUzyciaItemu = true;
        }
    }

    function wykonajDoubleClick(element, opis) {
        const kordy = generujKordy(element);
        const losowyOdstep = Math.floor(Math.random() * (DBL_CLICK_MAX - DBL_CLICK_MIN + 1) + DBL_CLICK_MIN);
        console.log(`[Bocik] >>> DOUBLE CLICK: ${opis} <<< (Odstęp: ${losowyOdstep}ms)`);

        ['mousedown', 'mouseup', 'click'].forEach(typ => pojedynczyKlik(element, kordy.x, kordy.y, typ));

        setTimeout(() => {
             ['mousedown', 'mouseup', 'click'].forEach(typ => pojedynczyKlik(element, kordy.x, kordy.y, typ));
             element.dispatchEvent(new MouseEvent('dblclick', {
                bubbles: true, cancelable: true, view: window,
                clientX: kordy.x, clientY: kordy.y, buttons: 1
            }));
             console.log("[Bocik] Item użyty. Reset cyklu - gotowy do chodzenia.");
             fazaUzyciaItemu = false;
        }, losowyOdstep);
    }

    function zaplanujAkcje(element, opis, typAkcji, czyDoubleClick = false) {
        jestemZajety = true;
        const czas = Math.floor(Math.random() * (CLICK_MAX - CLICK_MIN + 1) + CLICK_MIN);
        setTimeout(() => {
            const rect = element.getBoundingClientRect();
            if (document.body.contains(element) && element.style.display !== 'none' && rect.width > 0) {
                if (czyDoubleClick) { wykonajDoubleClick(element, opis); }
                else { kliknijLosowo(element, opis, typAkcji); }
            } else { console.log(`[Bocik] Element ${opis} zniknął.`); }
            jestemZajety = false;
            cyklZycia();
        }, czas);
    }

    // --- GŁÓWNY CYKL ---

    function cyklZycia() {
        if (!isRunning) {
            setTimeout(cyklZycia, 1000);
            return;
        }

        const nazwaMapy = window.map ? window.map.name : "";
        if (nazwaMapy === MAPA_CHODZENIA) {
            fazaUzyciaItemu = false;
            fazaZamykaniaSklepu = false;
            if (!czyTrzymamA && timerTrzymaniaA === null) {
                setTimeout(wcisnijKlawiszA, Math.random() * 500 + 200);
            }
            setTimeout(cyklZycia, 1000);
            return;
        } else {
            if (czyTrzymamA) puscKlawiszA();
        }

        if (jestemZajety) {
            setTimeout(cyklZycia, 200);
            return;
        }

        if (fazaUzyciaItemu) {
            const item = znajdzItemWTorbie();
            if (item) { zaplanujAkcje(item, `ITEM: ${NAZWA_ITEMU}`, 'NORMALNY', true); return; }
            else { setTimeout(cyklZycia, 500); return; }
        }

        if (fazaZamykaniaSklepu) {
            const btnZamknij = znajdzPrzyciskZamknij();
            if (btnZamknij) { zaplanujAkcje(btnZamknij, "Przycisk ZAMKNIJ", 'ZAMYKANIE', false); return; }
            else { console.log("[Bocik] Brak przycisku Zamknij."); fazaZamykaniaSklepu = false; fazaUzyciaItemu = true; return; }
        }

        const zadanie = SEKWENCJA_KROKOW[aktualnyKrok];
        let element = null;
        let opis = "";

        if (zadanie.typ === 'numer') { element = znajdzPrzyciskNumer(zadanie.wartosc); opis = `Przycisk "${zadanie.wartosc}"`; }
        else if (zadanie.typ === 'akceptuj') { element = znajdzPrzyciskAkceptuj(); opis = `Przycisk AKCEPTUJ`; }

        if (element) { zaplanujAkcje(element, opis, 'SEKWENCJA', false); return; }

        const dialog = znajdzOpcjeDialogowa();
        if (dialog) {
            if (aktualnyKrok !== 0) aktualnyKrok = 0;
            zaplanujAkcje(dialog, "Dialog Handlu", 'NORMALNY', false);
            return;
        }

        const npc = document.getElementById(ID_NPC);
        if (npc && npc.style.display !== 'none') {
            if (aktualnyKrok !== 0) aktualnyKrok = 0;
            zaplanujAkcje(npc, "NPC Tunia", 'NORMALNY', false);
            return;
        }

        setTimeout(cyklZycia, 500);
    }

    // --- INTEGRACJA Z HUBEM ---
    window.addEventListener('load', function() {
        const savedState = localStorage.getItem(STORAGE_VISIBLE_KEY);
        // Jeśli nie ma zapisu, domyślnie ukryty
        const shouldBeVisible = savedState === 'true';
        panel.style.display = shouldBeVisible ? 'flex' : 'none';

        window.addEventListener('bocik:toggle-gui', function(e) {
            if (e.detail.id === ADDON_ID) {
                const isHidden = (panel.style.display === 'none' || panel.style.display === '');
                panel.style.display = isHidden ? 'flex' : 'none';
                localStorage.setItem(STORAGE_VISIBLE_KEY, isHidden ? 'true' : 'false');
            }
        });
        cyklZycia();
    });

})();