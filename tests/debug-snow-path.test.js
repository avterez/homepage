/**
 * Debug checkbox draws each snowflake's straight fall, not its sideways drift.
 * Run: node tests/debug-snow-path.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const debugSrc = fs.readFileSync(path.join(root, 'js/debug.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');

const dleafAt = debugSrc.indexOf('id="dleaf"');
const checkAt = debugSrc.indexOf('id="debug-draw-snow-path"');
assert.ok(dleafAt !== -1 && checkAt > dleafAt, 'the checkbox sits under DLEAF');
assert.ok(debugSrc.includes('draw snow path'), 'checkbox title is draw snow path');
assert.ok(!debugSrc.includes('debug-dleaf-checkbox'), 'the DLEAF checkbox stays gone');
assert.ok(css.includes('.debug-panel__snow-path{'), 'checkbox row is styled under the debug panel');
assert.ok(css.includes('#snow-path-overlay'), 'the path overlay is on the page');
assert.ok(css.includes('.snow-flake{position:absolute;top:-12px;'), 'flake top offset is still -12px');
assert.ok(css.includes('translate3d(0,-8vh,0)') && css.includes('108vh,0)'), 'snow fall still runs from -8vh to 108vh');

function node() {
    const el = {
        attrs: {},
        children: [],
        style: {},
        className: '',
        firstChild: null,
        setAttribute: function (key, value) { this.attrs[key] = value; },
        removeAttribute: function (key) { delete this.attrs[key]; },
        appendChild: function (child) {
            this.children.push(child);
            this.firstChild = this.children[0];
            return child;
        },
        removeChild: function (child) {
            this.children = this.children.filter(function (item) { return item !== child; });
            this.firstChild = this.children[0] || null;
        }
    };
    return el;
}

function flake(classNames, left, width, height) {
    const el = node();
    el.style.left = left;
    el.style.width = width;
    el.style.height = height;
    el.classList = {
        contains: function (name) { return classNames.indexOf(name) !== -1; }
    };
    return el;
}

function loadDebug() {
    const ids = {};
    const body = node();
    body.appendChild = function (child) {
        this.children.push(child);
        this.firstChild = this.children[0];
        if (child.id) ids[child.id] = child;
        return child;
    };
    const checkbox = { checked: false };
    const snow = flake(['snow-flake'], '10%', '8px', '8px');
    const crystal = flake(['snow-flake', 'snow-flake--crystal'], '40%', '16px', '16px');
    const leaf = flake(['snow-flake', 'snow-flake--leaf'], '70%', '18px', '10px');
    const layer = node();
    layer.querySelectorAll = function () { return [snow, crystal, leaf]; };
    ids['debug-draw-snow-path'] = checkbox;
    ids['snow-layer'] = layer;
    const sandbox = {
        console: console,
        document: {
            body: body,
            getElementById: function (id) { return ids[id] || null; },
            createElementNS: function () { return node(); },
            addEventListener: function () {},
            querySelector: function () { return null; }
        },
        window: { innerWidth: 1000, innerHeight: 800 },
        MutationObserver: undefined
    };
    sandbox.window.document = sandbox.document;
    sandbox.globalThis = sandbox;
    vm.createContext(sandbox);
    vm.runInContext(debugSrc, sandbox, { filename: 'js/debug.js' });
    return { sandbox: sandbox, ids: ids, checkbox: checkbox, snow: snow };
}

const straight = loadDebug();
const expected = straight.sandbox.snowLinearPath(25, 8, 8, 1000, 800);
assert.strictEqual(expected.x1, expected.x2, 'the path is a vertical line');
assert.strictEqual(expected.x1, 254);
assert.strictEqual(expected.y1, -72);
assert.strictEqual(expected.y2, 856);
assert.notStrictEqual(expected.y1, expected.y2);

straight.checkbox.checked = true;
straight.sandbox.syncSnowPathOverlay();
const overlay = straight.ids['snow-path-overlay'];
assert.ok(overlay, 'checking the box adds the overlay');
assert.strictEqual(overlay.children.length, 2, 'leaves are not drawn');
overlay.children.forEach(function (line) {
    assert.strictEqual(line.attrs.x1, line.attrs.x2, 'each drawn path stays vertical');
    assert.ok(!line.attrs.d, 'the overlay does not use a curve path');
});
const snowLine = overlay.children[0];
const snowExpected = straight.sandbox.snowLinearPath(10, 8, 8, 1000, 800);
assert.strictEqual(snowLine.attrs.x1, String(snowExpected.x1));
assert.strictEqual(snowLine.attrs.y1, String(snowExpected.y1));
assert.strictEqual(snowLine.attrs.x2, String(snowExpected.x2));
assert.strictEqual(snowLine.attrs.y2, String(snowExpected.y2));
const crystalLine = overlay.children[1];
const crystalExpected = straight.sandbox.snowLinearPath(40, 16, 16, 1000, 800);
assert.strictEqual(crystalLine.attrs.x1, String(crystalExpected.x1));
assert.strictEqual(crystalLine.attrs.x1, crystalLine.attrs.x2);

straight.snow.style.setProperty = function (name, value) { this[name] = value; };
straight.snow.style.setProperty('--snow-drift', '80px');
straight.sandbox.syncSnowPathOverlay();
assert.strictEqual(straight.ids['snow-path-overlay'].children[0].attrs.x1, String(snowExpected.x1), 'drift does not bend the line');

straight.checkbox.checked = false;
straight.sandbox.syncSnowPathOverlay();
assert.strictEqual(straight.ids['snow-path-overlay'].attrs.hidden, '');

console.log('debug-snow-path.test.js: ok');
