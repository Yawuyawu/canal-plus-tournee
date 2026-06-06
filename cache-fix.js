(function() {
  const f = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && url.includes('jsonbin.io')) {
      url = url + (url.includes('?') ? '&' : '?') + 'nocache=' + Date.now();
    }
    return f(url, opts);
  };
})();
