/**
 * GHIRAS — Global State Management
 * Reactive state with localStorage persistence
 */

import { DEFAULT_HABITS, getGardenStage, getGardenProgress, ACHIEVEMENTS } from './data/habits.js';

// ── Helper ─────────────────────────────────────────────────
const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
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
function createDefaultState() {
  const today = new Date();
  return {
    version: 1,
    isOnboarded: false,
    user: {
      name: 'سليمان',
      level: 1,
      xp: 0,
      xpToNextLevel: 200,
      joinDate: today.toISOString(),
      avatar: 'س',
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
    suhba: {
      groups: [
        {
          id: 'family',
          name: 'العائلة المباركة',
          emoji: '🏠',
          members: [
            { id: 'u1', name: 'أبو سليمان', avatar: 'أ', streak: 12, todayDone: true, color: '#4A6B53' },
            { id: 'u2', name: 'أم سليمان', avatar: 'أ', streak: 8, todayDone: true, color: '#B88E4F' },
            { id: 'u3', name: 'عبدالرحمن', avatar: 'ع', streak: 5, todayDone: false, color: '#6E6053' },
          ]
        }
      ]
    },
    settings: {
      notifications: true,
      reminderTime: '06:00',
      darkMode: false,
      language: 'ar',
      notificationStyle: 'gentle',
      quranFontSize: 'large',
      showStreak: true,
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
const STORAGE_KEY = 'ghiras_state_v1';

let _state = null;
let _listeners = [];

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      // Merge with defaults to handle new fields
      _state = deepMerge(createDefaultState(), saved);
    } else {
      _state = createDefaultState();
    }
    // Daily reset check
    checkDailyReset();
  } catch (e) {
    console.warn('Ghiras: state load failed, using defaults', e);
    _state = createDefaultState();
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_state));
  } catch (e) {
    console.warn('Ghiras: state save failed', e);
  }
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
  save();
  notify();
}

function subscribe(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
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
      } else if (!state.garden.lastCompletedDate) {
        state.garden.streakDays = 1;
      } else {
        state.garden.streakDays = 1; // reset streak
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
  const fajrHabit = state.habits.find(h => h.id === 'fajr-prayer');

  return {
    longestStreak,
    totalCompletions,
    quranStreak: quranHabit?.currentStreak || 0,
    fajrCount: fajrHabit?.totalCompletions || 0,
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
      label: AR_DAYS[d.getDay()].substring(0, 3),
      fullLabel: AR_DAYS[d.getDay()],
      isToday: i === 0,
      done,
      date: d,
    });
  }
  return days;
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
  localStorage.removeItem(STORAGE_KEY);
  _state = createDefaultState();
  save();
  notify();
}

// Initialize
load();

export const State = {
  get,
  set,
  subscribe,
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
  // Computed
  getTodayGreeting,
  getHijriDate,
  getActiveHabits,
  getTodayProgress,
  getLast7Days,
  getMaxStreak,
  getGardenStage,
  getGardenProgress,
  // UI helpers
  showToast,
  // Dev
  resetState,
  toArabicNum,
};
