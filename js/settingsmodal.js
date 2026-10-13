function openSettingsModal() {
    updateSettingsMobileInfo();
    if (typeof syncDebugSettingsCheckbox === 'function') syncDebugSettingsCheckbox();
    openUiModal('settings-modal');
}

function closeSettingsModal(restoreSearch) {
    closeUiModal('settings-modal');
    if (restoreSearch !== false) restoreLinkSearchFocus();
}


function buildColorThemeField(field) {
    const wrap = document.createElement('div');
    wrap.className = 'color-theme-modal__field';

    const label = document.createElement('label');
    label.className = 'color-theme-modal__label';
    label.textContent = field.label;
    wrap.appendChild(label);

    const controls = document.createElement('div');
    controls.className = 'color-theme-modal__controls';

    const picker = document.createElement('input');
    picker.type = 'color';
    picker.id = colorFieldPickerId(field);
    picker.className = 'color-theme-modal__picker';
    controls.appendChild(picker);

    const text = document.createElement('input');
    text.type = 'text';
    text.id = colorFieldTextId(field);
    text.className = 'color-theme-modal__hex';
    text.placeholder = field.light;
    controls.appendChild(text);

    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'reset-single-color color-theme-modal__reset';
    reset.dataset.field = field.key;
    reset.title = 'Reset to last saved';
    reset.setAttribute('aria-label', 'Reset to last saved');
    const icon = document.createElement('i');
    icon.className = 'fa-solid fa-undo';
    reset.appendChild(icon);
    controls.appendChild(reset);

    wrap.appendChild(controls);
    return wrap;
}

/** True when the browser is in mobile/device mode (UA or coarse touch pointer). */
function isMobileBrowser() {
    try {
        if (navigator.userAgentData && navigator.userAgentData.mobile === true) {
            return true;
        }
    } catch (e) { /* ignore */ }

    var ua = navigator.userAgent || '';
    if (/Mobi|Android|iPhone|iPod|IEMobile|Opera Mini/i.test(ua)) return true;

    try {
        return window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    } catch (e2) {
        return false;
    }
}

function updateColorThemeMobileLayout() {
    var mobile = isMobileBrowser();
    document.documentElement.classList.toggle('is-mobile', mobile);
    if (typeof syncAddEditModalLayout === 'function') syncAddEditModalLayout();
    if (typeof syncGitHubCredentialsModalLayout === 'function') syncGitHubCredentialsModalLayout();
    if (typeof refreshAbcSectionNavLayout === 'function') {
        refreshAbcSectionNavLayout();
    }
    applyMobileZoomLock(mobile);
    updateSettingsMobileInfo();
    syncMobileLandscapeLock();
    if (typeof updateDatetimeVisibility === 'function') {
        updateDatetimeVisibility();
    }
}

var VIEWPORT_DESKTOP = 'width=device-width, initial-scale=1.0';
var VIEWPORT_MOBILE = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no';
var mobileZoomLocked = false;

function onMobileZoomGesture(e) {
    e.preventDefault();
}

function onMobilePinchTouch(e) {
    var scale = e.scale;
    if ((e.touches && e.touches.length > 1) || (typeof scale === 'number' && scale !== 1)) {
        e.preventDefault();
    }
}

/** Block pinch-zoom and double-tap zoom while the site is in mobile mode. */
function applyMobileZoomLock(mobile) {
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta) meta.setAttribute('content', mobile ? VIEWPORT_MOBILE : VIEWPORT_DESKTOP);

    if (!!mobile === mobileZoomLocked) return;
    mobileZoomLocked = !!mobile;

    var opts = { passive: false, capture: true };
    if (mobile) {
        document.addEventListener('gesturestart', onMobileZoomGesture, opts);
        document.addEventListener('gesturechange', onMobileZoomGesture, opts);
        document.addEventListener('gestureend', onMobileZoomGesture, opts);
        document.addEventListener('touchstart', onMobilePinchTouch, opts);
        document.addEventListener('touchmove', onMobilePinchTouch, opts);
    } else {
        document.removeEventListener('gesturestart', onMobileZoomGesture, true);
        document.removeEventListener('gesturechange', onMobileZoomGesture, true);
        document.removeEventListener('gestureend', onMobileZoomGesture, true);
        document.removeEventListener('touchstart', onMobilePinchTouch, true);
        document.removeEventListener('touchmove', onMobilePinchTouch, true);
    }
}

