/**
 * GHIRAS — Global State Management
 * Reactive state with localStorage persistence
 */

import { DEFAULT_HABITS, getGardenStage, getGardenProgress, ACHIEVEMENTS } from './data/habits.js';
import { Auth } from './auth.js';

// ── Helper ─────────────────────────────────────────────────
const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_DAYS_SHORT = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function toArabicNum(n) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// ── Default State ───────────────────────────────────────────
function createDefaultState(userName, avatar) {
  const today = new Date();
  const name = (userName || '').trim() || 'غارس الخير';
  const av = avatar || (name ? name.charAt(0) : 'غ');
  return {
    version: 1,
    isOnboarded: true,
    user: {
      name: name,
      level: 1,
      xp: 0,
      xpToNextLevel: 200,
      joinDate: today.toISOString(),
      avatar: av,
    },
    habits: DEFAULT_HABITS.map(h => ({
      ...h,
      currentStreak: 0,
      longestStreak: 0,
      totalCompletions: 0,
      todayStatus: 'pending', // pending | min_done | extra_done
      history: {}, // { 'YYYY-M-D': 'min_done' | 'extra_done' }
      minGoalDone: false,
      extraGoalDone: false,
    })),
    garden: {
      stage: 'seed',
      streakDays: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      totalXP: 0,
      badges: [],
      graceTokens: 2,           // رخص الاستدراك الهادئة (درع الغراس)
      isThirsty: false,         // هل النبتة في وضع العطش والانتظار
      lastGraceUsedDate: null,
      recoveredStreakCount: 0,
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
      todayKey: getTodayKey(),
    },
    khatmaPlan: {
      enabled: false,
      durationMonths: 1, // 1 (30 days), 2 (60 days), 3 (90 days), 6 (180 days)
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
      todayKey: getTodayKey(),
    },
    suhba: {
      companions: [],
      groups: [],
    },
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
      lastActiveDate: getTodayKey(),
    },
    _todayKey: getTodayKey(),
  };
}

// ── State Engine ────────────────────────────────────────────
function getStorageKey(user) {
  const u = user || Auth.getCurrentUser();
  if (u && u.id) {
    return `ghiras_state_usr_${u.id}`;
  }
  return 'ghiras_state_guest';
}

let _state = (typeof globalThis !== 'undefined' && globalThis.__GHIRAS_STATE__) ? globalThis.__GHIRAS_STATE__ : null;
let _listeners = (typeof globalThis !== 'undefined' && globalThis.__GHIRAS_LISTENERS__) ? globalThis.__GHIRAS_LISTENERS__ : [];
let _syncDebounceTimer = null;

function scheduleServerSync() {
  if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
  _syncDebounceTimer = setTimeout(() => {
    if (_state && Auth.isAuthenticated() && !Auth.isGuest()) {
      Auth.syncState(_state);
    }
  }, 1200);
}

function migrateHabits() {
  if (_state && Array.isArray(_state.habits)) {
    const targetHabit = _state.habits.find(h => h.id === 'fajr-prayer' || h.id === 'ayah-reflection');
    if (targetHabit && (targetHabit.name === 'صلاة الفجر' || targetHabit.name === 'قرآن الفجر' || targetHabit.id === 'fajr-prayer')) {
      targetHabit.id = 'ayah-reflection';
      targetHabit.name = 'تدبر آية';
      targetHabit.icon = 'auto_stories';
      targetHabit.iconBg = '#F2E4CB';
      targetHabit.iconColor = '#B88E4F';
      targetHabit.description = 'تأمل معنى آية كريمة وقراءة تفسيرها الميسر';
      targetHabit.minGoal = { value: 1, unit: 'ayah', label: 'آية واحدة', arabicNum: '١' };
      targetHabit.extraGoal = { value: 3, unit: 'ayahs', label: '٣ آيات بخواطرها', arabicNum: '٣' };
      targetHabit.category = 'quran';
    }
  }
}

