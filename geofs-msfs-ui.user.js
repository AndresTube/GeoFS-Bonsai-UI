// ==UserScript==
// @name         GeoFS MSFS-Style UI
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  MSFS-style HUD for GeoFS: HDG compass (TL), AIRSPEED+FLAPS+THROTTLE (BL), ALT (BR).
// @author       Fendrixx
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const BOTTOM_OFFSET = 10;

    const css = `
    #msfs-ui-root {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 999999;
        font-family: 'Consolas','Menlo',monospace; color: #fff;
        text-shadow: 0 0 2px #000;
    }
    #msfs-ui-root .panel {
        position: absolute;
        background: rgba(0,0,0,0.55);
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 3px;
        box-sizing: border-box;
    }
    #msfs-ui-root .label { font-size: 10px; color: #ccc; letter-spacing: 1px; }

    #msfs-hdg {
        top: 36px; left: 12px;
        width: 170px; height: 170px;
        border-radius: 50%;
        background: rgba(0,0,0,0.45);
    }
    #msfs-hdg .hdg-readout {
        position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
        background: #000; padding: 2px 10px; border: 1px solid #fff;
        font-weight: bold; font-size: 14px; z-index: 2; white-space: nowrap;
    }
    #msfs-hdg canvas { display:block; width:100%; height:100%; }

    #msfs-spd {
        left: 12px; bottom: ${BOTTOM_OFFSET}px;
        width: 70px; height: 220px;
    }
    #msfs-spd .top-label, #msfs-spd .bot-label,
    #msfs-alt .top-label, #msfs-alt .bot-label {
        position:absolute; left:0; right:0; text-align:center;
        font-size:10px; color:#ccc; letter-spacing:1px;
    }
    #msfs-spd .top-label, #msfs-alt .top-label { top: 4px; }
    #msfs-spd .bot-label, #msfs-alt .bot-label { bottom: 4px; }

    #msfs-spd .tape, #msfs-alt .tape {
        position: absolute; top: 20px; bottom: 20px; left: 4px; right: 4px;
        overflow: hidden;
    }
    #msfs-spd .tape { border-left: 2px solid #fff; border-right: 1px solid #444; }
    #msfs-alt .tape { border-left: 1px solid #444; border-right: 2px solid #fff; }

    #msfs-spd .strip, #msfs-alt .strip {
        position: absolute; left: 0; right: 0;
    }
    #msfs-spd .tick, #msfs-alt .tick {
        position: relative; height: 24px; font-size: 11px; color: #ddd;
    }
    #msfs-spd .tick { padding-left: 6px; }
    #msfs-spd .tick::before {
        content:''; position:absolute; left:0; top:11px; width:6px; height:2px; background:#fff;
    }
    #msfs-alt .tick { text-align: right; padding-right: 6px; }
    #msfs-alt .tick::after {
        content:''; position:absolute; right:0; top:11px; width:6px; height:2px; background:#fff;
    }

    #msfs-spd .center, #msfs-alt .center {
        position: absolute; left: 0; right: 0; top: 50%; height: 24px;
        transform: translateY(-50%);
        background: #000; border: 1px solid #fff;
        font-size: 16px; font-weight: bold; text-align: center; line-height: 22px;
    }

    #msfs-thr {
        left: 12px; bottom: ${BOTTOM_OFFSET + 240}px;
        width: 56px; height: 140px;
    }
    #msfs-thr .top-label, #msfs-thr .val {
        position:absolute; left:0; right:0; text-align:center; font-size:10px; color:#ccc;
    }
    #msfs-thr .top-label { top: 4px; letter-spacing: 1px; }
    #msfs-thr .val { bottom: 4px; }
    #msfs-thr .bar {
        position: absolute; left: 22px; right: 22px; top: 22px; bottom: 22px;
        background: linear-gradient(#1a1a1a,#000); border: 1px solid #555;
    }
    #msfs-thr .fill {
        position: absolute; left: 0; right: 0; bottom: 0;
        background: linear-gradient(#fff,#888); height: 0%;
    }

    #msfs-flaps {
        left: 90px; bottom: ${BOTTOM_OFFSET}px;
        width: 56px; height: 100px;
    }
    #msfs-flaps .top-label, #msfs-flaps .val,
    #msfs-spl .top-label, #msfs-spl .val {
        position:absolute; left:0; right:0; text-align:center; font-size:10px; color:#ccc;
    }
    #msfs-flaps .top-label, #msfs-spl .top-label { top: 4px; letter-spacing: 1px; }
    #msfs-flaps .val, #msfs-spl .val { bottom: 4px; }
    #msfs-flaps .bar, #msfs-spl .bar {
        position: absolute; left: 22px; right: 22px; top: 22px; bottom: 22px;
        background: linear-gradient(#222,#000); border: 1px solid #555;
    }
    #msfs-flaps .knob, #msfs-spl .knob {
        position: absolute; left: -4px; right: -4px; height: 4px; background: #fff;
        top: 0;
    }

    #msfs-spl {
        left: 154px; bottom: ${BOTTOM_OFFSET}px;
        width: 56px; height: 100px;
    }

    #msfs-alt {
        right: 12px; bottom: ${BOTTOM_OFFSET}px;
        width: 80px; height: 220px;
    }

    .geofs-ui-bottom {
        background: rgba(0,0,0,0.55) !important;
        border: 1px solid rgba(255,255,255,0.18) !important;
        border-radius: 4px !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.5) !important;
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        padding: 3px 8px !important;
        min-height: 36px !important;
        height: 36px !important;
        line-height: 30px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-wrap: nowrap !important;
        gap: 4px !important;
        left: 50% !important;
        right: auto !important;
        transform: translateX(-50%) !important;
        width: auto !important;
        max-width: calc(100vw - 24px) !important;
        bottom: 8px !important;
    }
    .geofs-ui-bottom .mdl-button {
        color: #e0e0e0 !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 11px !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        background: rgba(30,30,30,0.55) !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        border-radius: 3px !important;
        margin: 0 2px !important;
        height: 26px !important;
        min-height: 26px !important;
        line-height: 24px !important;
        padding: 0 8px !important;
        vertical-align: middle !important;
        transition: background 0.15s, border-color 0.15s !important;
    }
    .geofs-ui-bottom .mdl-button:hover {
        background: rgba(180,180,180,0.25) !important;
        border-color: #fff !important;
        color: #fff !important;
    }
    .geofs-ui-bottom .mdl-button--icon {
        padding: 0 !important;
        width: 28px !important;
        min-width: 28px !important;
        height: 26px !important;
        border-radius: 3px !important;
    }
    .geofs-ui-bottom .mdl-button .material-icons {
        font-size: 16px !important;
        line-height: 24px !important;
        vertical-align: middle !important;
        color: #ddd !important;
    }
    .geofs-ui-bottom .geofs-ui-bottom-box {
        background: rgba(0,0,0,0.35) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 3px !important;
        padding: 1px 3px !important;
        margin: 0 3px !important;
        height: 28px !important;
        display: inline-flex !important;
        align-items: center !important;
        vertical-align: middle !important;
        float: none !important;
    }
    .geofs-ui-bottom .geofs-ui-bottom-box .mdl-button {
        background: transparent !important;
        border: none !important;
        margin: 0 !important;
        height: 24px !important;
        min-height: 24px !important;
        width: 26px !important;
        min-width: 26px !important;
    }
    .geofs-ui-bottom .geofs-chat-input-section {
        background: rgba(0,0,0,0.35) !important;
        border: 1px solid rgba(255,255,255,0.12) !important;
        border-radius: 3px !important;
        padding: 0 6px !important;
        height: 28px !important;
        display: inline-flex !important;
        align-items: center !important;
    }
    .geofs-ui-bottom .geofs-chat-input-section input {
        color: #fff !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 11px !important;
    }
    .geofs-ui-bottom .geofs-chat-input-section .mdl-textfield__label {
        color: #ccc !important;
        font-size: 11px !important;
    }
    .geofs-ui-bottom .mdl-button.geofs-toggled,
    .geofs-ui-bottom .mdl-button.is-active {
        background: rgba(220,220,220,0.35) !important;
        border-color: #fff !important;
        color: #fff !important;
    }
    .geofs-ui-bottom .geofs-button-fullscreen {
        float: none !important;
    }

    .control-pad {
        background: rgba(20,20,20,0.85) !important;
        border: 1px solid rgba(255,255,255,0.55) !important;
        border-radius: 4px !important;
        color: #fff !important;
        backdrop-filter: blur(6px) !important;
        -webkit-backdrop-filter: blur(6px) !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.08) !important;
        font-family: 'Consolas','Menlo',monospace !important;
        transition: background 0.15s, border-color 0.15s !important;
        cursor: pointer !important;
    }
    .control-pad:hover {
        background: rgba(220,220,220,0.35) !important;
        border-color: #fff !important;
    }
    .control-pad.blue-pad,
    .control-pad.green-pad,
    .control-pad.red-pad,
    .control-pad.orange-pad,
    .control-pad.yellow-pad {
        background: rgba(20,20,20,0.85) !important;
        border-color: rgba(255,255,255,0.55) !important;
    }
    .control-pad-label, .control-pad .control-pad-label, .transp-pad {
        color: #fff !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 12px !important;
        font-weight: bold !important;
        letter-spacing: 2px !important;
        text-transform: uppercase !important;
        background: transparent !important;
        text-shadow: 0 0 4px rgba(0,0,0,0.8) !important;
    }

    .geofs-radio-pad,
    .geofs-autopilot-pad {
        position: fixed !important;
        top: 8px !important;
        z-index: 1000000 !important;
        width: 150px !important;
        height: 32px !important;
        margin: 0 !important;
        padding: 0 !important;
        right: auto !important;
        bottom: auto !important;
    }
    .geofs-radio-pad { left: calc(50% - 160px) !important; }
    .geofs-autopilot-pad { left: calc(50% + 10px) !important; }

    .geofs-radio-pad > .control-pad-label,
    .geofs-autopilot-pad > .control-pad-label {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        writing-mode: horizontal-tb !important;
        text-orientation: mixed !important;
        transform: none !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        font-size: 12px !important;
        letter-spacing: 2px !important;
        text-transform: uppercase !important;
        cursor: pointer !important;
        background: transparent !important;
        color: #fff !important;
    }

    .geofs-autopilot-controls,
    .geofs-radio-controls,
    .geofs-radio,
    .geofs-radio-list {
        position: fixed !important;
        top: 50px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 1000001 !important;
        background: rgba(0,0,0,0.78) !important;
        border: 1px solid rgba(255,255,255,0.22) !important;
        border-radius: 6px !important;
        box-shadow: 0 6px 22px rgba(0,0,0,0.65) !important;
        backdrop-filter: blur(12px) !important;
        -webkit-backdrop-filter: blur(12px) !important;
        color: #e0e0e0 !important;
        font-family: 'Consolas','Menlo',monospace !important;
        padding: 12px 16px !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
        align-items: stretch !important;
        justify-content: center !important;
        max-width: min(900px, calc(100vw - 32px)) !important;
        right: auto !important;
        bottom: auto !important;
        margin: 0 !important;
    }
    .geofs-autopilot-controls[style*="display: block"],
    .geofs-radio-controls[style*="display: block"],
    .geofs-radio[style*="display: block"],
    .geofs-radio-list[style*="display: block"] {
        display: flex !important;
    }
    .geofs-autopilot-controls .geofs-overlay,
    .geofs-radio-controls .geofs-overlay,
    .geofs-radio .geofs-overlay,
    .geofs-radio-list .geofs-overlay {
        display: none !important;
    }
    .geofs-autopilot-controls .geofs-autopilot-control,
    .geofs-radio-controls .geofs-radio-control,
    .geofs-radio .geofs-radio-control,
    .geofs-radio-list .geofs-radio-control {
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        transform: none !important;
        float: none !important;
    }

    .geofs-radio-control {
        background: rgba(20,20,20,0.55) !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        border-radius: 3px !important;
        padding: 6px 8px !important;
        margin: 4px !important;
        color: #e0e0e0 !important;
        font-family: 'Consolas','Menlo',monospace !important;
    }
    .geofs-radio-label {
        color: #ccc !important;
        font-size: 11px !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        background: transparent !important;
    }
    .geofs-radio-display {
        background: rgba(0,0,0,0.65) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        border-radius: 2px !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 13px !important;
        letter-spacing: 1px !important;
        padding: 2px 4px !important;
        text-align: center !important;
    }
    .geofs-radio-unit {
        color: #aaa !important;
        font-size: 10px !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
    }
    .geofs-radio-select,
    .geofs-radio-ident {
        background: rgba(30,30,30,0.6) !important;
        border: 1px solid rgba(255,255,255,0.18) !important;
        border-radius: 2px !important;
        color: #ddd !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 10px !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        padding: 2px 6px !important;
        cursor: pointer !important;
        transition: background 0.15s, border-color 0.15s !important;
    }
    .geofs-radio-select:hover,
    .geofs-radio-ident:hover {
        background: rgba(180,180,180,0.25) !important;
        border-color: #fff !important;
        color: #fff !important;
    }
    .geofs-radio-select.on,
    .geofs-radio-select.geofs-toggled {
        background: rgba(220,220,220,0.4) !important;
        border-color: #fff !important;
        color: #fff !important;
    }
    .geofs-radio-knob {
        background-image: none !important;
        background: radial-gradient(circle at 30% 30%, #555, #111) !important;
        border: 1px solid rgba(255,255,255,0.4) !important;
        border-radius: 50% !important;
        box-shadow: 0 0 4px rgba(255,255,255,0.15) !important;
    }
    .geofs-radio-knob::after {
        content: '';
        position: absolute;
        left: 50%; top: 4px;
        width: 2px; height: 8px;
        background: #fff;
        transform: translateX(-50%);
    }

    .geofs-autopilot-control {
        background: rgba(20,20,20,0.55) !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        border-radius: 3px !important;
        padding: 6px 8px !important;
        margin: 4px !important;
        color: #e0e0e0 !important;
        font-family: 'Consolas','Menlo',monospace !important;
        display: inline-flex !important;
        align-items: center !important;
        gap: 4px !important;
    }
    .geofs-autopilot-control input,
    .geofs-autopilot-control .numberValue {
        background: rgba(0,0,0,0.65) !important;
        color: #fff !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        border-radius: 2px !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 13px !important;
        letter-spacing: 1px !important;
        padding: 2px 4px !important;
        text-align: center !important;
    }
    .geofs-autopilot-control span {
        color: #ccc !important;
        font-size: 10px !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        background: transparent !important;
    }
    .geofs-autopilot-control .numberUp,
    .geofs-autopilot-control .numberDown {
        background: rgba(30,30,30,0.6) !important;
        border: 1px solid rgba(255,255,255,0.18) !important;
        border-radius: 2px !important;
        color: #ddd !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 12px !important;
        width: 20px !important;
        height: 20px !important;
        line-height: 18px !important;
        text-align: center !important;
        cursor: pointer !important;
        display: inline-block !important;
        transition: background 0.15s, border-color 0.15s !important;
    }
    .geofs-autopilot-control .numberUp:hover,
    .geofs-autopilot-control .numberDown:hover {
        background: rgba(180,180,180,0.25) !important;
        border-color: #fff !important;
        color: #fff !important;
    }
    .geofs-autopilot-switch {
        display: inline-flex !important;
        margin-left: 4px !important;
    }
    .geofs-autopilot-switch .switchLeft,
    .geofs-autopilot-switch .switchRight {
        background: rgba(30,30,30,0.6) !important;
        border: 1px solid rgba(255,255,255,0.18) !important;
        color: #ddd !important;
        font-family: 'Consolas','Menlo',monospace !important;
        font-size: 10px !important;
        letter-spacing: 1px !important;
        text-transform: uppercase !important;
        padding: 2px 6px !important;
        cursor: pointer !important;
        transition: background 0.15s, border-color 0.15s !important;
    }
    .geofs-autopilot-switch .switchLeft { border-radius: 2px 0 0 2px !important; }
    .geofs-autopilot-switch .switchRight { border-radius: 0 2px 2px 0 !important; border-left: none !important; }
    .geofs-autopilot-switch .switchLeft:hover,
    .geofs-autopilot-switch .switchRight:hover {
        background: rgba(180,180,180,0.25) !important;
        border-color: #fff !important;
        color: #fff !important;
    }
    .geofs-autopilot-switch .green-pad,
    .geofs-autopilot-switch .switchLeft.green-pad,
    .geofs-autopilot-switch .switchRight.green-pad,
    .geofs-autopilot-switch .switchLeft.geofs-toggled,
    .geofs-autopilot-switch .switchRight.geofs-toggled {
        background: rgba(220,220,220,0.4) !important;
        border-color: #fff !important;
        color: #fff !important;
    }

    .geofs-overlay[style*="images/instruments/"] {
        display: none !important;
    }
    .geofs-instrument-background {
        display: none !important;
    }

    .geofs-sd-logo,
    .geofs-sr-logo,
    .geofs-hd-logo {
        display: none !important;
    }

    .geofs-inline-overlay.spoiler-overlay,
    .geofs-inline-overlay.brakes-overlay,
    .geofs-inline-overlay.gear-overlay,
    .geofs-inline-overlay.flaps-overlay,
    .spoiler-overlay,
    .brakes-overlay,
    .gear-overlay,
    .flaps-overlay {
        display: none !important;
    }

    .geofs-chat-messages,
    .geofs-chat-message-list,
    #geofs-chat-messages {
        padding-left: 100px !important;
    }
    .geofs-chat-message {
        margin-left: 100px !important;
    }

    .geofs-list,
    .geofs-aircraft-list,
    .geofs-location-list,
    .geofs-map-list,
    .geofs-preference-list,
    .geofs-player-list,
    .livery-list,
    .geofs-debug,
    .mdl-menu__container.is-visible {
        z-index: 2147483600 !important;
    }

    body.msfs-menu-open #msfs-ui-root {
        opacity: 0;
        pointer-events: none;
    }
    #msfs-ui-root { transition: opacity 0.2s ease; }
    `;

    function buildSpeedTicks() {
        let html = '';
        for (let v = 400; v >= 0; v -= 10) html += `<div class="tick">${v}</div>`;
        return html;
    }
    function buildAltTicks() {
        let html = '';
        for (let v = 50000; v >= 0; v -= 200) html += `<div class="tick">${v}</div>`;
        return html;
    }

    function init() {
        if (document.getElementById('msfs-ui-root')) return;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        const root = document.createElement('div');
        root.id = 'msfs-ui-root';
        root.innerHTML = `
            <div class="panel" id="msfs-hdg">
                <div class="hdg-readout"><span id="v-hdg">000</span>°</div>
                <canvas id="c-hdg" width="170" height="170"></canvas>
            </div>

            <div class="panel" id="msfs-spd">
                <div class="top-label">AIRSPEED</div>
                <div class="tape"><div class="strip" id="spd-strip">${buildSpeedTicks()}</div></div>
                <div class="center" id="v-ias">0</div>
                <div class="bot-label">KTS</div>
            </div>

            <div class="panel" id="msfs-flaps">
                <div class="top-label">FLAPS</div>
                <div class="bar"><div class="knob" id="v-flaps"></div></div>
                <div class="val" id="v-flaps-pct">0%</div>
            </div>

            <div class="panel" id="msfs-spl">
                <div class="top-label">SPOILERS</div>
                <div class="bar"><div class="knob" id="v-spl"></div></div>
                <div class="val" id="v-spl-pct">0%</div>
            </div>

            <div class="panel" id="msfs-thr">
                <div class="top-label">THROTTLE</div>
                <div class="bar"><div class="fill" id="v-thr-fill"></div></div>
                <div class="val" id="v-thr-pct">0%</div>
            </div>

            <div class="panel" id="msfs-alt">
                <div class="top-label">ALTITUDE</div>
                <div class="tape"><div class="strip" id="alt-strip">${buildAltTicks()}</div></div>
                <div class="center" id="v-alt">0</div>
                <div class="bot-label">FT</div>
            </div>
        `;
        document.body.appendChild(root);

        wireMenuWatcher();

        requestAnimationFrame(loop);
    }

    function wireMenuWatcher() {
        const MENU_SELECTORS = [
            '.geofs-list',
            '.geofs-aircraft-list',
            '.geofs-location-list',
            '.geofs-map-list',
            '.geofs-preference-list',
            '.geofs-player-list',
            '.livery-list',
            '.geofs-debug',
        ];
        const isMenuOpen = () => {
            for (const sel of MENU_SELECTORS) {
                for (const el of document.querySelectorAll(sel)) {
                    if (el.offsetParent === null) continue;
                    const cs = getComputedStyle(el);
                    if (cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.05) {
                        return true;
                    }
                }
            }
            return false;
        };
        setInterval(() => {
            document.body.classList.toggle('msfs-menu-open', isMenuOpen());
        }, 200);
    }

    function drawCompass(ctx, hdg) {
        const W = 170, H = 170, cx = W / 2, cy = H / 2, r = 72;
        ctx.clearRect(0, 0, W, H);
        ctx.save();
        ctx.translate(cx, cy);

        ctx.fillStyle = 'rgba(10,15,25,0.55)';
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

        ctx.rotate(-hdg * Math.PI / 180);
        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.font = '11px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let deg = 0; deg < 360; deg += 10) {
            const isMajor = deg % 30 === 0;
            ctx.save();
            ctx.rotate(deg * Math.PI / 180);
            ctx.lineWidth = isMajor ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(0, -r);
            ctx.lineTo(0, -r + (isMajor ? 10 : 5));
            ctx.stroke();
            if (isMajor) {
                ctx.translate(0, -r + 22);
                ctx.rotate(hdg * Math.PI / 180);
                let label;
                if (deg === 0) label = 'N';
                else if (deg === 90) label = 'E';
                else if (deg === 180) label = 'S';
                else if (deg === 270) label = 'W';
                else label = String(deg / 10);
                ctx.fillText(label, 0, 0);
            }
            ctx.restore();
        }
        ctx.restore();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx, cy - r - 2);
        ctx.lineTo(cx - 6, cy - r - 12);
        ctx.lineTo(cx + 6, cy - r - 12);
        ctx.closePath();
        ctx.fill();
    }

    function readState() {
        const g = window.geofs;
        if (!g) return null;
        const av = g.animation?.values || g.aircraft?.instance?.animationValue;
        if (!av) return null;

        let thr = 0;
        const ctrls = g.controls?.controls;
        if (ctrls && typeof ctrls.throttle === 'number') thr = ctrls.throttle;
        else if (typeof av.throttle === 'number') thr = av.throttle;
        else if (g.aircraft?.instance?.engine?.[0]?.throttle != null)
            thr = g.aircraft.instance.engine[0].throttle;
        if (thr < 0) thr = 0;
        if (thr > 1) thr = thr / 100;

        let spl = 0;
        if (ctrls && typeof ctrls.airbrakes === 'number') spl = ctrls.airbrakes;
        else if (ctrls && typeof ctrls.spoilers === 'number') spl = ctrls.spoilers;
        else if (typeof av.airbrakesPosition === 'number') spl = av.airbrakesPosition;
        else if (typeof av.spoilersPosition === 'number') spl = av.spoilersPosition;
        if (spl < 0) spl = 0;
        if (spl > 1) spl = spl / 100;

        return {
            ias: av.kias ?? av.ias ?? 0,
            alt: av.altitude ?? av.altitude1 ?? 0,
            hdg: ((av.heading360 ?? av.heading ?? 0) + 360) % 360,
            flaps: av.flapsPosition ?? av.flaps ?? 0,
            throttle: thr,
            spoilers: spl,
        };
    }

    let _lastHdg = 0;
    function loop() {
        const s = readState();
        if (s) {
            _lastHdg = s.hdg;
            const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            set('v-ias', Math.round(s.ias));
            set('v-alt', Math.round(s.alt));
            set('v-hdg', String(Math.round(s.hdg)).padStart(3, '0'));

            const spdStrip = document.getElementById('spd-strip');
            if (spdStrip) {
                const tapeH = spdStrip.parentElement.clientHeight;
                const offset = ((400 - s.ias) / 10) * 24;
                spdStrip.style.top = (tapeH / 2 - offset - 12) + 'px';
            }
            const altStrip = document.getElementById('alt-strip');
            if (altStrip) {
                const tapeH = altStrip.parentElement.clientHeight;
                const offset = ((50000 - s.alt) / 200) * 24;
                altStrip.style.top = (tapeH / 2 - offset - 12) + 'px';
            }

            const flapsKnob = document.getElementById('v-flaps');
            const flapsPct = document.getElementById('v-flaps-pct');
            if (flapsKnob) {
                const pct = Math.max(0, Math.min(1, s.flaps));
                flapsKnob.style.top = `calc(${pct * 100}% - 2px)`;
                if (flapsPct) flapsPct.textContent = Math.round(pct * 100) + '%';
            }

            const thrFill = document.getElementById('v-thr-fill');
            const thrPct = document.getElementById('v-thr-pct');
            if (thrFill) {
                const pct = Math.max(0, Math.min(1, s.throttle));
                thrFill.style.height = (pct * 100) + '%';
                if (thrPct) thrPct.textContent = Math.round(pct * 100) + '%';
            }

            const splKnob = document.getElementById('v-spl');
            const splPct = document.getElementById('v-spl-pct');
            if (splKnob) {
                const pct = Math.max(0, Math.min(1, s.spoilers));
                splKnob.style.top = `calc(${pct * 100}% - 2px)`;
                if (splPct) splPct.textContent = Math.round(pct * 100) + '%';
            }

            const cHdg = document.getElementById('c-hdg');
            if (cHdg) drawCompass(cHdg.getContext('2d'), s.hdg);
        } else {
            const cHdg = document.getElementById('c-hdg');
            if (cHdg) drawCompass(cHdg.getContext('2d'), _lastHdg);
        }
        requestAnimationFrame(loop);
    }

    function unhideMistakes() {
        document.querySelectorAll('[data-msfs-hidden]').forEach(el => {
            el.style.removeProperty('display');
            delete el.dataset.msfsHidden;
        });
    }

    function autoCycleVisibility() {
        const ready = () => {
            const g = window.geofs;
            if (!g || typeof g.visibilityCycle !== 'function') return false;
            const inst = g.instruments;
            if (!inst || !inst.groups) return false;
            const keys = Object.keys(inst.groups);
            if (!keys.length) return false;
            return keys.some(k => inst.groups[k] && inst.groups[k].controls);
        };
        const tryCycle = (attempt = 0) => {
            if (ready()) {
                try {
                    window.geofs.visibilityCycle();
                    window.geofs.visibilityCycle();
                    window.geofs.visibilityCycle();
                } catch (e) {
                    if (attempt < 60) setTimeout(() => tryCycle(attempt + 1), 1000);
                }
            } else if (attempt < 60) {
                setTimeout(() => tryCycle(attempt + 1), 1000);
            }
        };
        setTimeout(() => tryCycle(), 6000);
    }

    function enableMapNavLayers() {
        const tryEnable = (attempt = 0) => {
            const g = window.geofs;
            const map = g && g.map;
            if (!map) {
                if (attempt < 60) setTimeout(() => tryEnable(attempt + 1), 1000);
                return;
            }
            try {
                if (typeof map.toggleAirports === 'function') map.airportsVisible !== true && map.toggleAirports(true);
                else if (typeof map.showAirports === 'function') map.showAirports(true);
                else if (map.airports && typeof map.airports.show === 'function') map.airports.show();

                if (typeof map.toggleRunways === 'function') map.runwaysVisible !== true && map.toggleRunways(true);
                else if (typeof map.showRunways === 'function') map.showRunways(true);

                if (typeof map.toggleNavaids === 'function') map.navaidsVisible !== true && map.toggleNavaids(true);
                else if (typeof map.showNavaids === 'function') map.showNavaids(true);
                else if (map.navaids && typeof map.navaids.show === 'function') map.navaids.show();

                if (typeof map.toggleWaypoints === 'function') map.waypointsVisible !== true && map.toggleWaypoints(true);
                else if (typeof map.showWaypoints === 'function') map.showWaypoints(true);

                if (map.options) {
                    map.options.showAirports = true;
                    map.options.showRunways = true;
                    map.options.showNavaids = true;
                    map.options.showWaypoints = true;
                }
                if (typeof map.update === 'function') map.update();
                if (typeof map.refresh === 'function') map.refresh();
            } catch (e) {
                if (attempt < 60) setTimeout(() => tryEnable(attempt + 1), 1000);
            }
        };
        setTimeout(() => tryEnable(), 6000);
    }

    function boot() {
        unhideMistakes();
        init();
        autoCycleVisibility();
        enableMapNavLayers();
    }

    if (document.body) boot();
    else window.addEventListener('DOMContentLoaded', boot, { once: true });
})();
