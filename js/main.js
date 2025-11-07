// Config file ko import karein
import { config } from './config.js'; 
import { initCanvasScroll } from './canvas-scroll.js';
import { initBubbles } from './bubbles.js';

window.addEventListener('DOMContentLoaded', () => {
    'use strict';
    
    // Config object se settings pass karein
    initCanvasScroll(config.canvasScroll);
    initBubbles(config.bubbles);
});