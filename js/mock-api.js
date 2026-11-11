// Local stand-in for the Apps Script API, used when APP_CONFIG.API_URL === 'mock'.
// Scenario via ?mock= : open (default) | closed | nocoupon | sendfail | used | expired | badpin.
(function () {
  var DELAY_MS = 600;
  var EVENT_NAME = '11월 학부모 간담회';
  var usedAt = '';

  function scenario() { return window.queryParam('mock') || 'open'; }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function nowStamp() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  function coupon() {
    var s = scenario();
    var state = usedAt || s === 'used' ? 'used' : s === 'expired' ? 'expired' : 'unused';
    return {
      code: '1120-K7Q3', studentName: '김민준', eventName: EVENT_NAME, amount: 10000,
      expiresOn: s === 'expired' ? '2026-08-19' : '2027-02-19',
      state: state, usedAt: usedAt || (s === 'used' ? '2026-11-20 14:05' : ''),
    };
  }

  function respond(b) {
    var s = scenario();
    switch (b.action) {
      case 'getEvent':
        return { ok: true, event: { id: b.eventId, name: EVENT_NAME, type: '간담회', date: '2026-11-20',
          couponOn: s !== 'nocoupon', amount: 10000, open: s !== 'closed' } };
      case 'checkin': {
        if (s === 'closed') return { ok: false, error: 'CLOSED' };
        var name = String(b.studentName || '').trim();
        if (!name) return { ok: false, error: 'BAD_NAME' };
        if (!/^010\d{8}$/.test(String(b.phone || '').replace(/\D/g, ''))) return { ok: false, error: 'BAD_PHONE' };
        if (b.consent !== true) return { ok: false, error: 'NO_CONSENT' };
        var c = s === 'nocoupon' ? null : { token: 'mocktoken', amount: 10000, sendStatus: s === 'sendfail' ? '실패' : '접수' };
        return { ok: true, studentName: name, alreadyCheckedIn: false, coupon: c };
      }
      case 'getCoupon':
        return { ok: true, coupon: coupon() };
      case 'redeem': {
        if (typeof b.pin !== 'string') return { ok: false, error: 'BAD_REQUEST' };
        if (s === 'badpin') return { ok: false, error: 'BAD_PIN' };
        var cur = coupon();
        if (cur.state === 'used') return { ok: false, error: 'ALREADY_USED' };
        if (cur.state === 'expired') return { ok: false, error: 'EXPIRED' };
        usedAt = nowStamp();
        return { ok: true, coupon: coupon() };
      }
    }
    return { ok: false, error: 'BAD_REQUEST' };
  }

  window.MockApi = {
    call: function (body) {
      return new Promise(function (resolve) {
        setTimeout(function () { resolve(respond(body)); }, DELAY_MS);
      });
    },
  };
})();