function migrateSuhba() {
  if (_state) {
    if (!_state.suhba) {
      _state.suhba = { companions: [], groups: [] };
    }
    if (!Array.isArray(_state.suhba.companions)) {
      _state.suhba.companions = [];
    }
    // Remove old demo members if present
    if (Array.isArray(_state.suhba.groups)) {
      _state.suhba.groups = _state.suhba.groups.filter(g => 
        g.id !== 'family' || !g.members?.some(m => m.name === 'أبو سليمان' || m.name === 'أم سليمان')
      );
    }
  }
}

function load(user, remoteState) {
  try {
    const activeUser = user || Auth.getCurrentUser();
    if (remoteState) {
      _state = deepMerge(createDefaultState(activeUser?.name, activeUser?.avatar), remoteState);
    } else {
      const key = getStorageKey(activeUser);
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        _state = deepMerge(createDefaultState(activeUser?.name, activeUser?.avatar), saved);
      } else {
        _state = createDefaultState(activeUser?.name, activeUser?.avatar);
      }
    }
    checkDailyReset();
    migrateHabits();
    migrateSuhba();
    if (typeof globalThis !== 'undefined') globalThis.__GHIRAS_STATE__ = _state;
  } catch (e) {
    console.warn('Ghiras: state load failed, using defaults', e);
    const activeUser = user || Auth.getCurrentUser();
    _state = createDefaultState(activeUser?.name, activeUser?.avatar);
    if (typeof globalThis !== 'undefined') globalThis.__GHIRAS_STATE__ = _state;
  }
}

function save() {
  try {
    const key = getStorageKey();
    localStorage.setItem(key, JSON.stringify(_state));
    scheduleServerSync();
  } catch (e) {
    console.warn('Ghiras: state save failed', e);
  }
}

function initForUser(user, remoteState) {
  load(user, remoteState);
  save();
  notify();
}

function clearUserState() {
  _state = null;
  if (typeof globalThis !== 'undefined') globalThis.__GHIRAS_STATE__ = null;
  load();
  notify();
}

function get() {
  if (!_state) load();
  return _state;
}

function set(updater) {
  if (!_state) load();
  if (typeof updater === 'function') {
    updater(_state);
  } else {
    Object.assign(_state, updater);
  }
  if (typeof globalThis !== 'undefined') globalThis.__GHIRAS_STATE__ = _state;
  save();
  notify();
}

function subscribe(fn) {
  _listeners.push(fn);
  if (typeof globalThis !== 'undefined') globalThis.__GHIRAS_LISTENERS__ = _listeners;
  return () => {
    _listeners = _listeners.filter(l => l !== fn);
    if (typeof globalThis !== 'undefined') globalThis.__GHIRAS_LISTENERS__ = _listeners;
  };
}

function notify() {
  _listeners.forEach(fn => {
    try { fn(_state); } catch(e) {}
  });
}

// ── Daily Reset ──────────────────────────────────────────────
function checkDailyReset() {
  const today = getTodayKey();
  if (_state._todayKey !== today) {
    // New day — reset today statuses
    _state.habits.forEach(h => {
      h.todayStatus = 'pending';
      h.minGoalDone = false;
      h.extraGoalDone = false;
    });
    _state.quranProgress.todayAyahsRead = 0;
    _state.quranProgress.todayPages = 0;
    _state.quranProgress.todayStatus = 'pending';
    _state.quranProgress.todayKey = today;
    if (_state.khatmaPlan) {
      _state.khatmaPlan.prayersDone = {
        fajr: false,
        dhuhr: false,
        asr: false,
        maghrib: false,
        isha: false
      };
      _state.khatmaPlan.todayKey = today;
    }

    // Compassionate Garden check:
    // If yesterday was missed and user had an active streak, don't wipe it out!
    // Set isThirsty = true so the user can easily recover without guilt!
    const yesterday = getYesterdayKey();
    if (_state.garden && _state.garden.streakDays > 0) {
      if (_state.garden.lastCompletedDate !== yesterday && _state.garden.lastCompletedDate !== today) {
        _state.garden.isThirsty = true;
      }
    }

    _state._todayKey = today;
    _state.ui.lastActiveDate = today;
    save();
  }
}

