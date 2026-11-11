// POSTs { action, ...payload } to the Apps Script web app. Always resolves to { ok, ... } (network failures → NETWORK).
(function (root) {
  function failure() { return { ok: false, error: 'NETWORK' }; }

  function callApi(action, payload) {
    var body = { action: action };
    var p = payload || {};
    for (var k in p) if (Object.prototype.hasOwnProperty.call(p, k)) body[k] = p[k];

    var url = root.APP_CONFIG && root.APP_CONFIG.API_URL;
    if (url === 'mock') {
      // A forgotten 'mock' setting must not silently "work" on the real site.
      if (!mockAllowed(root.location.hostname, root.location.search)) return Promise.resolve(failure());
      return root.MockApi.call(body);
    }

    // text/plain keeps this a "simple" request (no CORS preflight); fetch follows the Apps Script redirect.
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    }).then(function (res) {
      if (!res.ok) return failure();
      return res.json().then(function (data) {
        return data && typeof data === 'object' ? data : failure();
      });
    }).catch(failure);
  }

  // The mock API runs only locally (localhost/127.0.0.1) or when the query asks for it (?mock=...).
  function mockAllowed(hostname, search) {
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    return /(^\?|&)mock=/.test(String(search || ''));
  }

  function decode(s) {
    try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return null; }
  }

  // Reads one parameter from a query string such as '?e=abc' (URLSearchParams-free for older in-app browsers).
  // Malformed percent-encoding yields '' so the page falls through to its not-found notice.
  function parseQueryParam(search, name) {
    var pairs = String(search || '').replace(/^\?/, '').split('&');
    for (var i = 0; i < pairs.length; i++) {
      var eq = pairs[i].indexOf('=');
      var key = decode(eq < 0 ? pairs[i] : pairs[i].slice(0, eq));
      if (key !== name) continue;
      var value = eq < 0 ? '' : decode(pairs[i].slice(eq + 1));
      return value === null ? '' : value;
    }
    return '';
  }

  function queryParam(name) { return parseQueryParam(root.location.search, name); }

  root.callApi = callApi;
  root.queryParam = queryParam;
  if (typeof module !== 'undefined' && module.exports) module.exports = { parseQueryParam: parseQueryParam, mockAllowed: mockAllowed };
})(typeof window !== 'undefined' ? window : this);
