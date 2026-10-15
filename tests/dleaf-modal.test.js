/**
 * Ten DLEAF clicks within ten seconds open the FDATE / FNAME modal.
 * Run: node tests/dleaf-modal.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const debugSrc = fs.readFileSync(path.join(root, 'js/debug.js'), 'utf8');
const appSrc = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
const configSrc = fs.readFileSync(path.join(root, 'js/config.js'), 'utf8');

const modalAt = html.indexOf('id="dleaf-modal"');
assert.ok(modalAt !== -1, 'index.html should include #dleaf-modal');
const modalHtml = html.slice(modalAt, modalAt + 1600);
assert.ok(/<label[^>]*for="dleaf-fdate"[^>]*>FDATE<\/label>/.test(modalHtml), modalHtml);
assert.ok(modalHtml.includes('type="date"') && modalHtml.includes('id="dleaf-fdate"'), modalHtml);
assert.ok(/<label[^>]*for="dleaf-fname"[^>]*>FNAME<\/label>/.test(modalHtml), modalHtml);
assert.ok(modalHtml.includes('type="text"') && modalHtml.includes('id="dleaf-fname"'), modalHtml);
assert.ok(html.includes('name="homepage-pr" content="104"'), 'debug PR meta should be 104');
assert.ok(configSrc.includes("'dleaf-modal'"), 'dleaf-modal should be a ui-modal id');
assert.ok(appSrc.includes("'dleaf-modal': closeDleafModal"), 'Escape should close the DLEAF modal');

function matches(el, sel) {
  return String(sel).split(',').some(function (part) {
    part = part.trim();
    if (!part || !el) return false;
    if (part.charAt(0) === '#') return el.id === part.slice(1);
    if (part.charAt(0) === '.') {
      return (' ' + (el.className || '') + ' ').indexOf(' ' + part.slice(1) + ' ') !== -1;
    }
    return el.tagName === part;
  });
}

function loadPanel() {
  const docListeners = {};
  const opened = [];
  let clock = 0;

  function listen(bucket, type, fn) {
    (bucket[type] || (bucket[type] = [])).push(fn);
  }

  function node(spec) {
    const el = {
      id: spec.id || '',
      className: spec.className || '',
      tagName: spec.tagName || 'span',
      parent: spec.parent || null,
      style: { setProperty: function () {} },
      innerHTML: '',
      value: spec.value || '',
      classSet: {},
      listeners: {},
      addEventListener: function (type, fn) { listen(el.listeners, type, fn); },
      getBoundingClientRect: function () {
        return { left: 20, top: 40, right: 308, bottom: 220, width: 288, height: 180 };
      },
      closest: function (sel) {
        let current = el;
        while (current) {
          if (matches(current, sel)) return current;
          current = current.parent;
        }
        return null;
      }
    };
    el.classList = {
      add: function (name) { el.classSet[name] = true; },
      remove: function (name) { delete el.classSet[name]; },
      contains: function (name) { return !!el.classSet[name]; }
    };
    return el;
  }

  const panel = node({ id: 'debug-panel', tagName: 'div', className: 'debug-panel' });
  const preview = node({
    className: 'debug-panel__dleaf-preview',
    parent: panel
  });
  const leaf = node({ id: 'dleaf', className: 'dleaf', parent: preview });
  const angle = node({ id: 'debug-dleaf-angle', tagName: 'input', value: '35', parent: panel });
  const minus = node({ id: 'debug-dleaf-angle-minus', tagName: 'button', parent: panel });
  const plus = node({ id: 'debug-dleaf-angle-plus', tagName: 'button', parent: panel });
  const modal = node({ id: 'dleaf-modal', tagName: 'div', className: 'ui-modal' });
  modal.innerHTML = modalHtml;

  panel.querySelector = function (sel) {
    if (sel === '#debug-content') return panel.content;
    if (sel === '#debug-dleaf-angle') return angle;
    if (sel === '#debug-dleaf-angle-minus') return minus;
    if (sel === '#debug-dleaf-angle-plus') return plus;
    if (sel === '.debug-panel__dleaf-preview') return preview;
    if (sel === '#dleaf') return leaf;
    return null;
  };
  panel.content = { innerHTML: '' };

  function dispatch(target, type, extra) {
    const event = Object.assign({
      type: type,
      button: 0,
      clientX: 16,
      clientY: 16,
      target: target,
      cancelable: true,
      preventDefault: function () {},
      stopPropagation: function () { event.stopped = true; }
    }, extra || {});
    let current = target;
    while (current) {
      (current.listeners[type] || []).forEach(function (fn) { fn(event); });
      if (event.stopped) return event;
      current = current.parent;
    }
    (docListeners[type] || []).forEach(function (fn) { fn(event); });
    return event;
  }

  const sandbox = {
    console: console,
    Date: { now: function () { return clock; } },
    setInterval: function () { return 0; },
    clearInterval: function () {},
    document: {
      body: { appendChild: function () {} },
      createElement: function () { return panel; },
      getElementById: function (id) {
        if (id === 'dleaf') return leaf;
        if (id === 'dleaf-modal') return modal;
        if (id === 'daily-quote') return { textContent: '', title: '' };
        return null;
      },
      addEventListener: function (type, fn) { listen(docListeners, type, fn); },
      querySelector: function (sel) {
        if (sel === 'meta[name="homepage-pr"]') return { content: '104' };
        return null;
      }
    },
    links: [],
    keyboardFocusedIndex: -1,
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: function () {},
    openUiModal: function (id) {
      opened.push(id);
      const found = sandbox.document.getElementById(id);
      if (found) found.classList.add('is-open');
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(debugSrc, sandbox);
  sandbox.toggleDebugPanel();

  return {
    clock: function (value) { clock = value; },
    modal: modal,
    opened: opened,
    leaf: leaf,
    plus: plus,
    dispatch: dispatch,
    panel: panel
  };
}

function click(ui, target, x, y) {
  ui.dispatch(target, 'mousedown', { clientX: x, clientY: y });
  ui.dispatch(target, 'mouseup', { clientX: x, clientY: y });
}

const within = loadPanel();
within.clock(1000);
for (let i = 0; i < 9; i++) click(within, within.leaf, 16, 16);
assert.ok(!within.modal.classList.contains('is-open'), 'nine clicks should not open the modal');
click(within, within.leaf, 16, 16);
assert.ok(within.modal.classList.contains('is-open'), 'the tenth click within ten seconds should open the modal');
assert.strictEqual(within.opened[0], 'dleaf-modal');
assert.ok(/<label[^>]*for="dleaf-fdate"[^>]*>FDATE<\/label>/.test(within.modal.innerHTML));
assert.ok(within.modal.innerHTML.includes('type="date"') && within.modal.innerHTML.includes('id="dleaf-fdate"'));
assert.ok(/<label[^>]*for="dleaf-fname"[^>]*>FNAME<\/label>/.test(within.modal.innerHTML));
assert.ok(within.modal.innerHTML.includes('type="text"') && within.modal.innerHTML.includes('id="dleaf-fname"'));

within.modal.classList.remove('is-open');
within.opened.length = 0;
for (let i = 0; i < 9; i++) click(within, within.leaf, 16, 16);
assert.ok(!within.modal.classList.contains('is-open'), 'opening the modal should reset the click buffer');

const aged = loadPanel();
aged.clock(0);
for (let i = 0; i < 9; i++) click(aged, aged.leaf, 16, 16);
aged.clock(10001);
click(aged, aged.leaf, 16, 16);
assert.ok(!aged.modal.classList.contains('is-open'), 'clicks older than ten seconds should not count');
for (let i = 0; i < 8; i++) click(aged, aged.leaf, 16, 16);
assert.ok(!aged.modal.classList.contains('is-open'), 'nine fresh clicks should still be short of ten');
click(aged, aged.leaf, 16, 16);
assert.ok(aged.modal.classList.contains('is-open'), 'ten clicks inside the new window should open the modal');

const dragged = loadPanel();
dragged.clock(5000);
for (let i = 0; i < 9; i++) click(dragged, dragged.leaf, 12, 12);
dragged.dispatch(dragged.leaf, 'mousedown', { clientX: 12, clientY: 12 });
dragged.dispatch(dragged.leaf, 'mousemove', { clientX: 40, clientY: 12 });
dragged.dispatch(dragged.leaf, 'mouseup', { clientX: 40, clientY: 12 });
assert.ok(!dragged.modal.classList.contains('is-open'), 'a drag should not count as a DLEAF click');
click(dragged, dragged.leaf, 12, 12);
assert.ok(dragged.modal.classList.contains('is-open'), 'the tenth still click after a drag should open the modal');

const angle = loadPanel();
angle.clock(8000);
for (let i = 0; i < 10; i++) click(angle, angle.plus, 80, 20);
assert.ok(!angle.modal.classList.contains('is-open'), 'angle buttons should not count as DLEAF clicks');

console.log('dleaf-modal.test.js: ok');
