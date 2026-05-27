// auth.js — login/logout (no password, prototype)
const Auth = (() => {
  const SESSION_KEY = 'crm_session';

  function login(loginId) {
    const users = Store.getList('users');
    const user = users.find(u => u.loginId === loginId);
    if (!user) return null;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function current() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function require() {
    const user = current();
    if (!user) { location.hash = '#/login'; return null; }
    return user;
  }

  function requireRole(...roles) {
    const user = require();
    if (!user) return null;
    if (!roles.includes(user.role)) { location.hash = '#/login'; return null; }
    return user;
  }

  return { login, logout, current, require, requireRole };
})();