function updateSettingsMobileInfo() {
    var info = document.getElementById('settings-mobile-info');
    if (!info) return;

    var mobile = isMobileBrowser();
    var field = info.closest('.settings-modal__field');
    if (mobile) {
        info.removeAttribute('hidden');
        if (field) field.classList.remove('is-hidden');
    } else {
        info.setAttribute('hidden', '');
        if (field) field.classList.add('is-hidden');
    }
}

function isLandscapeOrientation() {
    try {
        var mq = window.matchMedia('(orientation: landscape)');
        if (mq && typeof mq.matches === 'boolean') return mq.matches;
    } catch (e) { /* ignore */ }
    return (Number(window.innerWidth) || 0) > (Number(window.innerHeight) || 0);
}

var landscapeLockActive = false;

function onLandscapeLockKey(e) {
    if (!landscapeLockActive) return;
    e.preventDefault();
    e.stopImmediatePropagation();
}

function onLandscapeLockInput(e) {
    if (!landscapeLockActive) return;
    var overlay = document.getElementById('landscape-lock');
    if (overlay && overlay.contains(e.target)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
}

/** Block the whole site on mobile devices held in landscape until they rotate to portrait. */
function syncMobileLandscapeLock() {
    var lock = !!(isMobileBrowser() && isLandscapeOrientation());
    var wasLocked = landscapeLockActive;
    landscapeLockActive = lock;
    document.documentElement.classList.toggle('is-landscape', lock);

    var overlay = document.getElementById('landscape-lock');
    var kids = document.body ? document.body.children : [];
    for (var i = 0; i < kids.length; i++) {
        if (overlay && kids[i] === overlay) continue;
        if (lock) kids[i].setAttribute('inert', '');
        else kids[i].removeAttribute('inert');
    }

    if (overlay) {
        overlay.setAttribute('aria-hidden', lock ? 'false' : 'true');
        if (lock && !wasLocked) {
            try { overlay.focus(); } catch (e) { /* ignore */ }
        }
    }
}

function syncDebugSettingsCheckbox() {
    var cb = document.getElementById('debug-panel-checkbox');
    if (!cb) return;
    var open = (typeof isDebugPanelOpen === 'function') ? !!isDebugPanelOpen() : false;
    cb.checked = open;
}

function ensureColorThemeFields() {
    const grid = document.querySelector('#color-theme-modal .color-theme-modal__grid');
    if (!grid || grid.dataset.fieldsBuilt === 'true') return;
    const byKey = {};
    COLOR_FIELDS.forEach(function (f) { byKey[f.key] = f; });

    COLOR_EDITOR_KEYS.forEach(function (key) {
        const field = byKey[key];
        if (!field) return;
        grid.appendChild(buildColorThemeField(field));
    });
    grid.dataset.fieldsBuilt = 'true';
}

var themePreviewActive = false;

function openColorThemeModal() {
    themePreviewActive = true;
    closeSettingsModal(false);
    ensureColorThemeFields();
    const modal = document.getElementById('color-theme-modal');
    const colors = readStoredColors();

    COLOR_FIELDS.forEach(field => {
        const stored = colors[field.key];

        const pickerEl = document.getElementById(colorFieldPickerId(field));
        if (pickerEl) pickerEl.value = stored;

        const textEl = document.getElementById(colorFieldTextId(field));
        if (textEl) textEl.value = stored;
    });

    function setupSync(pickerId, textId) {
        const picker = document.getElementById(pickerId);
        const text = document.getElementById(textId);
        if (!picker || !text) return;

        picker.oninput = () => {
            text.value = picker.value;
            previewCurrentColors();
        };
        text.oninput = () => {
            if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) {
                picker.value = text.value;
                previewCurrentColors();
            } else {
                syncThemeUnsavedWarning();
            }
        };
    }

    COLOR_FIELDS.forEach(field => {
        setupSync(colorFieldPickerId(field), colorFieldTextId(field));
    });

    if (!modal.dataset.resetHandlersAttached) {
        modal.dataset.resetHandlersAttached = 'true';
        const grid = modal.querySelector('.color-theme-modal__grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('.reset-single-color');
                if (!btn) return;
                e.preventDefault();
                const fieldKey = btn.dataset.field;
                if (fieldKey) {
                    resetSingleColor(fieldKey);
                }
            });
        }
    }

    updateColorThemeMobileLayout();
    syncThemeUnsavedWarning();
    openUiModal('color-theme-modal');
    const themeGrid = modal.querySelector('.color-theme-modal__grid');
    if (themeGrid) themeGrid.scrollTop = 0;
}

