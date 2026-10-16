/**
 * file:/// links stay unprefixed on save and are omitted from the mobile list.
 * Run: node tests/file-url-links.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const storageSrc = fs.readFileSync(path.join(root, 'js/storage.js'), 'utf8');
const renderSrc = fs.readFileSync(path.join(root, 'js/render.js'), 'utf8');
const addSrc = fs.readFileSync(path.join(root, 'js/addeditlink.js'), 'utf8');

function makeEl(tag) {
    const node = {
        tagName: String(tag || 'div').toUpperCase(),
        id: '',
        className: '',
        classList: {
            add: function () {},
            remove: function () {},
            toggle: function () {},
            contains: function () { return false; }
        },
        dataset: {},
        style: { setProperty: function () {} },
        children: [],
        _html: '',
        textContent: '',
        draggable: false,
        onclick: null,
        appendChild: function (child) { this.children.push(child); return child; },
        setAttribute: function (name, value) { this[name] = value; },
        getAttribute: function (name) { return this[name]; },
        addEventListener: function () {},
        remove: function () {},
        focus: function () {},
        scrollIntoView: function () {},
        closest: function () { return null; },
        querySelector: function () {
            return { style: {}, addEventListener: function () {} };
        },
        querySelectorAll: function () { return []; }
    };
    Object.defineProperty(node, 'innerHTML', {
        get: function () { return this._html; },
        set: function (value) {
            this._html = String(value);
            this.children = [];
        }
    });
    return node;
}

function loadApp() {
    const grid = makeEl('div');
    grid.id = 'links-grid';
    const sidebar = makeEl('div');
    sidebar.id = 'categories-sidebar';
    const nav = makeEl('div');
    nav.id = 'abc-section-nav';
    const byId = {
        'links-grid': grid,
        'categories-sidebar': sidebar,
        'abc-section-nav': nav,
        'clear-filter-link-container': makeEl('div'),
        'clear-filter-link': makeEl('a'),
        'link-name': { value: '' },
        'link-url': { value: '' },
        'link-description': { value: '' },
        'link-emoji': { value: '🔗' },
        'link-is-favorite': { checked: false },
        'link-tally': { value: '0' }
    };
    const alerts = [];
    const context = {
        console: console,
        links: [],
        currentFilterCategory: null,
        linkSearchTerm: '',
        categorySearchTerm: '',
        sortMode: 'default',
        viewMode: 'full',
        currentEditId: null,
        modalCurrentCategories: [],
        modalCurrentAccent: null,
        mobile: false,
        Date: Date,
        setTimeout: function (fn) { if (typeof fn === 'function') fn(); return 0; },
        clearTimeout: function () {},
        alert: function (message) { alerts.push(message); },
        isMobileBrowser: function () { return context.mobile; },
        isManualSortLocked: function () { return true; },
        escapeHtml: function (value) { return String(value == null ? '' : value); },
        getAbcSectionElementId: function (label) { return 'section-' + label; },
        clearCategoryFilter: function () { context.currentFilterCategory = null; },
        closeUiModal: function () {},
        restoreLinkSearchFocus: function () {},
        applyLinkCardKeyboardFocus: function () {},
        renameCategory: function () {},
        deleteCategory: function () {},
        ACCENT_COLORS: {},
        localStorage: { getItem: function () { return null; }, setItem: function () {} },
        navigator: { userAgent: '' },
        matchMedia: function () { return { matches: false }; }
    };
    context.window = context;
    context.document = {
        body: makeEl('body'),
        getElementById: function (id) { return byId[id] || null; },
        querySelectorAll: function (sel) {
            if (sel === '.link-card-tooltip') return [];
            if (sel === '#links-grid .link-card') {
                return grid.children.filter(function (child) {
                    return String(child.className || '').indexOf('link-card') !== -1;
                });
            }
            return [];
        },
        addEventListener: function () {},
        createElement: function (tag) { return makeEl(tag); }
    };
    vm.createContext(context);
    vm.runInContext(storageSrc, context);
    vm.runInContext(renderSrc, context);
    vm.runInContext(addSrc, context);
    return { context: context, grid: grid, sidebar: sidebar, alerts: alerts };
}

const urlCases = loadApp().context;
assert.strictEqual(urlCases.normalizeLinkUrl('example.com'), 'https://example.com');
assert.strictEqual(urlCases.normalizeLinkUrl('https://example.com/a'), 'https://example.com/a');
assert.strictEqual(urlCases.normalizeLinkUrl('http://example.com'), 'http://example.com');
assert.strictEqual(
    urlCases.normalizeLinkUrl('file:///C:/notes/today.txt'),
    'file:///C:/notes/today.txt',
    'file:/// is stored without an https:// prefix'
);
assert.strictEqual(
    urlCases.normalizeLinkUrl('  FILE:///home/alan/doc.pdf  '),
    'FILE:///home/alan/doc.pdf',
    'file scheme check is case-insensitive and keeps the typed URL'
);
assert.strictEqual(urlCases.isLocalFileUrl('file:///tmp/a'), true);
assert.strictEqual(urlCases.isLocalFileUrl('https://example.com'), false);
assert.strictEqual(urlCases.isLocalFileUrl('file://server/share'), false);

const desktop = loadApp();
desktop.context.links = [
    { id: 1, name: 'Local Notes', url: 'file:///C:/notes/today.txt', description: '', emoji: '📁', categories: ['Files'], isFavorite: false, tally: 0 },
    { id: 2, name: 'Example', url: 'https://example.com', description: '', emoji: '🔗', categories: ['Web'], isFavorite: false, tally: 0 }
];
desktop.context.mobile = false;
desktop.context.renderLinks();
const desktopNames = desktop.grid.children
    .filter(function (child) { return String(child.className).indexOf('link-card') !== -1; })
    .map(function (child) { return String(child.dataset.id); });
assert.deepStrictEqual(desktopNames, ['1', '2'], 'desktop shows file:/// cards next to web cards');

desktop.context.renderCategoriesSidebar();
assert.ok(desktop.sidebar.children[0]._html.includes('>2<'), 'desktop All Links count includes the file card');
assert.ok(desktop.sidebar._html === '' || desktop.sidebar.children.some(function (child) {
    return String(child._html || '').includes('Files');
}), 'desktop sidebar lists the file link category');

const mobile = loadApp();
mobile.context.links = desktop.context.links.map(function (link) { return Object.assign({}, link); });
mobile.context.mobile = true;
mobile.context.renderLinks();
const mobileIds = mobile.grid.children
    .filter(function (child) { return String(child.className).indexOf('link-card') !== -1; })
    .map(function (child) { return String(child.dataset.id); });
assert.deepStrictEqual(mobileIds, ['2'], 'mobile hides link cards whose URL starts with file:///');
assert.ok(!mobile.grid._html.includes('file:///'), 'the hidden file URL is not rendered into the mobile grid');

mobile.context.linkSearchTerm = 'Local Notes';
mobile.context.renderLinks();
const searched = mobile.grid.children.filter(function (child) {
    return String(child.className).indexOf('link-card') !== -1;
});
assert.strictEqual(searched.length, 0, 'mobile search does not reveal a file:/// card');
assert.ok(mobile.grid._html.includes('No links'), 'a search that only matches file cards shows the empty state');

mobile.context.linkSearchTerm = '';
mobile.context.renderCategoriesSidebar();
const mobileSidebarText = mobile.sidebar.children.map(function (child) { return child._html; }).join('\n');
assert.ok(mobileSidebarText.includes('>1<'), 'mobile All Links count skips file cards');
assert.ok(!mobileSidebarText.includes('Files'), 'a category that only contains file cards is omitted on mobile');
assert.ok(mobileSidebarText.includes('Web'), 'web categories stay on mobile');

const saved = loadApp();
saved.context.document.getElementById('link-name').value = 'Desk file';
saved.context.document.getElementById('link-url').value = 'file:///Users/alan/budget.ods';
saved.context.saveCurrentLink();
assert.strictEqual(saved.alerts.length, 0);
assert.strictEqual(saved.context.links.length, 1);
assert.strictEqual(saved.context.links[0].url, 'file:///Users/alan/budget.ods');
assert.ok(!saved.context.links[0].url.startsWith('https://'), 'Save does not prefix file:///');

saved.context.document.getElementById('link-name').value = 'Site';
saved.context.document.getElementById('link-url').value = 'example.com/docs';
saved.context.saveCurrentLink();
assert.strictEqual(saved.context.links[1].url, 'https://example.com/docs');

saved.context.currentEditId = saved.context.links[0].id;
saved.context.document.getElementById('link-name').value = 'Desk file';
saved.context.document.getElementById('link-url').value = 'file:///Users/alan/budget.ods';
saved.context.saveCurrentLink();
assert.strictEqual(saved.context.links[0].url, 'file:///Users/alan/budget.ods', 'editing keeps the file URL');

console.log('file-url-links.test.js: ok');
