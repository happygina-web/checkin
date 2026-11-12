// index.html?e=EVENT_ID — load event, show form (or closed notice), submit check-in, show done view.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var eventId = window.queryParam('e');
  var views = ['view-loading', 'view-notice', 'view-form', 'view-done'];

  function show(id) {
    for (var i = 0; i < views.length; i++) $(views[i]).hidden = views[i] !== id;
  }

  // retry: show the [다시 시도] button (only for a failed initial load).
  function showNotice(message, eventName, retry) {
    $('retry').hidden = !retry;
    $('notice-event').hidden = !eventName;
    $('notice-event').textContent = eventName || '';
    $('notice-msg').textContent = message;
    show('view-notice');
  }

  function setLoading(on) {
    var btn = $('submit');
    btn.disabled = on;
    btn.className = on ? 'btn loading' : 'btn';
    btn.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  function setError(code) {
    $('form-error').textContent = code ? window.Fmt.errorMessage(code) : '';
  }

  function clearError() { setError(''); }

  // Same rules as the server, so obvious mistakes are caught without a round trip.
  function validate(name, phoneDigits, consent) {
    if (!name) return 'BAD_NAME';
    if (!/^010\d{8}$/.test(phoneDigits)) return 'BAD_PHONE';
    if (!consent) return 'NO_CONSENT';
    return '';
  }

  function showDone(res) {
    $('done-name').textContent = res.studentName;
    var c = res.coupon;
    $('done-coupon').hidden = !c;
    $('done-link').hidden = !c;
    if (c) {
      var unsent = c.sendStatus === '실패';
      var amounts = document.querySelectorAll('.done-amount');
      for (var i = 0; i < amounts.length; i++) amounts[i].textContent = window.Fmt.formatWon(c.amount);
      $('done-sent').hidden = unsent;
      $('done-unsent').hidden = !unsent;
      $('done-unsent-hint').hidden = !unsent;
      $('done-link').href = 'coupon.html?t=' + encodeURIComponent(c.token);
    }
    show('view-done');
    window.scrollTo(0, 0);
  }

  function onSubmit(ev) {
    ev.preventDefault();
    if ($('submit').disabled) return;
    var name = $('name').value.trim();
    var phone = $('phone').value.replace(/\D/g, '');
    var consent = $('consent').checked;
    var invalid = validate(name, phone, consent);
    setError(invalid);
    if (invalid) return;

    setLoading(true);
    window.callApi('checkin', { eventId: eventId, studentName: name, phone: phone, consent: true })
      .then(function (res) {
        if (res.ok) return showDone(res);
        setLoading(false);
        if (res.error === 'CLOSED' || res.error === 'NOT_FOUND') return showNotice(window.Fmt.errorMessage(res.error), $('form-event').textContent);
        setError(res.error);
      })
      .catch(function () {
        setLoading(false);
        setError('NETWORK');
      });
  }

  function bindForm() {
    // Any edit to a field clears the message about it (or any other) so stale errors never linger.
    $('name').addEventListener('input', clearError);
    $('consent').addEventListener('change', clearError);
    $('phone').addEventListener('input', function () {
      clearError();
      var el = $('phone');
      var formatted = window.Fmt.formatPhoneInput(el.value);
      if (formatted !== el.value) el.value = formatted;
    });
    $('more').addEventListener('click', function () {
      var open = $('legal').hidden;
      $('legal').hidden = !open;
      $('more').setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $('view-form').addEventListener('submit', onSubmit);
    $('retry').addEventListener('click', function () { window.location.reload(); });
  }

  function start() {
    bindForm();
    if (!eventId) return showNotice(window.Fmt.errorMessage('NOT_FOUND'));
    window.callApi('getEvent', { eventId: eventId }).then(function (res) {
      if (!res.ok) return showNotice(window.Fmt.errorMessage(res.error), '', res.error === 'NETWORK' || res.error === 'SERVER');
      var e = res.event;
      if (!e.open) return showNotice(window.Fmt.errorMessage('CLOSED'), e.name);
      $('form-event').textContent = e.name;
      // Coupon events: checking in is an explicit request for the benefit (Kakao only allows
      // coupon 알림톡 for benefits the user acted to receive, not unilateral marketing gifts).
      if (e.couponOn) {
        $('benefit-amount').textContent = window.Fmt.formatWon(e.amount);
        $('benefit').hidden = false;
        $('submit').textContent = '참석 완료 · 혜택 신청';
      }
      document.title = e.name + ' 참석 확인';
      show('view-form');
    }).catch(function () { showNotice(window.Fmt.errorMessage('NETWORK'), '', true); });
  }

  start();
})();