function closeColorThemeModal() {
    themePreviewActive = false;
    applyColors(readStoredColors());
    closeUiModal('color-theme-modal');
    openSettingsModal();
}

function applyAndSaveColors() {
    try {
        const colors = getCurrentColorValues();
        applyColors(colors);
        saveColorSettings(colors);
        closeColorThemeModal();
    } catch (e) {
        console.error("Error saving colors:", e);
        alert("There was an error saving the colors. Check the console for details.");
    }
}


function getCurrentColorValues() {
    const getVal = (id, def) => {
        const el = document.getElementById(id);
        return (el && el.value) ? el.value : def;
    };

    const colors = {};
    COLOR_FIELDS.forEach(field => {
        colors[field.key] = getVal(colorFieldTextId(field), field.light);
    });
    return colors;
}


function resetSingleColor(fieldKey) {
    const field = colorFieldByKey(fieldKey);
    if (!field) {
        console.warn('Unknown color field:', fieldKey);
        return;
    }

    const saved = readStoredColors()[fieldKey];
    if (!saved) {
        console.warn('No saved color for field:', fieldKey);
        return;
    }

    const pickerEl = document.getElementById(colorFieldPickerId(field));
    const textEl = document.getElementById(colorFieldTextId(field));

    if (pickerEl) pickerEl.value = saved;
    if (textEl) textEl.value = saved;

    const colors = getCurrentColorValues();
    applyColors(colors);
    syncThemeUnsavedWarning();
}

/** Show the editor's current colors on the page. Storage changes only when the user saves. */
function previewCurrentColors() {
    if (!themePreviewActive) return;
    applyColors(getCurrentColorValues());
    syncThemeUnsavedWarning();
}

function themeColorValue(value) {
    return String(value || '').trim().toLowerCase();
}

function themeColorsMatchSaved() {
    const current = getCurrentColorValues();
    const saved = readStoredColors();
    return COLOR_FIELDS.every(function (field) {
        return themeColorValue(current[field.key]) === themeColorValue(saved[field.key]);
    });
}

function syncThemeUnsavedWarning() {
    const label = document.getElementById('color-theme-unsaved');
    if (!label) return;
    if (themeColorsMatchSaved()) label.setAttribute('hidden', '');
    else label.removeAttribute('hidden');
}

/** Fill the editor and live-preview a palette. Does not write storage. */
function applyColorPalette(palette) {
    if (!palette) return;

    Object.keys(palette).forEach(key => {
        const field = colorFieldByKey(key);
        if (!field) return;
        const value = palette[key];
        const pickerEl = document.getElementById(colorFieldPickerId(field));
        if (pickerEl) pickerEl.value = value;

        const textEl = document.getElementById(colorFieldTextId(field));
        if (textEl) textEl.value = value;
    });

    applyColors(palette);
    syncThemeUnsavedWarning();
}

