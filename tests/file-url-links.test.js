/**
 * file:/// links keep their scheme on save and stay off the main page in mobile mode.
 * Run: node tests/file-url-links.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');

function field(value) {
    return { value: value || '', checked: false, focus: function () {} };
}

function loadSaver() {
    const fields = {
        'link-name': field('Notes'),
        'link-url': field(''),
        'link-description': field(''),
        'link-emoji': field('📁'),
        'link-is-favorite': { checked: false },
        'link-tally': field('0')
    };
    const saved = [];
    const context = {
        document: {
            getElementById: function (id) { return fields[id] || null; },
            querySelectorAll: function () { return []; },
            addEventListener: function () {}
        },
        links: [],
        currentEditId: null,
        modalCurrentCategories: [],
        modalCurrentAccent: null,
        alert: function () {},
        isLocalFileUrl: function (url) {
            return String(url == null ? '' : url).trim().toLowerCase().startsWith('file:///');
        },
        normalizeLink: function (link) { return link; },
        coerceTally: function (value) {
            const n = parseInt(value, 10);
            return Number.isFinite(n) && n > 0 ? n : 0;
        },
        clearCategoryFilter: function () {},
        saveLinks: function () { saved.push(context.links.map(function (link) { return link.url; })); },
        closeModal: function () {},
        renderLinks: function () {},
        renderCategoriesSidebar: function () {},
        applyLinkCardKeyboardFocus: function () {},
        setTimeout: function () {}
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/addeditlink.js'), 'utf8'), context);
    context.closeModal = function () {};
    return { context: context, fields: fields, saved: saved };
}

function saveUrl(raw) {
    const loaded = loadSaver();
    loaded.fields['link-url'].value = raw;
    loaded.context.saveCurrentLink();
    assert.strictEqual(loaded.context.links.length, 1, 'save should store ' + raw);
    return loaded.context.links[0].url;
}

assert.strictEqual(saveUrl('file:///home/notes.txt'), 'file:///home/notes.txt');
assert.strictEqual(saveUrl('FILE:///C:/docs/a.txt'), 'FILE:///C:/docs/a.txt');
assert.strictEqual(saveUrl('  file:///tmp/x  '), 'file:///tmp/x');
assert.strictEqual(saveUrl('example.com'), 'https://example.com');
assert.strictEqual(saveUrl('http://example.com'), 'http://example.com');
assert.strictEqual(saveUrl('https://example.com/a'), 'https://example.com/a');

function Element(tag) {
    this.tagName = tag || 'div';
    this.children = [];
    this.className = '';
    this.id = '';
    this.innerHTML = '';
    this.textContent = '';
    this.dataset = {};
    this.style = { setProperty: function () {}, opacity: '' };
    this.draggable = false;
    this.classList = {
        add: function () {},
        remove: function () {},
        toggle: function () {},
        contains: function () { return false; }
    };
}
Element.prototype.setAttribute = function (name, value) { this[name] = value; };
Element.prototype.getAttribute = function (name) { return this[name]; };
Element.prototype.addEventListener = function () {};
Element.prototype.appendChild = function (child) { this.children.push(child); return child; };
Element.prototype.remove = function () {};
Element.prototype.querySelector = function (sel) {
    if (sel === '.drag-handle') return new Element('div');
    return null;
};
Element.prototype.querySelectorAll = function () { return []; };

function cardNames(grid) {
    return grid.children.filter(function (child) {
        return String(child.className).indexOf('link-card') !== -1;
    }).map(function (card) {
        const match = String(card.innerHTML).match(/link-card__name">([^<]*)</);
        return match ? match[1] : '';
    });
}

function loadGrid(mobile) {
    const grid = new Element('div');
    const context = {
        document: {
            getElementById: function (id) { return id === 'links-grid' ? grid : null; },
            querySelectorAll: function () { return []; },
            createElement: function (tag) { return new Element(tag); }
        },
        isMobileBrowser: function () { return mobile; },
        escapeHtml: function (value) { return String(value == null ? '' : value); },
        window: {},
        console: console
    };
    vm.createContext(context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/state.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(root, 'js/render.js'), 'utf8'), context);
    context.viewMode = 'full';
    context.sortMode = 'default';
    context.links = [
        { id: 1, name: 'Web', url: 'https://example.com', description: '', emoji: '🔗', categories: [], isFavorite: false, tally: 0 },
        { id: 2, name: 'Local', url: 'file:///home/notes.txt', description: '', emoji: '📁', categories: [], isFavorite: false, tally: 0 },
        { id: 3, name: 'Drive', url: 'FILE:///C:/docs/a.txt', description: '', emoji: '📁', categories: [], isFavorite: true, tally: 1 }
    ];
    context.renderLinks();
    return cardNames(grid);
}

assert.deepStrictEqual(loadGrid(false), ['Drive', 'Web', 'Local']);
assert.deepStrictEqual(loadGrid(true), ['Web']);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.includes('name="homepage-pr" content="111"'), 'debug and settings PR number is 111');

console.log('file-url-links.test.js: ok');
