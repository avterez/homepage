
function ensureDebugPanel() {
    if (debugPanel) return;
    debugPanel = document.createElement('div');
        debugPanel.id = 'debug-panel';
        debugPanel.className = 'debug-panel';
        debugPanel.style.display = 'none';

        debugPanel.innerHTML = `
            <div class="debug-panel__header">
                <div class="debug-panel__brand">
                    <i class="debug-panel__brand-icon fa-solid fa-bug"></i>
                    <span class="debug-panel__label">DEBUG</span>
                </div>
                <div class="debug-panel__controls">
                    <button type="button" onclick="toggleDebugPanel()" 
                            class="debug-panel__btn debug-panel__btn--close"
                            title="Close debug panel">
                        <i class="debug-panel__btn-icon fa-solid fa-times"></i>
                    </button>
                </div>
            </div>
            <div id="debug-content" class="debug-panel__content"></div>
            <div class="debug-panel__dleaf">
                <span class="debug-panel__dleaf-name">DLEAF</span>
                <span class="debug-panel__dleaf-preview">
                    <span id="dleaf" class="dleaf" role="img" aria-label="DLEAF" title="DLEAF"></span>
                </span>
                <div class="debug-panel__dleaf-angle-row">
                    <button type="button" id="debug-dleaf-angle-minus" class="debug-panel__dleaf-step" aria-label="Decrease DLEAF angle">−</button>
                    <input type="text" id="debug-dleaf-angle" class="debug-panel__dleaf-angle" value="35" inputmode="decimal" aria-label="DLEAF angle" spellcheck="false">
                    <button type="button" id="debug-dleaf-angle-plus" class="debug-panel__dleaf-step" aria-label="Increase DLEAF angle">+</button>
                    <span class="debug-panel__unit">°</span>
                </div>
            </div>
        `;

        document.body.appendChild(debugPanel);
        var dleafAngle = debugPanel.querySelector('#debug-dleaf-angle');
        function applyDleafAngle(raw) {
            var leaf = document.getElementById('dleaf');
            if (!leaf) return;
            var value = parseFloat(String(raw).trim());
            if (!isFinite(value)) return;
            leaf.style.setProperty('--dleaf-angle', value + 'deg');
        }
        function readDleafAngle() {
            var value = parseFloat(String(dleafAngle.value).trim());
            return isFinite(value) ? value : 0;
        }
        function writeDleafAngle(value) {
            var rounded = Math.round(value * 1000) / 1000;
            dleafAngle.value = String(rounded);
            applyDleafAngle(dleafAngle.value);
        }
        function stepDleafAngle(delta) {
            writeDleafAngle(readDleafAngle() + delta);
        }
        if (dleafAngle) {
            applyDleafAngle(dleafAngle.value);
            dleafAngle.addEventListener('input', function () {
                applyDleafAngle(dleafAngle.value);
            });
            var dleafMinus = debugPanel.querySelector('#debug-dleaf-angle-minus');
            var dleafPlus = debugPanel.querySelector('#debug-dleaf-angle-plus');
            if (dleafMinus) dleafMinus.addEventListener('click', function () { stepDleafAngle(-1); });
            if (dleafPlus) dleafPlus.addEventListener('click', function () { stepDleafAngle(1); });
        }

        var debugHeader = debugPanel.querySelector('.debug-panel__header');
        if (debugHeader && debugHeader.style) debugHeader.style.cursor = 'grab';
        debugPanel.style.touchAction = 'none';
        debugPanel.style.msTouchAction = 'none';
        debugPanel.style.webkitUserSelect = 'none';
        debugPanel.style.userSelect = 'none';

        function debugDragPoint(e) {
            if (e.touches && e.touches.length) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            if (e.changedTouches && e.changedTouches.length) {
                return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        function isDleafEventTarget(target) {
            if (!target || typeof target.closest !== 'function') return false;
            return !!target.closest('#dleaf, .debug-panel__dleaf-preview');
        }

        function commitDebugDrag(rect) {
            isDraggingDebug = true;
            debugPanel.style.transition = 'none';
            if (debugHeader && debugHeader.style) debugHeader.style.cursor = 'grabbing';
            if (!debugPanel.style.left || debugPanel.style.left === 'auto') {
                debugPanel.style.left = rect.left + 'px';
                debugPanel.style.top = rect.top + 'px';
                debugPanel.style.right = 'auto';
            }
        }

        function startDebugDrag(e) {
            if (e.type === 'mousedown' && e.button !== 0) return;
            if (e.touches && e.touches.length > 1) return;
            if (e.target && typeof e.target.closest === 'function' && e.target.closest('button, label, input')) return;

            const point = debugDragPoint(e);
            const rect = debugPanel.getBoundingClientRect();
            debugDragOffsetX = point.x - rect.left;
            debugDragOffsetY = point.y - rect.top;
            debugDragOriginX = point.x;
            debugDragOriginY = point.y;
            debugDragMoved = false;
            debugDragPending = true;
            debugDragOnLeaf = isDleafEventTarget(e.target);

            // A still press on the leaf is a click. Movement past the threshold is not a click and does not move the panel.
            if (!debugDragOnLeaf) {
                commitDebugDrag(rect);
                if (e.cancelable) e.preventDefault();
            }
        }

        function moveDebugDrag(e) {
            if (!debugPanel || (!debugDragPending && !isDraggingDebug)) return;
            if (e.touches && e.touches.length > 1) return;

            const point = debugDragPoint(e);
            if (debugDragPending && !debugDragMoved) {
                var dx = point.x - debugDragOriginX;
                var dy = point.y - debugDragOriginY;
                if ((dx * dx + dy * dy) >= (DLEAF_DRAG_THRESHOLD_PX * DLEAF_DRAG_THRESHOLD_PX)) {
                    debugDragMoved = true;
                }
            }
            if (!isDraggingDebug) return;
            if (e.cancelable) e.preventDefault();

            debugPanel.style.left = (point.x - debugDragOffsetX) + 'px';
            debugPanel.style.top = (point.y - debugDragOffsetY) + 'px';
        }

        function endDebugDrag(e) {
            if (e && e.touches && e.touches.length > 0) return;

            var pending = debugDragPending;
            var onLeaf = debugDragOnLeaf;
            var moved = debugDragMoved;
            var cancelled = !!(e && e.type === 'touchcancel');
            debugDragPending = false;
            debugDragOnLeaf = false;
            debugDragMoved = false;

            if (pending && onLeaf && !moved && !cancelled) noteDleafClick();

            if (!isDraggingDebug || !debugPanel) return;

            isDraggingDebug = false;
            debugPanel.style.transition = '';
            if (debugHeader && debugHeader.style) debugHeader.style.cursor = 'grab';
            const rect = debugPanel.getBoundingClientRect();
            const padding = 12;
            const maxLeft = window.innerWidth - rect.width - padding;
            const maxTop = window.innerHeight - rect.height - padding;

            let clampedLeft = Math.max(padding, Math.min(parseFloat(debugPanel.style.left) || rect.left, maxLeft));
            let clampedTop = Math.max(padding, Math.min(parseFloat(debugPanel.style.top) || rect.top, maxTop));

            debugPanel.style.left = clampedLeft + 'px';
            debugPanel.style.top = clampedTop + 'px';
        }

        function onLeafPointerDown(e) {
            startDebugDrag(e);
            if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        }

        var leafHit = debugPanel.querySelector('.debug-panel__dleaf-preview');
        if (leafHit && typeof leafHit.addEventListener === 'function') {
            leafHit.addEventListener('mousedown', onLeafPointerDown);
            leafHit.addEventListener('touchstart', onLeafPointerDown, { passive: false });
        }

        if (debugHeader && typeof debugHeader.addEventListener === 'function') {
            debugHeader.addEventListener('mousedown', startDebugDrag);
            debugHeader.addEventListener('touchstart', startDebugDrag, { passive: false });
        }
        document.addEventListener('mousemove', moveDebugDrag);
        document.addEventListener('touchmove', moveDebugDrag, { passive: false });
        document.addEventListener('mouseup', endDebugDrag);
        document.addEventListener('touchend', endDebugDrag);
        document.addEventListener('touchcancel', endDebugDrag);

        window.addEventListener('resize', () => {
            if (isDebugPanelOpen()) {
                updateDebugInfo();
                const rect = debugPanel.getBoundingClientRect();
                const padding = 12;
                if (rect.left < padding || rect.top < padding ||
                    rect.right > window.innerWidth - padding || rect.bottom > window.innerHeight - padding) {
                    const maxLeft = window.innerWidth - rect.width - padding;
                    const maxTop = window.innerHeight - rect.height - padding;
                    debugPanel.style.left = Math.max(padding, Math.min(rect.left, maxLeft)) + 'px';
                    debugPanel.style.top = Math.max(padding, Math.min(rect.top, maxTop)) + 'px';
                }
            }
        });
}

function toggleDebugPanel() {
    // Not a ui-modal — display + .is-open only; Esc does not close
    ensureDebugPanel();
    setDebugPanelOpen(!isDebugPanelOpen());
}

function setDebugPanelOpen(open) {
    ensureDebugPanel();

    const currentlyOpen = isDebugPanelOpen();
    if (!!open === currentlyOpen) {
        if (open) updateDebugInfo();
        if (typeof syncDebugSettingsCheckbox === 'function') syncDebugSettingsCheckbox();
        return;
    }

    if (open) {
        debugPanel.style.display = 'block';
        debugPanel.classList.add('is-open');
        updateDebugInfo();

        if (!debugUpdateInterval) {
            debugUpdateInterval = setInterval(() => {
                if (isDebugPanelOpen()) {
                    updateDebugInfo();
                }
            }, 250);
        }
    } else {
        debugPanel.style.display = 'none';
        debugPanel.classList.remove('is-open');
        if (debugUpdateInterval) {
            clearInterval(debugUpdateInterval);
            debugUpdateInterval = null;
        }
    }

    if (typeof syncDebugSettingsCheckbox === 'function') syncDebugSettingsCheckbox();
}



// --- Debug panel ---

let debugPanel = null;
let debugUpdateInterval = null;

function isDebugPanelOpen() {
    return !!(debugPanel && debugPanel.style.display !== 'none');
}

let isDraggingDebug = false;
let debugDragOffsetX = 0;
let debugDragOffsetY = 0;
let debugDragPending = false;
let debugDragOnLeaf = false;
let debugDragMoved = false;
let debugDragOriginX = 0;
let debugDragOriginY = 0;
let dleafClickTimes = [];
var DLEAF_CLICKS_TO_OPEN = 10;
var DLEAF_CLICK_WINDOW_MS = 10000;
var DLEAF_DRAG_THRESHOLD_PX = 5;

function noteDleafClick() {
    var now = Date.now();
    var cutoff = now - DLEAF_CLICK_WINDOW_MS;
    var next = [];
    var i;
    for (i = 0; i < dleafClickTimes.length; i++) {
        if (dleafClickTimes[i] >= cutoff) next.push(dleafClickTimes[i]);
    }
    next.push(now);
    if (next.length >= DLEAF_CLICKS_TO_OPEN) {
        dleafClickTimes = [];
        if (typeof openUiModal === 'function') openUiModal('founders-modal');
        return;
    }
    dleafClickTimes = next;
}

function updateDebugInfo() {
    if (!debugPanel) return;
    const content = debugPanel.querySelector('#debug-content');
    if (!content) return;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = (typeof getDevicePixelRatio === 'function')
        ? getDevicePixelRatio()
        : (Number(window.devicePixelRatio) || 1);

    const linkCount = (typeof links !== 'undefined' && Array.isArray(links)) ? links.length : 0;
    const categoryCount = (typeof getAllCategories === 'function') ? getAllCategories().length : 0;

    let commonEmojiCount = 0;
    if (typeof COMMON_EMOJIS === 'object' && COMMON_EMOJIS !== null) {
        Object.values(COMMON_EMOJIS).forEach(arr => {
            if (Array.isArray(arr)) commonEmojiCount += arr.length;
        });
    }

    const prMeta = document.querySelector('meta[name="homepage-pr"]');
    const prNumber = (prMeta && prMeta.content) ? prMeta.content : '?';

    const quoteCount = (typeof dailyQuotes !== 'undefined' && dailyQuotes && typeof dailyQuotes.length === 'number')
        ? dailyQuotes.length
        : 0;
    let quoteShown = '—';
    if (quoteCount > 0 && typeof quoteLineIndex === 'function' && typeof daysSinceJanuary1_2026 === 'function') {
        quoteShown = quoteLineIndex(daysSinceJanuary1_2026(), quoteCount) + 1;
    }

    content.innerHTML = `
        <div class="debug-panel__row">
            <span class="debug-panel__key">PR</span>
            <span class="debug-panel__val debug-panel__val--pr">${prNumber}</span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key"># of Quotes</span>
            <span class="debug-panel__val debug-panel__val--count">${quoteCount}</span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Quote Shown</span>
            <span class="debug-panel__val debug-panel__val--index">${quoteShown}</span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Window Width</span>
            <span class="debug-panel__val debug-panel__val--size">${w} <span class="debug-panel__unit">px</span></span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Window Height</span>
            <span class="debug-panel__val debug-panel__val--size">${h} <span class="debug-panel__unit">px</span></span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">DPR</span>
            <span class="debug-panel__val debug-panel__val--size">${dpr}</span>
        </div>

        <!-- Data Stats -->
        <div class="debug-panel__row debug-panel__row--group">
            <span class="debug-panel__key">Link Cards</span>
            <span class="debug-panel__val debug-panel__val--count">${linkCount}</span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Keyboard Card Index</span>
            <span class="debug-panel__val debug-panel__val--index">${keyboardFocusedIndex}</span>
        </div>
        <div class="debug-panel__row">
            <span class="debug-panel__key">Categories</span>
            <span class="debug-panel__val debug-panel__val--count">${categoryCount}</span>
        </div>
        <div class="debug-panel__row debug-panel__row--last">
            <span class="debug-panel__key">COMMON_EMOJIS</span>
            <span class="debug-panel__val debug-panel__val--count">${commonEmojiCount}</span>
        </div>
    `;
}



