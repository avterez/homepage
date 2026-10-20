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
    'ticker-lookup-input'
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
const searchStart = html.indexOf('<div id="search-modal"');
const searchEnd = html.indexOf('<div id="color-theme-modal"');
const searchHtml = html.slice(searchStart, searchEnd);
assert.ok(searchHtml.includes('class="ui-modal__header"'), 'the search modal has a header');
assert.ok(
    /id="search-modal-title"[^>]*class="ui-modal__title ui-modal__title--row"[\s\S]*?<i class="fa-solid fa-search" aria-hidden="true"><\/i>\s*<span>Search<\/span>/.test(searchHtml),
    'the search modal header is titled Search with a magnifying glass'
);
assert.ok(!searchHtml.includes('ui-modal__close'), 'the search modal has no header close control');
assert.ok(!searchHtml.includes('id="finviz-title"') && !searchHtml.includes('id="finviz-input"'), 'the Finviz header and textbox are gone');
assert.ok(!searchHtml.includes('Google Financial Search') && !searchHtml.includes('id="google-stock-input"'), 'the Google Financial header and textbox are gone');
assert.ok(!searchHtml.includes('id="yahoo-finance-input"') && !searchHtml.includes('Yahoo Finance'), 'the Yahoo Finance field is replaced by Ticker Lookup');
assert.ok(searchHtml.includes('id="ticker-lookup-title"') && searchHtml.includes('>Ticker Lookup<'), 'Ticker Lookup replaces the finance sections');
const tickerForm = searchHtml.slice(searchHtml.indexOf('id="ticker-lookup-form"'), searchHtml.indexOf('search-modal__footer'));
assert.ok(tickerForm.includes('id="ticker-lookup-input"'), 'the ticker field sits in the ticker form');
assert.ok(tickerForm.includes('value="yahoo"') && tickerForm.includes('>Yahoo<'), 'Yahoo submits the ticker form');
assert.ok(tickerForm.includes('value="finviz"') && tickerForm.includes('>Finviz<'), 'Finviz submits the ticker form');
assert.ok(tickerForm.includes('value="google"') && tickerForm.includes('aria-label="Google Financial"') && tickerForm.includes('>Google<'), 'Google Financial submits the ticker form');
const footerAt = searchHtml.indexOf('class="search-modal__footer ui-modal__footer"');
const closeAt = searchHtml.indexOf('search-modal__footer-close');
assert.ok(footerAt !== -1 && closeAt > footerAt, 'Close sits in the search footer');
assert.ok(
    /<div class="search-modal__footer ui-modal__footer">\s*<button type="button" onclick="closeSearchModal\(\)"\s+class="search-modal__footer-close ui-modal__btn ui-modal__btn--block ui-modal__btn--bordered">\s*Close\s*<\/button>/.test(searchHtml),
    'the footer Close button closes the search modal'
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
loaded.inputs['ticker-lookup-input'].value = 'AAPL';
loaded.context.clearSearchModalField('ticker-lookup-input');
assert.strictEqual(loaded.inputs['ticker-lookup-input'].value, '');
assert.strictEqual(loaded.inputs['ticker-lookup-input'].focused, true);
assert.strictEqual(loaded.inputs['search-modal-input'].value, 'KEEPME');

loaded.context.clearSearchModalField('missing-id');

console.log('search-modal-clear.test.js: ok');
