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

assert.ok(html.includes('Cherry Blossom Petals'), 'Effects option label missing');
assert.ok(html.includes('id="effect-petals-radio"'), 'petals radio missing');
assert.ok(html.includes('value="petals"'), 'petals radio value missing');
assert.ok(html.includes('Falling Leaves'), 'Falling Leaves option label missing');
assert.ok(html.includes('id="effect-leaves-radio"'), 'leaves radio missing');
assert.ok(html.includes('value="leaves"'), 'leaves radio value missing');
assert.ok(html.includes('Dandelion Fluff'), 'Dandelion Fluff option label missing');
assert.ok(html.includes('id="effect-fluff-radio"'), 'fluff radio missing');
assert.ok(html.includes('value="fluff"'), 'fluff radio value missing');
assert.ok(css.includes('.snow-flake--fluff'), 'fluff shape missing');
assert.ok(css.includes('@keyframes fluff-float'), 'fluff float animation missing');
assert.ok(css.includes('.snow-flake--fluff{') && css.includes('var(--snow-color)'), 'fluff must use the snow color');
assert.ok(html.includes('>Fireflies<'), 'Fireflies option label missing');
assert.ok(html.includes('id="effect-fireflies-radio"'), 'fireflies radio missing');
assert.ok(html.includes('value="fireflies"'), 'fireflies radio value missing');
assert.ok(css.includes('.snow-flake--firefly'), 'firefly shape missing');
assert.ok(css.includes('@keyframes firefly-flash'), 'firefly flash animation missing');
assert.ok(css.includes('0%,86%,100%{opacity:0}90%{opacity:1}'), 'firefly flash stays dark most of the cycle');
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
const effectValues = Array.from(effectsBlock.matchAll(/value="([^"]+)"/g), function (match) { return match[1]; });
assert.deepStrictEqual(effectValues, ['none', 'petals', 'fluff', 'butterflies', 'fireflies', 'leaves', 'snow']);
const seasons = Array.from(effectsBlock.matchAll(/other-options-modal__season">([^<]+)/g), function (match) { return match[1]; });
assert.deepStrictEqual(seasons, ['Spring', 'Summer', 'Fall', 'Winter']);

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
assert.strictEqual(missing.context.readBackgroundEffect(), 'snow', 'missing key stays on snow');

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

const petals = loadState();
assert.strictEqual(petals.context.setBackgroundEffect('petals'), 'petals');
assert.strictEqual(petals.store.startpage_snow_effect, 'petals');
assert.strictEqual(petals.context.readBackgroundEffect(), 'petals');
assert.strictEqual(petals.context.backgroundEffect, 'petals');
assert.strictEqual(petals.context.snowEffect, true);

assert.strictEqual(petals.context.setSnowEffectEnabled(false), 'none');
assert.strictEqual(petals.store.startpage_snow_effect, 'false');
assert.strictEqual(petals.context.setSnowEffectEnabled(true), 'snow');
assert.strictEqual(petals.store.startpage_snow_effect, 'true');

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

const fireflies = loadState();
assert.strictEqual(fireflies.context.setBackgroundEffect('fireflies'), 'fireflies');
assert.strictEqual(fireflies.store.startpage_snow_effect, 'fireflies');
assert.strictEqual(fireflies.context.readBackgroundEffect(), 'fireflies');
assert.strictEqual(fireflies.context.parseSnowEffectFlag('fireflies'), 'fireflies');

const butterflies = loadState();
assert.strictEqual(butterflies.context.setBackgroundEffect('butterflies'), 'butterflies');
assert.strictEqual(butterflies.store.startpage_snow_effect, 'butterflies');
assert.strictEqual(butterflies.context.readBackgroundEffect(), 'butterflies');
assert.strictEqual(butterflies.context.parseSnowEffectFlag('butterflies'), 'butterflies');

console.log('background-effect.test.js ok');
