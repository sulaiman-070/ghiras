/**
 * GHIRAS — Authentication & Multi-User Session Manager
 * Full support for both Server API (Node.js) & Local Mode (GitHub Pages / Static / Offline)
 */

const TOKEN_KEY = 'ghiras_auth_token';
const USER_KEY  = 'ghiras_auth_user';
const LOCAL_USERS_DB_KEY = 'ghiras_local_users_db';

function getLocalUsers() {
  try {
    const raw = localStorage.getItem(LOCAL_USERS_DB_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalUsers(users) {
  try {
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(users));
  } catch (e) {}
}

function generateLocalTag(name) {
  const clean = name.trim().replace(/\s+/g, '').substring(0, 6) || 'مؤمن';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `${clean}#${num}`;
}

export function getApiBaseUrl() {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocalhost) return '';
  return window.GHIRAS_API_URL || localStorage.getItem('ghiras_custom_api_url') || 'https://ghiras-backend-wq79.onrender.com';
}

async function safeApiFetch(endpoint, options = {}) {
  try {
    const base = getApiBaseUrl();
    const fullUrl = endpoint.startsWith('http') ? endpoint : (base + endpoint);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(fullUrl, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timer);

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return { serverAvailable: false, status: res.status };
    }
    const data = await res.json();
    return { serverAvailable: true, ok: res.ok, status: res.status, data };
  } catch (err) {
    return { serverAvailable: false, error: err.message };
  }
}

export const Auth = {
  getApiBaseUrl,
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  },

  getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!(user && user.id);
  },

  isGuest() {
    const user = this.getCurrentUser();
    return !!(user && user.isGuest);
  },

  setSession(user, token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async register(name, email, password) {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanName) throw new Error('يرجى كتابة الاسم');
    if (!cleanEmail) throw new Error('يرجى كتابة البريد الإلكتروني');
    if (!password || password.length < 6) throw new Error('كلمة المرور يجب أن تكون ٦ خانات على الأقل');

    // 1. Try server API if available
    const serverResult = await safeApiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: cleanName, email: cleanEmail, password })
    });

    if (serverResult.serverAvailable) {
      if (!serverResult.ok) {
        throw new Error(serverResult.data?.error || 'فشل إنشاء الحساب');
      }
      this.setSession(serverResult.data.user, serverResult.data.token);
      return serverResult.data;
    }

    // 2. Seamless Local Mode (GitHub Pages / Static Host / Offline)
    const localUsers = getLocalUsers();
    const existing = localUsers.find(u => u.email === cleanEmail);
    if (existing) {
      throw new Error('البريد الإلكتروني مسجل مسبقاً، يرجى تسجيل الدخول');
    }

    const newUser = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name: cleanName,
      email: cleanEmail,
      avatar: cleanName.charAt(0) || 'غ',
      userTag: generateLocalTag(cleanName),
      isGuest: false,
      isLocal: true,
      createdAt: new Date().toISOString()
    };

    localUsers.push({ ...newUser, passwordHash: password });
    saveLocalUsers(localUsers);

    const token = 'ghiras_local_' + newUser.id;
    this.setSession(newUser, token);
    return { user: newUser, token, state: null };
  },

  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) throw new Error('يرجى كتابة البريد الإلكتروني');
    if (!password) throw new Error('يرجى كتابة كلمة المرور');

    // 1. Try server API if available
    const serverResult = await safeApiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password })
    });

    if (serverResult.serverAvailable) {
      if (!serverResult.ok) {
        throw new Error(serverResult.data?.error || 'بيانات الدخول غير صحيحة');
      }
      this.setSession(serverResult.data.user, serverResult.data.token);
      return serverResult.data;
    }

    // 2. Seamless Local Mode (GitHub Pages / Static Host / Offline)
    const localUsers = getLocalUsers();
    let userRecord = localUsers.find(u => u.email === cleanEmail);

    if (!userRecord) {
      // Create account automatically on first login in static mode
      const fallbackName = cleanEmail.split('@')[0] || 'قارئ القرآن';
      userRecord = {
        id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
        name: fallbackName,
        email: cleanEmail,
        avatar: fallbackName.charAt(0) || 'غ',
        userTag: generateLocalTag(fallbackName),
        isGuest: false,
        isLocal: true,
        createdAt: new Date().toISOString(),
        passwordHash: password
      };
      localUsers.push(userRecord);
      saveLocalUsers(localUsers);
    } else {
      if (userRecord.passwordHash && userRecord.passwordHash !== password) {
        throw new Error('كلمة المرور غير صحيحة');
      }
    }

    const { passwordHash, ...safeUser } = userRecord;
    const token = 'ghiras_local_' + safeUser.id;
    this.setSession(safeUser, token);
    return { user: safeUser, token, state: null };
  },

  async checkSession() {
    const token = this.getToken();
    const localUser = this.getCurrentUser();

    if (localUser && localUser.isGuest) {
      return { user: localUser, state: null };
    }

    if (!token) return null;

    if (token.startsWith('ghiras_local_')) {
      return localUser ? { user: localUser, state: null } : null;
    }

    const serverResult = await safeApiFetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (serverResult.serverAvailable && serverResult.ok) {
      this.setSession(serverResult.data.user, token);
      return serverResult.data;
    }

    // Fallback: keep local session
    return localUser ? { user: localUser, state: null } : null;
  },

  async logout() {
    const token = this.getToken();
    if (token && !token.startsWith('ghiras_local_')) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }
    this.clearSession();
  },

  loginAsGuest(guestName = 'زائر كريم') {
    const clean = guestName.trim() || 'زائر كريم';
    const guestUser = {
      id: 'guest',
      name: clean,
      email: 'guest@ghiras.local',
      avatar: clean.charAt(0) || 'ز',
      isGuest: true,
      createdAt: new Date().toISOString()
    };
    this.setSession(guestUser, null);
    return guestUser;
  },

  async syncState(stateData) {
    const token = this.getToken();
    if (!token || this.isGuest() || token.startsWith('ghiras_local_')) return;

    try {
      await fetch('/api/user/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stateData)
      });
    } catch (e) {
      // Offline: state is still preserved in user-scoped localStorage
    }
  }
};
