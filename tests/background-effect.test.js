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
assert.ok(css.includes('@keyframes petal-fall'), 'petal fall animation missing');
assert.ok(css.includes('--petal-tilt'), 'petal tilt angle missing');
assert.ok(css.includes('--petal-bank:40deg'), 'sway bank is capped at 40 degrees');
assert.ok(css.includes('var(--petal-tilt) - var(--petal-bank)'), 'rightward sway turns counter-clockwise');
assert.ok(css.includes('var(--petal-tilt) + var(--petal-bank)'), 'leftward sway turns clockwise');
assert.ok(!/@keyframes petal-fall\{[^}]*360deg/.test(css), 'petals must rock, not spin a full turn');

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

console.log('background-effect.test.js ok');
