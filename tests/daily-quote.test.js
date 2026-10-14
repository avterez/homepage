/**
 * Daily quote selection from docs/q.txt.
 * Run: node tests/daily-quote.test.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const quoteFile = fs.readFileSync(path.join(root, 'docs/q.txt'), 'utf8');
const quotesSrc = fs.readFileSync(path.join(root, 'js/quotes.js'), 'utf8');

function localDate(year, month, day, hours, minutes) {
  return new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0);
}

function loadQuotes(options) {
  const el = { textContent: '', title: '' };
  const fetchLog = [];
  let fetchImpl = options && options.fetch;
  const sandbox = {
    console: { warn: function () {}, log: function () {} },
    document: {
      getElementById: function (id) {
        if (options && options.missingElement) return null;
        return id === 'daily-quote' ? el : null;
      }
    },
    fetch: function (url) {
      fetchLog.push(url);
      if (fetchImpl) return fetchImpl(url);
      return Promise.resolve({
        ok: true,
        text: function () { return Promise.resolve(quoteFile); }
      });
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(quotesSrc, sandbox);
  return { sandbox: sandbox, el: el, fetchLog: fetchLog, setFetch: function (fn) { fetchImpl = fn; } };
}

const harness = loadQuotes();
const api = harness.sandbox;

const lines = api.parseQuoteFile(quoteFile);
assert.strictEqual(lines.length, 610, 'q.txt has 610 quote lines');
assert.strictEqual(lines[0], '“Stop being perfect, because obsessing over being perfect stops you from growing.” — Brad Pitt');
assert.strictEqual(lines[609], '“Even if I have already peaked, I have to believe I can improve. I wake up every morning, and go to practice, with the illusion that I’m going to get better that day.” — Rafael Nadal');
lines.forEach(function (line, index) {
  assert.ok(line.trim().length > 0, 'blank quote at index ' + index);
});

assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2026, 1, 1)), 0);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2026, 1, 2)), 1);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2026, 10, 14)), 286);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2025, 12, 31)), -1);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2026, 12, 31)), 364);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2027, 1, 1)), 365);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2027, 9, 2)), 609);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2027, 9, 3)), 610);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2027, 9, 4)), 611);
assert.strictEqual(api.daysSinceJanuary1_2026(localDate(2028, 2, 29)), 789);

assert.strictEqual(
  api.daysSinceJanuary1_2026(localDate(2026, 3, 8, 0, 30)),
  api.daysSinceJanuary1_2026(localDate(2026, 3, 8, 23, 30))
);
assert.strictEqual(
  api.daysSinceJanuary1_2026(localDate(2026, 3, 9)) - api.daysSinceJanuary1_2026(localDate(2026, 3, 8)),
  1
);

assert.strictEqual(api.quoteLineIndex(0, 610), 0);
assert.strictEqual(api.quoteLineIndex(1, 610), 1);
assert.strictEqual(api.quoteLineIndex(609, 610), 609);
assert.strictEqual(api.quoteLineIndex(610, 610), 0);
assert.strictEqual(api.quoteLineIndex(611, 610), 1);
assert.strictEqual(api.quoteLineIndex(1220, 610), 0);
assert.strictEqual(api.quoteLineIndex(-1, 610), 609);
assert.strictEqual(api.quoteLineIndex(-610, 610), 0);
assert.strictEqual(api.quoteLineIndex(-611, 610), 609);
assert.strictEqual(api.quoteLineIndex(5, 1), 0);
assert.strictEqual(api.quoteLineIndex(0, 0), 0);
assert.strictEqual(api.quoteLineIndex(4, 0), 0);

assert.strictEqual(api.quoteForDate(lines, localDate(2026, 1, 1)), lines[0]);
assert.strictEqual(api.quoteForDate(lines, localDate(2026, 1, 2)), lines[1]);
assert.strictEqual(api.quoteForDate(lines, localDate(2026, 10, 14)), lines[286]);
assert.strictEqual(api.quoteForDate(lines, localDate(2027, 9, 2)), lines[609]);
assert.strictEqual(api.quoteForDate(lines, localDate(2027, 9, 3)), lines[0]);
assert.strictEqual(api.quoteForDate(lines, localDate(2027, 9, 4)), lines[1]);
assert.strictEqual(api.quoteForDate(lines, localDate(2025, 12, 31)), lines[609]);

for (var day = -20; day <= lines.length + 20; day++) {
  var when = new Date(2026, 0, 1);
  when.setDate(when.getDate() + day);
  var quote = api.quoteForDate(lines, when);
  assert.ok(quote && quote.trim(), 'missing quote for day offset ' + day);
  var expected = lines[api.quoteLineIndex(day, lines.length)];
  assert.strictEqual(quote, expected, 'wrong quote for day offset ' + day);
}
assert.strictEqual(
  api.quoteForDate(lines, localDate(2027, 9, 3)),
  api.quoteForDate(lines, localDate(2026, 1, 1)),
  'sequence restarts at the first quote'
);

var tiny = api.parseQuoteFile('Alpha\n\n  \nBeta\r\nGamma\n');
assert.strictEqual(Array.prototype.join.call(tiny, '|'), 'Alpha|Beta|Gamma');
assert.strictEqual(api.quoteForDate(tiny, localDate(2026, 1, 1)), 'Alpha');
assert.strictEqual(api.quoteForDate(tiny, localDate(2026, 1, 2)), 'Beta');
assert.strictEqual(api.quoteForDate(tiny, localDate(2026, 1, 3)), 'Gamma');
assert.strictEqual(api.quoteForDate(tiny, localDate(2026, 1, 4)), 'Alpha');
assert.strictEqual(api.quoteForDate(['Only'], localDate(2030, 6, 15)), 'Only');
assert.strictEqual(api.quoteForDate(['Only'], localDate(2020, 1, 1)), 'Only');
assert.strictEqual(api.quoteForDate([], localDate(2026, 1, 1)), '');

api.initQuotes().then(function (loaded) {
  assert.strictEqual(loaded.length, 610);
  assert.strictEqual(harness.fetchLog.length, 1);
  assert.strictEqual(harness.fetchLog[0], 'docs/q.txt');
  assert.strictEqual(harness.el.textContent, api.quoteForDate(lines, new Date()));
  assert.strictEqual(harness.el.title, harness.el.textContent);
  assert.ok(harness.el.textContent.trim().length > 0, 'header quote is empty after load');

  var shown = [];
  for (var offset = 0; offset <= lines.length; offset++) {
    var date = new Date(2026, 0, 1);
    date.setDate(date.getDate() + offset);
    var text = api.displayDailyQuote(date);
    assert.strictEqual(harness.el.textContent, text);
    assert.strictEqual(harness.el.title, text);
    assert.ok(text.trim().length > 0, 'header cleared at offset ' + offset);
    shown.push(text);
  }
  assert.strictEqual(shown[0], lines[0]);
  assert.strictEqual(shown[lines.length - 1], lines[lines.length - 1]);
  assert.strictEqual(shown[lines.length], lines[0]);
  assert.strictEqual(harness.fetchLog.length, 1, 'second display must not fetch again');

  return api.initQuotes();
}).then(function () {
  assert.strictEqual(harness.fetchLog.length, 1, 'loaded quotes must not fetch again');

  const failed = loadQuotes({
    fetch: function () {
      return Promise.reject(new Error('offline'));
    }
  });
  return failed.sandbox.initQuotes().then(function (empty) {
    assert.strictEqual(empty.length, 0);
    assert.strictEqual(failed.el.textContent, '');
    failed.sandbox.fetch = function () {
      return Promise.resolve({
        ok: true,
        text: function () { return Promise.resolve('First\nSecond\n'); }
      });
    };
    return failed.sandbox.initQuotes();
  }).then(function (retried) {
    assert.strictEqual(Array.prototype.join.call(retried, '|'), 'First|Second');
    assert.strictEqual(failed.el.textContent, api.quoteForDate(['First', 'Second'], new Date()));
    assert.ok(failed.el.textContent === 'First' || failed.el.textContent === 'Second');

    const missing = loadQuotes({ missingElement: true });
    return missing.sandbox.initQuotes();
  });
}).then(function (loaded) {
  assert.strictEqual(loaded.length, 610);
  console.log('daily-quote.test.js: ok');
}).catch(function (error) {
  console.error(error);
  process.exit(1);
});
