/**
 * GHIRAS — Server with Multi-User Authentication & Data Sync
 * Run: node server.js
 * Open: http://localhost:5500
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import url, { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 5500;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'server_data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');
const GROUPS_FILE = path.join(DATA_DIR, 'groups.json');
const NUDGES_FILE = path.join(DATA_DIR, 'nudges.json');
const STATES_DIR = path.join(DATA_DIR, 'states');

// Ensure database directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(STATES_DIR)) fs.mkdirSync(STATES_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]), 'utf8');
if (!fs.existsSync(SESSIONS_FILE)) fs.writeFileSync(SESSIONS_FILE, JSON.stringify({}), 'utf8');
if (!fs.existsSync(GROUPS_FILE)) fs.writeFileSync(GROUPS_FILE, JSON.stringify([]), 'utf8');
if (!fs.existsSync(NUDGES_FILE)) fs.writeFileSync(NUDGES_FILE, JSON.stringify([]), 'utf8');

// ── Arabic Surah & Juz Helpers for Progress Tracking ────────
const SURAH_NAMES_AR = [
  "", "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة",
  "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم",
  "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت",
  "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر",
  "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات",
  "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر",
  "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة",
  "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات",
  "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر",
  "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة",
  "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون",
  "النصر", "المسد", "الإخلاص", "الفلق", "الناس"
];

const JUZ_PAGE_STARTS = [
  1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
  202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
  402, 422, 442, 462, 482, 502, 522, 542, 562, 582
];

function getJuzNumber(pageNumber) {
  const pageNum = Math.max(1, Math.min(604, parseInt(pageNumber, 10) || 1));
  let juz = 1;
  for (let i = 0; i < JUZ_PAGE_STARTS.length; i++) {
    if (JUZ_PAGE_STARTS[i] <= pageNum) {
      juz = i + 1;
    } else {
      break;
    }
  }
  return Math.min(30, juz);
}

function getJuzName(pageNumber) {
  const juz = getJuzNumber(pageNumber);
  const names = [
    '', 'الجزء الأول', 'الجزء الثاني', 'الجزء الثالث', 'الجزء الرابع', 'الجزء الخامس',
    'الجزء السادس', 'الجزء السابع', 'الجزء الثامن', 'الجزء التاسع', 'الجزء العاشر',
    'الجزء الحادي عشر', 'الجزء الثاني عشر', 'الجزء الثالث عشر', 'الجزء الرابع عشر', 'الجزء الخامس عشر',
    'الجزء السادس عشر', 'الجزء السابع عشر', 'الجزء الثامن عشر', 'الجزء التاسع عشر', 'الجزء العشرون',
    'الجزء الحادي والعشرون', 'الجزء الثاني والعشرون', 'الجزء الثالث والعشرون', 'الجزء الرابع والعشرون', 'الجزء الخامس والعشرون',
    'الجزء السادس والعشرون', 'الجزء السابع والعشرون', 'الجزء الثامن والعشرون', 'الجزء التاسع والعشرون', 'الجزء الثلاثون'
  ];
  return names[juz] || `الجزء ${juz}`;
}

function generateUniqueUserTag(users) {
  let tag;
  let attempts = 0;
  do {
    const num = Math.floor(1000 + Math.random() * 9000);
    tag = `GHR-${num}`;
    attempts++;
  } while (users.some(u => u.userTag === tag) && attempts < 100);
  return tag;
}

function generateUniqueGroupCode(groups) {
  let code;
  let attempts = 0;
  do {
    const num = Math.floor(1000 + Math.random() * 9000);
    code = `GRP-${num}`;
    attempts++;
  } while (groups.some(g => (g.code || '').toUpperCase() === code) && attempts < 100);
  return code;
}

// ── Database Helpers ──────────────────────────────────────────
function loadUsers() {
  try {
    const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    let modified = false;
    for (const u of users) {
      if (!u.userTag) {
        u.userTag = generateUniqueUserTag(users);
        modified = true;
      }
    }
    if (modified) {
      saveUsers(users);
    }
    return users;
  } catch (e) {
    return [];
  }
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
}

function loadGroups() {
  try {
    return JSON.parse(fs.readFileSync(GROUPS_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveGroups(groups) {
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(groups, null, 2), 'utf8');
}

function loadNudges() {
  try {
    return JSON.parse(fs.readFileSync(NUDGES_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveNudges(nudges) {
  fs.writeFileSync(NUDGES_FILE, JSON.stringify(nudges, null, 2), 'utf8');
}

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days session expiry

function loadSessions() {
  try {
    const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    // Clean expired sessions on load
    const now = Date.now();
    let dirty = false;
    for (const [token, s] of Object.entries(data)) {
      if (s && s.createdAt && (now - new Date(s.createdAt).getTime() > SESSION_TTL_MS)) {
        delete data[token];
        dirty = true;
      }
    }
    if (dirty) {
      saveSessions(data);
    }
    return data;
  } catch (e) {
    return {};
  }
}

function saveSessions(sessions) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
}

function getUserStatePath(userId) {
  const safeId = userId.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(STATES_DIR, `${safeId}.json`);
}

function loadUserState(userId) {
  const p = getUserStatePath(userId);
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {}
  }
  return null;
}

function saveUserState(userId, stateData) {
  const p = getUserStatePath(userId);
  fs.writeFileSync(p, JSON.stringify(stateData, null, 2), 'utf8');
}

function getUserPublicStats(user, state) {
  if (!state) state = loadUserState(user.id) || {};
  const qp = state.quranProgress || {};
  const garden = state.garden || {};
  const usr = state.user || {};
  const currentPage = qp.currentPage || 1;
  const currentSurahId = qp.currentSurahId || 1;
  const surahName = SURAH_NAMES_AR[currentSurahId] || 'الفاتحة';
  const juzName = getJuzName(currentPage);

  return {
    id: user.id,
    userTag: user.userTag || `GHR-${user.id.slice(-4).toUpperCase()}`,
    name: user.name || usr.name || 'غارس الخير',
    avatar: user.avatar || usr.avatar || 'غ',
    xp: usr.xp || garden.totalXP || 0,
    streak: garden.streakDays || 0,
    currentPage: currentPage,
    currentSurahId: currentSurahId,
    currentSurahName: surahName,
    currentJuzName: juzName,
    currentAyah: qp.currentAyah || 1,
    todayPages: qp.todayPages || 0,
    todayDone: (qp.todayPages || 0) > 0 || qp.todayStatus === 'completed',
    plantStage: garden.stage || 'seed',
    level: usr.level || 1
  };
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) { // 10MB limit
        reject(new Error('حجم البيانات كبير جداً'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('تنسيق JSON غير صالح'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-id',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(data));
}

function getBearerToken(req) {
  const auth = req.headers['authorization'] || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return null;
}

function getSessionUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const sessions = loadSessions();
  const session = sessions[token];
  if (!session) return null;

  // Enforce session expiration
  if (session.createdAt && (Date.now() - new Date(session.createdAt).getTime() > SESSION_TTL_MS)) {
    delete sessions[token];
    saveSessions(sessions);
    return null;
  }
  
  const users = loadUsers();
  const user = users.find(u => u.id === session.userId);
  if (!user) return null;
  return { user, token };
}

// ── Default State Template for New Users ──────────────────────
function createInitialUserState(name) {
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const cleanName = (name || '').trim() || 'غارس الخير';
  const avatar = cleanName.charAt(0) || 'غ';

  return {
    version: 1,
    isOnboarded: true,
    user: {
      name: cleanName,
      level: 1,
      xp: 0,
      xpToNextLevel: 200,
      joinDate: today.toISOString(),
      avatar: avatar,
    },
    garden: {
      stage: 'seed',
      streakDays: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      totalXP: 0,
      badges: [],
    },
    quranProgress: {
      currentSurahId: 1,
      currentAyah: 1,
      currentPage: 1,
      lastReadSurahId: 1,
      lastReadAyah: 1,
      lastReadPage: 1,
      todayAyahsRead: 0,
      todayPages: 0,
      totalAyahsRead: 0,
      todayStatus: 'pending',
      todayKey: todayKey,
    },
    khatmaPlan: {
      enabled: false,
      durationMonths: 1,
      targetDays: 30,
      dailyPages: 20,
      startDate: today.toISOString(),
      prayersDone: {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false
      },
      todayKey: todayKey,
    },
    suhba: {
      companions: [],
      groups: [],
    },
    habits: [
      {
        id: 'quran-reading',
        name: 'قراءة القرآن',
        category: 'quran',
        icon: 'menu_book',
        iconBg: '#EAF0EA',
        iconColor: '#4A6B53',
        description: 'اقرأ من كتاب الله كل يوم',
        minGoal: { value: 1, unit: 'page', label: 'صفحة واحدة', arabicNum: '١' },
        extraGoal: { value: 5, unit: 'pages', label: '٥ صفحات', arabicNum: '٥' },
        frequency: 'daily',
        active: true,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        todayStatus: 'pending',
        history: {},
        minGoalDone: false,
        extraGoalDone: false
      },
      {
        id: 'morning-athkar',
        name: 'أذكار الصباح',
        category: 'athkar',
        icon: 'wb_sunny',
        iconBg: '#F2E4CB',
        iconColor: '#B88E4F',
        description: 'أذكار الصباح المأثورة',
        minGoal: { value: 1, unit: 'set', label: 'مجموعة واحدة', arabicNum: '١' },
        extraGoal: { value: 3, unit: 'sets', label: 'المجموعة الكاملة', arabicNum: '٣' },
        frequency: 'daily',
        active: true,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        todayStatus: 'pending',
        history: {},
        minGoalDone: false,
        extraGoalDone: false
      },
      {
        id: 'ayah-reflection',
        name: 'تدبر آية',
        category: 'quran',
        icon: 'auto_stories',
        iconBg: '#F2E4CB',
        iconColor: '#B88E4F',
        description: 'تأمل معنى آية كريمة وقراءة تفسيرها الميسر',
        minGoal: { value: 1, unit: 'ayah', label: 'آية واحدة', arabicNum: '١' },
        extraGoal: { value: 3, unit: 'ayahs', label: '٣ آيات بخواطرها', arabicNum: '٣' },
        frequency: 'daily',
        active: true,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        todayStatus: 'pending',
        history: {},
        minGoalDone: false,
        extraGoalDone: false
      },
      {
        id: 'evening-athkar',
        name: 'أذكار المساء',
        category: 'athkar',
        icon: 'nights_stay',
        iconBg: '#F6EFE9',
        iconColor: '#6E6053',
        description: 'أذكار المساء المأثورة',
        minGoal: { value: 1, unit: 'set', label: 'مجموعة واحدة', arabicNum: '١' },
        extraGoal: { value: 3, unit: 'sets', label: 'المجموعة الكاملة', arabicNum: '٣' },
        frequency: 'daily',
        active: false,
        currentStreak: 0,
        longestStreak: 0,
        totalCompletions: 0,
        todayStatus: 'pending',
        history: {},
        minGoalDone: false,
        extraGoalDone: false
      }
    ],
    settings: {
      notifications: true,
      reminderTime: '06:00',
      darkMode: false,
      language: 'ar',
      notificationStyle: 'gentle',
      quranFontSize: 'large',
      showStreak: true,
      reciterId: 'alafasy',
    },
    reminders: [
      {
        id: 'rem_mulk',
        title: 'سورة الملك قبل النوم',
        type: 'surah',
        surahNumber: 67,
        surahName: 'الملك',
        page: 562,
        time: '21:30',
        enabled: true,
        days: [0, 1, 2, 3, 4, 5, 6],
        repeatType: 'daily',
        lastTriggeredDate: ''
      },
      {
        id: 'rem_kahf',
        title: 'سورة الكهف المباركة',
        type: 'surah',
        surahNumber: 18,
        surahName: 'الكهف',
        page: 293,
        time: '09:00',
        enabled: true,
        days: [5],
        repeatType: 'friday',
        lastTriggeredDate: ''
      },
      {
        id: 'rem_wird',
        title: 'الورد القرآني اليومي',
        type: 'wird',
        surahNumber: 0,
        surahName: 'الورد القرآني',
        page: 1,
        time: '06:00',
        enabled: true,
        days: [0, 1, 2, 3, 4, 5, 6],
        repeatType: 'daily',
        lastTriggeredDate: ''
      }
    ],
    ui: {
      activeTab: 'home',
      lastActiveDate: todayKey,
    },
    _todayKey: todayKey,
  };
}

// ── API Router ───────────────────────────────────────────────
async function handleApiRequest(req, res, parsedUrl) {
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // 0. Healthcheck for Cloud Monitoring & Uptime
  if (pathname === '/api/health' || pathname === '/api/ping') {
    return sendJson(res, 200, {
      status: 'ok',
      service: 'ghiras-api',
      time: new Date().toISOString()
    });
  }

  // 1. POST /api/auth/register
  if (pathname === '/api/auth/register' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';
      const name = (body.name || '').trim();

      if (!email || !email.includes('@')) {
        return sendJson(res, 400, { error: 'يرجى إدخال بريد إلكتروني صحيح' });
      }
      if (!password || password.length < 6) {
        return sendJson(res, 400, { error: 'كلمة المرور يجب أن تكون ٦ خانات على الأقل' });
      }
      if (!name) {
        return sendJson(res, 400, { error: 'يرجى كتابة اسمك الكريم' });
      }

      const users = loadUsers();
      if (users.some(u => u.email.toLowerCase() === email)) {
        return sendJson(res, 400, { error: 'هذا البريد الإلكتروني مسجل مسبقاً، يمكنك تسجيل الدخول به' });
      }

      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(password, salt);
      const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
      const userTag = generateUniqueUserTag(users);
      const avatar = name.charAt(0) || 'غ';

      const newUser = {
        id: userId,
        userTag: userTag,
        email: email,
        name: name,
        avatar: avatar,
        salt: salt,
        passwordHash: passwordHash,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      saveUsers(users);

      // Create new clean state for this specific user
      const initialState = createInitialUserState(name);
      initialState.user.userTag = userTag;
      saveUserState(userId, initialState);

      // Create session
      const token = 'tok_' + crypto.randomBytes(32).toString('hex');
      const sessions = loadSessions();
      sessions[token] = { userId: userId, createdAt: new Date().toISOString() };
      saveSessions(sessions);

      return sendJson(res, 201, {
        success: true,
        token: token,
        user: {
          id: newUser.id,
          userTag: newUser.userTag,
          email: newUser.email,
          name: newUser.name,
          avatar: newUser.avatar,
          createdAt: newUser.createdAt
        },
        state: initialState
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'حدث خطأ أثناء إنشاء الحساب' });
    }
  }

  // 2. POST /api/auth/login
  if (pathname === '/api/auth/login' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const email = (body.email || '').trim().toLowerCase();
      const password = body.password || '';

      if (!email || !password) {
        return sendJson(res, 400, { error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
      }

      const users = loadUsers();
      const user = users.find(u => u.email.toLowerCase() === email);
      if (!user) {
        return sendJson(res, 401, { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      const calculatedHash = hashPassword(password, user.salt);
      if (calculatedHash !== user.passwordHash) {
        return sendJson(res, 401, { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
      }

      // Create new session token
      const token = 'tok_' + crypto.randomBytes(32).toString('hex');
      const sessions = loadSessions();
      sessions[token] = { userId: user.id, createdAt: new Date().toISOString() };
      saveSessions(sessions);

      // Load user's personal state
      let userState = loadUserState(user.id);
      if (!userState) {
        userState = createInitialUserState(user.name);
        saveUserState(user.id, userState);
      }

      return sendJson(res, 200, {
        success: true,
        token: token,
        user: {
          id: user.id,
          userTag: user.userTag || `GHR-${user.id.slice(-4).toUpperCase()}`,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt
        },
        state: userState
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'حدث خطأ أثناء تسجيل الدخول' });
    }
  }

  // 3. GET /api/auth/me
  if (pathname === '/api/auth/me' && method === 'GET') {
    const sessionInfo = getSessionUser(req);
    if (!sessionInfo) {
      return sendJson(res, 401, { error: 'غير مصرح' });
    }

    const { user } = sessionInfo;
    let userState = loadUserState(user.id);
    if (!userState) {
      userState = createInitialUserState(user.name);
      saveUserState(user.id, userState);
    }

    return sendJson(res, 200, {
      success: true,
      user: {
        id: user.id,
        userTag: user.userTag || `GHR-${user.id.slice(-4).toUpperCase()}`,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      state: userState
    });
  }

  // 4. POST /api/auth/logout
  if (pathname === '/api/auth/logout' && method === 'POST') {
    const token = getBearerToken(req);
    if (token) {
      const sessions = loadSessions();
      delete sessions[token];
      saveSessions(sessions);
    }
    return sendJson(res, 200, { success: true });
  }

  // 5. POST /api/user/sync
  if (pathname === '/api/user/sync' && method === 'POST') {
    const sessionInfo = getSessionUser(req);
    if (!sessionInfo) {
      return sendJson(res, 401, { error: 'غير مصرح' });
    }

    try {
      const body = await readJsonBody(req);
      if (!body || typeof body !== 'object') {
        return sendJson(res, 400, { error: 'بيانات غير صالحة' });
      }

      saveUserState(sessionInfo.user.id, body);
      return sendJson(res, 200, {
        success: true,
        syncedAt: new Date().toISOString()
      });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'فشل حفظ بيانات التقدم' });
    }
  }

  // 6. GET /api/user/state
  if (pathname === '/api/user/state' && method === 'GET') {
    const sessionInfo = getSessionUser(req);
    if (!sessionInfo) {
      return sendJson(res, 401, { error: 'غير مصرح' });
    }

    const userState = loadUserState(sessionInfo.user.id) || createInitialUserState(sessionInfo.user.name);
    return sendJson(res, 200, {
      success: true,
      state: userState
    });
  }

  // 7. GET /api/users/list
  if (pathname === '/api/users/list' && method === 'GET') {
    const users = loadUsers();
    const sessionInfo = getSessionUser(req);
    const currentId = sessionInfo ? sessionInfo.user.id : null;

    const list = users
      .filter(u => u.id !== currentId)
      .map(u => ({
        id: u.id,
        userTag: u.userTag,
        name: u.name,
        email: u.email,
        avatar: u.avatar
      }));
    return sendJson(res, 200, { success: true, users: list });
  }

  // 8. GET /api/users/lookup?query=...
  if (pathname === '/api/users/lookup' && method === 'GET') {
    const q = (parsedUrl.query.query || '').trim().toLowerCase();
    if (!q) {
      return sendJson(res, 400, { error: 'يرجى إدخال معرّف المستخدم أو بريده' });
    }

    const users = loadUsers();
    const cleanQ = q.startsWith('ghr-') ? q : `ghr-${q}`;

    const found = users.find(u => {
      const tag = (u.userTag || '').toLowerCase();
      return tag === q || tag === cleanQ || (u.email && u.email.toLowerCase() === q) || u.id.toLowerCase() === q;
    });

    if (!found) {
      return sendJson(res, 404, { error: 'لم يتم العثور على مستخدم بهذا المعرّف (ID)' });
    }

    const stats = getUserPublicStats(found);
    return sendJson(res, 200, { success: true, user: stats });
  }

  // 9. POST /api/users/stats-batch
  if (pathname === '/api/users/stats-batch' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const userIds = Array.isArray(body.userIds) ? body.userIds : [];
      const users = loadUsers();
      const results = [];

      for (const idOrTag of userIds) {
        const clean = (idOrTag || '').toString().trim().toLowerCase();
        const u = users.find(x => 
          (x.id && x.id.toLowerCase() === clean) || 
          (x.userTag && x.userTag.toLowerCase() === clean) ||
          (x.email && x.email.toLowerCase() === clean)
        );
        if (u) {
          results.push(getUserPublicStats(u));
        }
      }

      return sendJson(res, 200, { success: true, stats: results });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'فشل جلب الإحصائيات' });
    }
  }

  // 10. POST /api/groups/create
  if (pathname === '/api/groups/create' && method === 'POST') {
    const sessionInfo = getSessionUser(req);
    const userId = sessionInfo ? sessionInfo.user.id : (req.headers['x-guest-id'] || 'guest_user');
    const userName = sessionInfo ? sessionInfo.user.name : 'أنت';

    try {
      const body = await readJsonBody(req);
      const name = (body.name || '').trim();
      const category = (body.category || 'أصدقاء').trim();
      const description = (body.description || '').trim();

      if (!name) {
        return sendJson(res, 400, { error: 'يرجى كتابة اسم المجموعة' });
      }

      const groups = loadGroups();
      const code = generateUniqueGroupCode(groups);
      const groupId = 'grp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

      const newGroup = {
        id: groupId,
        code: code,
        name: name,
        category: category,
        description: description,
        createdBy: userId,
        createdByName: userName,
        createdAt: new Date().toISOString(),
        memberIds: [userId]
      };

      groups.push(newGroup);
      saveGroups(groups);

      return sendJson(res, 201, { success: true, group: newGroup });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'فشل إنشاء المجموعة' });
    }
  }

  // 11. POST /api/groups/join
  if (pathname === '/api/groups/join' && method === 'POST') {
    const sessionInfo = getSessionUser(req);
    const userId = sessionInfo ? sessionInfo.user.id : (req.headers['x-guest-id'] || 'guest_user');

    try {
      const body = await readJsonBody(req);
      const code = (body.code || '').trim().toUpperCase();

      if (!code) {
        return sendJson(res, 400, { error: 'يرجى إدخال رمز المجموعة' });
      }

      const groups = loadGroups();
      const group = groups.find(g => (g.code || '').toUpperCase() === code);

      if (!group) {
        return sendJson(res, 404, { error: 'رمز المجموعة غير صحيح أو المجموعة غير موجودة' });
      }

      if (!Array.isArray(group.memberIds)) {
        group.memberIds = [];
      }

      if (!group.memberIds.includes(userId)) {
        group.memberIds.push(userId);
        saveGroups(groups);
      }

      return sendJson(res, 200, { success: true, group });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'فشل الانضمام للمجموعة' });
    }
  }

  // 12. GET /api/groups/my
  if (pathname === '/api/groups/my' && method === 'GET') {
    const sessionInfo = getSessionUser(req);
    const userId = sessionInfo ? sessionInfo.user.id : (req.headers['x-guest-id'] || 'guest_user');

    const groups = loadGroups();
    const myGroups = groups.filter(g => Array.isArray(g.memberIds) && g.memberIds.includes(userId));
    const allUsers = loadUsers();

    const formattedGroups = myGroups.map(g => {
      const membersStats = [];
      let totalPages = 0;

      for (const mId of g.memberIds) {
        const u = allUsers.find(x => x.id === mId);
        if (u) {
          const stats = getUserPublicStats(u);
          totalPages += (stats.currentPage || 1);
          membersStats.push({ ...stats, isMe: mId === userId });
        } else if (mId === userId) {
          // Fallback if session state is memory-based
          const userState = loadUserState(userId);
          const qp = userState?.quranProgress || {};
          const usr = userState?.user || {};
          const garden = userState?.garden || {};
          const cPage = qp.currentPage || 1;
          totalPages += cPage;
          membersStats.push({
            id: userId,
            userTag: sessionInfo ? sessionInfo.user.userTag : 'أنت',
            name: sessionInfo ? sessionInfo.user.name : (usr.name || 'أنت'),
            avatar: sessionInfo ? sessionInfo.user.avatar : (usr.avatar || 'أ'),
            xp: usr.xp || garden.totalXP || 0,
            streak: garden.streakDays || 0,
            currentPage: cPage,
            currentSurahName: SURAH_NAMES_AR[qp.currentSurahId || 1] || 'الفاتحة',
            currentJuzName: getJuzName(cPage),
            todayDone: (qp.todayPages || 0) > 0 || qp.todayStatus === 'completed',
            isMe: true
          });
        }
      }

      // Sort members by XP descending for leaderboard
      membersStats.sort((a, b) => (b.xp || 0) - (a.xp || 0));

      return {
        id: g.id,
        code: g.code,
        name: g.name,
        category: g.category || 'أصدقاء',
        description: g.description || '',
        createdByName: g.createdByName || '',
        membersCount: g.memberIds.length,
        totalPagesRead: totalPages,
        members: membersStats
      };
    });

    return sendJson(res, 200, { success: true, groups: formattedGroups });
  }

  // 13. POST /api/groups/leave
  if (pathname === '/api/groups/leave' && method === 'POST') {
    const sessionInfo = getSessionUser(req);
    const userId = sessionInfo ? sessionInfo.user.id : (req.headers['x-guest-id'] || 'guest_user');

    try {
      const body = await readJsonBody(req);
      const groupId = body.groupId;
      const groups = loadGroups();
      const group = groups.find(g => g.id === groupId);

      if (group && Array.isArray(group.memberIds)) {
        group.memberIds = group.memberIds.filter(id => id !== userId);
        saveGroups(groups);
      }

      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'فشل مغادرة المجموعة' });
    }
  }

  // 14. POST /api/nudges/send
  if (pathname === '/api/nudges/send' && method === 'POST') {
    const sessionInfo = getSessionUser(req);
    const userId = sessionInfo ? sessionInfo.user.id : (req.headers['x-guest-id'] || 'guest_user');
    const users = loadUsers();
    const currentUser = sessionInfo ? sessionInfo.user : users.find(u => u.id === userId);

    try {
      const body = await readJsonBody(req);
      const toUserTag = (body.toUserTag || '').trim().toUpperCase();
      const message = (body.message || '').trim() || 'أخوك ينتظرك في الورد.. لا تقطع غراسك اليوم 🌿';
      const toUserName = body.toUserName || '';

      const fromUserTag = currentUser?.userTag || body.fromUserTag || 'GHR-1000';
      const fromUserName = currentUser?.name || body.fromUserName || 'رفيق دربك';
      const fromAvatar = currentUser?.avatar || body.fromUserAvatar || 'غ';

      const nudges = loadNudges();
      const newNudge = {
        id: 'ndg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        fromUserId: userId,
        fromUserTag: fromUserTag,
        fromUserName: fromUserName,
        fromUserAvatar: fromAvatar,
        toUserTag: toUserTag,
        toUserName: toUserName,
        message: message,
        type: body.type || 'encouragement',
        createdAt: new Date().toISOString(),
        isRead: false
      };

      nudges.push(newNudge);
      if (nudges.length > 200) {
        nudges.splice(0, nudges.length - 200);
      }
      saveNudges(nudges);

      return sendJson(res, 200, { success: true, nudge: newNudge });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'فشل إرسال همسة التحفيز' });
    }
  }

  // 15. GET /api/nudges/my
  if (pathname === '/api/nudges/my' && method === 'GET') {
    const sessionInfo = getSessionUser(req);
    const userId = sessionInfo ? sessionInfo.user.id : (req.headers['x-guest-id'] || 'guest_user');
    const users = loadUsers();
    const currentUser = sessionInfo ? sessionInfo.user : users.find(u => u.id === userId);
    const myTag = (currentUser?.userTag || parsedUrl.query.userTag || req.headers['x-user-tag'] || '').trim().toUpperCase();

    const nudges = loadNudges();
    const myNudges = nudges.filter(n => {
      if (myTag && n.toUserTag && n.toUserTag === myTag) return true;
      if (userId && n.toUserId && n.toUserId === userId) return true;
      return false;
    }).slice(-20).reverse();

    return sendJson(res, 200, { success: true, nudges: myNudges });
  }

  // 16. POST /api/nudges/mark-read
  if (pathname === '/api/nudges/mark-read' && method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const nudgeId = body.nudgeId;
      const nudges = loadNudges();
      if (nudgeId === 'all') {
        const myTag = (body.userTag || '').trim().toUpperCase();
        nudges.forEach(n => {
          if (n.toUserTag === myTag) n.isRead = true;
        });
      } else {
        const target = nudges.find(n => n.id === nudgeId);
        if (target) target.isRead = true;
      }
      saveNudges(nudges);
      return sendJson(res, 200, { success: true });
    } catch (err) {
      return sendJson(res, 500, { error: err.message || 'فشل التحديث' });
    }
  }

  // Not matched API route
  return sendJson(res, 404, { error: 'API route not found' });
}

// ── Static Files & HTTP Server ────────────────────────────────
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-guest-id',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    });
    return res.end();
  }

  const host = req.headers.host || `localhost:${PORT}`;
  const parsedUrl = new URL(req.url, `http://${host}`);
  parsedUrl.query = Object.fromEntries(parsedUrl.searchParams.entries());

  // Check if API route
  if (parsedUrl.pathname.startsWith('/api/')) {
    return handleApiRequest(req, res, parsedUrl);
  }

  // Favicon fallback handling
  if (parsedUrl.pathname === '/favicon.ico') {
    const iconPath = path.join(ROOT, 'favicon.ico');
    if (!fs.existsSync(iconPath)) {
      const svgPath = path.join(ROOT, 'favicon.svg');
      if (fs.existsSync(svgPath)) {
        res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' });
        return fs.createReadStream(svgPath).pipe(res);
      }
      res.writeHead(204);
      return res.end();
    }
  }

  // Static files handling
  let filePath = path.join(ROOT, parsedUrl.pathname === '/' ? '/index.html' : parsedUrl.pathname);

  // Security: prevent directory traversal
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath);
  const mimeType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Server Error');
      }
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`
╔═════════════════════════════════════════════════════╗
║   🌿 غِراس — GHIRAS Server (Auth & Multi-User)     ║
║   http://localhost:${PORT}                            ║
╚═════════════════════════════════════════════════════╝
  `);
});