// ── Actions ──────────────────────────────────────────────────

/**
 * Complete a habit (min or extra goal)
 */
function completeHabit(habitId, type = 'min') {
  set(s => {
    const habit = s.habits.find(h => h.id === habitId);
    if (!habit || !habit.active) return;

    const today = getTodayKey();
    const wasMinDone = habit.minGoalDone;

    if (type === 'min' && !habit.minGoalDone) {
      habit.minGoalDone = true;
      habit.todayStatus = 'min_done';
      habit.history[today] = 'min_done';
      habit.totalCompletions++;
      // Update streak
      updateHabitStreak(habit, today);
      // Award XP
      awardXP(s, 25, '✅ أحسنت!');
      // Update garden
      updateGarden(s);
    }

    if (type === 'extra') {
      habit.minGoalDone = true;
      habit.extraGoalDone = true;
      habit.todayStatus = 'extra_done';
      habit.history[today] = 'extra_done';
      if (!wasMinDone) {
        habit.totalCompletions++;
        updateHabitStreak(habit, today);
        awardXP(s, 50, '⭐ رائع!');
      } else {
        awardXP(s, 25, '🌟 ممتاز!');
      }
      updateGarden(s);
    }

    // Check achievements
    checkAchievements(s);
  });
}

function updateHabitStreak(habit, today) {
  const yesterday = getYesterdayKey();
  const hadYesterday = habit.history[yesterday];

  if (hadYesterday) {
    habit.currentStreak++;
  } else {
    habit.currentStreak = 1;
  }

  if (habit.currentStreak > habit.longestStreak) {
    habit.longestStreak = habit.currentStreak;
  }
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function awardXP(state, amount, label) {
  state.user.xp += amount;
  state.garden.totalXP += amount;

  // Level up check
  while (state.user.xp >= state.user.xpToNextLevel) {
    state.user.xp -= state.user.xpToNextLevel;
    state.user.level++;
    state.user.xpToNextLevel = Math.round(state.user.xpToNextLevel * 1.5);
    showToast(`🎉 مبروك! وصلت للمستوى ${toArabicNum(state.user.level)}`, 'achievement');
  }

  showXPPop(amount);
}

function updateGarden(state) {
  // Count how many habits were completed today
  const completedToday = state.habits.filter(
    h => h.active && h.minGoalDone
  ).length;

  const activeHabits = state.habits.filter(h => h.active).length;
  if (activeHabits === 0) return;

  const ratio = completedToday / activeHabits;
  if (ratio >= 0.5) { // at least half done = garden progress
    const today = getTodayKey();
    const yesterday = getYesterdayKey();
    if (state.garden.lastCompletedDate !== today) {
      if (state.garden.lastCompletedDate === yesterday) {
        state.garden.streakDays++;
      } else if (state.garden.isThirsty) {
        // Compassionate revival: was thirsty, now revived by today's worship!
        state.garden.isThirsty = false;
        state.garden.streakDays = (state.garden.streakDays || 0) + 1;
        showToast('🌱 الحمد لله! ارتوت نبتتك واستعادت نموها المبارك بفضله تعالى ✨', 'achievement');
      } else if (!state.garden.lastCompletedDate) {
        state.garden.streakDays = 1;
      } else {
        // Compassionate resilience: keep progress rather than punitive wipeout
        state.garden.isThirsty = false;
        state.garden.streakDays = Math.max(1, state.garden.streakDays || 1);
      }

      // Award a new grace token every 15 consecutive days (capped at 3 tokens to prevent slacking)
      if (state.garden.streakDays > 0 && state.garden.streakDays % 15 === 0 && state.garden.lastGraceEarnedStreak !== state.garden.streakDays) {
        state.garden.lastGraceEarnedStreak = state.garden.streakDays;
        if ((state.garden.graceTokens || 0) < 3) {
          state.garden.graceTokens = Math.min(3, (state.garden.graceTokens || 0) + 1);
          showToast(`💧 مبارك! التزمت ${toArabicNum(state.garden.streakDays)} يوماً وكسبت رخصة استدراك جديدة (رصيدك: ${toArabicNum(state.garden.graceTokens)} من ٣)`, 'achievement');
        }
      }

      state.garden.lastCompletedDate = today;
      if (state.garden.streakDays > state.garden.longestStreak) {
        state.garden.longestStreak = state.garden.streakDays;
      }
    }
    state.garden.stage = getGardenStage(state.garden.streakDays).id;
  }
}

/**
 * Check and unlock achievements
 */
function checkAchievements(state) {
  const stats = getStats(state);
  ACHIEVEMENTS.forEach(ach => {
    const alreadyUnlocked = state.garden.badges.find(b => b.id === ach.id);
    if (!alreadyUnlocked && ach.condition(stats)) {
      state.garden.badges.push({
        id: ach.id,
        unlockedAt: new Date().toISOString(),
      });
      state.user.xp += ach.xp;
      showToast(`🏆 إنجاز جديد: ${ach.name}!`, 'achievement');
    }
  });
}

function getStats(state) {
  const longestStreak = Math.max(...state.habits.map(h => h.longestStreak), 0);
  const totalCompletions = state.habits.reduce((s, h) => s + h.totalCompletions, 0);
  const quranHabit = state.habits.find(h => h.id === 'quran-reading');
  const reflectionHabit = state.habits.find(h => h.id === 'ayah-reflection' || h.id === 'fajr-prayer');

  return {
    longestStreak,
    totalCompletions,
    quranStreak: quranHabit?.currentStreak || 0,
    fajrCount: reflectionHabit?.totalCompletions || 0,
    gardenStreak: state.garden.streakDays,
  };
}

/**
 * Update Quran reading progress
 */
function updateQuranProgress(ayahsRead, surahId, ayahNum, pageNum) {
  set(s => {
    s.quranProgress.todayAyahsRead = (s.quranProgress.todayAyahsRead || 0) + ayahsRead;
    s.quranProgress.totalAyahsRead = (s.quranProgress.totalAyahsRead || 0) + ayahsRead;
    if (surahId) {
      s.quranProgress.lastReadSurahId = surahId;
      s.quranProgress.currentSurahId = surahId;
    }
    if (ayahNum) {
      s.quranProgress.lastReadAyah = ayahNum;
      s.quranProgress.currentAyah = ayahNum;
    }
    if (pageNum) {
      s.quranProgress.currentPage = pageNum;
      s.quranProgress.lastReadPage = pageNum;
    }

    // Mark wird as done if min goal met (1 ayah)
    if (s.quranProgress.todayAyahsRead >= 1 && s.quranProgress.todayStatus === 'pending') {
      s.quranProgress.todayStatus = 'min_done';
      // Also complete the habit
      const habit = s.habits.find(h => h.id === 'quran-reading');
      if (habit && !habit.minGoalDone) {
        completeHabit('quran-reading', 'min');
        return; // completeHabit calls set() internally
      }
    }
  });
}

/**
 * Accept habit level upgrade
 */
function upgradeHabitGoal(habitId) {
  set(s => {
    const habit = s.habits.find(h => h.id === habitId);
    if (!habit) return;
    if (habit.extraGoal) {
      // Promote extra goal to min goal
      habit.minGoal = { ...habit.extraGoal };
    }
    showToast(`🌱 تم ترقية هدفك بهدوء — ${habit.name}`, 'success');
  });
}

/**
 * Onboarding complete
 */
function completeOnboarding(userName, selectedCategories) {
  set(s => {
    s.isOnboarded = true;
    s.user.name = userName || 'أخي';
    s.user.avatar = (userName || 'أ')[0];
    // Activate only selected categories
    if (selectedCategories && selectedCategories.length > 0) {
      s.habits.forEach(h => {
        h.active = selectedCategories.includes(h.category);
      });
    }
  });
}

function setUserName(name) {
  set(s => {
    s.user.name = name;
    s.user.avatar = name[0] || 'م';
  });
}

function updateSettings(updates) {
  set(s => { Object.assign(s.settings, updates); });
}

function setActiveTab(tab) {
  set(s => { s.ui.activeTab = tab; });
}

// ── UI Helpers ───────────────────────────────────────────────
let _toastTimeout = null;

function showToast(message, type = 'default') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'achievement') toast.style.background = '#4A6B53';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
}