/** @param {'light'|'dark'} mode */
function applyColorMode(mode) {
    const palette = mode === 'light' ? COLOR_LIGHT_DEFAULTS : COLOR_DEFAULTS;
    applyColorPalette(palette);
}


function openAttributionModal() {
    closeSettingsModal(false);
    openUiModal('attribution-modal');
    const body = document.querySelector('#attribution-modal .attribution-modal__body');
    if (body) body.scrollTop = 0;
}

function closeAttributionModal() {
    closeUiModal('attribution-modal');
    openSettingsModal();
}

function openAboutModal() {
    closeSettingsModal(false);
    openUiModal('about-modal');
    const body = document.querySelector('#about-modal .about-modal__body');
    if (body) body.scrollTop = 0;
}

function closeAboutModal() {
    closeUiModal('about-modal');
    openSettingsModal();
}

var otherOptionsOpenedFromSettings = false;
var RESET_PHRASE = 'CLEAR EVERYTHING!';
var RESET_HIDE_SECONDS = 5;
var resetHideTimer = null;
var resetHideRemaining = RESET_HIDE_SECONDS;

function stopResetHideTimer() {
    if (resetHideTimer) {
        clearInterval(resetHideTimer);
        resetHideTimer = null;
    }
}

function updateResetHideLabel() {
    var el = document.getElementById('other-options-reset-timer');
    if (el) el.textContent = '(hides in ' + resetHideRemaining + ' seconds)';
}

function startResetHideTimer() {
    stopResetHideTimer();
    resetHideRemaining = RESET_HIDE_SECONDS;
    updateResetHideLabel();
    resetHideTimer = setInterval(function () {
        resetHideRemaining -= 1;
        if (resetHideRemaining <= 0) {
            stopResetHideTimer();
            hideOtherOptionsResetSection();
            return;
        }
        updateResetHideLabel();
    }, 1000);
}

function syncOtherOptionsSightSection() {
    var hidden = !otherOptionsOpenedFromSettings;
    var sight = document.getElementById('other-options-sight');
    var rule = document.getElementById('other-options-sight-rule');
    var effects = document.getElementById('other-options-effects');
    var effectsRule = document.getElementById('other-options-effects-rule');
    if (sight) sight.classList.toggle('is-hidden', hidden);
    if (rule) rule.classList.toggle('is-hidden', hidden);
    if (effects) effects.classList.toggle('is-hidden', hidden);
    if (effectsRule) effectsRule.classList.toggle('is-hidden', hidden);
}

function hideOtherOptionsResetSection() {
    stopResetHideTimer();
    var more = document.getElementById('other-options-show-more');
    var rest = document.getElementById('other-options-reset');
    if (rest) rest.classList.add('is-hidden');
    if (more) more.classList.toggle('is-hidden', !otherOptionsOpenedFromSettings);
}

function submitResetPhrase() {
    var phrase = document.getElementById('reset-confirm-phrase');
    if (phrase && phrase.value === RESET_PHRASE) {
        setResetConfirmStep('sure');
        return;
    }
    window.alert('Rest Failed!');
    closeUiModal('reset-confirm-modal');
    hideOtherOptionsResetSection();
}

function scrollOtherOptionsBodyToEnd() {
    var body = document.querySelector('#other-options-modal .other-options-modal__body');
    if (!body) return;
    body.scrollTop = body.scrollHeight;
}

function showOtherOptionsResetSection() {
    var rest = document.getElementById('other-options-reset');
    if (rest) rest.classList.remove('is-hidden');
    startResetHideTimer();
    scrollOtherOptionsBodyToEnd();
    requestAnimationFrame(scrollOtherOptionsBodyToEnd);
}

