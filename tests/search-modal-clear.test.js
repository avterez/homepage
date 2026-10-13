/**
 * Search modal per-field clear buttons.
 * Run: node tests/search-modal-clear.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const gsmodalSrc = fs.readFileSync(path.join(__dirname, '..', 'js/gsmodal.js'), 'utf8');

const FIELD_IDS = [
    'search-modal-input',
    'yahoo-finance-input',
    'finviz-input',
    'google-stock-input'
];

FIELD_IDS.forEach(function (id) {
    const re = new RegExp(
        'id="' + id + '"[\\s\\S]*?onclick="clearSearchModalField\\(\'' + id + '\'\\)"'
    );
    assert.ok(re.test(html), 'clear button missing for ' + id);
});

assert.strictEqual(
    (html.match(/class="search-modal__clear"/g) || []).length,
    FIELD_IDS.length,
    'expected one clear button per search-modal field'
);

const searchOpen = html.slice(
    html.indexOf('<div id="search-modal"'),
    html.indexOf('>', html.indexOf('<div id="search-modal"')) + 1
);
assert.ok(!/onclick\s*=/.test(searchOpen), 'clicking off the search modal does not close it');
assert.ok(
    /<button type="button" onclick="closeSearchModal\(\)" class="ui-modal__close" aria-label="Close">/.test(html),
    'the X button still closes the search modal'
);
assert.ok(
    /onclick="closeSearchModal\(\)"\s+class="search-modal__close ui-modal__btn ui-modal__btn--block ui-modal__btn--bordered">\s*Close\s*<\/button>/.test(html),
    'the Close button closes the search modal'
);

function loadGsmodal() {
    const inputs = {};
    FIELD_IDS.forEach(function (id) {
        inputs[id] = { id: id, value: 'KEEPME', focused: false, focus: function () { this.focused = true; } };
    });
    const context = {
        document: {
            getElementById: function (id) { return inputs[id] || null; }
        }
    };
    vm.createContext(context);
    vm.runInContext(gsmodalSrc, context);
    return { context: context, inputs: inputs };
}

const loaded = loadGsmodal();
loaded.inputs['yahoo-finance-input'].value = 'AAPL';
loaded.inputs['finviz-input'].value = 'MSFT';
loaded.context.clearSearchModalField('yahoo-finance-input');
assert.strictEqual(loaded.inputs['yahoo-finance-input'].value, '');
assert.strictEqual(loaded.inputs['yahoo-finance-input'].focused, true);
assert.strictEqual(loaded.inputs['finviz-input'].value, 'MSFT');
assert.strictEqual(loaded.inputs['search-modal-input'].value, 'KEEPME');

loaded.context.clearSearchModalField('missing-id');

console.log('search-modal-clear.test.js: ok');