function showXPPop(amount) {
  const pop = document.createElement('div');
  pop.className = 'xp-pop';
  pop.textContent = `+${toArabicNum(amount)} XP`;
  pop.style.top = '20%';
  pop.style.left = '50%';
  pop.style.transform = 'translateX(-50%)';
  document.body.appendChild(pop);
  setTimeout(() => {
    if (pop.parentNode) pop.parentNode.removeChild(pop);
  }, 1200);
}

// ── Computed Getters ─────────────────────────────────────────
function getTodayGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'مساء الخير';
  if (h < 12) return 'صباح النور';
  if (h < 17) return 'مرحباً';
  if (h < 20) return 'مساء الخير';
  return 'مساء النور';
}

function getHijriDate() {
  // Simple Hijri approximation — good enough for display
  const today = new Date();
  return `${AR_DAYS[today.getDay()]}، ${toArabicNum(today.getDate())} ${AR_MONTHS[today.getMonth()]} ${toArabicNum(today.getFullYear())}`;
}

function getActiveHabits() {
  return get().habits.filter(h => h.active);
}

function getTodayProgress() {
  const active = getActiveHabits();
  if (active.length === 0) return 0;
  const done = active.filter(h => h.minGoalDone).length;
  return Math.round((done / active.length) * 100);
}

