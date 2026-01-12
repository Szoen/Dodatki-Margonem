// ==UserScript==
// @name         Click marker
// @namespace    http://tampermonkey.net/
// @version      1.1
// @author       Szpinak
// @match        http://*.margonem.pl/*
// @match        https://*.margonem.pl/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log("Bocik: Skrypt V2 wystartował!"); // To zobaczysz w konsoli (F12)

    // Używamy 'true' na końcu (useCapture), żeby wyłapać kliknięcie ZANIM gra to zrobi
    document.addEventListener('mousedown', function(e) {
        createDot(e.clientX, e.clientY);
    }, true);

    function createDot(x, y) {
        const dot = document.createElement('div');

        // Style kropki
        dot.style.position = 'fixed';
        dot.style.width = '10px';      // Nieco większa dla lepszej widoczności
        dot.style.height = '10px';
        dot.style.backgroundColor = 'red';
        dot.style.borderRadius = '50%';
        dot.style.boxShadow = '0 0 4px #000'; // Cień, żeby była widoczna na jasnym tle
        dot.style.zIndex = '2147483647';   // Absolutnie najwyższa możliwa wartość w CSS
        dot.style.pointerEvents = 'none';  // Kliknięcia przelatują przez kropkę
        dot.style.transform = 'translate(-50%, -50%)'; // Centrowanie
        dot.style.left = x + 'px';
        dot.style.top = y + 'px';

        // Dodajemy do elementu html zamiast body, żeby uniknąć problemów z layoutem gry
        document.documentElement.appendChild(dot);

        // Animacja znikania
        // Kropka widoczna przez 200ms, potem znika przez 300ms
        setTimeout(() => {
            dot.style.transition = 'opacity 0.3s ease-out';
            dot.style.opacity = '0';
        }, 200);

        // Całkowite usunięcie po 500ms
        setTimeout(() => {
            dot.remove();
        }, 500);
    }
})();