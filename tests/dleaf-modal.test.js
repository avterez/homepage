/**
 * Ten DLEAF clicks within ten seconds open the Founders Modal.
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

const modalAt = html.indexOf('id="founders-modal"');
assert.ok(modalAt !== -1, 'index.html should include #founders-modal');
const modalEnd = html.indexOf('id="landscape-lock"', modalAt);
const modalHtml = html.slice(modalAt, modalEnd === -1 ? modalAt + 8000 : modalEnd);

function assertFdateFields(source, label) {
  assert.ok(source.includes('>Special Date<'), label + ' should title the Founders Modal Special Date');
  assert.ok(source.includes('>Date:<'), label + ' should label Date:');
  assert.ok(source.includes('id="dleaf-fdate-month"'), label + ' should ask for a month');
  assert.ok(source.includes('id="dleaf-fdate-day"'), label + ' should ask for a day');
  assert.ok(/<option value="4" selected>April<\/option>/.test(source), label + ' should default the month to April');
  assert.ok(/<option value="15" selected>15<\/option>/.test(source), label + ' should default the day to 15');
  assert.ok(!source.includes('type="date"'), label + ' should not use a year-bearing date input');
  assert.ok(!/year/i.test(source), label + ' should not ask for a year');
  assert.ok(/<label[^>]*for="dleaf-fmessage"[^>]*>Message:<\/label>/.test(source), label);
  const fmessageTag = source.match(/<input[^>]*id="dleaf-fmessage"[^>]*>/);
  assert.ok(fmessageTag && fmessageTag[0].includes('type="text"'), label + ' FMESSAGE should be a text box');
  assert.ok(fmessageTag && fmessageTag[0].includes('name="fmessage"'), label + ' FMESSAGE name should be fmessage');
  assert.ok(fmessageTag && fmessageTag[0].includes('autocomplete="off"') && fmessageTag[0].includes('spellcheck="false"'), label + ' FMESSAGE stays a plain text box');
  assert.ok(fmessageTag && fmessageTag[0].includes('class="founders-modal__input"'), label + ' FMESSAGE keeps the founders input class');
  assert.ok(fmessageTag && !/\bvalue\s*=/.test(fmessageTag[0]), label + ' FMESSAGE should start blank');
}

assertFdateFields(modalHtml, 'index.html');
assert.ok(html.includes('name="homepage-pr" content="106"'), 'debug PR meta should be 106');
const fmessageAt = modalHtml.indexOf('id="dleaf-fmessage"');
const ruleAt = modalHtml.indexOf('<hr class="founders-modal__rule">');
const f2DateAt = modalHtml.indexOf('id="dleaf-f2date-month"');
const f2MessageAt = modalHtml.indexOf('id="dleaf-f2message"');
assert.ok(fmessageAt !== -1 && ruleAt > fmessageAt, 'an hr sits under FMESSAGE');
assert.ok(f2DateAt > ruleAt, 'second Date sits under the hr');
assert.ok(/id="dleaf-f2date-label">Date:</.test(modalHtml), 'second Date label should read Date:');
assert.ok(modalHtml.includes('id="dleaf-f2date-day"'), 'second Date should ask for a day');
assert.ok(f2MessageAt > f2DateAt, 'F2MESSAGE sits under the second Date');
assert.ok(/<label[^>]*for="dleaf-f2message"[^>]*>Message:<\/label>/.test(modalHtml), 'second Message label should read Message:');
const f2MessageTag = modalHtml.match(/<input[^>]*id="dleaf-f2message"[^>]*>/);
assert.ok(f2MessageTag && f2MessageTag[0].includes('type="text"') && f2MessageTag[0].includes('name="f2message"') && !/\bvalue\s*=/.test(f2MessageTag[0]), 'F2MESSAGE should be a blank text box');
assert.ok(!modalHtml.includes('dleaf-fname') && !modalHtml.includes('dleaf-f2name'), 'old name ids are gone from the Founders Modal');
assert.ok(!modalHtml.includes('name="fname"') && !modalHtml.includes('name="f2name"'), 'old name attributes are gone from the Founders Modal');

function selectBlock(source, id) {
  const marker = 'id="' + id + '"';
  const at = source.indexOf(marker);
  assert.ok(at !== -1, id + ' missing');
  const open = source.lastIndexOf('<select', at);
  const close = source.indexOf('</select>', at);
  return source.slice(open, close);
}

const firstMonth = selectBlock(modalHtml, 'dleaf-fdate-month');
const firstDay = selectBlock(modalHtml, 'dleaf-fdate-day');
const secondMonth = selectBlock(modalHtml, 'dleaf-f2date-month');
const secondDay = selectBlock(modalHtml, 'dleaf-f2date-day');
assert.ok(/<option value="4" selected>April<\/option>/.test(firstMonth), 'first Date month stays April');
assert.ok(/<option value="15" selected>15<\/option>/.test(firstDay), 'first Date day stays 15');
assert.ok(/<option value="11" selected>November<\/option>/.test(secondMonth), 'second Date month defaults to November');
assert.ok(!/<option value="4" selected>/.test(secondMonth), 'second Date month is not April');
assert.ok(/<option value="5" selected>5<\/option>/.test(secondDay), 'second Date day defaults to 5');
assert.ok(!/<option value="15" selected>/.test(secondDay), 'second Date day is not 15');

function assertNoneMonth(block, label) {
  const none = '<option value="">None</option>';
  assert.ok(block.includes(none), label + ' month includes <option value="">None</option>');
  assert.ok(block.indexOf(none) !== -1 && block.indexOf(none) < block.indexOf('<option value="1">January</option>'), label + ' None is the first month option');
  assert.ok(!/<option value=""[^>]*selected/.test(block), label + ' None is not selected');
  assert.ok(!/selected[^>]*>None</.test(block), label + ' None is not the selected option');
}
assertNoneMonth(firstMonth, 'first Date');
assertNoneMonth(secondMonth, 'second Date');
assert.ok(!firstDay.includes('>None<') && !secondDay.includes('>None<'), 'day selects do not include None');
const css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
assert.ok(css.includes('#founders-modal.is-open{z-index:100000;align-items:flex-start;justify-content:center;padding-top:10vh}'), 'Founders Modal should open at 10% of the screen height');
assert.ok(configSrc.includes("'founders-modal'"), 'founders-modal should be a ui-modal id');
assert.ok(appSrc.includes("'founders-modal': closeFoundersModal"), 'Escape should close the Founders Modal');

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
  const header = node({ className: 'debug-panel__header', tagName: 'div', parent: panel });
  const closeBtn = node({ tagName: 'button', className: 'debug-panel__btn--close', parent: header });
  const content = node({ id: 'debug-content', className: 'debug-panel__content', parent: panel });
  const preview = node({
    className: 'debug-panel__dleaf-preview',
    parent: panel
  });
  const leaf = node({ id: 'dleaf', className: 'dleaf', parent: preview });
  const angle = node({ id: 'debug-dleaf-angle', tagName: 'input', value: '35', parent: panel });
  const minus = node({ id: 'debug-dleaf-angle-minus', tagName: 'button', parent: panel });
  const plus = node({ id: 'debug-dleaf-angle-plus', tagName: 'button', parent: panel });
  const modal = node({ id: 'founders-modal', tagName: 'div', className: 'ui-modal' });
  modal.innerHTML = modalHtml;

  panel.querySelector = function (sel) {
    if (sel === '#debug-content') return content;
    if (sel === '.debug-panel__header') return header;
    if (sel === '#debug-dleaf-angle') return angle;
    if (sel === '#debug-dleaf-angle-minus') return minus;
    if (sel === '#debug-dleaf-angle-plus') return plus;
    if (sel === '.debug-panel__dleaf-preview') return preview;
    if (sel === '#dleaf') return leaf;
    return null;
  };
  panel.content = content;

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
        if (id === 'founders-modal') return modal;
        if (id === 'daily-quote') return { textContent: '', title: '' };
        return null;
      },
      addEventListener: function (type, fn) { listen(docListeners, type, fn); },
      querySelector: function (sel) {
        if (sel === 'meta[name="homepage-pr"]') return { content: '106' };
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
    header: header,
    closeBtn: closeBtn,
    content: content,
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
assert.strictEqual(within.opened[0], 'founders-modal');
assertFdateFields(within.modal.innerHTML, 'opened modal');

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
assert.strictEqual(dragged.panel.style.left, undefined, 'a leaf press that moves should not move the panel');
click(dragged, dragged.leaf, 12, 12);
assert.ok(dragged.modal.classList.contains('is-open'), 'the tenth still click after a drag should open the modal');

const angle = loadPanel();
angle.clock(8000);
for (let i = 0; i < 10; i++) click(angle, angle.plus, 80, 20);
assert.ok(!angle.modal.classList.contains('is-open'), 'angle buttons should not count as DLEAF clicks');
assert.strictEqual(angle.panel.style.left, undefined, 'angle buttons should not move the panel');

function drag(ui, target, x0, y0, x1, y1) {
  ui.dispatch(target, 'mousedown', { clientX: x0, clientY: y0 });
  ui.dispatch(target, 'mousemove', { clientX: x1, clientY: y1 });
  ui.dispatch(target, 'mouseup', { clientX: x1, clientY: y1 });
}

const bodyDrag = loadPanel();
drag(bodyDrag, bodyDrag.content, 40, 90, 160, 90);
assert.strictEqual(bodyDrag.panel.style.left, undefined, 'dragging the body should not change panel.style.left');

const headerDrag = loadPanel();
drag(headerDrag, headerDrag.header, 40, 48, 140, 48);
assert.strictEqual(headerDrag.panel.style.left, '120px', 'dragging the header should change panel.style.left');

const closeDrag = loadPanel();
drag(closeDrag, closeDrag.closeBtn, 180, 48, 260, 48);
assert.strictEqual(closeDrag.panel.style.left, undefined, 'the header close button should not start a drag');

console.log('dleaf-modal.test.js: ok');