function setResetConfirmStep(step) {
    var modal = document.getElementById('reset-confirm-modal');
    if (!modal) return;
    modal.querySelectorAll('[data-reset-step]').forEach(function (el) {
        el.classList.toggle('is-hidden', el.getAttribute('data-reset-step') !== step);
    });
    modal.querySelectorAll('[data-reset-actions]').forEach(function (el) {
        el.classList.toggle('is-hidden', el.getAttribute('data-reset-actions') !== step);
    });
    if (step === 'type') {
        var input = document.getElementById('reset-confirm-phrase');
        if (input) {
            input.value = '';
            setTimeout(function () { input.focus(); }, 0);
        }
    }
}

function openResetConfirmModal() {
    setResetConfirmStep('warn');
    openUiModal('reset-confirm-modal');
}

function cancelResetConfirm() {
    closeUiModal('reset-confirm-modal');
    hideOtherOptionsResetSection();
    var options = document.getElementById('other-options-modal');
    if (options && !options.classList.contains('is-open')) {
        openUiModal('other-options-modal');
        options.style.display = 'flex';
    }
}

function clearAllAppData() {
    try {
        localStorage.clear();
        localStorage.setItem('startpage_links', '[]');
    } catch (e) { /* ignore */ }
    window.location.reload();
}

function bindResetConfirmControls() {
    var more = document.getElementById('other-options-show-more');
    if (more) more.addEventListener('click', showOtherOptionsResetSection);
    bindOtherOptionsSectionToggles();
    bindHemisphereControls();
    var clearBtn = document.getElementById('other-options-clear-all');
    if (clearBtn) clearBtn.addEventListener('click', openResetConfirmModal);
    ['reset-confirm-close', 'reset-cancel-warn', 'reset-cancel-type', 'reset-no'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', cancelResetConfirm);
    });
    var cont = document.getElementById('reset-continue');
    if (cont) cont.addEventListener('click', function () { setResetConfirmStep('type'); });
    var phrase = document.getElementById('reset-confirm-phrase');
    if (phrase) {
        phrase.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitResetPhrase();
            }
        });
    }
    var submit = document.getElementById('reset-submit');
    if (submit) submit.addEventListener('click', submitResetPhrase);
    var yes = document.getElementById('reset-yes');
    if (yes) yes.addEventListener('click', clearAllAppData);
}

function setOtherOptionsSectionExpanded(choicesId, toggleId, open, showTitle, hideTitle) {
    var choices = document.getElementById(choicesId);
    var toggle = document.getElementById(toggleId);
    if (choices) choices.hidden = !open;
    if (toggle) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.title = open ? hideTitle : showTitle;
    }
    if (!open || !choices) return;
    var body = document.querySelector('#other-options-modal .other-options-modal__body');
    if (!body) return;
    var bodyRect = body.getBoundingClientRect();
    var choiceRect = choices.getBoundingClientRect();
    if (choiceRect.bottom > bodyRect.bottom - 4) {
        body.scrollTop += choiceRect.bottom - bodyRect.bottom + 8;
    }
}

function collapseOtherOptionsDetails() {
    setOtherOptionsSectionExpanded('sight-choices', 'sight-toggle', false, 'Show sight', 'Hide sight');
    setOtherOptionsSectionExpanded('effects-choices', 'effects-toggle', false, 'Show effects', 'Hide effects');
    setOtherOptionsSectionExpanded('description-timing-choices', 'description-timing-toggle', false, 'Show description timing', 'Hide description timing');
}

