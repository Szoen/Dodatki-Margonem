// ==UserScript==
// @name         Margonem - Logger Przejść (Pełne ID)
// @namespace    http://tampermonkey.net/
// @version      2.2
// @description  Generuje obiekt { mapName: "...", gateId: "gw..." } (z prefixem gw)
// @author       Bocik
// @match        http://*.margonem.pl/*
// @match        https://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // KLUCZE PAMIĘCI
    const KEY_ID = 'bocik_last_gw_id';
    const KEY_MAP = 'bocik_last_map_name';

    // KONFIGURACJA CZASOWA
    let blokadaStartowa = true;     // Ochrona przed spawnem
    let czyJestCooldown = false;    // Ochrona przed spamem
    const CZAS_NA_START = 4000;     // 4 sekundy ignorowania po wejściu (anty-spawn)
    const CZAS_COOLDOWNU = 2000;    // 2 sekundy przerwy po wykryciu

    // --- 1. ODCZYT I FORMATOWANIE (Po załadowaniu nowej mapy) ---
    const savedId = localStorage.getItem(KEY_ID);
    const savedMap = localStorage.getItem(KEY_MAP);

    if (savedId && savedMap) {
        // Formatowanie wyjściowe z zachowaniem "gw" w ID
        const formattedOutput = `{ mapName: "${savedMap}", gateId: "${savedId}" }`;

        console.log('%c[Bocik] Gotowy obiekt do skopiowania:', 'color: lime; font-weight: bold;');
        console.log(formattedOutput);

        // Czyścimy pamięć (opcjonalne)
        localStorage.removeItem(KEY_ID);
        localStorage.removeItem(KEY_MAP);
    }

    // --- 2. ZDEJMOWANIE BLOKADY SPAWNU ---
    setTimeout(() => {
        blokadaStartowa = false;
    }, CZAS_NA_START);

    // --- 3. WYKRYWANIE ---
    function detectGateway() {
        if (blokadaStartowa || czyJestCooldown) return;
        if (typeof hero === 'undefined' || typeof map === 'undefined') return;

        const gateways = document.getElementsByClassName('gw');

        for (let gw of gateways) {
            const gwX = parseInt(gw.style.left) / 32;
            const gwY = parseInt(gw.style.top) / 32;

            if (Math.abs(hero.x - gwX) < 0.5 && Math.abs(hero.y - gwY) < 0.5) {

                // ZMIANA: Pobieramy pełne ID (np. "gw9490") bez usuwania "gw"
                const fullId = gw.id;
                const currentMapName = map.name;

                // Sprawdzenie, czy to nowe wejście
                if (localStorage.getItem(KEY_ID) !== fullId) {

                    // Zapisujemy pełne ID (z 'gw')
                    localStorage.setItem(KEY_ID, fullId);
                    localStorage.setItem(KEY_MAP, currentMapName);

                    console.log(`%c[Bocik] Złapano! ${fullId} na mapie ${currentMapName}`, 'color: gray; font-style: italic;');

                    // Cooldown
                    czyJestCooldown = true;
                    setTimeout(() => { czyJestCooldown = false; }, CZAS_COOLDOWNU);

                    break;
                }
            }
        }
    }

    setInterval(detectGateway, 100);
})();