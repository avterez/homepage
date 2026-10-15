/**
 * Go-to Top / Go-to Bottom focus the link search on desktop only.
 * Run: node tests/goto-focus.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const src = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
const start = src.indexOf('function focusLinkSearchFromGoto()');
const end = src.indexOf('function getLinkCardSectionRange');
assert.ok(start > 0 && end > start, 'focusLinkSearchFromGoto missing');
const fn = src.slice(start, end);

const topHandler = src.slice(src.indexOf('topBtn.onclick'), src.indexOf('bottomBtn.onclick'));
const bottomHandler = src.slice(src.indexOf('bottomBtn.onclick'), src.indexOf('if (linksScrollEl && typeof MutationObserver'));
assert.ok(topHandler.includes('focusLinkSearchFromGoto()'), 'go to top should use the shared focus helper');
assert.ok(bottomHandler.includes('focusLinkSearchFromGoto()'), 'go to bottom should use the shared focus helper');
assert.ok(!topHandler.includes('linkSearch.focus()'), 'go to top should not focus link search directly');
assert.ok(!bottomHandler.includes('linkSearch.focus()'), 'go to bottom should not focus link search directly');

function focusedAfter(isMobile) {
    let focused = false;
    const context = {
        document: {
            getElementById: function (id) {
                if (id !== 'link-search-input') return null;
                return { focus: function () { focused = true; } };
            }
        }
    };
    if (isMobile !== null) {
        context.isMobileBrowser = function () { return isMobile; };
    }
    vm.createContext(context);
    vm.runInContext(fn + '\nfocusLinkSearchFromGoto();', context);
    return focused;
}

assert.strictEqual(focusedAfter(false), true, 'desktop focuses the link search');
assert.strictEqual(focusedAfter(true), false, 'mobile does not focus the link search');
assert.strictEqual(focusedAfter(null), true, 'missing mobile check still focuses the link search');

console.log('goto-focus.test.js ok');