function bindOtherOptionsSectionToggles() {
    [
        ['sight-toggle', 'sight-choices', 'Show sight', 'Hide sight'],
        ['effects-toggle', 'effects-choices', 'Show effects', 'Hide effects'],
        ['description-timing-toggle', 'description-timing-choices', 'Show description timing', 'Hide description timing']
    ].forEach(function (spec) {
        var toggle = document.getElementById(spec[0]);
        if (!toggle || toggle.getAttribute('data-section-bound') === '1') return;
        toggle.setAttribute('data-section-bound', '1');
        toggle.addEventListener('click', function (event) {
            event.preventDefault();
            var choices = document.getElementById(spec[1]);
            setOtherOptionsSectionExpanded(spec[1], spec[0], !choices || choices.hidden, spec[2], spec[3]);
        });
    });
}

function syncPopupDurationFields(fromSettings) {
    var block = document.getElementById('popup-duration-settings');
    if (!block) return;
    if (typeof fromSettings === 'boolean') {
        block.classList.toggle('is-hidden', !fromSettings);
    }
    var linkInput = document.getElementById('mobile-link-desc-seconds');
    var emojiInput = document.getElementById('emoji-desc-seconds');
    if (linkInput && typeof getMobileLinkDescriptionSeconds === 'function') {
        linkInput.value = String(getMobileLinkDescriptionSeconds());
    }
    if (emojiInput && typeof getEmojiDescriptionSeconds === 'function') {
        emojiInput.value = String(getEmojiDescriptionSeconds());
    }
}

function openOtherOptionsModal() {
    var modal = document.getElementById('other-options-modal');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    var settingsOpen = typeof isUiModalOpen === 'function' && isUiModalOpen('settings-modal');
    otherOptionsOpenedFromSettings = !!settingsOpen;
    if (typeof syncPopupDurationFields === 'function') {
        syncPopupDurationFields(otherOptionsOpenedFromSettings);
    }
    collapseOtherOptionsDetails();
    if (settingsOpen) closeSettingsModal(false);
    syncOtherOptionsSightSection();
    hideOtherOptionsResetSection();
    openUiModal('other-options-modal');
    modal.style.display = 'flex';
    var body = modal.querySelector('.other-options-modal__body');
    if (body) body.scrollTop = 0;
}

var HEMISPHERE_EFFECT_NAMES = {
    snow: 'Snow',
    fluff: 'Dandelion Fluff',
    butterflies: 'Butterflies',
    leaves: 'Falling Leaves'
};

function syncHemisphereControls() {
    var hemisphere = (typeof readHemisphere === 'function') ? readHemisphere() : 'northern';
    var north = document.getElementById('hemisphere-northern');
    var south = document.getElementById('hemisphere-southern');
    if (north) north.checked = hemisphere !== 'southern';
    if (south) south.checked = hemisphere === 'southern';
    var rows = document.querySelectorAll('#hemisphere-schedule [data-month]');
    for (var i = 0; i < rows.length; i++) {
        var month = Number(rows[i].getAttribute('data-month'));
        var effect = (typeof effectForMonth === 'function') ? effectForMonth(month, hemisphere) : 'snow';
        var name = rows[i].querySelector('.hemisphere-modal__effect');
        if (name) name.textContent = HEMISPHERE_EFFECT_NAMES[effect] || effect;
    }
}

