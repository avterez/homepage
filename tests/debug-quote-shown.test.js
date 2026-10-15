/**
 * Debug panel quote count and the 1-based quote being shown.
 * Run: node tests/debug-quote-shown.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const quoteFile = fs.readFileSync(path.join(root, 'docs/q.txt'), 'utf8');
const quotesSrc = fs.readFileSync(path.join(root, 'js/quotes.js'), 'utf8');
const debugSrc = fs.readFileSync(path.join(root, 'js/debug.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

assert.ok(appSrc.includes('js/debug.js?v=pr104-header-drag'), 'debug.js cache key should change with this panel');

function makeElement() {
  const content = { innerHTML: '' };
  const el = {
    innerHTML: '',
    className: '',
    style: {},
    content: content,
    classList: { add: function () {}, remove: function () {} },
    appendChild: function () { return el; },
    addEventListener: function () {},
    getBoundingClientRect: function () {
      return { left: 20, top: 20, right: 120, bottom: 80, width: 100, height: 60 };
    },
    querySelector: function (sel) {
      if (sel === '#debug-content') return content;
      if (sel === '#debug-dleaf-angle') return { value: '35', addEventListener: function () {} };
      if (sel === '#debug-dleaf-angle-minus' || sel === '#debug-dleaf-angle-plus') {
        return { addEventListener: function () {} };
      }
      if (sel === '#dleaf' || sel === '.debug-panel__dleaf-preview') {
        return { addEventListener: function () {} };
      }
      if (sel === '.debug-panel__header') {
        return { style: {}, addEventListener: function () {} };
      }
      return null;
    }
  };
  return el;
}

function loadPanel(lines) {
  const created = [];
  const sandbox = {
    console: console,
    setInterval: function () { return 0; },
    clearInterval: function () {},
    document: {
      body: { appendChild: function () {} },
      createElement: function () {
        const el = makeElement();
        created.push(el);
        return el;
      },
      getElementById: function (id) {
        if (id === 'daily-quote') return { textContent: '', title: '' };
        if (id === 'dleaf') return { style: { setProperty: function () {} } };
        return null;
      },
      addEventListener: function () {},
      querySelector: function (sel) {
        if (sel === 'meta[name="homepage-pr"]') return { content: '98' };
        return null;
      }
    },
    dailyQuotes: lines,
    links: [],
    keyboardFocusedIndex: -1,
    COMMON_EMOJIS: { a: ['x'] },
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: function () {},
    fetch: function () {
      return Promise.resolve({
        ok: true,
        text: function () { return Promise.resolve(quoteFile); }
      });
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(quotesSrc, sandbox);
  vm.runInContext(debugSrc, sandbox);
  sandbox.toggleDebugPanel();
  return { sandbox: sandbox, html: created[0].content.innerHTML };
}

const tiny = loadPanel(['Alpha', 'Beta', 'Gamma']);
assert.ok(tiny.html.includes('># of Quotes<'), tiny.html);
assert.ok(tiny.html.includes('>Quote Shown<'), tiny.html);
assert.ok(tiny.html.includes('>3<'), tiny.html);
const shown = tiny.sandbox.quoteLineIndex(tiny.sandbox.daysSinceJanuary1_2026(), 3) + 1;
assert.ok(shown >= 1 && shown <= 3);
assert.ok(tiny.html.includes('>' + shown + '<'), 'shown quote ' + shown + ' missing\n' + tiny.html);

const realLines = tiny.sandbox.parseQuoteFile(quoteFile);
assert.strictEqual(realLines.length, 610);
const filePanel = loadPanel(realLines);
assert.ok(filePanel.html.includes('>610<'), filePanel.html);
const todayShown = filePanel.sandbox.quoteLineIndex(filePanel.sandbox.daysSinceJanuary1_2026(), 610) + 1;
assert.ok(filePanel.html.includes('>' + todayShown + '<'), filePanel.html);

const day611 = new Date(2027, 8, 3);
assert.strictEqual(filePanel.sandbox.daysSinceJanuary1_2026(day611), 610);
assert.strictEqual(filePanel.sandbox.quoteLineIndex(610, 610) + 1, 1);

const empty = loadPanel([]);
assert.ok(empty.html.includes('>0<'), empty.html);
assert.ok(empty.html.includes('>—</span>') || empty.html.includes('>&mdash;</span>') || empty.html.includes('>—</'), empty.html);

console.log('debug-quote-shown.test.js: ok');