function getLast7Days() {
  const days = [];
  const s = get();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const done = s.habits.filter(h => h.active && (h.history[key] === 'min_done' || h.history[key] === 'extra_done')).length > 0;
    days.push({
      key,
      label: i === 0 ? 'اليوم' : AR_DAYS_SHORT[d.getDay()],
      dayName: AR_DAYS_SHORT[d.getDay()],
      fullLabel: AR_DAYS[d.getDay()],
      dayNumber: toArabicNum(d.getDate()),
      isToday: i === 0,
      done,
      date: d,
    });
  }
  return days;
}

function formatStreakText(count) {
  if (count === 0) return 'ابدأ اليوم 🌱';
  if (count === 1) return 'يوم واحد 🔥';
  if (count === 2) return 'يومان متتاليان 🔥';
  if (count >= 3 && count <= 10) return `${toArabicNum(count)} أيام 🔥`;
  return `${toArabicNum(count)} يوماً 🔥`;
}

function getMaxStreak() {
  const s = get();
  return Math.max(s.garden.streakDays, ...s.habits.map(h => h.currentStreak), 0);
}

// ── Deep Merge ───────────────────────────────────────────────
function deepMerge(defaults, saved) {
  const result = { ...defaults };
  for (const key of Object.keys(saved)) {
    if (key in defaults && typeof defaults[key] === 'object' && !Array.isArray(defaults[key]) && defaults[key] !== null) {
      result[key] = deepMerge(defaults[key], saved[key] || {});
    } else {
      result[key] = saved[key];
    }
  }
  return result;
}

// ── Reminders & Alarms State ──────────────────────────────
function getReminders() {
  const s = get();
  if (!s.reminders) {
    s.reminders = [
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
    ];
    save();
  }
  return s.reminders;
}

function addReminder(rem) {
  set(s => {
    if (!s.reminders) s.reminders = [];
    const newRem = {
      id: 'rem_' + Date.now(),
      title: rem.title || 'تذكير قرآني',
      type: rem.type || 'surah',
      surahNumber: parseInt(rem.surahNumber, 10) || 0,
      surahName: rem.surahName || '',
      page: parseInt(rem.page, 10) || 1,
      time: rem.time || '20:00',
      enabled: true,
      days: rem.days || [0, 1, 2, 3, 4, 5, 6],
      repeatType: rem.repeatType || 'daily',
      lastTriggeredDate: ''
    };
    s.reminders.push(newRem);
  });
}

function updateReminder(id, updates) {
  set(s => {
    if (!s.reminders) return;
    const item = s.reminders.find(r => r.id === id);
    if (item) Object.assign(item, updates);
  });
}