var SEASONAL_HEADER_ICONS = {
    snowflake: '<path d="m10 20-1.25-2.5L6 18"/><path d="M10 4 8.75 6.5 6 6"/><path d="m14 20 1.25-2.5L18 18"/><path d="m14 4 1.25 2.5L18 6"/><path d="m17 21-3-6h-4"/><path d="m17 3-3 6 1.5 3"/><path d="M2 12h6.5L10 9"/><path d="m20 10-1.5 2 1.5 2"/><path d="M22 12h-6.5L14 15"/><path d="m4 10 1.5 2L4 14"/><path d="m7 21 3-6-1.5-3"/><path d="m7 3 3 6h4"/>',
    flower: '<circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 1 7.5 12 4.5 4.5 0 1 1 12 7.5a4.5 4.5 0 1 1 4.5 4.5 4.5 4.5 0 1 1-4.5 4.5"/><path d="M12 7.5V9"/><path d="M7.5 12H9"/><path d="M16.5 12H15"/><path d="M12 16.5V15"/><path d="m8 8 1.88 1.88"/><path d="M14.12 9.88 16 8"/><path d="m8 16 1.88-1.88"/><path d="M14.12 14.12 16 16"/>',
    butterfly: '<path d="M15.8 2C12 3.8 12 9 12 9s0-5.2-3.8-7"/><path d="M12 9v11"/><path d="M20 5c-3.5 0-6.5 3.9-8 6.3C10.5 8.9 7.5 5 4 5a2 2 0 0 0-2 2c0 2.3.6 4.4 1.5 5.6C4 13.5 4.9 14 6 14h2c-.9.4-2.1.9-2.6 1.5-1.6 1.6-.9 3.4.7 4.9 1.6 1.6 3.4 2.3 4.9.7.3-.3 1-1.1 1-1.1s.6.8 1 1.1c1.6 1.6 3.4.9 4.9-.7 1.6-1.6 2.3-3.4.7-4.9-.5-.5-1.7-1.1-2.6-1.5h2c1.1 0 2-.5 2.5-1.4.9-1.2 1.5-3.3 1.5-5.6a2 2 0 0 0-2-2"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    feather: '<path d="M14.086 18.412A2 2 0 0112.67 19H5v-7.672a2 2 0 01.586-1.414L11.75 3.75a6 6 0 118.49 8.49z"/><path d="M16 8 2 22"/><path d="M17.488 15H9"/>'
};

function paintSeasonalHeaderIcon(forceChange) {
    var icon = document.getElementById('hemisphere-modal-icon');
    if (!icon) return;
    var names = Object.keys(SEASONAL_HEADER_ICONS);
    var current = icon.getAttribute('data-seasonal-icon');
    if (forceChange && current) {
        names = names.filter(function (name) { return name !== current; });
    }
    var name = names[Math.floor(Math.random() * names.length)];
    icon.setAttribute('data-seasonal-icon', name);
    icon.innerHTML = SEASONAL_HEADER_ICONS[name];
}

function openHemisphereModal() {
    paintSeasonalHeaderIcon();
    syncHemisphereControls();
    openUiModal('hemisphere-modal');
    setTimeout(function () {
        var closeBtn = document.querySelector('#hemisphere-modal .about-modal__footer-close');
        if (closeBtn) closeBtn.focus();
    }, 50);
}

function closeHemisphereModal() {
    closeUiModal('hemisphere-modal');
}

function bindHemisphereControls() {
    var info = document.getElementById('seasonal-info-btn');
    if (info && info.getAttribute('data-hemisphere-bound') !== '1') {
        info.setAttribute('data-hemisphere-bound', '1');
        info.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            openHemisphereModal();
        });
    }
    var header = document.querySelector('#hemisphere-modal .ui-modal__header');
    if (header && header.getAttribute('data-seasonal-icon-bound') !== '1') {
        header.setAttribute('data-seasonal-icon-bound', '1');
        header.addEventListener('click', function (event) {
            if (event.target.closest('.ui-modal__close')) return;
            paintSeasonalHeaderIcon(true);
        });
    }
    var radios = document.querySelectorAll('input[name="hemisphere"]');
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].getAttribute('data-hemisphere-bound') === '1') continue;
        radios[i].setAttribute('data-hemisphere-bound', '1');
        radios[i].addEventListener('change', function () {
            if (!this.checked || typeof setHemisphere !== 'function') return;
            setHemisphere(this.value);
        });
    }
}

function closeOtherOptionsModal() {
    if (typeof closeHemisphereModal === 'function') closeHemisphereModal();
    var modal = document.getElementById('other-options-modal');
    hideOtherOptionsResetSection();
    closeUiModal('other-options-modal');
    if (modal) modal.style.display = '';
    if (otherOptionsOpenedFromSettings) openSettingsModal();
    otherOptionsOpenedFromSettings = false;
}

