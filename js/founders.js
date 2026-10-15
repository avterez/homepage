// Founders dates: month and day only, matched on the local calendar every year.
// A blank month is None and never matches, even when the day number is today's.

var FOUNDERS_KEYS = {
    fdateMonth: 'startpage_fdate_month',
    fdateDay: 'startpage_fdate_day',
    fmessage: 'startpage_fmessage',
    f2dateMonth: 'startpage_f2date_month',
    f2dateDay: 'startpage_f2date_day',
    f2message: 'startpage_f2message'
};

var FOUNDERS_DEFAULTS = {
    fdateMonth: '4',
    fdateDay: '15',
    fmessage: '',
    f2dateMonth: '',
    f2dateDay: '5',
    f2message: ''
};

function normalizeFoundersMonth(value, fallback) {
    var text = String(value == null ? '' : value).trim();
    if (text === '') return '';
    var month = parseInt(text, 10);
    if (month >= 1 && month <= 12 && String(month) === text) return text;
    return fallback;
}

function normalizeFoundersDay(value, fallback) {
    var text = String(value == null ? '' : value).trim();
    var day = parseInt(text, 10);
    if (day >= 1 && day <= 31 && String(day) === text) return text;
    return fallback;
}

function readFoundersField(name) {
    var fallback = FOUNDERS_DEFAULTS[name];
    var key = FOUNDERS_KEYS[name];
    try {
        var raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        if (name === 'fmessage' || name === 'f2message') return String(raw);
        if (name === 'fdateMonth' || name === 'f2dateMonth') return normalizeFoundersMonth(raw, fallback);
        return normalizeFoundersDay(raw, fallback);
    } catch (e) {
        return fallback;
    }
}

function readFoundersRecord() {
    return {
        fdateMonth: readFoundersField('fdateMonth'),
        fdateDay: readFoundersField('fdateDay'),
        fmessage: readFoundersField('fmessage'),
        f2dateMonth: readFoundersField('f2dateMonth'),
        f2dateDay: readFoundersField('f2dateDay'),
        f2message: readFoundersField('f2message')
    };
}

function writeFoundersRecord(record) {
    var next = record || {};
    var names = ['fdateMonth', 'fdateDay', 'fmessage', 'f2dateMonth', 'f2dateDay', 'f2message'];
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var value = next[name] != null ? next[name] : FOUNDERS_DEFAULTS[name];
        if (name === 'fdateMonth' || name === 'f2dateMonth') value = normalizeFoundersMonth(value, FOUNDERS_DEFAULTS[name]);
        else if (name === 'fdateDay' || name === 'f2dateDay') value = normalizeFoundersDay(value, FOUNDERS_DEFAULTS[name]);
        else value = String(value);
        try {
            localStorage.setItem(FOUNDERS_KEYS[name], value);
        } catch (e) { /* ignore quota */ }
    }
    return readFoundersRecord();
}

function foundersDateMatches(month, day, date) {
    var monthText = normalizeFoundersMonth(month, null);
    if (monthText == null || monthText === '') return false;
    var dayText = normalizeFoundersDay(day, null);
    if (dayText == null || dayText === '') return false;
    var when = (date && typeof date.getMonth === 'function') ? date : new Date();
    return (when.getMonth() + 1) === parseInt(monthText, 10) && when.getDate() === parseInt(dayText, 10);
}

function foundersRecordHits(record, date) {
    var fields = record || {};
    return foundersDateMatches(fields.fdateMonth, fields.fdateDay, date) ||
        foundersDateMatches(fields.f2dateMonth, fields.f2dateDay, date);
}

function foundersDayMessages(record, date) {
    var fields = record || {};
    var lines = [];
    if (foundersDateMatches(fields.fdateMonth, fields.fdateDay, date)) {
        var first = String(fields.fmessage == null ? '' : fields.fmessage).trim();
        if (first) lines.push(first);
    }
    if (foundersDateMatches(fields.f2dateMonth, fields.f2dateDay, date)) {
        var second = String(fields.f2message == null ? '' : fields.f2message).trim();
        if (second) lines.push(second);
    }
    return lines;
}

function foundersPlayingEffect(savedEffect, record, date, userPickedEffect) {
    if (!userPickedEffect && foundersRecordHits(record, date)) return 'fireworks';
    return savedEffect;
}
