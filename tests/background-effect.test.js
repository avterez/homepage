/**
 * Background effect setting: snow, none, and cherry blossom petals.
 * Run: node tests/background-effect.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const appSrc = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

assert.ok(html.includes('>Seasonal<'), 'Seasonal option missing');
assert.ok(html.includes('id="seasonal-info-btn"'), 'seasonal info button missing');
const seasonalBtn = html.slice(html.indexOf('id="seasonal-info-btn"'), html.indexOf('id="effect-fluff-radio"'));
assert.ok(seasonalBtn.includes('icon-settings'), 'seasonal control should use the settings gear');
assert.ok(!seasonalBtn.includes('<svg'), 'seasonal control should not keep the info mark');
assert.ok(html.includes('id="hemisphere-modal"'), 'hemisphere modal missing');
assert.ok(html.includes('id="hemisphere-modal-icon"'), 'seasonal header icon missing');
const settingsSrc = fs.readFileSync(path.join(root, 'js/settingsmodal.js'), 'utf8');
['snowflake', 'flower', 'butterfly', 'sun', 'feather'].forEach(function (name) {
    assert.ok(settingsSrc.includes(name + ':'), 'seasonal header icon missing: ' + name);
});
assert.ok(settingsSrc.includes('paintSeasonalHeaderIcon()'), 'seasonal header icon should be chosen when the modal opens');
assert.ok(settingsSrc.includes('paintSeasonalHeaderIcon(true)'), 'tapping the seasonal header picks a new icon');
assert.ok(settingsSrc.includes("closest('.ui-modal__close')"), 'the seasonal close control does not reshuffle the icon');
assert.ok(html.includes('>Northern<') && html.includes('>Southern<'), 'hemisphere options missing');
assert.ok(
    css.includes('.hemisphere-modal__schedule{margin:calc(1rem / var(--font-scale, 1)) 0 0;padding:0;list-style:none;color:var(--text-color);font-size:calc(0.75rem * var(--font-scale, 1));line-height:1.45}'),
    'season schedule uses the same size as the hemisphere option labels'
);
assert.ok(css.includes('#hemisphere-modal .ui-modal__panel{width:90%;max-width:510px;min-width:0}'), 'seasonal panel is 90% wide and capped at 510px');
assert.ok(css.includes('#hemisphere-modal .about-modal__body{padding:calc(1.5rem / var(--font-scale, 1)) calc(1.5rem / var(--font-scale, 1)) calc(1rem / var(--font-scale, 1))}'), 'seasonal body padding stays put when the font size changes');
assert.ok(css.includes('#hemisphere-modal .about-modal__footer{padding:calc(1.25rem / var(--font-scale, 1)) calc(1.5rem / var(--font-scale, 1)) calc(1.5rem / var(--font-scale, 1))}'), 'seasonal footer padding stays put when the font size changes');
assert.ok(
    css.includes('.settings-modal__check-label{color:var(--text-color);font-size:calc(0.75rem * var(--font-scale,1));font-weight:500}')
    || css.includes('.settings-modal__label,.settings-modal__check-label{color:var(--text-color);font-size:calc(0.75rem * var(--font-scale,1));font-weight:500}'),
    'hemisphere option labels stay at 0.75rem'
);
assert.ok(html.includes('Effects automatically change with the seasons.'), 'seasonal instructions missing');
assert.ok(html.includes('id="effect-season-radio"'), 'season radio missing');
assert.ok(!html.includes('Cherry Blossom Petals'), 'cherry blossom option should be removed');
assert.ok(!html.includes('effect-fireflies-radio'), 'fireflies option should be removed');
assert.ok(html.includes('>Snow*<'), 'Snow option label missing');
assert.ok(html.includes('Dandelion Fluff*'), 'Dandelion Fluff asterisk missing');
assert.ok(html.includes('* Uses "Effects" color in the "Color Theme Editor"'), 'effects color note missing');
assert.ok(html.includes('Effects Timeout (in minutes):'), 'effects timeout label missing');
assert.ok(/type="number"[^>]*id="effects-timeout-minutes"[^>]*min="1"[^>]*max="99"[^>]*value="5"/.test(html), 'effects timeout uses the number arrows and defaults to 5');
const timeoutField = html.slice(html.indexOf('for="effects-timeout-minutes"'), html.indexOf('other-options-modal__effects-note'));
assert.ok(timeoutField.includes('>m<'), 'effects timeout should show m');
assert.ok(!html.includes('Snow Effect'), 'Snow Effect label should be renamed');
assert.ok(html.indexOf('id="other-options-effects"') < html.indexOf('id="other-options-sight"'), 'Effects should come before Sight');
const configSrc = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');
assert.ok(configSrc.includes("key: 'snow', label: 'Effects'"), 'color theme Snow role should be labeled Effects');
assert.ok(html.includes('Falling Leaves'), 'Falling Leaves option label missing');
assert.ok(html.includes('id="effect-leaves-radio"'), 'leaves radio missing');
assert.ok(html.includes('value="leaves"'), 'leaves radio value missing');
assert.ok(html.includes('Dandelion Fluff'), 'Dandelion Fluff option label missing');
assert.ok(html.includes('id="effect-fluff-radio"'), 'fluff radio missing');
assert.ok(html.includes('value="fluff"'), 'fluff radio value missing');
assert.ok(css.includes('.snow-flake--fluff'), 'fluff shape missing');
assert.ok(css.includes('@keyframes fluff-float'), 'fluff float animation missing');
assert.ok(css.includes('.snow-flake--fluff{') && css.includes('var(--snow-color)'), 'fluff must use the snow color');
assert.ok(!css.includes('.snow-flake--firefly'), 'firefly shape should be removed');
assert.ok(!css.includes('.snow-flake--petal{'), 'cherry blossom shape should be removed');
assert.ok(html.includes('>Butterflies<'), 'Butterflies option label missing');
assert.ok(html.includes('id="effect-butterflies-radio"'), 'butterflies radio missing');
assert.ok(html.includes('value="butterflies"'), 'butterflies radio value missing');
assert.ok(css.includes('@keyframes butterfly-flap'), 'butterfly wing flap missing');
assert.ok(css.includes('@keyframes butterfly-flight'), 'butterfly flight missing');
assert.ok(css.includes('scaleX(0.18)'), 'wings must close when they flap');
assert.ok(css.includes('.snow-flake--leaf'), 'leaf shape missing');
assert.ok(css.includes('animation-name:petal-fall'), 'leaves must use the petal sway animation');
assert.ok(css.includes('@keyframes petal-fall'), 'petal fall animation missing');
assert.ok(css.includes('--leaf-low'), 'low-point angle is a leaf custom property');
assert.ok(css.includes('35deg - 60deg * max(var(--leaf-sign) * sin(var(--leaf-ang)), 0) - 25deg * min(var(--leaf-sign) * sin(var(--leaf-ang)), 0)'), 'a leaf rocks to -25 degrees on the right of its sway and 60 degrees on the left');
assert.ok(css.includes('.debug-panel__dleaf-angle{width:3rem'), 'the DLEAF angle textbox is 3rem wide');
assert.ok(css.includes('.debug-panel__dleaf-angle{width:3rem;padding:0.125rem 0.375rem;border:1px solid var(--color-border-strong);border-radius:0.25rem;background-color:#27272a;color:#e4e4e7 !important;font:inherit;font-variant-numeric:tabular-nums;text-align:center;'), 'the DLEAF angle text is centered in the box');
assert.ok(css.includes('.dleaf{position:relative;flex:0 0 30px;width:30px;height:18px'), 'DLEAF is half the previous size');
assert.ok(css.includes('.debug-panel__dleaf-preview{position:relative;flex:1 1 auto;min-width:2.375rem;height:2.25rem}'), 'DLEAF fills the space between its label and the angle controls');
assert.ok(css.includes('.debug-panel__dleaf-angle-row{display:flex;align-items:center;column-gap:0.25rem}.debug-panel__dleaf-step'), 'the angle controls stay grouped after the centered leaf');
assert.ok(!css.includes('--petal-tilt') && !css.includes('--petal-bank'), 'old tilt and bank formula is gone');
assert.ok(appSrc.includes("setProperty('--leaf-low', '35deg')"), 'every leaf starts at 35 degrees');
assert.ok(appSrc.includes('Math.random() < 0.5 ? -1 : 1'), 'each leaf picks left or right with an even chance');
assert.ok(appSrc.includes("setProperty('--leaf-sign', drift > 0 ? '1' : '-1')"), 'the sine sway keeps the same left and right sides for both drift directions');
assert.ok(!html.includes('id="dleaf"'), 'the header no longer holds DLEAF');
const debugSrc = fs.readFileSync(path.join(root, 'js/debug.js'), 'utf8');
assert.ok(debugSrc.includes('>DLEAF<') && debugSrc.includes('id="dleaf"'), 'the debug panel shows the DLEAF label and leaf');
assert.ok(!debugSrc.includes('debug-dleaf-checkbox'), 'the debug panel has no DLEAF checkbox');
assert.ok(debugSrc.includes('id="debug-dleaf-angle"') && debugSrc.includes('value="35"'), 'debug panel has a DLEAF angle textbox that starts at 35');
assert.ok(debugSrc.includes('id="debug-dleaf-angle-minus"') && debugSrc.includes('id="debug-dleaf-angle-plus"'), 'DLEAF angle has minus and plus buttons');
assert.ok(debugSrc.includes('stepDleafAngle(-1)') && debugSrc.includes('stepDleafAngle(1)'), 'the buttons step the DLEAF angle by one degree');
assert.ok(debugSrc.includes("setProperty('--dleaf-angle'"), 'the textbox rotates DLEAF');
assert.ok(css.includes('--dleaf-angle:35deg') && css.includes('rotate(var(--dleaf-angle))'), 'DLEAF rotation follows its angle');
assert.ok(!/@keyframes petal-fall\{[^}]*360deg/.test(css), 'petals must rock, not spin a full turn');
assert.ok(css.includes('@property --leaf-t'), 'leaf time is a continuous numeric property');
assert.ok(css.includes('sin(var(--leaf-ang))'), 'sideways motion is a sine of time');
assert.ok(css.includes('pow(abs(sin(var(--leaf-ang))), 6)'), 'the lift is concentrated at the outer hang');
assert.ok(css.includes('--leaf-wobble'), 'a second wave keeps swings from matching');
assert.ok(css.includes('(2.391vh / var(--leaf-cycles))'), 'the fastest vertical drop is ten percent slower');
assert.ok(appSrc.includes('(1.161 + Math.random() * 0.725)'), 'leaf lift stays small enough that the center crossing stays fastest');
assert.ok(appSrc.includes("setProperty('--leaf-cycles'"), 'each leaf varies its sway frequency');
assert.ok(appSrc.includes('/ 24348') && appSrc.includes('count > 64'), 'leaf count is fifteen percent higher, up to 64');
assert.ok(css.includes('@property --snow-t'), 'snow time is a continuous numeric property');
assert.ok(css.includes('@keyframes snow-fall{from{--snow-t:0}to{--snow-t:1}}'), 'snow fall advances time along a straight line');
assert.ok(!css.includes('snow-fall-spin'), 'snow no longer snaps direction at keyframe corners');
assert.ok(!css.includes('translate3d(var(--snow-drift),18vh,0)'), 'the zig-zag waypoints are gone');
assert.ok(css.includes('var(--snow-wind) * var(--snow-t) + var(--snow-drift) * sin(var(--snow-ang))'), 'sideways drift is a sine wrapped around the wind line');
assert.ok(appSrc.includes('(1.4 + Math.random() * 5.6)'), 'each flake leans between 1.4 and 7 degrees off vertical');
assert.ok(appSrc.includes('2.75 + Math.random() * (5.25 - 2.75)'), 'snow falls between 2.75vh and 5.25vh per second');
assert.ok(appSrc.includes('var duration = 116 / speedVh'), 'fall time is the 116vh drop divided by that speed');
assert.ok(appSrc.includes("setProperty('--snow-wind'"), 'the linear slide uses its own wind distance');
assert.ok(appSrc.includes('var drift = (22 + Math.random() * 64) * sign'), 'the sine sway amplitude stays 22 to 86 pixels');
assert.ok(css.includes('-8vh + 116vh * var(--snow-t)'), 'the vertical fall is linear');
assert.ok(css.includes('--snow-spin:calc(var(--snow-t) * 360deg)'), 'crystals spin smoothly with the fall');
assert.ok(css.includes('.snow-flake__arm{'), 'crystal spokes are flat bars');
assert.ok(appSrc.includes('armIndex * 60'), 'crystal spokes are sixty degrees apart');
assert.ok(css.includes('.snow-flake--fern>.snow-flake__arm::before{left:0}') && css.includes('.snow-flake--fern>.snow-flake__arm::after{right:0}'), 'larger flakes grow a crossbar at each spoke tip');
assert.ok(appSrc.includes("arm.className = 'snow-flake__arm'"), 'a crystal is built from three spokes');
assert.ok(appSrc.includes('snow-flake--fern'), 'some flakes use the branched shape');
assert.ok(appSrc.includes('roll < 0.12') && appSrc.includes('roll < 0.34'), 'most flakes stay plain dots');
assert.ok(appSrc.includes("setProperty('--snow-sway', (1.5 + Math.random() * 1.5).toFixed(2))"), 'each flake varies how often it sways');
assert.ok(appSrc.includes("setProperty('--snow-phase', (Math.random() * 360).toFixed(1) + 'deg')"), 'each flake starts at its own point on the sine');

const effectsBlock = html.slice(html.indexOf('id="other-options-effects"'), html.indexOf('id="popup-duration-settings"'));
const effectValues = Array.from(effectsBlock.matchAll(/name="background-effect"[^>]*value="([^"]+)"/g), function (match) { return match[1]; });
assert.deepStrictEqual(effectValues, ['none', 'season', 'fluff', 'butterflies', 'leaves', 'snow']);
assert.ok(!/>Spring<|>Summer<|>Fall<|>Winter</.test(effectsBlock), 'season labels are not shown');
assert.ok(html.includes('id="sight-toggle"'), 'sight disclosure missing');
assert.ok(/id="sight-choices"[^>]*hidden/.test(html), 'sight choices start hidden');
assert.ok(html.includes('id="effects-toggle"'), 'effects disclosure missing');
assert.ok(html.includes('id="effects-choices"') && /id="effects-choices"[^>]*hidden/.test(html), 'effects choices start hidden');
assert.ok(html.includes('id="description-timing-toggle"'), 'description timing disclosure missing');
assert.ok(/id="description-timing-choices"[^>]*hidden/.test(html), 'description timing choices start hidden');
assert.ok(html.includes('id="other-options-show-more"'), 'show more link missing');

function loadState() {
    const store = {};
    const context = {
        localStorage: {
            getItem: function (key) { return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null; },
            setItem: function (key, value) { store[key] = String(value); }
        },
        document: { getElementById: function () { return null; } },
        console: console
    };
    context.globalThis = context;
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/state.js'), 'utf8'), context);
    return { context: context, store: store };
}

const missing = loadState();
assert.strictEqual(missing.context.readBackgroundEffect(), 'season', 'missing key starts on season');

const legacyOn = loadState();
legacyOn.store.startpage_snow_effect = 'true';
assert.strictEqual(legacyOn.context.readBackgroundEffect(), 'snow');
assert.strictEqual(legacyOn.context.readSnowEffectEnabled(), true);

const legacyOff = loadState();
legacyOff.store.startpage_snow_effect = 'false';
assert.strictEqual(legacyOff.context.readBackgroundEffect(), 'none');
assert.strictEqual(legacyOff.context.parseSnowEffectFlag(false), 'none');
assert.strictEqual(legacyOff.context.parseSnowEffectFlag(true), 'snow');
assert.strictEqual(legacyOff.context.parseSnowEffectFlag('nope'), null);

const season = loadState();
assert.strictEqual(season.context.setBackgroundEffect('season'), 'season');
assert.strictEqual(season.store.startpage_snow_effect, 'season');
assert.strictEqual(season.context.parseSnowEffectFlag('petals'), null);
assert.strictEqual(season.context.parseSnowEffectFlag('fireflies'), null);
[11, 0, 1].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month), 'snow', 'month ' + month); });
[2, 3, 4].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month), 'fluff', 'month ' + month); });
[5, 6, 7].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month), 'butterflies', 'month ' + month); });
[8, 9, 10].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month), 'leaves', 'month ' + month); });
[11, 0, 1].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month, 'southern'), 'butterflies', 'south ' + month); });
[2, 3, 4].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month, 'southern'), 'leaves', 'south ' + month); });
[5, 6, 7].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month, 'southern'), 'snow', 'south ' + month); });
[8, 9, 10].forEach(function (month) { assert.strictEqual(season.context.effectForMonth(month, 'southern'), 'fluff', 'south ' + month); });
assert.strictEqual(season.context.getEffectsTimeoutMinutes(), 5);
assert.strictEqual(season.context.parseEffectsTimeoutMinutes('7'), 7);
assert.strictEqual(season.context.parseEffectsTimeoutMinutes('0'), null);
assert.strictEqual(season.context.parseEffectsTimeoutMinutes('100'), null);
assert.strictEqual(season.context.saveEffectsTimeoutMinutes('12'), 12);
assert.strictEqual(season.store.startpage_effects_timeout_minutes, '12');
assert.strictEqual(season.context.readHemisphere(), 'northern');
assert.strictEqual(season.context.setHemisphere('southern'), 'southern');
assert.strictEqual(season.store.startpage_hemisphere, 'southern');

assert.strictEqual(season.context.setSnowEffectEnabled(false), 'none');
assert.strictEqual(season.store.startpage_snow_effect, 'false');
assert.strictEqual(season.context.setSnowEffectEnabled(true), 'snow');
assert.strictEqual(season.store.startpage_snow_effect, 'true');

const leaves = loadState();
assert.strictEqual(leaves.context.setBackgroundEffect('leaves'), 'leaves');
assert.strictEqual(leaves.store.startpage_snow_effect, 'leaves');
assert.strictEqual(leaves.context.readBackgroundEffect(), 'leaves');
assert.strictEqual(leaves.context.parseSnowEffectFlag('leaves'), 'leaves');

const fluff = loadState();
assert.strictEqual(fluff.context.setBackgroundEffect('fluff'), 'fluff');
assert.strictEqual(fluff.store.startpage_snow_effect, 'fluff');
assert.strictEqual(fluff.context.readBackgroundEffect(), 'fluff');
assert.strictEqual(fluff.context.parseSnowEffectFlag('fluff'), 'fluff');

const butterflies = loadState();
assert.strictEqual(butterflies.context.setBackgroundEffect('butterflies'), 'butterflies');
assert.strictEqual(butterflies.store.startpage_snow_effect, 'butterflies');
assert.strictEqual(butterflies.context.readBackgroundEffect(), 'butterflies');
assert.strictEqual(butterflies.context.parseSnowEffectFlag('butterflies'), 'butterflies');

console.log('background-effect.test.js ok');
