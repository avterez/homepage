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

assert.ok(html.includes('>Seasonal<'), 'Seasonal option missing');
assert.ok(html.includes('id="seasonal-info-btn"'), 'seasonal info button missing');
assert.ok(html.includes('id="hemisphere-modal"'), 'hemisphere modal missing');
assert.ok(html.includes('>Northern<') && html.includes('>Southern<'), 'hemisphere options missing');
assert.ok(html.includes('Effects automatically change with the seasons.'), 'seasonal instructions missing');
assert.ok(html.includes('id="effect-season-radio"'), 'season radio missing');
assert.ok(!html.includes('Cherry Blossom Petals'), 'cherry blossom option should be removed');
assert.ok(!html.includes('effect-fireflies-radio'), 'fireflies option should be removed');
assert.ok(html.includes('>Snow*<'), 'Snow option label missing');
assert.ok(html.includes('Dandelion Fluff*'), 'Dandelion Fluff asterisk missing');
assert.ok(html.includes('* Uses "Effects" color in the "Color Theme Editor"'), 'effects color note missing');
assert.ok(html.includes('Effects Timeout (in minutes)'), 'effects timeout label missing');
assert.ok(/id="effects-timeout-minutes"[^>]*maxlength="2"[^>]*value="5"/.test(html), 'effects timeout defaults to 5 and allows 2 digits');
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
assert.ok(css.includes('--petal-tilt'), 'petal tilt angle missing');
assert.ok(css.includes('--petal-bank:40deg'), 'sway bank is capped at 40 degrees');
assert.ok(css.includes('var(--petal-tilt) - var(--petal-bank)'), 'rightward sway turns counter-clockwise');
assert.ok(css.includes('var(--petal-tilt) + var(--petal-bank)'), 'leftward sway turns clockwise');
assert.ok(!/@keyframes petal-fall\{[^}]*360deg/.test(css), 'petals must rock, not spin a full turn');

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
