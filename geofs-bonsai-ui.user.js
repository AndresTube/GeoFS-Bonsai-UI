// ==UserScript==
// @name         GeoFS Bonsai UI
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  Bonsai UI: Monochromatic MSFS-style HUD for GeoFS
// @author       Fendrixx
// @match        https://www.geo-fs.com/geofs.php*
// @match        https://*.geo-fs.com/geofs.php*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const css = `
    #msfs-ui-root {
        position: fixed; inset: 0;
        pointer-events: none; z-index: 999999;
        font-family: 'Consolas','Menlo',monospace; color: #fff;
        text-shadow: 0 0 2px #000;
        --bonsai-bottom: 10px;
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
        top: 8px; left: 50%; transform: translateX(-50%);
        width: 420px; height: 36px;
        background: rgba(0,0,0,0.55);
    }
    #msfs-hdg .hdg-readout {
        position: absolute; top: 100%; left: 50%; transform: translate(-50%, 2px);
        background: #000; padding: 2px 10px; border: 1px solid #fff;
        font-weight: bold; font-size: 13px; z-index: 2; white-space: nowrap;
    }
    #msfs-hdg canvas { display: block; width: 100%; height: 100%; }
    #msfs-hdg .hdg-cursor {
        position: absolute; top: -6px; left: 50%; transform: translateX(-50%);
        width: 0; height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #fff;
        z-index: 2;
    }

    #msfs-spd {
        left: 12px; bottom: var(--bonsai-bottom);
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
        left: 12px; bottom: calc(var(--bonsai-bottom) + 240px);
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
        left: 90px; bottom: var(--bonsai-bottom);
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
        left: 154px; bottom: var(--bonsai-bottom);
        width: 56px; height: 100px;
    }

    #msfs-alt {
        right: 12px; bottom: var(--bonsai-bottom);
        width: 80px; height: 220px;
    }

    #msfs-gear, #msfs-brk, #msfs-wind {
        right: 100px;
        width: 56px; height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 2px;
    }
    #msfs-gear { bottom: var(--bonsai-bottom); }
    #msfs-brk  { bottom: calc(var(--bonsai-bottom) + 52px); }
    #msfs-wind { bottom: calc(var(--bonsai-bottom) + 104px); }
    #msfs-gear .lbl, #msfs-brk .lbl, #msfs-wind .lbl {
        font-size: 9px;
        letter-spacing: 1.5px;
        color: #aaa;
        text-transform: uppercase;
    }
    #msfs-gear .val, #msfs-brk .val, #msfs-wind .val {
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 1.5px;
        color: #ddd;
        padding: 1px 6px;
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 2px;
        background: rgba(0,0,0,0.4);
    }
    #msfs-gear .val.on  { color: #fff; background: rgba(40,150,40,0.35); border-color: #6c6; }
    #msfs-gear .val.off { color: #fff; background: rgba(150,40,40,0.35); border-color: #c66; }
    #msfs-brk  .val.on  { color: #fff; background: rgba(180,140,0,0.4);  border-color: #db3; }
    #msfs-brk  .val.off { color: #aaa; }

    #msfs-eng {
        left: 90px;
        bottom: calc(var(--bonsai-bottom) + 110px);
        width: 56px; height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 2px;
    }
    #msfs-eng .lbl {
        font-size: 9px;
        letter-spacing: 1.5px;
        color: #aaa;
        text-transform: uppercase;
    }
    #msfs-eng .val {
        font-size: 12px;
        font-weight: bold;
        letter-spacing: 1.5px;
        color: #ddd;
        padding: 1px 6px;
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 2px;
        background: rgba(0,0,0,0.4);
    }
    #msfs-eng .val.on  { color: #fff; background: rgba(40,150,40,0.35); border-color: #6c6; }
    #msfs-eng .val.off { color: #fff; background: rgba(150,40,40,0.35); border-color: #c66; }

    #msfs-thr.reverse .bar { border-color: #db3 !important; }
    #msfs-thr.reverse .fill {
        background: linear-gradient(#ffd24a, #b58a00) !important;
    }
    #msfs-thr.reverse .top-label,
    #msfs-thr.reverse .val { color: #ffd24a !important; }

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
    .geofs-recordPlayer-slider {
        position: fixed !important;
        width: 380px !important;
        min-width: 380px !important;
        height: 14px !important;
        background: rgba(0,0,0,0.6) !important;
        border: 1px solid rgba(255,255,255,0.2) !important;
        border-radius: 7px !important;
        bottom: 54px !important;
        left: 50% !important;
        right: auto !important;
        top: auto !important;
        transform: translateX(-50%) !important;
        padding: 0 !important;
        margin: 0 !important;
        z-index: 2147483647 !important;
        display: block !important;
        box-shadow: 0 4px 10px rgba(0,0,0,0.5) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
    }
    .geofs-recordPlayer-slider .slider-rail {
        width: 100% !important;
        height: 100% !important;
        background: transparent !important;
    }
    .geofs-recordPlayer-slider .slider-selection {
        height: 100% !important;
        background: rgba(255,255,255,0.3) !important;
        border-radius: 7px !important;
    }
    .geofs-recordPlayer-slider .slider-grippy {
        width: 14px !important;
        height: 22px !important;
        margin-top: -4px !important;
        background: #fff !important;
        border-radius: 3px !important;
        box-shadow: 0 0 4px rgba(0,0,0,0.8) !important;
        position: absolute !important;
        right: -7px !important;
        cursor: pointer !important;
        top: 0 !important;
    }
    .geofs-recordPlayer-slider .slider-input {
        opacity: 0 !important;
        width: 100% !important;
        height: 100% !important;
        cursor: pointer !important;
        position: absolute !important;
        inset: 0 !important;
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
        top: 50px !important;
        z-index: 1000000 !important;
        width: 110px !important;
        height: 32px !important;
        margin: 0 !important;
        padding: 0 !important;
        right: auto !important;
        bottom: auto !important;
    }
    .geofs-radio-pad     { left: 16px !important; }
    .geofs-autopilot-pad { left: 132px !important; }

    .geofs-flightPlan {
        top: 40px !important;
    }

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
        top: 90px !important;
        left: 16px !important;
        right: auto !important;
        transform: none !important;
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
    .flaps-overlay,
    .geofs-screenshot {
        display: none !important;
    }

    .geofs-chat,
    .geofs-chat-container,
    .geofs-chat-messages,
    .geofs-chat-message-list,
    #geofs-chat-messages {
        position: fixed !important;
        left: 16px !important;
        top: 60px !important;
        bottom: auto !important;
        width: 226px !important;
        max-width: 226px !important;
        height: 50px !important;
        max-height: 50px !important;
        overflow: hidden !important;
        padding-left: 0 !important;
        box-sizing: border-box !important;
    }
    .geofs-chat-message {
        margin-left: 0 !important;
        max-width: 226px !important;
        word-wrap: break-word !important;
        overflow-wrap: break-word !important;
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

    #bonsai-landing-popup {
        position: fixed;
        bottom: 56px;
        left: 50%;
        transform: translate(-50%, 12px);
        z-index: 2147483647;
        padding: 6px 12px;
        background: rgba(0,0,0,0.78);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 6px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.6);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        color: #fff;
        font-family: 'Consolas','Menlo',monospace;
        text-align: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.2,0.8,0.2,1);
        display: flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
    }
    #bonsai-landing-popup.show {
        opacity: 1;
        transform: translate(-50%, 0);
    }
    #bonsai-landing-popup .bl-fpm {
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 1.5px;
        line-height: 1;
    }
    #bonsai-landing-popup .bl-fpm-unit {
        font-size: 10px;
        color: #bbb;
        letter-spacing: 1.5px;
        text-transform: uppercase;
    }
    #bonsai-landing-popup .bl-grade {
        display: inline-block;
        padding: 3px 10px;
        font-size: 11px;
        font-weight: bold;
        letter-spacing: 2px;
        text-transform: uppercase;
        border-radius: 3px;
        border: 1px solid rgba(255,255,255,0.2);
    }
    #bonsai-landing-popup .bl-grade.butter     { background: #1e6b1e; color: #fff; }
    #bonsai-landing-popup .bl-grade.great      { background: #2c8a2c; color: #fff; }
    #bonsai-landing-popup .bl-grade.acceptable { background: #b58a00; color: #000; }
    #bonsai-landing-popup .bl-grade.hard       { background: #a83232; color: #fff; }
    #bonsai-landing-popup .bl-grade.crash      { background: #5c0000; color: #fff; }
    #bonsai-landing-popup .bl-title {
        font-size: 9px;
        color: #aaa;
        letter-spacing: 2px;
        text-transform: uppercase;
    }

    body.msfs-hidden #msfs-ui-root,
    body.msfs-hidden #bonsai-landing-popup { display: none !important; }

    body .geofs-alarms-container,
    body .geofs-control-status,
    body .geofs-crashOverlay,
    body .geofs-message,
    body .geofs-warning {
        position: fixed !important;
        left: 50% !important;
        right: auto !important;
        top: auto !important;
        bottom: 60px !important;
        transform: translateX(-50%) !important;
        z-index: 2147483640 !important;
        margin: 0 !important;
        width: auto !important;
        height: auto !important;
        float: none !important;
        pointer-events: none;
    }
    body .geofs-control-status { bottom: 100px !important; pointer-events: auto; }
    body .geofs-alarms-container .geofs-textOverlay {
        position: relative !important;
        margin: 0 4px !important;
        transform: none !important;
        transform-origin: 0 0 !important;
    }

    #bonsai-settings-btn {
        position: fixed;
        top: 50px;
        right: 8px;
        z-index: 2147483646;
        width: 32px;
        height: 32px;
        border-radius: 4px;
        background: rgba(0,0,0,0.55);
        border: 1px solid rgba(255,255,255,0.25);
        color: #fff;
        font-family: 'Consolas','Menlo',monospace;
        font-size: 16px;
        cursor: pointer;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        pointer-events: auto;
    }
    #bonsai-settings-btn:hover { background: rgba(0,0,0,0.75); }
    body.msfs-hidden #bonsai-settings-btn { display: none !important; }

    #bonsai-settings {
        position: fixed;
        top: 90px;
        right: 8px;
        z-index: 2147483646;
        width: 320px;
        max-height: 80vh;
        overflow-y: auto;
        background: rgba(0,0,0,0.82);
        border: 1px solid rgba(255,255,255,0.25);
        border-radius: 6px;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        color: #fff;
        font-family: 'Consolas','Menlo',monospace;
        font-size: 12px;
        padding: 14px 16px;
        display: none;
        pointer-events: auto;
    }
    #bonsai-settings.show { display: block; }
    #bonsai-settings h3 {
        font-size: 12px; letter-spacing: 3px; margin: 0 0 10px; color: #ccc;
        border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 6px;
    }
    #bonsai-settings h4 {
        font-size: 10px; letter-spacing: 2px; margin: 12px 0 6px; color: #888;
    }
    #bonsai-settings .row {
        display: flex; align-items: center; justify-content: space-between;
        padding: 4px 0;
    }
    #bonsai-settings .row label { flex: 1; cursor: pointer; }
    #bonsai-settings input[type="checkbox"] { accent-color: #fff; cursor: pointer; }
    #bonsai-settings input[type="range"] { width: 130px; }
    #bonsai-settings input[type="text"] {
        width: 60px; background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.25);
        color: #fff; padding: 2px 6px; font-family: inherit; text-align: center;
        text-transform: uppercase;
    }
    #bonsai-settings .hint { color: #888; font-size: 10px; margin-top: 4px; }
    #bonsai-settings button.reset {
        margin-top: 10px; width: 100%; padding: 6px;
        background: rgba(255,255,255,0.08); color: #fff;
        border: 1px solid rgba(255,255,255,0.2); cursor: pointer;
        font-family: inherit; letter-spacing: 2px; font-size: 11px;
    }
    #bonsai-settings button.reset:hover { background: rgba(255,255,255,0.18); }
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

    const SETTINGS_KEY = 'bonsaiUISettings_v1';
    const PANELS = [
        { id: 'msfs-hdg', label: 'Heading compass' },
        { id: 'msfs-spd', label: 'Airspeed tape' },
        { id: 'msfs-alt', label: 'Altitude tape' },
        { id: 'msfs-thr', label: 'Throttle gauge' },
        { id: 'msfs-flaps', label: 'Flaps gauge' },
        { id: 'msfs-spl', label: 'Spoilers gauge' },
        { id: 'msfs-gear', label: 'Gear indicator' },
        { id: 'msfs-brk', label: 'Brakes indicator' },
        { id: 'msfs-wind', label: 'Wind indicator' },
        { id: 'msfs-eng', label: 'Engine indicator' },
    ];
    const DEFAULT_SETTINGS = {
        panels: Object.fromEntries(PANELS.map(p => [p.id, true])),
        opacity: 1.0,
        scale: 1.0,
        bottomOffset: 10,
        hideHotkey: 'h',
        landingPopup: true,
    };
    let _settings = loadSettings();

    function loadSettings() {
        try {
            const raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
            const parsed = JSON.parse(raw);
            return {
                panels: { ...DEFAULT_SETTINGS.panels, ...(parsed.panels || {}) },
                opacity: typeof parsed.opacity === 'number' ? parsed.opacity : DEFAULT_SETTINGS.opacity,
                scale: typeof parsed.scale === 'number' ? parsed.scale : DEFAULT_SETTINGS.scale,
                bottomOffset: typeof parsed.bottomOffset === 'number' ? parsed.bottomOffset : DEFAULT_SETTINGS.bottomOffset,
                hideHotkey: parsed.hideHotkey || DEFAULT_SETTINGS.hideHotkey,
                landingPopup: parsed.landingPopup !== false,
            };
        } catch (e) {
            return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
    }
    function saveSettings() {
        try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(_settings)); } catch (e) { }
    }
    const PANEL_ORIGINS = {
        'msfs-hdg': 'top center',
        'msfs-spd': 'bottom left',
        'msfs-thr': 'bottom left',
        'msfs-flaps': 'bottom left',
        'msfs-spl': 'bottom left',
        'msfs-eng': 'bottom left',
        'msfs-alt': 'bottom right',
        'msfs-gear': 'bottom right',
        'msfs-brk': 'bottom right',
        'msfs-wind': 'bottom right',
    };
    function applySettings() {
        const root = document.getElementById('msfs-ui-root');
        if (root) {
            root.style.opacity = String(_settings.opacity);
            root.style.setProperty('--bonsai-bottom', (_settings.bottomOffset || 0) + 'px');
        }
        const sc = _settings.scale || 1;
        for (const p of PANELS) {
            const el = document.getElementById(p.id);
            if (!el) continue;
            el.style.display = _settings.panels[p.id] ? '' : 'none';
            el.style.transformOrigin = PANEL_ORIGINS[p.id] || 'top left';
            const baseTransform = (p.id === 'msfs-hdg') ? 'translateX(-50%)' : '';
            const scaleTransform = (sc === 1) ? '' : `scale(${sc})`;
            el.style.transform = [baseTransform, scaleTransform].filter(Boolean).join(' ');
        }
        const popup = document.getElementById('bonsai-landing-popup');
        if (popup && !_settings.landingPopup) {
            popup.classList.remove('show');
        }
    }

    function buildSettingsPanel() {
        if (document.getElementById('bonsai-settings')) return;

        const btn = document.createElement('button');
        btn.id = 'bonsai-settings-btn';
        btn.textContent = '⚙';
        btn.title = 'Bonsai UI settings';
        document.body.appendChild(btn);

        const panel = document.createElement('div');
        panel.id = 'bonsai-settings';
        panel.innerHTML = `
            <h3>BONSAI UI</h3>
            <h4>ELEMENTS</h4>
            ${PANELS.map(p => `
                <div class="row">
                    <label for="bs-${p.id}">${p.label}</label>
                    <input type="checkbox" id="bs-${p.id}" data-panel="${p.id}">
                </div>
            `).join('')}
            <div class="row">
                <label for="bs-landing">Landing FPM popup</label>
                <input type="checkbox" id="bs-landing">
            </div>
            <h4>OPACITY</h4>
            <div class="row">
                <input type="range" id="bs-opacity" min="0.1" max="1" step="0.05">
                <span id="bs-opacity-val">100%</span>
            </div>
            <h4>SIZE</h4>
            <div class="row">
                <input type="range" id="bs-scale" min="0.5" max="2" step="0.05">
                <span id="bs-scale-val">100%</span>
            </div>
            <h4>BOTTOM OFFSET</h4>
            <div class="row">
                <input type="range" id="bs-bottom" min="0" max="200" step="2">
                <span id="bs-bottom-val">10px</span>
            </div>
            <div class="hint">Lift HUD above GeoFS bottom bar.</div>
            <h4>HIDE HOTKEY</h4>
            <div class="row">
                <label for="bs-hotkey">Toggle HUD key</label>
                <input type="text" id="bs-hotkey" maxlength="12" readonly>
            </div>
            <div class="hint">Click box, then press a key.</div>
            <button class="reset" id="bs-reset">RESET TO DEFAULTS</button>
        `;
        document.body.appendChild(panel);

        btn.addEventListener('click', () => {
            panel.classList.toggle('show');
            btn.blur();
        });

        for (const p of PANELS) {
            const cb = panel.querySelector(`#bs-${p.id}`);
            cb.checked = !!_settings.panels[p.id];
            cb.addEventListener('change', () => {
                _settings.panels[p.id] = cb.checked;
                saveSettings(); applySettings();
            });
        }

        const landing = panel.querySelector('#bs-landing');
        landing.checked = !!_settings.landingPopup;
        landing.addEventListener('change', () => {
            _settings.landingPopup = landing.checked;
            saveSettings(); applySettings();
        });

        const op = panel.querySelector('#bs-opacity');
        const opVal = panel.querySelector('#bs-opacity-val');
        op.value = _settings.opacity;
        opVal.textContent = Math.round(_settings.opacity * 100) + '%';
        op.addEventListener('input', () => {
            _settings.opacity = parseFloat(op.value);
            opVal.textContent = Math.round(_settings.opacity * 100) + '%';
            saveSettings(); applySettings();
        });

        const sc = panel.querySelector('#bs-scale');
        const scVal = panel.querySelector('#bs-scale-val');
        sc.value = _settings.scale;
        scVal.textContent = Math.round(_settings.scale * 100) + '%';
        sc.addEventListener('input', () => {
            _settings.scale = parseFloat(sc.value);
            scVal.textContent = Math.round(_settings.scale * 100) + '%';
            saveSettings(); applySettings();
        });

        const bo = panel.querySelector('#bs-bottom');
        const boVal = panel.querySelector('#bs-bottom-val');
        bo.value = _settings.bottomOffset;
        boVal.textContent = _settings.bottomOffset + 'px';
        bo.addEventListener('input', () => {
            _settings.bottomOffset = parseInt(bo.value, 10);
            boVal.textContent = _settings.bottomOffset + 'px';
            saveSettings(); applySettings();
        });

        const hk = panel.querySelector('#bs-hotkey');
        hk.value = _settings.hideHotkey.toUpperCase();
        hk.addEventListener('focus', () => { hk.value = '...'; });
        hk.addEventListener('blur', () => { hk.value = _settings.hideHotkey.toUpperCase(); });
        hk.addEventListener('keydown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.key === 'Escape' || e.key === 'Tab') { hk.blur(); return; }
            const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
            _settings.hideHotkey = k;
            hk.value = k.toUpperCase();
            saveSettings();
            hk.blur();
        });

        panel.querySelector('#bs-reset').addEventListener('click', () => {
            _settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
            saveSettings();
            panel.remove();
            btn.remove();
            buildSettingsPanel();
            applySettings();
        });
    }

    function wireHideHotkey() {
        window.addEventListener('keydown', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)) return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const k = (e.key || '').toLowerCase();
            if (k === _settings.hideHotkey) {
                document.body.classList.toggle('msfs-hidden');
            }
        }, true);
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
                <div class="hdg-cursor"></div>
                <canvas id="c-hdg" width="420" height="36"></canvas>
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

            <div class="panel" id="msfs-brk">
                <div class="lbl">BRAKES</div>
                <div class="val off" id="v-brk">OFF</div>
            </div>

            <div class="panel" id="msfs-wind">
                <div class="lbl">WIND</div>
                <div class="val" id="v-wind">0 KTS</div>
            </div>

            <div class="panel" id="msfs-gear">
                <div class="lbl">GEAR</div>
                <div class="val off" id="v-gear">UP</div>
            </div>

            <div class="panel" id="msfs-eng">
                <div class="lbl">ENGINE</div>
                <div class="val off" id="v-eng">OFF</div>
            </div>
        `;
        document.body.appendChild(root);

        wireMenuWatcher();
        buildSettingsPanel();
        wireHideHotkey();
        applySettings();

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
        const canvas = ctx.canvas;
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const PX_PER_DEG = 3;
        const cx = W / 2;
        const startDeg = ((hdg - (W / 2) / PX_PER_DEG) % 360 + 360) % 360;
        const visibleDeg = W / PX_PER_DEG;

        ctx.strokeStyle = '#fff';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const firstTick = Math.ceil(startDeg / 5) * 5;
        for (let d = firstTick; d <= startDeg + visibleDeg + 5; d += 5) {
            const deg = ((d % 360) + 360) % 360;
            const x = (d - startDeg) * PX_PER_DEG;
            const isMajor = deg % 30 === 0;
            const isMid = deg % 10 === 0;

            ctx.lineWidth = isMajor ? 2 : 1;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, isMajor ? 10 : (isMid ? 7 : 4));
            ctx.stroke();

            if (isMajor) {
                let label;
                if (deg === 0) label = 'N';
                else if (deg === 90) label = 'E';
                else if (deg === 180) label = 'S';
                else if (deg === 270) label = 'W';
                else label = String(deg / 10).padStart(2, '0');
                ctx.fillText(label, x, 12);
            }
        }
    }

    function readState() {
        const g = window.geofs;
        if (!g) return null;
        const av = g.animation?.values || g.aircraft?.instance?.animationValue;
        if (!av) return null;

        let thr = 0;
        let rawThr = null;
        const ctrls = g.controls?.controls;
        if (ctrls && typeof ctrls.throttle === 'number') rawThr = ctrls.throttle;
        else if (typeof av.throttle === 'number') rawThr = av.throttle;
        else if (g.aircraft?.instance?.engine?.[0]?.throttle != null)
            rawThr = g.aircraft.instance.engine[0].throttle;
        const reverse = (typeof rawThr === 'number' && rawThr < 0)
            || !!av.reverse
            || !!av.thrustReverse
            || !!(g.aircraft?.instance?.engine?.[0]?.reverse)
            || !!(ctrls && ctrls.reverseThrust);
        thr = (typeof rawThr === 'number') ? Math.abs(rawThr) : 0;
        if (thr > 1) thr = thr / 100;
        if (thr > 1) thr = 1;

        let spl = 0;
        if (ctrls && typeof ctrls.airbrakes === 'number') spl = ctrls.airbrakes;
        else if (ctrls && typeof ctrls.spoilers === 'number') spl = ctrls.spoilers;
        else if (typeof av.airbrakesPosition === 'number') spl = av.airbrakesPosition;
        else if (typeof av.spoilersPosition === 'number') spl = av.spoilersPosition;
        if (spl < 0) spl = 0;
        if (spl > 1) spl = spl / 100;

        let gearDown = true;
        if (typeof av.gearPosition === 'number') gearDown = av.gearPosition < 0.5;
        else if (typeof av.landingGearPosition === 'number') gearDown = av.landingGearPosition < 0.5;
        else if (ctrls && typeof ctrls.gear === 'boolean') gearDown = !ctrls.gear;
        else if (ctrls && typeof ctrls.gear === 'number') gearDown = ctrls.gear < 0.5;

        let brakesOn = false;
        if (ctrls && typeof ctrls.brakes === 'boolean') brakesOn = ctrls.brakes;
        else if (ctrls && typeof ctrls.brakes === 'number') brakesOn = ctrls.brakes > 0.05;
        else if (ctrls && typeof ctrls.parkingBrake === 'boolean') brakesOn = ctrls.parkingBrake;
        else if (typeof av.brakesPosition === 'number') brakesOn = av.brakesPosition > 0.05;
        else if (typeof av.parkingBrake === 'boolean') brakesOn = av.parkingBrake;

        let flapPct = 0;
        let flapStage = 0;
        let flapMax = 0;
        try {
            const overlays = document.querySelectorAll('.flaps-overlay .control-pad-dyn-label, .geofs-flaps-overlay .control-pad-dyn-label');
            for (const ov of overlays) {
                const m = (ov.textContent || '').match(/(\d+)\s*\/\s*(\d+)/);
                if (m) {
                    flapStage = parseInt(m[1], 10);
                    flapMax = parseInt(m[2], 10);
                    break;
                }
            }
            if (!flapMax && ctrls && typeof ctrls.flaps === 'number') flapStage = ctrls.flaps;
            if (typeof av.flapsPosition === 'number') {
                let raw = av.flapsPosition;
                if (raw > 1) raw = raw / 90;
                flapPct = Math.max(0, Math.min(1, raw));
            }
            if ((!flapPct || flapPct < 0.001) && flapMax > 0 && flapStage > 0) {
                flapPct = flapStage / flapMax;
            }
        } catch (e) { }

        let engineOn = false;
        try {
            const inst = g.aircraft && g.aircraft.instance;
            if (inst) {
                if (typeof inst.engineOn === 'boolean') engineOn = inst.engineOn;
                else if (typeof inst.engineRunning === 'boolean') engineOn = inst.engineRunning;
                if (!engineOn && Array.isArray(inst.engines)) {
                    engineOn = inst.engines.some(e => e && (e.running || e.on || e.started || (typeof e.rpm === 'number' && e.rpm > 0.05)));
                }
                if (!engineOn && Array.isArray(inst.engine)) {
                    engineOn = inst.engine.some(e => e && (e.running || e.on || e.started || (typeof e.rpm === 'number' && e.rpm > 0.05)));
                }
            }
            if (!engineOn) {
                if (typeof av.engineOn === 'boolean') engineOn = av.engineOn;
                else if (typeof av.engineRunning === 'boolean') engineOn = av.engineRunning;
                else if (typeof av.engine1Running === 'boolean') engineOn = av.engine1Running;
                else if (typeof av.engineRPM === 'number') engineOn = av.engineRPM > 0.05;
                else if (typeof av.engine1RPM === 'number') engineOn = av.engine1RPM > 0.05;
                else if (typeof av.engineN1 === 'number') engineOn = av.engineN1 > 1;
            }
            if (!engineOn) {
                const overlay = document.querySelector('.geofs-engineToggleOverlay, .engineToggleOverlay, .control-pad.engine-overlay');
                if (overlay) {
                    const txt = (overlay.textContent || '').toUpperCase();
                    if (/\bON\b/.test(txt) && !/\bOFF\b/.test(txt)) engineOn = true;
                    if (overlay.classList.contains('engine-on') || overlay.classList.contains('on')) engineOn = true;
                }
            }
        } catch (e) { }

        let windSpeed = g?.weather?.windSpeed ?? av?.windSpeed ?? 0;
        try {
            const windStickers = document.querySelectorAll('.control-pad-sticker');
            for (const st of windStickers) {
                const txt = st.textContent || '';
                if (txt.includes('kts')) {
                    const parsed = parseInt(txt, 10);
                    if (!isNaN(parsed)) windSpeed = parsed;
                    st.style.display = 'none';
                }
            }
            const windLabels = document.querySelectorAll('.control-pad-label');
            for (const lbl of windLabels) {
                if ((lbl.textContent || '').toLowerCase().includes('wind')) {
                    lbl.style.display = 'none';
                }
            }
            const windPointers = document.querySelectorAll('.geofs-overlay[style*="wind/pointer"], .geofs-overlay[style*="wind/plane"]');
            for (const p of windPointers) {
                p.style.display = 'none';
            }
        } catch (e) { }

        return {
            ias: av.kias ?? av.ias ?? 0,
            alt: av.altitude ?? av.altitude1 ?? 0,
            hdg: ((av.heading360 ?? av.heading ?? 0) + 360) % 360,
            flaps: flapPct,
            flapStage,
            flapMax,
            throttle: thr,
            reverse,
            spoilers: spl,
            gearDown,
            brakesOn,
            engineOn,
            windSpeed: windSpeed,
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
                if (flapsPct) {
                    flapsPct.textContent = (s.flapMax > 0)
                        ? `${s.flapStage}/${s.flapMax}`
                        : Math.round(pct * 100) + '%';
                }
            }

            const thrFill = document.getElementById('v-thr-fill');
            const thrPct = document.getElementById('v-thr-pct');
            if (thrFill) {
                const pct = Math.max(0, Math.min(1, s.throttle));
                thrFill.style.height = (pct * 100) + '%';
                if (thrPct) thrPct.textContent = Math.round(pct * 100) + '%';
            }
            const thrPanel = document.getElementById('msfs-thr');
            if (thrPanel) thrPanel.classList.toggle('reverse', !!s.reverse);

            const vGear = document.getElementById('v-gear');
            if (vGear) {
                vGear.textContent = s.gearDown ? 'DOWN' : 'UP';
                vGear.classList.toggle('on', !!s.gearDown);
                vGear.classList.toggle('off', !s.gearDown);
            }
            const vBrk = document.getElementById('v-brk');
            if (vBrk) {
                vBrk.textContent = s.brakesOn ? 'ON' : 'OFF';
                vBrk.classList.toggle('on', !!s.brakesOn);
                vBrk.classList.toggle('off', !s.brakesOn);
            }
            const vWind = document.getElementById('v-wind');
            if (vWind) {
                vWind.textContent = Math.round(s.windSpeed) + ' KTS';
            }
            const vEng = document.getElementById('v-eng');
            if (vEng) {
                vEng.textContent = s.engineOn ? 'ON' : 'OFF';
                vEng.classList.toggle('on', !!s.engineOn);
                vEng.classList.toggle('off', !s.engineOn);
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
            try {
                document.querySelectorAll('input[data-gespref]').forEach(inp => {
                    const pref = inp.getAttribute('data-gespref') || '';
                    if (/recenterMap|drawFlightPath|showRunways|showAirports|showNavaids|showWaypoints|showPlanes|showFlightPath/i.test(pref)) {
                        if (!inp.checked) {
                            inp.click();
                        }
                    }
                });

                const g = window.geofs;
                if (g) {
                    if (g.preferences && g.preferences.interface) {
                        g.preferences.interface.recenterMap = true;
                        g.preferences.interface.drawFlightPath = true;
                    }
                    if (typeof g.savePreferences === 'function') {
                        try { g.savePreferences(); } catch (e) { }
                    }
                    if (g.flight && g.flight.recorder && typeof g.flight.recorder.setPathDrawState === 'function') {
                        try { g.flight.recorder.setPathDrawState(); } catch (e) { }
                    }
                }
            } catch (e) { }

            if (attempt < 30) setTimeout(() => tryEnable(attempt + 1), 3000);
        };
        setTimeout(() => tryEnable(), 4000);
    }

    function ensureLandingPopup() {
        let el = document.getElementById('bonsai-landing-popup');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'bonsai-landing-popup';
        document.body.appendChild(el);
        return el;
    }

    function gradeFromFpm(fpm) {
        if (fpm <= -1000 || fpm > 200) return { label: 'CRASH', cls: 'crash' };
        if (fpm >= -50) return { label: 'BUTTER', cls: 'butter' };
        if (fpm >= -200) return { label: 'GREAT', cls: 'great' };
        if (fpm >= -500) return { label: 'ACCEPTABLE', cls: 'acceptable' };
        return { label: 'HARD LANDING', cls: 'hard' };
    }

    let _bonsaiPrevGround = true;
    let _bonsaiPrevVS = 0;
    let _bonsaiPopupTimer = null;

    function showLandingPopup(fpm) {
        if (!_settings.landingPopup) return;
        const popup = ensureLandingPopup();
        const g = gradeFromFpm(fpm);
        popup.innerHTML = `
            <div class="bl-title">Touchdown</div>
            <div class="bl-fpm">${Math.round(fpm)}</div>
            <div class="bl-fpm-unit">FPM</div>
            <div class="bl-grade ${g.cls}">${g.label}</div>
        `;
        requestAnimationFrame(() => popup.classList.add('show'));
        if (_bonsaiPopupTimer) clearTimeout(_bonsaiPopupTimer);
        _bonsaiPopupTimer = setTimeout(() => {
            popup.classList.remove('show');
        }, 10000);
    }

    function watchLanding() {
        setInterval(() => {
            const g = window.geofs;
            if (!g || !g.animation || !g.animation.values) return;
            const av = g.animation.values;
            const grounded = !!av.groundContact;
            const vs = av.verticalSpeed;
            if (grounded && !_bonsaiPrevGround) {
                const touchdownFpm = (typeof _bonsaiPrevVS === 'number' && _bonsaiPrevVS !== 0)
                    ? _bonsaiPrevVS
                    : (typeof vs === 'number' ? vs : 0);
                showLandingPopup(touchdownFpm);
            }
            if (!grounded && typeof vs === 'number') _bonsaiPrevVS = vs;
            _bonsaiPrevGround = grounded;
        }, 60);
    }

    function boot() {
        unhideMistakes();
        init();
        autoCycleVisibility();
        enableMapNavLayers();
        ensureLandingPopup();
        watchLanding();
    }

    if (document.body) boot();
    else window.addEventListener('DOMContentLoaded', boot, { once: true });
})();