function deleteReminder(id) {
  set(s => {
    if (!s.reminders) return;
    s.reminders = s.reminders.filter(r => r.id !== id);
  });
}

function toggleReminder(id) {
  let nowEnabled = false;
  set(s => {
    if (!s.reminders) return;
    const item = s.reminders.find(r => r.id === id);
    if (item) {
      item.enabled = !item.enabled;
      nowEnabled = item.enabled;
    }
  });
  return nowEnabled;
}

function markReminderTriggered(id, dateStr) {
  set(s => {
    if (!s.reminders) return;
    const item = s.reminders.find(r => r.id === id);
    if (item) item.lastTriggeredDate = dateStr;
  });
}

// ── Reset (Dev) ──────────────────────────────────────────────
function resetState() {
  const key = getStorageKey();
  localStorage.removeItem(key);
  const activeUser = Auth.getCurrentUser();
  _state = createDefaultState(activeUser?.name, activeUser?.avatar);
  save();
  notify();
}

// Initialize
load();

// ── Khatma Plan Actions ─────────────────────────────────────
function setKhatmaEnabled(enabled) {
  set(s => {
    if (!s.khatmaPlan) {
      s.khatmaPlan = {
        enabled: false,
        durationMonths: 1,
        targetDays: 30,
        dailyPages: 20,
        startDate: new Date().toISOString(),
        prayersDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        todayKey: getTodayKey()
      };
    }
    s.khatmaPlan.enabled = !!enabled;
    if (enabled && !s.khatmaPlan.startDate) {
      s.khatmaPlan.startDate = new Date().toISOString();
    }
  });
}

function setKhatmaDuration(months) {
  set(s => {
    if (!s.khatmaPlan) {
      s.khatmaPlan = {
        enabled: true,
        durationMonths: 1,
        targetDays: 30,
        dailyPages: 20,
        startDate: new Date().toISOString(),
        prayersDone: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
        todayKey: getTodayKey()
      };
    }
    const m = Number(months) || 1;
    s.khatmaPlan.durationMonths = m;
    s.khatmaPlan.targetDays = m * 30;
    s.khatmaPlan.dailyPages = Math.max(1, Math.round(604 / (m * 30)));
  });
}

function toggleKhatmaPrayerDone(prayerKey) {
  let isDone = false;
  set(s => {
    if (!s.khatmaPlan) return;
    if (!s.khatmaPlan.prayersDone) {
      s.khatmaPlan.prayersDone = { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false };
    }
    const current = !!s.khatmaPlan.prayersDone[prayerKey];
    s.khatmaPlan.prayersDone[prayerKey] = !current;
    isDone = !current;
    if (isDone) {
      s.user.xp = (s.user.xp || 0) + 15;
      s.garden.totalXP = (s.garden.totalXP || 0) + 15;
    }
  });
  return isDone;
}

// ── Suhba (Companions & Groups) Actions ────────────────────
function getUserTag() {
  const s = get();
  if (s.user && s.user.userTag) return s.user.userTag;
  const user = Auth.getCurrentUser();
  if (user && user.userTag) return user.userTag;
  return 'GHR-1024';
}

