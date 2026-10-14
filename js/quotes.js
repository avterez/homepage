// Daily quote from docs/q.txt.
// days since January 1, 2026  mod  line count  =  line to show.
// Line 0 is the first line. When the day count reaches the line count,
// the result is 0 and the header starts again at the first quote.

var QUOTE_FILE_URL = 'docs/q.txt';
var quoteLines = [];
var quotesLoad = null;

function daysSinceJanuary1_2026(date) {
  var d = (date && typeof date.getFullYear === 'function') ? date : new Date();
  var utcDay = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  var utcEpoch = Date.UTC(2026, 0, 1);
  return Math.round((utcDay - utcEpoch) / 86400000);
}

function quoteLineIndex(daysSince, lineCount) {
  var count = lineCount | 0;
  if (count <= 0) return 0;
  return ((daysSince % count) + count) % count;
}

function parseQuoteFile(text) {
  var raw = String(text == null ? '' : text).split(/\r?\n/);
  if (raw.length && raw[raw.length - 1] === '') raw.pop();
  var lines = [];
  for (var i = 0; i < raw.length; i++) {
    var line = raw[i].trim();
    if (line) lines.push(line);
  }
  return lines;
}

function quoteForDate(lines, date) {
  if (!lines || !lines.length) return '';
  var index = quoteLineIndex(daysSinceJanuary1_2026(date), lines.length);
  var quote = lines[index];
  return (typeof quote === 'string' && quote.trim()) ? quote : '';
}

function displayDailyQuote(date) {
  var quote = quoteForDate(quoteLines, date);
  var quoteEl = (typeof document !== 'undefined' && document.getElementById)
    ? document.getElementById('daily-quote')
    : null;
  if (!quoteEl || !quote) return quote;
  quoteEl.textContent = quote;
  quoteEl.title = quote;
  return quote;
}

function initQuotes() {
  if (quoteLines.length) {
    displayDailyQuote();
    return Promise.resolve(quoteLines);
  }
  if (quotesLoad) return quotesLoad;
  if (typeof fetch !== 'function') return Promise.resolve(quoteLines);

  quotesLoad = fetch(QUOTE_FILE_URL)
    .then(function (response) {
      if (!response || !response.ok) {
        throw new Error('Failed to load ' + QUOTE_FILE_URL);
      }
      return response.text();
    })
    .then(function (text) {
      quoteLines = parseQuoteFile(text);
      window.dailyQuotes = quoteLines;
      displayDailyQuote();
      return quoteLines;
    })
    .catch(function (error) {
      quotesLoad = null;
      if (typeof console !== 'undefined' && console.warn) {
        console.warn('Daily quote file could not be loaded', error);
      }
      return quoteLines;
    });
  return quotesLoad;
}

window.daysSinceJanuary1_2026 = daysSinceJanuary1_2026;
window.quoteLineIndex = quoteLineIndex;
window.parseQuoteFile = parseQuoteFile;
window.quoteForDate = quoteForDate;
window.displayDailyQuote = displayDailyQuote;
window.initQuotes = initQuotes;
initQuotes();
