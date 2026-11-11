// coupon.html?t=TOKEN — show the coupon; staff redeem it with a 4-digit PIN in a bottom sheet.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var token = window.queryParam('t');
  var views = ['view-loading', 'view-notice', 'view-coupon'];
  var busy = false;

  function show(id) {
    for (var i = 0; i < views.length; i++) $(views[i]).hidden = views[i] !== id;
  }

  function showNotice(code) {
    $('notice-msg').textContent = window.Fmt.errorMessage(code, 'coupon');
    show('view-notice');
  }

  function render(c) {
    var Fmt = window.Fmt;
    $('c-name').textContent = c.studentName;
    $('c-amount').textContent = Fmt.formatWon(c.amount);
    $('c-code').textContent = c.code;
    $('c-event').textContent = c.eventName;

    var usable = c.state === 'unused';
    $('c-exp-label').hidden = !usable;
    if (c.state === 'used') $('c-exp').textContent = '사용 완료 (' + Fmt.formatDot(c.usedAt) + ')';
    else if (c.state === 'expired') $('c-exp').textContent = '기간 만료';
    else $('c-exp').textContent = Fmt.formatDot(c.expiresOn) + '까지';
    $('ticket').className = usable ? 'ticket' : 'ticket inactive';
    $('use-area').hidden = !usable;
    show('view-coupon');
  }

  // ---------- bottom sheet ----------
  function setSheetError(code) {
    $('sheet-error').textContent = code ? window.Fmt.errorMessage(code, 'coupon') : '';
  }

  function openSheet() {
    $('pin').value = '';
    setSheetError('');
    $('sheet').hidden = false;
    $('pin').focus();
  }

  function closeSheet() {
    if (busy) return;
    $('sheet').hidden = true;
  }

  function setBusy(on) {
    busy = on;
    $('sheet-ok').disabled = on;
    $('sheet-ok').className = on ? 'btn loading' : 'btn';
    $('sheet-ok').setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function onRedeem(ev) {
    ev.preventDefault();
    if (busy) return;
    var pin = $('pin').value;
    if (!/^\d{4}$/.test(pin)) return setSheetError('BAD_PIN');
    setSheetError('');
    setBusy(true);
    window.callApi('redeem', { token: token, pin: String(pin) }).then(function (res) {
      setBusy(false);
      if (res.ok) {
        render(res.coupon); // render first: a malformed coupon throws into .catch with the sheet still open
        return closeSheet();
      }
      setSheetError(res.error);
      $('pin').value = '';
      // The coupon changed state elsewhere: show the card's new state (사용 완료 / 기간 만료) instead of the sheet.
      if (res.error === 'ALREADY_USED' || res.error === 'EXPIRED') refresh().then(closeSheet, closeSheet);
      else $('pin').focus();
    }).catch(function () {
      setBusy(false);
      setSheetError('NETWORK');
    });
  }

  function refresh() {
    return window.callApi('getCoupon', { token: token }).then(function (res) {
      if (res.ok) render(res.coupon);
    });
  }

  function bind() {
    $('use').addEventListener('click', openSheet);
    $('sheet-cancel').addEventListener('click', closeSheet);
    $('sheet').addEventListener('click', function (ev) { if (ev.target === $('sheet')) closeSheet(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !$('sheet').hidden) closeSheet(); });
    $('pin').addEventListener('input', function () {
      var el = $('pin');
      var digits = el.value.replace(/\D/g, '').slice(0, 4);
      if (digits !== el.value) el.value = digits;
    });
    $('sheet-form').addEventListener('submit', onRedeem);
  }

  function start() {
    bind();
    if (!token) return showNotice('NOT_FOUND');
    window.callApi('getCoupon', { token: token }).then(function (res) {
      if (!res.ok) return showNotice(res.error);
      render(res.coupon);
    }).catch(function () { showNotice('NETWORK'); });
  }

  start();
})();
