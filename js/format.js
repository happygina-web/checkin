// Display formatting and error copy shared by the parent pages (also loaded by node tests).
(function (root) {
  var NETWORK_MSG = '연결이 원활하지 않아요. 잠시 후 다시 시도해 주세요';

  var ERROR_MESSAGES = {
    NOT_FOUND: '행사 정보를 찾을 수 없어요. 학원에 문의해 주세요.',
    CLOSED: '체크인 기간이 아닙니다',
    BAD_NAME: '학생 이름을 입력해 주세요',
    BAD_PHONE: '휴대폰 번호를 다시 확인해 주세요',
    NO_CONSENT: '개인정보 수집·이용에 동의해 주세요',
    BAD_PIN: '비밀번호가 맞지 않아요',
    LOCKED: '비밀번호를 여러 번 틀렸어요. 10분 뒤에 다시 시도해 주세요',
    ALREADY_USED: '이미 사용한 쿠폰이에요',
    EXPIRED: '유효기간이 지난 쿠폰이에요',
    BUSY: '지금 참석 확인이 몰리고 있어요. 잠시 후 다시 눌러 주세요',
    BAD_REQUEST: NETWORK_MSG,
    SERVER: NETWORK_MSG,
    NETWORK: NETWORK_MSG,
  };

  var COUPON_NOT_FOUND = '쿠폰을 찾을 수 없어요.';

  // Keeps digits only (max 11) and inserts hyphens as the user types: 010-1234-5678.
  function formatPhoneInput(raw) {
    var d = String(raw == null ? '' : raw).replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  }

  function formatWon(n) {
    return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '원';
  }

  // 'yyyy-MM-dd' or 'yyyy-MM-dd HH:mm' -> 'yyyy.MM.dd'
  function formatDot(s) {
    return String(s || '').slice(0, 10).replace(/-/g, '.');
  }

  // page: 'coupon' switches NOT_FOUND to the coupon wording. Unknown codes read as a network problem.
  function errorMessage(code, page) {
    if (code === 'NOT_FOUND' && page === 'coupon') return COUPON_NOT_FOUND;
    return Object.prototype.hasOwnProperty.call(ERROR_MESSAGES, code) ? ERROR_MESSAGES[code] : NETWORK_MSG;
  }

  var Fmt = {
    formatPhoneInput: formatPhoneInput,
    formatWon: formatWon,
    formatDot: formatDot,
    errorMessage: errorMessage,
    ERROR_MESSAGES: ERROR_MESSAGES,
  };

  root.Fmt = Fmt;
  if (typeof module !== 'undefined' && module.exports) module.exports = Fmt;
})(typeof window !== 'undefined' ? window : this);
