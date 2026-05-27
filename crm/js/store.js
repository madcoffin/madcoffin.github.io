// store.js — localStorage abstraction + seed initialization
const Store = (() => {
  const PREFIX = 'crm_';

  function key(name) { return PREFIX + name; }

  function get(name) {
    try { const raw = localStorage.getItem(key(name)); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  }
  function set(name, value) {
    try { localStorage.setItem(key(name), JSON.stringify(value)); } catch {}
  }
  function remove(name) { localStorage.removeItem(key(name)); }
  function getList(name) { return get(name) || []; }
  function setList(name, arr) { set(name, arr); }

  function upsert(name, item, idField = 'id') {
    const list = getList(name);
    const idx  = list.findIndex(x => x[idField] === item[idField]);
    if (idx >= 0) list[idx] = { ...list[idx], ...item };
    else list.push(item);
    setList(name, list);
    return item;
  }

  function findById(name, id, idField = 'id') {
    return getList(name).find(x => x[idField] === id) || null;
  }

  function deleteById(name, id, idField = 'id') {
    setList(name, getList(name).filter(x => x[idField] !== id));
  }

  function seed() {
    // v2: 기본 데이터 (도서·사용자·신청·채택)
    if (!get('seeded_v2')) {
      setList('books',             window.SEED_BOOKS             || []);
      setList('users',             window.SEED_USERS             || []);
      setList('sample_requests',   window.SEED_SAMPLE_REQUESTS   || []);
      setList('material_requests', window.SEED_MATERIAL_REQUESTS || []);
      setList('adoptions',         window.SEED_ADOPTIONS         || []);
      setList('notifications',     window.SEED_NOTIFICATIONS     || []);
      set('seeded_v2', true);
      localStorage.removeItem(key('seeded'));
    }
    // v3: 임시ID 교강사·등급이력·접촉이력 추가
    if (!get('seeded_v3')) {
      const users = getList('users');
      const newTemps = (window.SEED_TEMP_PROFESSORS || [])
        .filter(tp => !users.find(u => u.id === tp.id));
      if (newTemps.length) setList('users', [...users, ...newTemps]);
      setList('grade_history',  window.SEED_GRADE_HISTORY  || []);
      setList('contact_notes',  window.SEED_CONTACT_NOTES  || []);
      set('seeded_v3', true);
    }
  }

  function reset() {
    Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .forEach(k => localStorage.removeItem(k));
  }

  return { get, set, remove, getList, setList, upsert, findById, deleteById, seed, reset };
})();