document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest && e.target.closest('#open-other-options-btn');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    openOtherOptionsModal();
}, true);

function applyColors(colors) {
    const textColor = colors.text || COLOR_DEFAULTS.text;
    document.body.style.backgroundColor = colors.bg || COLOR_DEFAULTS.bg;
    document.body.style.color = textColor;
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--background-color', colors.bg || COLOR_DEFAULTS.bg);

    document.documentElement.style.setProperty('--card-bg', colors.card || COLOR_DEFAULTS.card);
    document.documentElement.style.setProperty('--active-cat-bg', colors.activeCat || COLOR_DEFAULTS.activeCat);
    document.documentElement.style.setProperty('--active-cat-color', colors.activeCat || COLOR_DEFAULTS.activeCat);
    document.documentElement.style.setProperty('--category-bg', colors.category || COLOR_DEFAULTS.category);

    if (colors.textbox) document.documentElement.style.setProperty('--textbox-bg', colors.textbox);
    if (colors.activeText) {
        document.documentElement.style.setProperty('--active-text-color', colors.activeText);
        document.documentElement.style.setProperty('--active-cat-text', colors.activeText);
    }
    if (colors.emojiBg) document.documentElement.style.setProperty('--emoji-bg', colors.emojiBg);
    if (colors.hoverBlend) document.documentElement.style.setProperty('--hover-blend', colors.hoverBlend);
    if (colors.button) document.documentElement.style.setProperty('--button-bg', colors.button);
    if (colors.saveButton) document.documentElement.style.setProperty('--save-button-bg', colors.saveButton);
    if (colors.success) document.documentElement.style.setProperty('--success-color', colors.success);
    if (colors.caution) document.documentElement.style.setProperty('--caution-color', colors.caution);
    document.documentElement.style.setProperty('--snow-color', colors.snow || (COLOR_DEFAULTS && COLOR_DEFAULTS.snow) || '#ffffff');
}



function loadColorSettings() {
    const firstVisit = !hasStoredColorSettings();
    const colors = readStoredColors();
    applyColors(colors);
    if (firstVisit) saveColorSettings(colors);
}

function saveColorSettings(colors) {
    COLOR_FIELDS.forEach(field => {
        const val = colors[field.key];
        if (field.saveIfSet) {
            if (val) localStorage.setItem(field.storage, val);
        } else {
            localStorage.setItem(field.storage, val);
        }
    });
    localStorage.removeItem('startpage_search_color');
}

ensureColorThemeFields();
bindResetConfirmControls();
updateColorThemeMobileLayout();
window.addEventListener('resize', updateColorThemeMobileLayout);
window.addEventListener('orientationchange', updateColorThemeMobileLayout);
document.addEventListener('keydown', onLandscapeLockKey, true);
document.addEventListener('click', onLandscapeLockInput, true);
document.addEventListener('pointerdown', onLandscapeLockInput, true);
document.addEventListener('mousedown', onLandscapeLockInput, true);
document.addEventListener('touchstart', onLandscapeLockInput, true);
try {
    var colorThemeMobileMq = window.matchMedia('(hover: none) and (pointer: coarse)');
    if (colorThemeMobileMq.addEventListener) {
        colorThemeMobileMq.addEventListener('change', updateColorThemeMobileLayout);
    } else if (colorThemeMobileMq.addListener) {
        colorThemeMobileMq.addListener(updateColorThemeMobileLayout);
    }
} catch (e) { /* ignore */ }
try {
    var landscapeMq = window.matchMedia('(orientation: landscape)');
    if (landscapeMq.addEventListener) {
        landscapeMq.addEventListener('change', updateColorThemeMobileLayout);
    } else if (landscapeMq.addListener) {
        landscapeMq.addListener(updateColorThemeMobileLayout);
    }
} catch (e2) { /* ignore */ }