function addCompanion(data) {
  let newComp = null;
  set(s => {
    if (!s.suhba) s.suhba = { companions: [], groups: [] };
    if (!Array.isArray(s.suhba.companions)) s.suhba.companions = [];

    const name = (data.name || '').trim();
    if (!name) return;

    // Check if already added by tag or id
    const existing = s.suhba.companions.find(c => 
      (data.userTag && c.userTag && c.userTag.toUpperCase() === data.userTag.toUpperCase()) ||
      (data.id && c.id === data.id)
    );
    if (existing) {
      Object.assign(existing, data);
      newComp = existing;
      return;
    }

    newComp = {
      id: data.id || ('comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6)),
      userId: data.userId || data.id || null,
      userTag: data.userTag || null,
      name: name,
      relation: data.relation || 'رفيق درب',
      avatar: data.avatar || (name ? name.charAt(0) : 'ص'),
      color: data.color || '#4A6B53',
      streak: data.streak !== undefined ? Number(data.streak) : 1,
      xp: data.xp !== undefined ? Number(data.xp) : 120,
      currentPage: data.currentPage !== undefined ? Number(data.currentPage) : 1,
      currentSurahName: data.currentSurahName || 'الفاتحة',
      currentJuzName: data.currentJuzName || 'الجزء الأول',
      todayDone: data.todayDone !== undefined ? !!data.todayDone : true,
      plantStage: data.plantStage || 'seed',
      createdAt: new Date().toISOString()
    };

    s.suhba.companions.push(newComp);
  });
  return newComp;
}

function removeCompanion(companionId) {
  set(s => {
    if (!s.suhba || !Array.isArray(s.suhba.companions)) return;
    s.suhba.companions = s.suhba.companions.filter(c => c.id !== companionId);
  });
}

function updateCompanion(companionId, updates) {
  set(s => {
    if (!s.suhba || !Array.isArray(s.suhba.companions)) return;
    const item = s.suhba.companions.find(c => c.id === companionId);
    if (item) Object.assign(item, updates);
  });
}

function updateCompanionsFromBatch(statsList) {
  if (!Array.isArray(statsList) || statsList.length === 0) return;
  set(s => {
    if (!s.suhba || !Array.isArray(s.suhba.companions)) return;
    statsList.forEach(stat => {
      const comp = s.suhba.companions.find(c => 
        (c.userId && c.userId === stat.id) ||
        (c.userTag && stat.userTag && c.userTag.toUpperCase() === stat.userTag.toUpperCase()) ||
        c.id === stat.id
      );
      if (comp) {
        comp.name = stat.name || comp.name;
        comp.avatar = stat.avatar || comp.avatar;
        comp.userTag = stat.userTag || comp.userTag;
        comp.xp = stat.xp !== undefined ? stat.xp : comp.xp;
        comp.streak = stat.streak !== undefined ? stat.streak : comp.streak;
        comp.currentPage = stat.currentPage !== undefined ? stat.currentPage : comp.currentPage;
        comp.currentSurahName = stat.currentSurahName || comp.currentSurahName;
        comp.currentJuzName = stat.currentJuzName || comp.currentJuzName;
        comp.todayDone = stat.todayDone !== undefined ? stat.todayDone : comp.todayDone;
        comp.plantStage = stat.plantStage || comp.plantStage;
      }
    });
  });
}

function getGroups() {
  const s = get();
  return (s.suhba && Array.isArray(s.suhba.groups)) ? s.suhba.groups : [];
}

function setGroups(groupsList) {
  set(s => {
    if (!s.suhba) s.suhba = { companions: [], groups: [] };
    s.suhba.groups = Array.isArray(groupsList) ? groupsList : [];
  });
}

function addGroupToState(grp) {
  set(s => {
    if (!s.suhba) s.suhba = { companions: [], groups: [] };
    if (!Array.isArray(s.suhba.groups)) s.suhba.groups = [];
    const idx = s.suhba.groups.findIndex(g => g.id === grp.id || g.code === grp.code);
    if (idx >= 0) {
      s.suhba.groups[idx] = grp;
    } else {
      s.suhba.groups.push(grp);
    }
  });
}

function removeGroupFromState(groupId) {
  set(s => {
    if (!s.suhba || !Array.isArray(s.suhba.groups)) return;
    s.suhba.groups = s.suhba.groups.filter(g => g.id !== groupId);
  });
}

// ── Compassionate Garden Recovery & Compensation ─────────────────────────────
function recoverGardenStreak(method = 'token') {
  set(s => {
    s.garden = s.garden || {};
    s.garden.graceTokens = s.garden.graceTokens !== undefined ? s.garden.graceTokens : 2;

    if (method === 'token') {
      if (s.garden.graceTokens > 0) {
        s.garden.graceTokens--;
      } else {
        showToast('⚠️ لا توجد رخص طوارئ متبقية، استخدم خيار "تعويض الورد" لإنقاذ نبتتك مجاناً 📖', 'warning');
        return;
      }
    }

    s.garden.isThirsty = false;
    s.garden.streakDays = (s.garden.streakDays || 0) + 1;
    if (s.garden.streakDays > (s.garden.longestStreak || 0)) {
      s.garden.longestStreak = s.garden.streakDays;
    }
    s.garden.stage = getGardenStage(s.garden.streakDays).id;
    s.garden.lastCompletedDate = getTodayKey();
    s.garden.lastGraceUsedDate = getTodayKey();
    s.garden.recoveredStreakCount = (s.garden.recoveredStreakCount || 0) + 1;

    awardXP(s, 50, '💧 رخصة استدراك');
    showToast(`🌱 الحمد لله! استُخدمت رخصة استدراك لحفظ نبتتك وسلسلتك (المتبقي: ${toArabicNum(s.garden.graceTokens)} من ٣) ✨`, 'achievement');
  });
}

function compensateMissedWird() {
  set(s => {
    s.garden = s.garden || {};
    // Compensation does NOT deduct any grace tokens!
    s.garden.isThirsty = false;
    s.garden.streakDays = (s.garden.streakDays || 0) + 1;
    if (s.garden.streakDays > (s.garden.longestStreak || 0)) {
      s.garden.longestStreak = s.garden.streakDays;
    }
    s.garden.stage = getGardenStage(s.garden.streakDays).id;
    s.garden.lastCompletedDate = getTodayKey();
    s.garden.compensatedDaysCount = (s.garden.compensatedDaysCount || 0) + 1;

    // Award bonus XP for making up the wird!
    awardXP(s, 80, '📖 تعويض الورد ببركة');
    showToast('🌟 «من نام عن حزبه فقرأه..» تقبل الله! عوّضت وردك ببركة وارتوت نبتتك دون استهلاك أي رخصة 🌿', 'achievement');
  });
}

function simulateMissedDay() {
  set(s => {
    s.garden = s.garden || {};
    s.garden.isThirsty = true;
    showToast('⚠️ تم تفعيل حالة "النبتة العطشى" لمعاينة التعافي الرحيم والتعويض');
  });
}

function getGraceTokens() {
  const s = get();
  return (s.garden && s.garden.graceTokens !== undefined) ? s.garden.graceTokens : 2;
}

function getDaysUntilNextGraceToken() {
  const s = get();
  const streak = s.garden?.streakDays || 0;
  const rem = streak % 15;
  return rem === 0 ? 15 : (15 - rem);
}

function isGardenThirsty() {
  const s = get();
  return !!(s.garden && s.garden.isThirsty);
}

export const State = {
  get,
  set,
  subscribe,
  initForUser,
  clearUserState,
  getStorageKey,
  completeHabit,
  upgradeHabitGoal,
  updateQuranProgress,
  completeOnboarding,
  setUserName,
  updateSettings,
  setActiveTab,
  // Reminders
  getReminders,
  addReminder,
  updateReminder,
  deleteReminder,
  toggleReminder,
  markReminderTriggered,
  // Khatma Plan
  setKhatmaEnabled,
  setKhatmaDuration,
  toggleKhatmaPrayerDone,
  // Suhba (Companions & Groups)
  getUserTag,
  addCompanion,
  removeCompanion,
  updateCompanion,
  updateCompanionsFromBatch,
  getGroups,
  setGroups,
  addGroupToState,
  removeGroupFromState,
  // Computed
  getTodayGreeting,
  getHijriDate,
  getActiveHabits,
  getTodayProgress,
  getLast7Days,
  getMaxStreak,
  getGardenStage,
  getGardenProgress,
  formatStreakText,
  // UI helpers
  showToast,
  // Garden Compassionate Recovery & Compensation
  recoverGardenStreak,
  compensateMissedWird,
  simulateMissedDay,
  getGraceTokens,
  getDaysUntilNextGraceToken,
  isGardenThirsty,
  // Dev
  resetState,
  toArabicNum,
};

if (typeof globalThis !== 'undefined') {
  globalThis.State = State;
}
