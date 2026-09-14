/**
 * GHIRAS — App Main Controller
 * Orchestrates routing, rendering, and all user interactions
 */

import { State } from './state.js?v=4.0';
import { Auth }  from './auth.js?v=4.0';
import {
  renderAuthScreen,
  setAuthMode,
  getAuthMode,
  setAuthError,
  setAuthLoading,
  togglePasswordVisibility
} from './screens/auth_screen.js?v=4.0';
import { renderHome }       from './screens/home.js?v=4.0';
import {
  renderWird,
  setWirdTab,
  setMemorizationMode,
  isMemorizationActive,
  setAthkarCategory,
  setPrayerSub,
  setAthkarSearch,
  renderAthkarTabContent
} from './screens/wird.js?v=4.0';
import { ATHKAR_DUAS, ATHKAR_CATEGORIES } from './data/athkar_duas.js?v=4.0';
import { renderGarden }     from './screens/garden.js?v=4.0';
import { renderSuhba, setSuhbaTab, getSuhbaTab } from './screens/suhba.js?v=4.0';
import { renderProfile }    from './screens/profile.js?v=4.0';
import { renderOnboarding, onboardingStepData } from './screens/onboarding.js?v=4.0';
import { SOUL_REMEDIES, getSoulRemedy } from './data/remedies.js?v=4.0';
import {
  getSurahById,
  getSurah,
  getPage,
  getAllSurahs,
  getPageOfSurah,
  getSurahForPage,
  getJuzForPage,
  ALL_SURAHS,
  JUZ_NAMES,
  loadFullQuran,
  ATHKAR,
  QURAN_DATA,
  getAyah,
  getNextAyah,
  getPrevAyah,
  QURAN_RECITERS,
  getReciters,
  getReciter
} from './data/quran.js?v=3.6';
import { getGardenStage }   from './data/habits.js?v=3.6';
import {
  playAlarmChime,
  requestNotificationPermission,
  sendAlarmNotification,
  startAlarmClock
} from './data/alarm.js?v=3.6';

// ── Screens Config ─────────────────────────────────────────
const SCREENS = {
  home:    { id: 'home',    render: renderHome,    label: 'الرئيسية', icon: 'spa',            navId: 'nav-home' },
  wird:    { id: 'wird',    render: renderWird,    label: 'وردي',    icon: 'menu_book',      navId: 'nav-wird' },
  garden:  { id: 'garden',  render: renderGarden,  label: 'حديقتي',  icon: 'yard',           navId: 'nav-garden' },
  suhba:   { id: 'suhba',   render: renderSuhba,   label: 'الصحبة',  icon: 'groups_2',       navId: 'nav-suhba' },
  profile: { id: 'profile', render: renderProfile, label: 'حسابي',   icon: 'account_circle', navId: 'nav-profile' },
};

let _currentScreen = 'home';
let _onboardingData = null;
let _athkarCounts = {};
let _wirdActiveTab = 'quran';

// ── Continuous Recitation & Audio State ────────────────────
let _audioInstance = null;
let _audioState = {
  isPlaying: false,
  surahNumber: 1,
  surahName: 'الفاتحة',
  ayahNumber: 1,
  page: 1,
  repeatMode: 1, // 1 = continuous no repeat; 2 = 2x; 3 = 3x; Infinity = loop
  repeatCounter: 1 // current repetition
};

// ── Boot ───────────────────────────────────────────────────
async function boot() {
  // Preload full Quran dataset so all 604 pages and 114 Surahs are immediately available
  try {
    await loadFullQuran();
  } catch (err) {
    console.warn('GHIRAS: Quran data preload error', err);
  }

  const currentUser = Auth.getCurrentUser();

  if (!currentUser) {
    showAuth();
  } else {
    State.initForUser(currentUser);
    showApp();
    navigate(State.get().ui?.activeTab || 'home');

    // Verify session in background
    Auth.checkSession().then(res => {
      if (res && res.state) {
        State.initForUser(res.user, res.state);
        updateHeader();
      }
    }).catch(() => {});
  }

  // Subscribe to state changes for reactive re-render
  State.subscribe((s) => {
    updateHeader();
    updateNavBadges();
  });

  // Start Smart Quran Alarm Clock (checks every 15s)
  startAlarmClock(() => State.getReminders(), handleAlarmTrigger);

  // Initialize Touch Gestures & Keyboard Navigation for Mushaf
  initMushafGestureHandlers();

  // Initialize Daily Midnight (12:00 AM) Reset Scheduler
  initDailyMidnightScheduler();
}

// ── Daily Midnight Reset Scheduler (كل 24 ساعة عند 12:00 AM) ──
let _midnightTimerId = null;
let _midnightHeartbeatId = null;

function initDailyMidnightScheduler() {
  // 1. التحقق اللحظي عند إقلاع التطبيق
  checkAndPerformDailyReset();

  // 2. جدولة مؤقت دقيق للحظة حلول منتصف الليل 12:00:01 AM القادمة
  scheduleNextMidnightTimer();

  // 3. نبض دوري كل 30 ثانية لالتقاط اليوم الجديد فور استيقاظ الجهاز من وضع السكون
  if (!_midnightHeartbeatId) {
    _midnightHeartbeatId = setInterval(() => {
      checkAndPerformDailyReset();
    }, 30000);
  }

  // 4. عند عودة المستخدم للتطبيق أو إلغاء قفل شاشة الهاتف
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkAndPerformDailyReset();
    }
  });

  window.addEventListener('focus', () => {
    checkAndPerformDailyReset();
  });
}

function scheduleNextMidnightTimer() {
  if (_midnightTimerId) clearTimeout(_midnightTimerId);

  const now = new Date();
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  const msUntilMidnight = Math.max(1000, nextMidnight.getTime() - now.getTime());

  _midnightTimerId = setTimeout(() => {
    checkAndPerformDailyReset(true);
    scheduleNextMidnightTimer();
  }, msUntilMidnight);
}

function checkAndPerformDailyReset(isExactMidnight = false) {
  const didReset = State.checkDailyReset();
  if (didReset) {
    console.log('GHIRAS: تم تصفير الأذكار والورد تلقائياً لليوم الجديد (12:00 AM)');

    // تحديث واجهة الأذكار فوراً إذا كان المستخدم داخلها
    const athkarTab = document.getElementById('wird-athkar-tab');
    if (athkarTab && _currentScreen === 'wird') {
      athkarTab.innerHTML = renderAthkarTabContent();
    }

    // تحديث الشاشة الحالية إذا كانت الرئيسية ليعكس الورد الجديد
    if (_currentScreen === 'home') {
      const container = document.getElementById('screen-container');
      if (container) {
        container.innerHTML = `
          <div class="screen active" id="screen-home" role="tabpanel">
            ${renderHome()}
          </div>
        `;
      }
    }

    updateHeader();
    updateNavBadges();

    if (isExactMidnight) {
      State.showToast('🌙 بداية يوم جديد مبارك (١٢:٠٠ ص) — تم تجديد وتصفير الأذكار والورد اليومي ✨');
    }
  }
}

let _mushafGesturesBound = false;
function initMushafGestureHandlers() {
  if (_mushafGesturesBound) return;
  _mushafGesturesBound = true;

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener('touchstart', (e) => {
    if (_currentScreen !== 'wird') return;
    const wirdEl = document.getElementById('wird-content') || document.getElementById('mushaf-page');
    if (!wirdEl || !wirdEl.contains(e.target)) return;

    // Ignore touches on buttons, inputs, chips, or modal triggers
    if (e.target.closest('button, input, select, .chip, #ayah-action-sheet, .modal')) return;

    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (_currentScreen !== 'wird') return;
    const wirdEl = document.getElementById('wird-content') || document.getElementById('mushaf-page');
    if (!wirdEl || !wirdEl.contains(e.target)) return;

    if (e.target.closest('button, input, select, .chip, #ayah-action-sheet, .modal')) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const duration = Date.now() - touchStartTime;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Must be a distinct horizontal swipe within 800ms
    if (duration < 800 && Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY) * 1.0) {
      const s = State.get();
      const curPage = s.quranProgress?.currentPage || 1;

      if (deltaX > 0) {
        // سحب من اليسار لليمين -> الانتقال للصفحة اليسرى (التالية)
        if (curPage < 604) {
          goToPage(curPage + 1, 'next');
        }
      } else {
        // سحب من اليمين لليسار -> الانتقال للصفحة اليمنى (السابقة)
        if (curPage > 1) {
          goToPage(curPage - 1, 'prev');
        }
      }
    }
  }, { passive: true });

  // Keyboard navigation for Quran reader:
  // ArrowLeft (←) = Next Page in Quran RTL order
  // ArrowRight (→) = Previous Page in Quran RTL order
  window.addEventListener('keydown', (e) => {
    if (_currentScreen !== 'wird') return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    const overlay = document.getElementById('modal-overlay');
    if (overlay && overlay.classList.contains('open')) return;

    const s = State.get();
    const curPage = s.quranProgress.currentPage || 1;

    if (e.key === 'ArrowLeft') {
      if (curPage < 604) {
        e.preventDefault();
        goToPage(curPage + 1, 'next');
      }
    } else if (e.key === 'ArrowRight') {
      if (curPage > 1) {
        e.preventDefault();
        goToPage(curPage - 1, 'prev');
      }
    }
  });
}

// ── Auth Handlers ──────────────────────────────────────────
function showAuth() {
  const shell = document.getElementById('app-shell');
  if (shell) {
    shell.innerHTML = renderAuthScreen();
  }
}

function switchAuthMode(mode) {
  const emailEl = document.getElementById('auth-email-input');
  const nameEl = document.getElementById('auth-name-input');
  const savedEmail = emailEl ? emailEl.value : '';
  const savedName = nameEl ? nameEl.value : '';

  setAuthMode(mode);
  showAuth();

  if (savedEmail) {
    const newEmail = document.getElementById('auth-email-input');
    if (newEmail) newEmail.value = savedEmail;
  }
  if (savedName) {
    const newName = document.getElementById('auth-name-input');
    if (newName) newName.value = savedName;
  }
}

function toggleAuthPassword() {
  const passInput = document.getElementById('auth-password-input');
  const eyeIcon = document.getElementById('auth-eye-icon');
  if (passInput) {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    if (eyeIcon) {
      eyeIcon.textContent = isPass ? 'visibility_off' : 'visibility';
    }
  } else {
    togglePasswordVisibility();
    showAuth();
  }
}

function dismissAuthError() {
  setAuthError(null);
  const errorEl = document.getElementById('auth-error-banner');
  if (errorEl) {
    errorEl.remove();
  }
}

async function handleAuthSubmit(event) {
  if (event) event.preventDefault();

  const emailEl = document.getElementById('auth-email-input');
  const passEl = document.getElementById('auth-password-input');
  const nameEl = document.getElementById('auth-name-input');

  const email = emailEl ? emailEl.value.trim() : '';
  const password = passEl ? passEl.value : '';
  const name = nameEl ? nameEl.value.trim() : '';
  const mode = getAuthMode();

  setAuthLoading(true);
  setAuthError(null);
  showAuth();

  try {
    let result;
    if (mode === 'register') {
      result = await Auth.register(name, email, password);
    } else {
      result = await Auth.login(email, password);
    }

    setAuthLoading(false);
    State.initForUser(result.user, result.state);
    showApp();
    navigate('home');
    State.showToast(`🌿 مرحباً بك، ${result.user.name}`);
  } catch (err) {
    setAuthLoading(false);
    setAuthError(err.message || 'تعذر إتمام العملية');
    showAuth();
  }
}

function continueAsGuest() {
  const guestUser = Auth.loginAsGuest('زائر كريم');
  State.initForUser(guestUser);
  showApp();
  navigate('home');
  State.showToast('🌿 تم الدخول كزائر. نرحب بك!');
}

function openSwitchAccount() {
  showAuth();
}

function confirmLogout() {
  openModal(`
    <div style="text-align:center;padding:var(--space-4)">
      <div style="font-size:3rem;margin-bottom:var(--space-3)">🚪</div>
      <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">
        تسجيل الخروج
      </h3>
      <p style="font-size:var(--font-size-sm);color:var(--text-secondary);line-height:1.6;margin-bottom:var(--space-5)">
        سيتم حفظ تقدمك الحالي في المصحف وحديقة الطاعات بأمان، لتتمكن من العودة إليه عند تسجيل الدخول مجدداً.
      </p>
      <div style="display:flex;gap:var(--space-3)">
        <button onclick="App.doLogout()" style="
          flex:1;padding:12px;border:none;border-radius:var(--radius-xl);
          background:var(--color-error);color:#fff;font-weight:700;font-size:0.9375rem;cursor:pointer;font-family:inherit">
          تأكيد الخروج
        </button>
        <button onclick="App.closeModal()" style="
          flex:1;padding:12px;border:1px solid var(--color-border);border-radius:var(--radius-xl);
          background:var(--color-bg-secondary);color:var(--text-primary);font-weight:600;font-size:0.9375rem;cursor:pointer;font-family:inherit">
          إلغاء
        </button>
      </div>
    </div>
  `);
}

async function doLogout() {
  closeModal();
  await Auth.logout();
  State.clearUserState();
  showAuth();
  State.showToast('تم تسجيل الخروج بنجاح');
}

// ── Onboarding ─────────────────────────────────────────────
function showOnboarding() {
  document.getElementById('app-shell').innerHTML = renderOnboarding();
  _onboardingData = onboardingStepData();
}

function onboardingNext() {
  const data = _onboardingData;
  if (!data) return;

  // Gather data from current step
  const currentStep = data.steps[data.getStep()];

  if (currentStep.hasInput) {
    const input = document.getElementById('onboarding-name-input');
    if (input && input.value.trim()) {
      data.setUserName(input.value.trim());
    }
  }

  const nextStep = data.getStep() + 1;

  if (nextStep >= data.steps.length) {
    // Complete onboarding
    State.completeOnboarding(data.getUserName(), data.getCategories());
    showApp();
    navigate('home');
    State.showToast('🌿 مرحباً بك في غِراس!');
    return;
  }

  data.setStep(nextStep);
  updateOnboardingStep(data, nextStep);
}

function onboardingSkip() {
  State.completeOnboarding('', ['quran', 'prayer', 'athkar']);
  showApp();
  navigate('home');
}

function updateOnboardingStep(data, step) {
  const s = data.steps[step];

  // Art
  document.getElementById('onboarding-art').textContent = s.emoji;

  // Text
  document.getElementById('onboarding-text').innerHTML = `
    <h2 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3)">${s.title}</h2>
    <p style="font-size:var(--font-size-md);color:var(--text-secondary);line-height:1.8">${s.desc}</p>
  `;

  // Dynamic content
  const dynEl = document.getElementById('onboarding-dynamic');
  if (s.hasInput) {
    dynEl.innerHTML = `
      <input id="onboarding-name-input" class="form-input"
        type="text" placeholder="اسمك الكريم..." value="${data.getUserName()}"
        maxlength="20" autofocus
        oninput="document.getElementById('onboarding-action').disabled = !this.value.trim()"
      >
    `;
  } else if (s.hasCategories) {
    dynEl.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${data.categories.map(c => `
          <button id="cat-${c.id}" onclick="App.toggleOnboardingCategory('${c.id}')"
            style="width:100%;padding:var(--space-4);border-radius:var(--radius-xl);
            background:${data.getCategories().includes(c.id) ? 'var(--color-primary)' : 'var(--color-bg-card)'};
            color:${data.getCategories().includes(c.id) ? 'var(--text-inverted)' : 'var(--text-primary)'};
            border:1px solid ${data.getCategories().includes(c.id) ? 'var(--color-primary)' : 'var(--color-border)'};
            font-family:var(--font-family);font-size:var(--font-size-md);font-weight:600;
            cursor:pointer;display:flex;align-items:center;gap:var(--space-3);transition:all 0.2s;text-align:right">
            <span style="font-size:1.5rem">${c.emoji}</span>
            ${c.label}
            ${data.getCategories().includes(c.id) ? '<span class="material-symbols-outlined icon-fill" style="margin-right:auto;color:var(--color-gold)">check_circle</span>' : ''}
          </button>
        `).join('')}
      </div>
    `;
  } else {
    dynEl.innerHTML = '';
  }

  // Action button
  document.getElementById('onboarding-action').textContent = s.action;

  // Dots
  document.querySelectorAll('.onboarding-dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === step);
  });
}

function toggleOnboardingCategory(catId) {
  if (!_onboardingData) return;
  _onboardingData.toggleCategory(catId);
  updateOnboardingStep(_onboardingData, _onboardingData.getStep());
}

// ── App Shell ──────────────────────────────────────────────
function showApp() {
  document.getElementById('app-shell').innerHTML = buildAppShell();
  updateHeader();
}

function buildAppShell() {
  return `
  <!-- Header -->
  <header class="app-header" id="app-header">
    <div class="app-header__inner">
      <div class="app-header__brand">
        <div class="app-header__logo">
          <span class="material-symbols-outlined icon-fill" style="font-size:1.25rem">spa</span>
        </div>
        <span class="app-header__name">غِراس</span>
      </div>
      <div style="display:flex;align-items:center;gap:var(--space-2)">
        <div id="header-xp" style="display:flex;align-items:center;gap:var(--space-1);padding:var(--space-1) var(--space-3);border-radius:var(--radius-full);background:var(--color-gold-light);border:1px solid rgba(184,142,79,0.3)">
          <span style="font-size:0.6875rem;font-weight:700;color:var(--color-gold)">⭐ 0 XP</span>
        </div>
        <button class="header-avatar-btn" onclick="App.navigate('profile')" id="header-avatar">
          <span>${State.get().user.avatar || 'م'}</span>
        </button>
      </div>
    </div>
  </header>

  <!-- Screen Container -->
  <main id="screen-container" role="main" style="flex:1;display:flex;flex-direction:column"></main>

  <!-- Bottom Navigation -->
  <nav class="app-nav" role="navigation" aria-label="التنقل الرئيسي">
    <div class="app-nav__inner">
      ${Object.values(SCREENS).map(screen => `
        <button class="nav-tab ${screen.id === 'home' ? 'active' : ''}"
                id="nav-${screen.id}"
                role="tab"
                aria-selected="${screen.id === 'home'}"
                onclick="App.navigate('${screen.id}')">
          <span class="material-symbols-outlined ${screen.id === 'home' ? 'icon-fill' : ''}">${screen.icon}</span>
          <span>${screen.label}</span>
        </button>
      `).join('')}
    </div>
  </nav>

  <!-- Toast Container -->
  <div id="toast-container" aria-live="polite"></div>

  <!-- Modal -->
  <div id="modal-overlay" class="modal-overlay" onclick="App.closeModal(event)">
    <div class="modal-sheet" id="modal-sheet">
      <div class="modal-handle"></div>
      <div id="modal-content"></div>
    </div>
  </div>
  `;
}

// ── Navigation ─────────────────────────────────────────────
function navigate(screenId, params = null) {
  if (!SCREENS[screenId]) return;
  _currentScreen = screenId;
  State.setActiveTab(screenId);

  // Render screen
  const container = document.getElementById('screen-container');
  if (!container) return;

  container.innerHTML = `
    <div class="screen active" id="screen-${screenId}" role="tabpanel">
      ${SCREENS[screenId].render(params)}
    </div>
  `;

  // Update nav
  Object.values(SCREENS).forEach(s => {
    const tab = document.getElementById(`nav-${s.id}`);
    if (!tab) return;
    const isActive = s.id === screenId;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive);
    const icon = tab.querySelector('.material-symbols-outlined');
    if (icon) icon.classList.toggle('icon-fill', isActive);
  });

  // Scroll position: for Mushaf screen, align specifically to Mushaf frame; for other screens reset to top
  if (screenId === 'wird') {
    alignMushafScrollPosition();
  } else {
    container.scrollTop = 0;
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  updateHeader();

  // Sync live companion stats if on suhba screen
  if (screenId === 'suhba') {
    syncSuhbaLive();
  }
}

async function syncSuhbaLive() {
  try {
    const s = State.get();
    const comps = s.suhba?.companions || [];
    const userIds = comps.map(c => c.userTag || c.userId || c.id).filter(Boolean);

    // 1. Batch fetch companion live stats
    const apiBase = Auth.getApiBaseUrl();
    if (userIds.length > 0) {
      try {
        const res = await fetch(`${apiBase}/api/users/stats-batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds })
        });
        const ct = res.headers.get('content-type') || '';
        if (res.ok && ct.includes('json')) {
          const data = await res.json();
          if (data.stats && data.stats.length > 0) {
            State.updateCompanionsFromBatch(data.stats);
          }
        }
      } catch (e) {}
    }

    // 2. Fetch user's competition groups
    try {
      const token = Auth.getToken();
      const currentUser = Auth.getCurrentUser();
      const groupRes = await fetch(`${apiBase}/api/groups/my`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'x-guest-id': currentUser ? currentUser.id : 'guest_user'
        }
      });
      const groupCt = groupRes.headers.get('content-type') || '';
      if (groupRes.ok && groupCt.includes('json')) {
        const groupData = await groupRes.json();
        if (Array.isArray(groupData.groups)) {
          State.setGroups(groupData.groups);
        }
      }
    } catch (e) {}

    // 3. Fetch incoming spiritual nudges
    await loadIncomingNudges();

    // Re-render if still on Suhba screen
    if (_currentScreen === 'suhba') {
      const container = document.getElementById('screen-container');
      if (container) {
        container.innerHTML = `
          <div class="screen active" id="screen-suhba" role="tabpanel">
            ${SCREENS.suhba.render()}
          </div>
        `;
      }
    }
  } catch (err) {
    // Non-critical background sync
  }
}

// ── Header ──────────────────────────────────────────────────
function updateHeader() {
  const s = State.get();
  const xpEl = document.getElementById('header-xp');
  const avatarEl = document.getElementById('header-avatar');
  const n = State.toArabicNum;

  if (xpEl) xpEl.innerHTML = `<span style="font-size:0.6875rem;font-weight:700;color:var(--color-gold)">⭐ ${n(s.user.xp)} XP</span>`;
  if (avatarEl) avatarEl.innerHTML = `<span>${s.user.avatar || 'م'}</span>`;
}

function updateNavBadges() {
  // Nothing dynamic for now — tabs update on navigation
}

// ── Habit Actions ──────────────────────────────────────────
function toggleHabit(habitId, event) {
  const s = State.get();
  const habit = s.habits.find(h => h.id === habitId);
  if (!habit) return;

  // Determine next status
  if (habit.todayStatus === 'pending') {
    State.completeHabit(habitId, 'min');
    State.showToast(`✅ أحسنت! ${habit.name} — الحد الأدنى مكتمل`);
    // Ripple
    createRipple(event);
    navigate(_currentScreen); // re-render
  } else if (habit.todayStatus === 'min_done' && habit.extraGoal) {
    State.completeHabit(habitId, 'extra');
    State.showToast(`⭐ ممتاز! أكملت الهدف الإضافي`);
    createRipple(event);
    navigate(_currentScreen);
  }
}

function createRipple(event) {
  if (!event || !event.currentTarget) return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const r = document.createElement('span');
  r.className = 'ripple-effect';
  r.style.left = `${event.clientX - rect.left - 10}px`;
  r.style.top  = `${event.clientY - rect.top - 10}px`;
  el.appendChild(r);
  setTimeout(() => r.remove(), 600);
}

function toggleHabitActive(habitId, active) {
  State.set(s => {
    const h = s.habits.find(h => h.id === habitId);
    if (h) h.active = active;
  });
  State.showToast(active ? `✅ تم تفعيل العادة` : `⏸ تم إيقاف العادة مؤقتاً`);
  navigate(_currentScreen);
}

function acceptUpgrade(habitId) {
  State.upgradeHabitGoal(habitId);
  State.set(s => { s._upgradeAcknowledged = true; });
  navigate(_currentScreen);
}

function dismissUpgrade() {
  State.set(s => { s._upgradeAcknowledged = true; });
  const el = document.getElementById('upgrade-suggestion');
  if (el) {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.25s ease';
    setTimeout(() => el.remove(), 250);
  }
}

// ── Classical Mushaf State & Variables ─────────────────────
let _currentMushafFontSize = 1.45;
let _selectedAyahData = null;

// ── Wird / Classical Mushaf Actions ─────────────────────────
function switchWirdTab(tab) {
  _wirdActiveTab = tab;
  setWirdTab(tab);
  const quranTab   = document.getElementById('wird-quran-tab');
  const athkarTab  = document.getElementById('wird-athkar-tab');
  const btnQuran   = document.getElementById('wird-tab-quran');
  const btnAthkar  = document.getElementById('wird-tab-athkar');

  if (tab === 'quran') {
    if (quranTab) quranTab.style.display = '';
    if (athkarTab) athkarTab.style.display = 'none';
    if (btnQuran) {
      btnQuran.style.background = 'var(--color-primary)';
      btnQuran.style.color      = 'var(--text-inverted)';
    }
    if (btnAthkar) {
      btnAthkar.style.background = 'transparent';
      btnAthkar.style.color      = 'var(--text-secondary)';
    }
  } else {
    if (quranTab) quranTab.style.display = 'none';
    if (athkarTab) {
      athkarTab.style.display = '';
      athkarTab.innerHTML = renderAthkarTabContent();
    }
    if (btnAthkar) {
      btnAthkar.style.background = 'var(--color-primary)';
      btnAthkar.style.color      = 'var(--text-inverted)';
    }
    if (btnQuran) {
      btnQuran.style.background = 'transparent';
      btnQuran.style.color      = 'var(--text-secondary)';
    }
  }
}

function scrollToMushafTop(smooth = true) {
  const mushafPage = document.getElementById('mushaf-page');
  if (mushafPage) {
    try {
      mushafPage.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'start'
      });
    } catch (e) {
      const rect = mushafPage.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
      window.scrollTo(0, Math.max(0, scrollTop + rect.top - 10));
    }
  } else {
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }
}

function alignMushafScrollPosition() {
  const mushafPage = document.getElementById('mushaf-page');
  if (!mushafPage) return;

  // Immediate snap
  scrollToMushafTop(false);

  // Frame refine
  requestAnimationFrame(() => {
    scrollToMushafTop(false);
  });

  // Smooth settle after fonts and layout complete
  setTimeout(() => {
    scrollToMushafTop(true);
  }, 80);

  // Final lock for mobile browser address-bar transitions
  setTimeout(() => {
    scrollToMushafTop(false);
  }, 220);
}

function goToPage(pageNum, direction = 'auto') {
  closeAyahAction();
  const currentP = State.get().quranProgress?.currentPage || 1;
  const p = Math.max(1, Math.min(604, parseInt(pageNum, 10) || 1));

  let animDir = direction;
  if (animDir === 'auto') {
    animDir = p > currentP ? 'next' : (p < currentP ? 'prev' : null);
  }

  const surahMeta = getSurahForPage(p);

  State.set(s => {
    if (!s.quranProgress) s.quranProgress = {};
    s.quranProgress.currentPage = p;
    // Browsing pages does NOT automatically mark lastReadPage!
    if (surahMeta) {
      s.quranProgress.currentSurahId = surahMeta.number;
    }
  });

  console.log(`[GHIRAS Mushaf] Navigating to page ${p} (${surahMeta?.name || 'القرآن الكريم'}), direction: ${animDir}`);

  // Re-render the page with navigate
  navigate('wird', p);

  // Position viewport right at the top of the Mushaf golden frame
  alignMushafScrollPosition();

  // Trigger animation and ensure perfect alignment after layout
  requestAnimationFrame(() => {
    const page = document.getElementById('mushaf-page');
    if (page) {
      page.classList.remove('mushaf-flip-next', 'mushaf-flip-prev');
      if (animDir === 'next') {
        void page.offsetWidth;
        page.classList.add('mushaf-flip-next');
      } else if (animDir === 'prev') {
        void page.offsetWidth;
        page.classList.add('mushaf-flip-prev');
      }
    }
    if (_audioState.isPlaying || _audioInstance) {
      highlightPlayingAyah(_audioState.surahNumber, _audioState.ayahNumber);
      updateAudioBarUI();
    }
  });
}

function refreshMushafView() {
  if (_currentScreen === 'wird' && _wirdActiveTab === 'quran') {
    const s = State.get();
    const curPage = s.quranProgress?.currentPage || 1;
    goToPage(curPage);
  }
}

function selectSurah(surahId) {
  closeAyahAction();
  const page = getPageOfSurah(surahId) || 1;
  State.set(s => {
    s.quranProgress.currentSurahId = surahId;
    s.quranProgress.currentPage = page;
    // Do NOT set lastReadPage here
  });
  navigate('wird', page);
  alignMushafScrollPosition();
}

function openPageJumpModal() {
  const s = State.get();
  const n = State.toArabicNum;
  const cur = s.quranProgress.currentPage || 1;

  openModal(`
    <div style="padding-bottom:var(--space-2)">
      <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-2)">
        <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold);font-size:1.5rem">find_in_page</span>
        <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin:0">انتقال إلى صفحة بالمصحف</h3>
      </div>
      <p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-4)">
        المصحف الشريف ٦٠٤ صفحات — أدخل رقم الصفحة للانتقال إليها فوراً
      </p>

      <div style="display:flex;gap:var(--space-2);margin-bottom:var(--space-4)">
        <input type="number" id="page-jump-input" min="1" max="604" value="${cur}"
          class="form-input" style="font-size:1.25rem;font-weight:700;text-align:center;padding:var(--space-3)" placeholder="رقم الصفحة (١ - ٦٠٤)">
        <button class="btn btn--primary" style="width:auto;padding:0 var(--space-5)" onclick="App.submitPageJump()">
          انتقال
        </button>
      </div>

      <div style="font-size:var(--font-size-xs);font-weight:600;color:var(--text-muted);margin-bottom:var(--space-2)">
        محطات وسور رئيسية:
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:var(--space-2)">
        ${[
          { name: 'الفاتحة', page: 1 },
          { name: 'أول البقرة', page: 2 },
          { name: 'آل عمران', page: 50 },
          { name: 'الكهف', page: 293 },
          { name: 'يس', page: 440 },
          { name: 'الملك', page: 562 },
          { name: 'جزء عم', page: 582 },
          { name: 'الكوثر', page: 602 },
          { name: 'الإخلاص والناس', page: 604 },
        ].map(item => `
          <button onclick="App.goToPage(${item.page});App.closeModal()"
            class="chip chip--neutral" style="cursor:pointer;padding:var(--space-2) var(--space-3);font-size:var(--font-size-xs)">
            <span>${item.name} (ص ${n(item.page)})</span>
          </button>
        `).join('')}
      </div>
    </div>
  `);

  setTimeout(() => {
    const inp = document.getElementById('page-jump-input');
    if (inp) {
      inp.focus();
      inp.select();
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submitPageJump();
      });
    }
  }, 100);
}

function submitPageJump() {
  const inp = document.getElementById('page-jump-input');
  if (!inp) return;
  const val = parseInt(inp.value, 10);
  if (isNaN(val) || val < 1 || val > 604) {
    State.showToast('⚠️ يرجى إدخال رقم صفحة بين ١ و ٦٠٤');
    return;
  }
  closeModal();
  goToPage(val);
}

function openSurahIndex() {
  const s = State.get();
  const surahs = getAllSurahs();
  const curPage = s.quranProgress.currentPage || 1;

  openModal(`
    <div style="padding-bottom:var(--space-2)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold);font-size:1.5rem">menu_book</span>
          <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin:0">فهرس سور القرآن (١١٤ سورة)</h3>
        </div>
        <button onclick="App.closeModal()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Search input -->
      <div style="position:relative;margin-bottom:var(--space-3)">
        <input type="text" id="surah-search-input" class="form-input"
          placeholder="ابحث باسم السورة أو رقمها (مثال: الكهف، 18، الملك)..."
          style="padding-left:1rem;padding-right:2.5rem"
          oninput="App.filterSurahIndex(this.value)">
        <span class="material-symbols-outlined" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted)">search</span>
      </div>

      <div id="surah-index-list" style="display:flex;flex-direction:column;gap:var(--space-2);max-height:55vh;overflow-y:auto;padding:0 2px">
        ${renderSurahListItems(surahs, curPage)}
      </div>
    </div>
  `);

  setTimeout(() => {
    const sInp = document.getElementById('surah-search-input');
    if (sInp) sInp.focus();
  }, 100);
}

function renderSurahListItems(surahs, curPage) {
  const n = State.toArabicNum;
  if (!surahs || surahs.length === 0) {
    return `
      <div style="text-align:center;padding:var(--space-6);color:var(--text-muted)">
        لا توجد سورة مطابقة للبحث
      </div>
    `;
  }

  return surahs.map(surah => {
    const isCurrent = surah.page <= curPage && (surah.page + Math.ceil(surah.ayahCount / 15)) >= curPage;
    return `
      <div onclick="App.selectSurah(${surah.number});App.closeModal()"
           style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-3) var(--space-4);background:${isCurrent ? 'var(--color-gold-light)' : 'var(--color-bg-secondary)'};border:1px solid ${isCurrent ? 'var(--color-gold)' : 'var(--color-border)'};border-radius:var(--radius-xl);cursor:pointer;transition:all 0.15s">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="width:2rem;height:2rem;border-radius:50%;background:var(--color-bg-card);border:1px solid var(--color-border);display:flex;align-items:center;justify-content:center;font-family:var(--font-quran);font-weight:700;font-size:0.85rem;color:var(--mushaf-gold-dark)">
            ${n(surah.number)}
          </div>
          <div>
            <div style="font-family:var(--font-quran);font-size:1.15rem;font-weight:700;color:var(--text-primary)">
              سورة ${surah.name}
            </div>
            <div style="font-size:var(--font-size-xs);color:var(--text-muted)">
              ${surah.type} • ${n(surah.ayahCount)} آية • ص ${n(surah.page || 1)}
            </div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="chip chip--neutral" style="font-size:0.7rem">جزء ${n(surah.juz || 1)}</span>
          <span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--text-muted)">chevron_left</span>
        </div>
      </div>
    `;
  }).join('');
}

function filterSurahIndex(query) {
  const container = document.getElementById('surah-index-list');
  if (!container) return;
  const q = (query || '').trim().toLowerCase();
  const surahs = getAllSurahs();
  const s = State.get();
  const curPage = s.quranProgress.currentPage || 1;

  if (!q) {
    container.innerHTML = renderSurahListItems(surahs, curPage);
    return;
  }

  const filtered = surahs.filter(item => {
    return item.name.includes(q) ||
           item.fullName.includes(q) ||
           String(item.number) === q ||
           (item.englishName && item.englishName.toLowerCase().includes(q));
  });

  container.innerHTML = renderSurahListItems(filtered, curPage);
}

function adjustMushafFontSize(delta) {
  _currentMushafFontSize = Math.max(1.1, Math.min(2.3, _currentMushafFontSize + (delta * 0.1)));
  const flows = document.querySelectorAll('.mushaf-body');
  flows.forEach(flow => {
    flow.style.setProperty('--mushaf-font-size', `${_currentMushafFontSize}rem`);
  });
  State.showToast(`حجم الخط: ${Math.round(_currentMushafFontSize * 100 / 1.45)}%`);
}

function toggleMushafFocus(enable) {
  document.body.classList.toggle('mushaf-focus-active', enable);
  if (enable) {
    State.showToast('📖 وضع الخشوع — تفرّغ كامل لتلاوة القرآن الكريم');
  } else {
    State.showToast('تمت العودة للواجهة المعتادة');
  }
}

function openAyahAction(surahId, ayahNum, event) {
  if (event) event.stopPropagation();

  const surah = getSurah(surahId) || getSurahById(surahId);
  if (!surah) return;
  const ayah = (surah.ayat && surah.ayat.find(a => a.number === ayahNum)) || {
    number: ayahNum,
    text: 'الآية الكريمة'
  };

  _selectedAyahData = { surah, ayah, ayahNum };

  // Highlight in text
  document.querySelectorAll('.mushaf-ayah').forEach(el => el.classList.remove('selected'));
  const targetEl = document.getElementById(`mushaf-ayah-${surahId}-${ayahNum}`) || document.getElementById(`mushaf-ayah-${ayahNum}`);
  if (targetEl) targetEl.classList.add('selected');

  // Populate sheet
  const titleEl   = document.getElementById('ayah-sheet-title');
  const textEl    = document.getElementById('ayah-sheet-text');
  const tafseerEl = document.getElementById('ayah-sheet-tafseer');
  const playBtn   = document.getElementById('ayah-play-audio-btn');
  const n = State.toArabicNum;

  if (titleEl) {
    titleEl.innerHTML = `
      <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">auto_stories</span>
      <span>سورة ${surah.name} — آية ${n(ayahNum)}</span>
    `;
  }

  if (textEl) textEl.textContent = ayah.text;
  if (tafseerEl) tafseerEl.textContent = ayah.tafseer || 'تأمّل في معاني هذه الآية الكريمة، واستحضر قلبك مع كتاب الله تعالى.';

  if (playBtn) {
    const isThisPlaying = _audioState.isPlaying && _audioState.surahNumber === surah.number && _audioState.ayahNumber === ayahNum;
    playBtn.innerHTML = `
      <span class="material-symbols-outlined">${isThisPlaying ? 'pause_circle' : 'play_circle'}</span>
      <span>${isThisPlaying ? 'إيقاف التلاوة' : 'تشغيل التلاوة المستمرة من هذه الآية'}</span>
    `;
  }

  // Sync reciter name in sheet
  const activeReciter = getReciter(State.get().settings.reciterId);
  const reciterLabel = document.getElementById('current-reciter-name');
  if (reciterLabel) {
    reciterLabel.textContent = `تلاوة الشيخ ${activeReciter.name}`;
  }

  // Sync repeat chip active state
  const chips = [
    { id: 'chip-repeat-1', mode: 1 },
    { id: 'chip-repeat-2', mode: 2 },
    { id: 'chip-repeat-3', mode: 3 },
    { id: 'chip-repeat-inf', mode: Infinity }
  ];
  chips.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) {
      if (c.mode === _audioState.repeatMode) el.classList.add('active');
      else el.classList.remove('active');
    }
  });

  const repInd = document.getElementById('ayah-repeat-indicator');
  if (repInd) {
    if (_audioState.repeatMode === 1) repInd.textContent = 'بدون تكرار';
    else if (_audioState.repeatMode === 2) repInd.textContent = 'تكرار مرتين (٢x)';
    else if (_audioState.repeatMode === 3) repInd.textContent = 'تكرار ٣ مرات (٣x)';
    else if (_audioState.repeatMode === Infinity) repInd.textContent = 'تكرار دائم (∞)';
  }

  // Open Sheet
  const sheet = document.getElementById('ayah-action-sheet');
  if (sheet) sheet.classList.add('open');
}

function closeAyahAction() {
  const sheet = document.getElementById('ayah-action-sheet');
  if (sheet) sheet.classList.remove('open');
  document.querySelectorAll('.mushaf-ayah.selected').forEach(el => el.classList.remove('selected'));
  _selectedAyahData = null;
}

// ── Continuous Recitation & Repeat Engine ───────────────────

function setAudioRepeatMode(mode) {
  _audioState.repeatMode = mode;
  _audioState.repeatCounter = 1;

  const chips = [
    { id: 'chip-repeat-1', mode: 1 },
    { id: 'chip-repeat-2', mode: 2 },
    { id: 'chip-repeat-3', mode: 3 },
    { id: 'chip-repeat-inf', mode: Infinity }
  ];
  chips.forEach(c => {
    const el = document.getElementById(c.id);
    if (el) {
      if (c.mode === mode) el.classList.add('active');
      else el.classList.remove('active');
    }
  });

  const ind = document.getElementById('ayah-repeat-indicator');
  if (ind) {
    if (mode === 1) ind.textContent = 'بدون تكرار';
    else if (mode === 2) ind.textContent = 'تكرار مرتين (٢x)';
    else if (mode === 3) ind.textContent = 'تكرار ٣ مرات (٣x)';
    else if (mode === Infinity) ind.textContent = 'تكرار دائم (∞)';
  }

  updateAudioBarUI();

  const labels = {
    1: 'تلاوة مستمرة بدون تكرار',
    2: 'تكرار كل آية مرتين (٢x)',
    3: 'تكرار كل آية ٣ مرات (٣x)',
    Infinity: 'تكرار مستمر للآية الحالية (∞)'
  };
  State.showToast(`🔁 وضع التكرار: ${labels[mode] || mode}`);
}

function audioCycleRepeatMode() {
  const modes = [1, 2, 3, Infinity];
  const idx = modes.indexOf(_audioState.repeatMode);
  const nextMode = modes[(idx + 1) % modes.length];
  setAudioRepeatMode(nextMode);
}

function playCurrentAyahAudio() {
  if (!_selectedAyahData) return;
  const { surah, ayah } = _selectedAyahData;
  const isThisPlaying = _audioState.isPlaying && _audioState.surahNumber === surah.number && _audioState.ayahNumber === ayah.number;
  
  if (isThisPlaying) {
    audioTogglePlayPause();
  } else {
    playAyahContinuous(surah.number, ayah.number);
  }
  closeAyahAction();
}

function playAyahContinuous(surahNumber, ayahNumber) {
  const sNum = parseInt(surahNumber, 10);
  const aNum = parseInt(ayahNumber, 10);
  const surah = getSurah(sNum);
  if (!surah) return;

  const ayahObj = getAyah(sNum, aNum);
  const targetPage = ayahObj ? ayahObj.page : (surah.page || 1);

  _audioState.surahNumber = sNum;
  _audioState.surahName = surah.name;
  _audioState.ayahNumber = aNum;
  _audioState.page = targetPage;
  _audioState.isPlaying = true;

  // If the target ayah is on another page, navigate there
  const curPage = State.get().quranProgress.currentPage || 1;
  if (targetPage && targetPage !== curPage) {
    goToPage(targetPage);
  }

  // Highlight active ayah on page
  highlightPlayingAyah(sNum, aNum);

  if (_audioInstance) {
    _audioInstance.pause();
    _audioInstance.onended = null;
    _audioInstance.onerror = null;
  }

  const reciterId = State.get().settings.reciterId || 'alafasy';
  const reciter = getReciter(reciterId);
  const pad3 = (num) => String(num).padStart(3, '0');
  const audioUrl = `https://everyayah.com/data/${reciter.folder}/${pad3(sNum)}${pad3(aNum)}.mp3`;

  updateAudioBarUI();

  _audioInstance = new Audio(audioUrl);
  _audioInstance.play().then(() => {
    _audioState.isPlaying = true;
    updateAudioBarUI();
  }).catch(err => {
    console.warn('Audio playback error', err);
    _audioState.isPlaying = false;
    updateAudioBarUI();
    State.showToast('تعذر تشغيل التلاوة، تأكد من اتصال الإنترنت');
  });

  _audioInstance.onended = () => {
    handleAyahEnded();
  };

  _audioInstance.onerror = () => {
    console.warn('Audio stream error', sNum, aNum);
    _audioState.isPlaying = false;
    updateAudioBarUI();
  };
}

function handleAyahEnded() {
  const { repeatMode, repeatCounter, surahNumber, ayahNumber } = _audioState;
  const reciterId = State.get().settings.reciterId || 'alafasy';
  const reciter = getReciter(reciterId);
  const pad3 = (num) => String(num).padStart(3, '0');

  // Repeat current ayah if mode requires
  if (repeatMode === Infinity || repeatCounter < repeatMode) {
    _audioState.repeatCounter++;
    updateAudioBarUI();
    const audioUrl = `https://everyayah.com/data/${reciter.folder}/${pad3(surahNumber)}${pad3(ayahNumber)}.mp3`;
    _audioInstance = new Audio(audioUrl);
    _audioInstance.play().then(() => {
      _audioState.isPlaying = true;
      updateAudioBarUI();
    }).catch(e => console.warn(e));
    _audioInstance.onended = () => handleAyahEnded();
    return;
  }

  // Done with repeats, advance to next ayah
  _audioState.repeatCounter = 1;
  const next = getNextAyah(surahNumber, ayahNumber);
  if (next) {
    playAyahContinuous(next.surahNumber, next.ayahNumber);
  } else {
    stopAyahAudio();
    State.showToast('✨ تم ختم الاستماع لسور القرآن الكريم، تقبل الله منكم');
  }
}

function audioTogglePlayPause() {
  if (!_audioInstance) {
    const s = State.get();
    const curPage = s.quranProgress.currentPage || 1;
    const pageObj = getPage(curPage);
    if (pageObj && pageObj.blocks && pageObj.blocks[0] && pageObj.blocks[0].ayahs[0]) {
      playAyahContinuous(pageObj.blocks[0].surahNumber, pageObj.blocks[0].ayahs[0].number);
    }
    return;
  }

  if (_audioState.isPlaying) {
    _audioInstance.pause();
    _audioState.isPlaying = false;
    updateAudioBarUI();
  } else {
    _audioInstance.play().then(() => {
      _audioState.isPlaying = true;
      updateAudioBarUI();
    }).catch(err => {
      console.warn('Audio resume error', err);
    });
  }
}

function audioPlayNextAyah() {
  const next = getNextAyah(_audioState.surahNumber, _audioState.ayahNumber);
  if (next) {
    _audioState.repeatCounter = 1;
    playAyahContinuous(next.surahNumber, next.ayahNumber);
  } else {
    State.showToast('أنت عند آخر آية في القرآن الكريم');
  }
}

function audioPlayPrevAyah() {
  const prev = getPrevAyah(_audioState.surahNumber, _audioState.ayahNumber);
  if (prev) {
    _audioState.repeatCounter = 1;
    playAyahContinuous(prev.surahNumber, prev.ayahNumber);
  } else {
    State.showToast('أنت عند أول آية في القرآن الكريم');
  }
}

function stopAyahAudio() {
  if (_audioInstance) {
    _audioInstance.pause();
    _audioInstance.onended = null;
    _audioInstance = null;
  }
  _audioState.isPlaying = false;
  _audioState.repeatCounter = 1;

  document.querySelectorAll('.mushaf-ayah.is-playing, .mushaf-ayah-end.is-playing').forEach(el => {
    el.classList.remove('is-playing');
  });

  const bar = document.getElementById('mushaf-audio-bar');
  if (bar) bar.classList.remove('active');
}

function audioBarJumpToCurrentPage() {
  if (_audioState.page) {
    goToPage(_audioState.page);
    highlightPlayingAyah(_audioState.surahNumber, _audioState.ayahNumber);
  }
}

function highlightPlayingAyah(surahNum, ayahNum) {
  document.querySelectorAll('.mushaf-ayah.is-playing, .mushaf-ayah-end.is-playing').forEach(el => {
    el.classList.remove('is-playing');
  });

  const ayahEl = document.getElementById(`mushaf-ayah-${surahNum}-${ayahNum}`);
  if (ayahEl) {
    ayahEl.classList.add('is-playing');
    const endEl = ayahEl.nextElementSibling;
    if (endEl && endEl.classList.contains('mushaf-ayah-end')) {
      endEl.classList.add('is-playing');
    }
    ayahEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function updateAudioBarUI() {
  const bar = document.getElementById('mushaf-audio-bar');
  if (!bar) return;

  if (_audioInstance || _audioState.isPlaying) {
    bar.classList.add('active');
  } else {
    bar.classList.remove('active');
    return;
  }

  const n = State.toArabicNum;
  const titleEl = document.getElementById('audio-bar-title');
  if (titleEl) {
    titleEl.textContent = `سورة ${_audioState.surahName} • آية ${n(_audioState.ayahNumber)}`;
  }

  const reciterId = State.get().settings.reciterId || 'alafasy';
  const reciter = getReciter(reciterId);
  const reciterNameEl = document.getElementById('audio-bar-reciter-name');
  if (reciterNameEl) {
    reciterNameEl.textContent = reciter.name;
  }

  const statusEl = document.getElementById('audio-bar-status');
  if (statusEl) {
    if (_audioState.repeatMode > 1 && _audioState.repeatMode !== Infinity) {
      statusEl.textContent = `تكرار ${n(_audioState.repeatCounter)} من ${n(_audioState.repeatMode)}`;
    } else if (_audioState.repeatMode === Infinity) {
      statusEl.textContent = `تكرار مستمر ∞`;
    } else {
      statusEl.textContent = _audioState.isPlaying ? 'تلاوة مستمرة' : 'متوقف مؤقتاً';
    }
  }

  const playIcon = document.getElementById('audio-bar-play-icon');
  if (playIcon) {
    playIcon.textContent = _audioState.isPlaying ? 'pause' : 'play_arrow';
  }

  const repeatLabel = document.getElementById('audio-bar-repeat-label');
  const repeatBtn = document.getElementById('audio-bar-repeat-btn');
  if (repeatLabel) {
    if (_audioState.repeatMode === 1) {
      repeatLabel.textContent = 'مستمر';
      if (repeatBtn) repeatBtn.classList.remove('is-active');
    } else if (_audioState.repeatMode === Infinity) {
      repeatLabel.textContent = 'تكرار ∞';
      if (repeatBtn) repeatBtn.classList.add('is-active');
    } else {
      repeatLabel.textContent = `${n(_audioState.repeatMode)}x تكرار`;
      if (repeatBtn) repeatBtn.classList.add('is-active');
    }
  }

  const pageBadge = document.getElementById('audio-bar-page-badge');
  if (pageBadge) {
    pageBadge.textContent = `ص ${n(_audioState.page || 1)}`;
  }
}

function bookmarkSelectedAyah() {
  if (!_selectedAyahData) return;
  const { surah, ayah } = _selectedAyahData;
  const n = State.toArabicNum;

  State.set(s => {
    s.quranProgress.lastReadSurahId = surah.id;
    s.quranProgress.lastReadAyah    = ayah.number;
  });

  State.showToast(`🔖 تم حفظ فاصل القراءة عند آية ${n(ayah.number)} من سورة ${surah.name}`);
  closeAyahAction();
}

function copySelectedAyah() {
  if (!_selectedAyahData) return;
  const { surah, ayah } = _selectedAyahData;
  const text = `﴿ ${ayah.text} ﴾ [سورة ${surah.name}: ${ayah.number}]`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      State.showToast('📋 تم نسخ الآية الكريمة');
    });
  } else {
    State.showToast('📋 تم تحديد الآية');
  }
}

function markSelectedAyahAsRead() {
  if (!_selectedAyahData) return;
  const { surah, ayah } = _selectedAyahData;
  const s = State.get();

  State.updateQuranProgress(1, surah.number, ayah.number, s.quranProgress.currentPage);
  State.completeHabit('quran-reading', 'min');

  const el = document.getElementById(`mushaf-ayah-${surah.number}-${ayah.number}`) || document.getElementById(`mushaf-ayah-${ayah.number}`);
  if (el) el.classList.add('read-done');

  State.showToast(`🌱 تم تسجيل الآية في وردك — جزاك الله خيراً ✨`);
  closeAyahAction();
}

function markAllRead() {
  const s = State.get();
  const surah = getSurahById(s.quranProgress.currentSurahId);
  if (!surah) return;

  State.updateQuranProgress(surah.ayat.length, surah.id, surah.ayat.length, s.quranProgress.currentPage);
  State.completeHabit('quran-reading', 'extra');
  State.showToast(`📖 مبارك! أكملت سورة ${surah.name} كاملة في وردك اليومي ✨`);

  // Visual feedback
  document.querySelectorAll('.mushaf-ayah').forEach(el => el.classList.add('read-done'));
}

function markPageRead() {
  const s = State.get();
  const curPage = s.quranProgress.currentPage || 1;
  const n = State.toArabicNum;

  // Record progress in state and complete habit
  State.updateQuranProgress(15, s.quranProgress.currentSurahId, 1, curPage);
  State.completeHabit('quran-reading', 'min');

  // Visual feedback: mark ayahs on this page as read
  document.querySelectorAll('.mushaf-ayah').forEach(el => el.classList.add('read-done'));

  if (curPage < 604) {
    const nextPage = curPage + 1;
    State.showToast(`📖 مبارك! تم تسجيل ص ${n(curPage)} — الانتقال إلى ص ${n(nextPage)} 🌿`);
    setTimeout(() => {
      goToPage(nextPage, 'next');
    }, 450);
  } else {
    State.showToast('🎉 مبارك ختم القرآن الكريم كاملاً! تقبل الله منكم ✨');
    openModal(`
      <div style="text-align:center;padding:var(--space-4)">
        <div style="font-size:4rem;margin-bottom:var(--space-2)">🌟</div>
        <h3 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">
          هنيئاً لك ختم المصحف الشريف!
        </h3>
        <p style="font-size:var(--font-size-base);color:var(--text-secondary);line-height:1.9;margin-bottom:var(--space-4)">
          أتممت قراءة القرآن الكريم كاملاً (٦٠٤ صفحات). تقبل الله طاعاتكم وكتب لكم بكل حرف حسنة إلى عشر أمثالها.
        </p>
        <button class="btn btn--primary" style="width:100%" onclick="App.closeModal()">
          الحمد لله رب العالمين
        </button>
      </div>
    `);
  }
}

function openTafseeer() {
  if (_selectedAyahData) {
    openAyahAction(_selectedAyahData.surah.id, _selectedAyahData.ayah.number);
  } else {
    const s = State.get();
    openAyahAction(s.quranProgress.currentSurahId, 1);
  }
}

function bookmarkAyah(surahId, ayahNum) {
  State.set(s => {
    s.quranProgress.lastReadSurahId = surahId;
    s.quranProgress.lastReadAyah    = ayahNum;
  });
  State.showToast('🔖 تم حفظ الفاصل في المصحف');
}

// ── Athkar & Prophetic Duas Hub Handlers ───────────────────
function switchAthkarCategory(catId) {
  setAthkarCategory(catId);
  setPrayerSub('all');
  setAthkarSearch('');
  const athkarTab = document.getElementById('wird-athkar-tab');
  if (athkarTab) {
    athkarTab.innerHTML = renderAthkarTabContent();
  }
}

function switchPrayerSub(sub) {
  setPrayerSub(sub);
  const athkarTab = document.getElementById('wird-athkar-tab');
  if (athkarTab) {
    athkarTab.innerHTML = renderAthkarTabContent();
  }
}

function onAthkarSearch(query) {
  setAthkarSearch(query);
  const athkarTab = document.getElementById('wird-athkar-tab');
  if (athkarTab) {
    athkarTab.innerHTML = renderAthkarTabContent();
    const inp = document.getElementById('athkar-search-input');
    if (inp) {
      inp.focus();
      inp.setSelectionRange(inp.value.length, inp.value.length);
    }
  }
}

function clearAthkarSearch() {
  setAthkarSearch('');
  const athkarTab = document.getElementById('wird-athkar-tab');
  if (athkarTab) {
    athkarTab.innerHTML = renderAthkarTabContent();
  }
}

function countThikr(thikrId, targetCount) {
  let current = 0;
  State.set(s => {
    s.athkarCounters = s.athkarCounters || {};
    current = (s.athkarCounters[thikrId] || 0);
    if (current < targetCount) {
      current++;
      s.athkarCounters[thikrId] = current;
    }
  });

  const n = State.toArabicNum;
  const btn = document.getElementById(`thikr-btn-${thikrId}`);
  const badge = document.getElementById(`thikr-count-${thikrId}`);
  const label = document.getElementById(`thikr-label-${thikrId}`);
  const card = document.getElementById(`thikr-card-${thikrId}`);

  if (badge) {
    badge.textContent = current >= targetCount ? `تم (${n(targetCount)})` : `${n(current)} / ${n(targetCount)}`;
  }

  if (current >= targetCount) {
    if (btn) btn.classList.add('completed');
    if (label) label.textContent = 'تم بحمد الله';
    if (card) {
      card.style.borderColor = 'var(--color-sage)';
      card.style.background = 'linear-gradient(180deg, #FFFFFF 0%, rgba(74, 107, 83, 0.05) 100%)';
    }
    State.showToast('✅ أتممت هذا الذكر المبارك — تقبل الله منك ✨');
  }
}

function resetThikr(thikrId) {
  State.set(s => {
    s.athkarCounters = s.athkarCounters || {};
    s.athkarCounters[thikrId] = 0;
  });

  const targetItem = ATHKAR_DUAS.find(d => d.id === thikrId);
  const target = targetItem ? targetItem.count : 1;
  const n = State.toArabicNum;

  const btn = document.getElementById(`thikr-btn-${thikrId}`);
  const badge = document.getElementById(`thikr-count-${thikrId}`);
  const label = document.getElementById(`thikr-label-${thikrId}`);
  const card = document.getElementById(`thikr-card-${thikrId}`);

  if (btn) btn.classList.remove('completed');
  if (label) label.textContent = 'انقر للعد والتكرار';
  if (badge) badge.textContent = `٠ / ${n(target)}`;
  if (card) {
    card.style.borderColor = '';
    card.style.background = '';
  }

  State.showToast('🔄 تم تصفير العدّاد');
}

function resetAllAthkar() {
  State.resetAllAthkar();
  const athkarTab = document.getElementById('wird-athkar-tab');
  if (athkarTab) {
    athkarTab.innerHTML = renderAthkarTabContent();
  }
  State.showToast('🔄 تم تصفير جميع عدّادات الأذكار بنجاح');
}

function copyThikr(thikrId) {
  const item = ATHKAR_DUAS.find(d => d.id === thikrId);
  if (!item) return;

  const copyText = `${item.title}\n\n${item.text}\n\n📌 فيمَ يفيد وفضله: ${item.benefit}${item.source ? `\n📖 المصدر: ${item.source}` : ''}\n\n— تطبيق غِراس (Ghiras)`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(copyText).then(() => {
      State.showToast('📋 تم نسخ الذكر وفضله كاملاً');
    }).catch(() => {
      State.showToast('📋 تم النسخ');
    });
  } else {
    State.showToast('📋 تم النسخ');
  }
}

function completeAthkar(habitId = 'morning-athkar') {
  const habitKey = habitId === 'evening-athkar' ? 'evening-athkar' : 'morning-athkar';
  const label = habitKey === 'evening-athkar' ? 'أذكار المساء' : 'أذكار الصباح';

  State.completeHabit(habitKey, 'min');
  State.showToast(`🤲 أتممت ${label} — تقبّل الله منك وكتب أجرك ✨`);

  const athkarTab = document.getElementById('wird-athkar-tab');
  if (athkarTab) {
    athkarTab.innerHTML = renderAthkarTabContent();
  }
}

function openAthkarCategory(catId, prayerSub = null) {
  setAthkarCategory(catId);
  if (prayerSub) setPrayerSub(prayerSub);
  setAthkarSearch('');
  navigate('wird');
  switchWirdTab('athkar');
  const athkarTab = document.getElementById('wird-athkar-tab');
  if (athkarTab) {
    athkarTab.innerHTML = renderAthkarTabContent();
  }
}

// ── Garden Actions ─────────────────────────────────────────
function waterGarden() {
  const btn = document.getElementById('water-btn');
  if (btn) {
    btn.style.transform = 'scale(0.85)';
    setTimeout(() => btn.style.transform = '', 300);
  }

  const s = State.get();
  if (State.getTodayProgress() > 0) {
    State.showToast('💧 الحديقة قد رُويت بعبادتك اليوم 🌿');
  } else {
    State.showToast('🌱 أكمل وردك اليومي لتسقي نبتتك');
  }
}

function shareGarden() {
  const s = State.get();
  const stage = getGardenStage(s.garden.streakDays);
  const n = State.toArabicNum;
  const text = `أنا في يوم ${n(s.garden.streakDays)} من رحلتي مع تطبيق غِراس 🌿\nنبتتي: ${stage.emoji} ${stage.label}\n#غراس #عادات_روحية`;

  if (navigator.share) {
    navigator.share({ title: 'غِراس — حديقتي', text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      State.showToast('📋 تم نسخ النص — شارك مع أحبابك');
    });
  }
}

// ── Social Actions ─────────────────────────────────────────
function encourageMember(groupId, memberId) {
  State.showToast('💌 تم إرسال التشجيع — جزاك الله خيراً');
}

function inviteFriend() {
  const text = 'جرّب تطبيق غِراس لبناء عادات روحية هادئة ومستمرة 🌿\nالقليل المستمر أفضل من الكثير المنقطع';
  if (navigator.share) {
    navigator.share({ title: 'غِراس', text });
  } else {
    navigator.clipboard.writeText(text).then(() => {
      State.showToast('📋 تم نسخ رسالة الدعوة');
    });
  }
}

function createGroup() {
  openModal(`
    <h3 style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:var(--space-4)">إنشاء مجموعة جديدة</h3>
    <div class="form-group" style="margin-bottom:var(--space-4)">
      <label class="form-label">اسم المجموعة</label>
      <input class="form-input" id="group-name-input" type="text" placeholder="مثال: أصحاب الفجر">
    </div>
    <button class="btn btn--primary" onclick="App.closeModal()">
      <span class="material-symbols-outlined icon-fill">group_add</span>
      إنشاء المجموعة
    </button>
    <p style="text-align:center;font-size:var(--font-size-xs);color:var(--text-muted);margin-top:var(--space-3)">
      قريباً — ميزة الصحبة قيد التطوير 🌿
    </p>
  `);
}

// ── Settings Actions ───────────────────────────────────────
function updateSetting(key, value) {
  State.updateSettings({ [key]: value });
}

// ── Smart Quran Alarms & Reminders Engine ───────────────────

function handleAlarmTrigger(reminder, todayKey) {
  State.markReminderTriggered(reminder.id, todayKey);
  playAlarmChime();
  sendAlarmNotification(reminder);
  showAlarmTriggerModal(reminder);
}

function onAlarmNotificationClick(reminder) {
  startReadingFromAlarm(reminder.id);
}

function formatReminderTime(t) {
  if (!t) return '';
  const parts = t.split(':');
  let h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  const ampm = h >= 12 ? 'م' : 'ص';
  h = h % 12;
  if (h === 0) h = 12;
  return `${State.toArabicNum(h)}:${State.toArabicNum(m)} ${ampm}`;
}

function openRemindersModal() {
  const reminders = State.getReminders();
  const n = State.toArabicNum;
  const hasNotifPerm = typeof Notification !== 'undefined' && Notification.permission === 'granted';

  openModal(`
    <div style="padding-bottom:var(--space-2)">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold);font-size:1.6rem">alarm</span>
          <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin:0">منبّه وتذكيرات القرآن الكريم</h3>
        </div>
        <button onclick="App.closeModal()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-bottom:var(--space-3);line-height:1.7">
        تنبيهات صوتية وإشعارات لطيفة تعينك على قراءة سورك المفضلة كالملك والكهف وملازمة وردك اليومي.
      </p>

      <!-- System Notification Banner if not granted -->
      ${!hasNotifPerm ? `
      <div style="background:var(--color-gold-light);border:1px solid var(--color-gold);border-radius:var(--radius-xl);padding:var(--space-3);margin-bottom:var(--space-3);display:flex;align-items:center;justify-content:space-between;gap:var(--space-2)">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined" style="color:var(--color-gold);font-size:1.3rem">notifications_active</span>
          <span style="font-size:0.75rem;color:var(--mushaf-gold-dark);font-weight:600">فعّل إشعارات المتصفح لتصلك حتى والتطبيق مغلق</span>
        </div>
        <button class="btn btn--sm" style="background:var(--color-gold);color:#1a0f00;font-size:0.75rem;padding:4px 8px;font-weight:700;border:none" onclick="App.requestAlarmNotificationPermission()">
          تفعيل
        </button>
      </div>` : ''}

      <!-- Reminders List -->
      <div style="display:flex;flex-direction:column;gap:var(--space-2);max-height:48vh;overflow-y:auto;padding:0 2px;margin-bottom:var(--space-4)">
        ${reminders.length === 0 ? `
          <div style="text-align:center;padding:var(--space-6);color:var(--text-muted)">
            لا يوجد منبهات حالياً. اضغط "إضافة منبه جديد" للبدء.
          </div>
        ` : reminders.map(rem => {
          const repLabel = rem.repeatType === 'friday' ? 'يوم الجمعة فقط' : (rem.repeatType === 'weekdays' ? 'أيام الأسبوع' : 'يومياً');
          const targetDesc = rem.type === 'surah' ? `سورة ${rem.surahName} (ص ${n(rem.page || 1)})` : (rem.type === 'wird' ? 'متابعة الورد القرآني' : 'الأذكار');
          return `
            <div class="reminder-card ${rem.enabled ? '' : 'disabled'}" id="rem-card-${rem.id}">
              <div style="display:flex;align-items:center;gap:var(--space-3)">
                <div style="text-align:center;min-width:70px">
                  <div class="reminder-card__time">${formatReminderTime(rem.time)}</div>
                  <div class="reminder-card__badge">${repLabel}</div>
                </div>
                <div>
                  <div class="reminder-card__title">${rem.title}</div>
                  <div style="font-size:0.75rem;color:var(--text-muted)">${targetDesc}</div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:var(--space-2)">
                <label class="toggle" style="margin:0">
                  <input type="checkbox" ${rem.enabled ? 'checked' : ''} onchange="App.toggleReminderItem('${rem.id}')">
                  <div class="toggle__track"></div>
                  <div class="toggle__thumb"></div>
                </label>
                <button onclick="App.deleteReminderItem('${rem.id}')" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px;display:flex" title="حذف المنبه">
                  <span class="material-symbols-outlined" style="font-size:1.2rem">delete</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;flex-direction:column;gap:var(--space-2)">
        <button class="btn btn--primary" onclick="App.openAddReminderModal()" style="width:100%">
          <span class="material-symbols-outlined">add_alarm</span>
          <span>إضافة منبّه جديد</span>
        </button>

        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn--secondary" onclick="App.testAlarmSound()" style="flex:1;font-size:0.8rem">
            <span class="material-symbols-outlined">notifications</span>
            <span>تجربة نغمة التنبيه</span>
          </button>
          <button class="btn btn--secondary" onclick="App.closeModal()" style="width:auto;padding:0 var(--space-4)">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  `);
}

function openAddReminderModal() {
  const surahs = getAllSurahs();
  const now = new Date();
  const defaultTime = `${String(now.getHours()).padStart(2, '0')}:00`;

  openModal(`
    <div style="padding-bottom:var(--space-2)">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
        <div style="display:flex;align-items:center;gap:var(--space-2)">
          <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold);font-size:1.5rem">add_alarm</span>
          <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin:0">إضافة منبّه قرآني جديد</h3>
        </div>
        <button onclick="App.openRemindersModal()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <!-- Form -->
      <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-4)">
        <!-- 1. Time Picker -->
        <div>
          <label style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-secondary);display:block;margin-bottom:4px">
            وقت التنبيه:
          </label>
          <input type="time" id="new-rem-time" value="${defaultTime}" class="form-input" style="font-size:1.2rem;font-weight:700;text-align:center">
        </div>

        <!-- 2. Target Preset Selector -->
        <div>
          <label style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-secondary);display:block;margin-bottom:4px">
            ماذا ترغب بالقراءة عند التنبيه؟
          </label>
          <select id="new-rem-target" class="form-input" onchange="App.onReminderTargetChange(this.value)" style="font-size:0.9rem">
            <optgroup label="سور مفضلة مستحبة">
              <option value="surah:67:سورة الملك قبل النوم" selected>🌙 سورة الملك (المانعة من عذاب القبر)</option>
              <option value="surah:18:سورة الكهف المباركة">🕌 سورة الكهف (نور بين الجمعتين)</option>
              <option value="surah:36:سورة يس المباركة">📖 سورة يس</option>
              <option value="surah:2:سورة البقرة المباركة">🛡️ سورة البقرة (بركة وطاردة للشياطين)</option>
              <option value="surah:56:سورة الواقعة">🌾 سورة الواقعة</option>
              <option value="surah:55:سورة الرحمن">🌸 سورة الرحمن</option>
            </optgroup>
            <optgroup label="الورد والأذكار">
              <option value="wird:0:الورد القرآني اليومي">📖 الورد القرآني اليومي (متابعة القراءة من حيث توقفت)</option>
              <option value="athkar_m:0:أذكار الصباح المباركة">🌅 أذكار الصباح وحصن المسلم</option>
              <option value="athkar_e:0:أذكار المساء المباركة">🌇 أذكار المساء وحصن المسلم</option>
            </optgroup>
            <optgroup label="جميع سور القرآن الكريم (١١٤ سورة)">
              ${surahs.map(s => `
                <option value="surah:${s.number}:سورة ${s.name}">سورة ${s.name} (${s.type} • ص ${s.page})</option>
              `).join('')}
            </optgroup>
          </select>
        </div>

        <!-- 3. Title input -->
        <div>
          <label style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-secondary);display:block;margin-bottom:4px">
            اسم التذكير (يظهر في الإشعار):
          </label>
          <input type="text" id="new-rem-title" value="سورة الملك قبل النوم" class="form-input" placeholder="عنوان التذكير...">
        </div>

        <!-- 4. Repeat options -->
        <div>
          <label style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-secondary);display:block;margin-bottom:4px">
            تكرار التنبيه:
          </label>
          <select id="new-rem-repeat" class="form-input" style="font-size:0.9rem">
            <option value="daily" selected>يومياً (كل يوم)</option>
            <option value="friday">يوم الجمعة فقط (لسورة الكهف)</option>
            <option value="weekdays">أيام الأسبوع (الأحد - الخميس)</option>
          </select>
        </div>
      </div>

      <!-- Submit & Cancel -->
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn--primary" onclick="App.saveNewReminder()" style="flex:1">
          <span class="material-symbols-outlined">save</span>
          <span>حفظ المنبّه</span>
        </button>
        <button class="btn btn--secondary" onclick="App.openRemindersModal()" style="width:auto;padding:0 var(--space-4)">
          رجوع
        </button>
      </div>
    </div>
  `);
}

function onReminderTargetChange(val) {
  const parts = (val || '').split(':');
  const title = parts[2] || '';
  const titleInput = document.getElementById('new-rem-title');
  const repeatSelect = document.getElementById('new-rem-repeat');
  if (titleInput && title) {
    titleInput.value = title;
  }
  if (parts[1] === '18' && repeatSelect) {
    repeatSelect.value = 'friday';
  } else if (repeatSelect && repeatSelect.value === 'friday') {
    repeatSelect.value = 'daily';
  }
}

function saveNewReminder() {
  const time = document.getElementById('new-rem-time')?.value || '21:00';
  const targetVal = document.getElementById('new-rem-target')?.value || 'surah:67:سورة الملك';
  const title = document.getElementById('new-rem-title')?.value || 'تذكير قرآني';
  const repeatType = document.getElementById('new-rem-repeat')?.value || 'daily';

  const parts = targetVal.split(':');
  const type = parts[0];
  const num = parseInt(parts[1], 10) || 0;
  const surahName = (type === 'surah' && num > 0) ? (getSurah(num)?.name || '') : '';
  const page = (type === 'surah' && num > 0) ? (getPageOfSurah(num) || 1) : 1;

  let days = [0, 1, 2, 3, 4, 5, 6];
  if (repeatType === 'friday') days = [5];
  else if (repeatType === 'weekdays') days = [0, 1, 2, 3, 4];

  State.addReminder({
    title,
    type,
    surahNumber: num,
    surahName,
    page,
    time,
    days,
    repeatType
  });

  State.showToast(`⏰ تم ضبط منبّه: ${title} عند ${formatReminderTime(time)}`);
  openRemindersModal();
}

function toggleReminderItem(id) {
  const enabled = State.toggleReminder(id);
  const card = document.getElementById(`rem-card-${id}`);
  if (card) {
    if (enabled) card.classList.remove('disabled');
    else card.classList.add('disabled');
  }
  State.showToast(enabled ? '🔔 تم تفعيل المنبه' : '🔕 تم إيقاف المنبه');
}

function deleteReminderItem(id) {
  State.deleteReminder(id);
  State.showToast('🗑️ تم حذف المنبه');
  openRemindersModal();
}

function testAlarmSound() {
  playAlarmChime();
  State.showToast('🔔 استمع لنغمة التنبيه الهادئة');
}

async function requestAlarmNotificationPermission() {
  const granted = await requestNotificationPermission();
  if (granted) {
    State.showToast('✅ تم تفعيل إشعارات التنبيه بنجاح!');
  } else {
    State.showToast('⚠️ يرجى السماح بالإشعارات من إعدادات المتصفح');
  }
  openRemindersModal();
}

function showAlarmTriggerModal(reminder) {
  openModal(`
    <div style="text-align:center;padding:var(--space-3)">
      <div class="alarm-bell-ring" style="font-size:3.5rem;margin-bottom:var(--space-2)">🔔</div>
      <div class="chip chip--gold" style="margin-bottom:var(--space-3)">
        <span>⏰ حان الآن موعدك مع كتاب الله</span>
      </div>

      <h2 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">
        ${reminder.title}
      </h2>

      <p style="font-size:var(--font-size-sm);color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-4);max-width:320px;margin-left:auto;margin-right:auto">
        ﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾<br>
        استقطع بضع دقائق من يومك وانعم بنور الآيات المباركة.
      </p>

      <div style="display:flex;flex-direction:column;gap:var(--space-2)">
        <button class="btn btn--primary btn--large" onclick="App.startReadingFromAlarm('${reminder.id}')" style="width:100%">
          <span class="material-symbols-outlined icon-fill">menu_book</span>
          <span>ابدأ القراءة الآن</span>
        </button>

        <button class="btn btn--secondary" onclick="App.snoozeAlarm('${reminder.id}')" style="width:100%">
          <span class="material-symbols-outlined">snooze</span>
          <span>تأجيل ١٠ دقائق</span>
        </button>

        <button class="btn--ghost btn" onclick="App.closeModal()">
          إغلاق التنبيه
        </button>
      </div>
    </div>
  `);
}

function startReadingFromAlarm(reminderId) {
  closeModal();
  const reminders = State.getReminders();
  const rem = reminders.find(r => r.id === reminderId);
  if (!rem) {
    navigate('wird');
    return;
  }

  if (rem.type === 'surah' && rem.surahNumber > 0) {
    const page = rem.page || getPageOfSurah(rem.surahNumber) || 1;
    goToPage(page);
    State.showToast(`📖 بارك الله في وقتك — بدأت سورة ${rem.surahName}`);
  } else if (rem.type === 'wird') {
    navigate('wird');
    State.showToast('📖 بارك الله في وردك القرآني اليومي');
  } else if (rem.type.startsWith('athkar')) {
    navigate('wird');
    switchWirdTab('athkar');
    State.showToast('🤲 أذكار مباركة وحصن لك');
  } else {
    navigate('wird');
  }
}

function snoozeAlarm(reminderId) {
  closeModal();
  const now = new Date();
  now.setMinutes(now.getMinutes() + 10);
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const snoozedTime = `${h}:${m}`;

  State.addReminder({
    title: 'تأجيل التنبيه القرآني',
    type: 'wird',
    surahNumber: 0,
    time: snoozedTime,
    repeatType: 'daily',
    days: [0, 1, 2, 3, 4, 5, 6]
  });

  State.showToast(`⏳ تم تأجيل التنبيه لمدة ١٠ دقائق (عند ${formatReminderTime(snoozedTime)})`);
}

// ── Holy Quran Reciter Selector Modal ─────────────────────
function openReciterModal() {
  const s = State.get();
  const currentReciterId = s.settings.reciterId || 'alafasy';
  const reciters = getReciters();

  openModal(`
    <div class="reciter-modal-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
        <div style="display:flex;align-items:center;gap:8px">
          <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold);font-size:1.6rem">record_voice_over</span>
          <div>
            <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin:0">اختيار القارئ المفضل</h3>
            <p style="font-size:0.75rem;color:var(--text-muted);margin:2px 0 0 0">استمع للقرآن الكريم بأعذب أصوات أئمة الحرمين وقراء العالم الإسلامي</p>
          </div>
        </div>
        <button onclick="App.closeModal()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <div class="reciter-note">
        <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-gold);flex-shrink:0">info</span>
        <div>
          تلاوة آية بآية مع المتابعة في المصحف والتكرار الذكي.
          <div style="font-size:0.72rem;color:var(--text-muted);margin-top:3px">
            (تلاوات الشيخ محمد عبد العزيز حصان رحمه الله مسجلة كمحافل إذاعية نادرة وليست مفرغة آية آية، ولذا وفرنا عمالقة التلاوة المرتلة الحصري والمنشاوي وعبد الباسط والطبلاوي وأئمة الحرمين).
          </div>
        </div>
      </div>

      <div class="reciter-list">
        ${reciters.map(r => {
          const isSelected = r.id === currentReciterId;
          return `
            <div class="reciter-item ${isSelected ? 'active' : ''}" onclick="App.selectReciter('${r.id}')">
              <div class="reciter-item__avatar">${r.avatar}</div>
              <div class="reciter-item__info">
                <div class="reciter-item__name">
                  <span>${r.name}</span>
                  <span class="reciter-badge">${r.badge}</span>
                </div>
                <div class="reciter-item__sub">${r.sub} • ${r.country}</div>
              </div>
              <div class="reciter-item__check">
                <span class="material-symbols-outlined ${isSelected ? 'icon-fill' : ''}">
                  ${isSelected ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="margin-top:var(--space-4)">
        <button class="btn btn--secondary" onclick="App.closeModal()" style="width:100%">
          إغلاق
        </button>
      </div>
    </div>
  `);
}

function selectReciter(reciterId) {
  const reciter = getReciter(reciterId);
  if (!reciter) return;

  State.updateSettings({ reciterId: reciter.id });

  // Update action sheet if open
  const reciterActionEl = document.getElementById('current-reciter-name');
  if (reciterActionEl) {
    reciterActionEl.textContent = `تلاوة الشيخ ${reciter.name}`;
  }

  // Update audio bar
  const audioBarReciterEl = document.getElementById('audio-bar-reciter-name');
  if (audioBarReciterEl) {
    audioBarReciterEl.textContent = reciter.name;
  }

  // If audio is currently playing, seamlessly continue with the new reciter for the current ayah
  if (_audioState.isPlaying && _audioState.surahNumber && _audioState.ayahNumber) {
    playAyahContinuous(_audioState.surahNumber, _audioState.ayahNumber);
  }

  closeModal();
  State.showToast(`🎙️ تم اختيار تلاوة الشيخ ${reciter.name}`);

  // Re-render if currently on profile screen to reflect new reciter in settings
  if (_currentScreen === 'profile') {
    navigate(_currentScreen);
  }
}

// ── State for Signature Features ──────────────────────────
let _remedyCounters = {};
let _timedWirdState = {
  timerId: null,
  remainingSeconds: 0,
  targetPages: 1,
  startPage: 1,
  endPage: 1,
  minutes: 5
};

// ── Feature 1: Soul Remedy Compass (بوصلة القلب وصيدلية الروح) ─────
function openSoulRemedyModal(emotionId) {
  const remedy = getSoulRemedy(emotionId);
  if (!remedy) return;

  if (_remedyCounters[emotionId] === undefined) {
    _remedyCounters[emotionId] = 0;
  }
  const currentCount = _remedyCounters[emotionId];
  const isCompleted = currentCount >= remedy.actionCount;
  const n = State.toArabicNum;

  openModal(`
    <div class="soul-remedy-modal-card">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:2.2rem">${remedy.emoji}</span>
          <div>
            <div style="display:flex;align-items:center;gap:6px">
              <h3 style="font-size:1.15rem;font-weight:700;color:var(--text-primary);margin:0">${remedy.title}</h3>
              <span class="chip chip--gold" style="font-size:0.65rem;padding:2px 7px">${remedy.tag}</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">
              دواءٌ قرآني لحالة: <strong style="color:var(--color-gold)">${remedy.emotion}</strong>
            </div>
          </div>
        </div>
        <button onclick="App.closeModal()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Ayah Display Box -->
      <div class="soul-remedy-ayah-box">
        <div style="font-size:0.75rem;color:var(--mushaf-gold-dark);font-weight:700;margin-bottom:8px">
          سورة ${remedy.surahName} • آية ${n(remedy.ayahNumber)}
        </div>
        <div class="soul-remedy-ayah-text">
          ﴿ ${remedy.ayahText} ﴾
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:var(--space-2);flex-wrap:wrap">
          <button class="btn btn--sm" style="background:var(--color-primary);color:var(--color-gold);border:1px solid var(--color-gold);border-radius:var(--radius-pill);font-size:0.75rem;padding:5px 12px;cursor:pointer" onclick="App.playAyahContinuous(${remedy.surahNumber}, ${remedy.ayahNumber})">
            <span class="material-symbols-outlined icon-fill" style="font-size:1rem">play_circle</span>
            <span>استمع للتلاوة</span>
          </button>
          <button class="btn btn--sm btn--secondary" style="border-radius:var(--radius-pill);font-size:0.75rem;padding:5px 12px;cursor:pointer" onclick="App.goToRemedyAyahInMushaf(${remedy.page}, ${remedy.surahNumber}, ${remedy.ayahNumber})">
            <span class="material-symbols-outlined" style="font-size:1rem">auto_stories</span>
            <span>افتح سياقها بالمصحف (ص ${n(remedy.page)})</span>
          </button>
        </div>
      </div>

      <!-- Reflection Balm -->
      <div class="soul-remedy-reflection-box">
        <div style="font-weight:700;color:var(--color-sage);margin-bottom:4px;display:flex;align-items:center;gap:4px">
          <span class="material-symbols-outlined" style="font-size:1rem">nature_people</span>
          <span>ومضة بلسم لقلبك:</span>
        </div>
        <div>${remedy.reflection}</div>
      </div>

      <!-- 60-Second Micro-Action -->
      <div class="soul-remedy-action-box">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:0.8rem;font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:4px">
            <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">timer</span>
            ${remedy.actionLabel}
          </span>
          <span style="font-size:0.72rem;color:var(--color-gold);font-weight:700">
            ${isCompleted ? '✓ اكتمل الورد' : `${n(currentCount)} من ${n(remedy.actionCount)}`}
          </span>
        </div>
        <div style="font-size:0.95rem;font-weight:700;color:var(--mushaf-gold-dark);text-align:center;padding:4px 0;line-height:1.6">
          "${remedy.actionDua}"
        </div>
        <button class="remedy-counter-btn" id="remedy-btn-${remedy.id}" onclick="App.incrementRemedyCounter('${remedy.id}', ${remedy.actionCount})">
          <span>${isCompleted ? '✨ مبارك! تقبل الله منك وطمأن فؤادك' : 'انقر مع كل ترديدة للتسبيح'}</span>
          <span style="background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:var(--radius-full);font-size:0.85rem">
            ${isCompleted ? '✓' : `${n(currentCount)} / ${n(remedy.actionCount)}`}
          </span>
        </button>
      </div>

      <div style="display:flex;justify-content:center">
        <button class="btn btn--ghost" style="color:var(--text-muted);font-size:0.8rem" onclick="App.closeModal()">
          إغلاق النافذة
        </button>
      </div>
    </div>
  `);
}

function incrementRemedyCounter(emotionId, targetCount) {
  _remedyCounters[emotionId] = (_remedyCounters[emotionId] || 0) + 1;
  const count = _remedyCounters[emotionId];

  if (count === targetCount) {
    playAlarmChime();
    State.addXP(25);
    State.showToast('🌿 تقبل الله منك! غرسة مباركة وطمأنينة لقلبك (+٢٥ XP)');
  }
  openSoulRemedyModal(emotionId);
}

function goToRemedyAyahInMushaf(page, surahNumber, ayahNumber) {
  closeModal();
  navigate('wird');
  goToPage(page);
  setTimeout(() => {
    highlightPlayingAyah(surahNumber, ayahNumber);
  }, 400);
}

// ── Feature 2: Time-Based Smart Wird Session (اقرأ حسب وقتك) ──────
function startTimedWirdSession(minutes) {
  const pagesPerMin = { 2: 1, 5: 2, 10: 4 };
  const targetPages = pagesPerMin[minutes] || 2;
  const s = State.get();
  const startPage = Math.max(1, Math.min(604, s.quranProgress.currentPage || 1));
  const endPage = Math.min(604, startPage + targetPages - 1);
  const n = State.toArabicNum;

  _timedWirdState = {
    minutes,
    targetPages,
    startPage,
    endPage,
    remainingSeconds: minutes * 60,
    timerId: null
  };

  navigate('wird');
  goToPage(startPage);

  let bar = document.getElementById('timed-wird-floating-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'timed-wird-floating-bar';
    bar.className = 'timed-wird-floating-bar';
    document.body.appendChild(bar);
  }

  updateTimedWirdBarUI();

  if (_timedWirdState.timerId) clearInterval(_timedWirdState.timerId);
  _timedWirdState.timerId = setInterval(() => {
    _timedWirdState.remainingSeconds--;
    if (_timedWirdState.remainingSeconds <= 0) {
      stopTimedWirdSession(true);
    } else {
      updateTimedWirdBarUI();
    }
  }, 1000);

  State.showToast(`⏱️ بدأت جلسة الـ ${n(minutes)} دقائق! الهدف: ص ${n(startPage)} إلى ص ${n(endPage)}`);
}

function updateTimedWirdBarUI() {
  const bar = document.getElementById('timed-wird-floating-bar');
  if (!bar) return;

  const n = State.toArabicNum;
  const sec = _timedWirdState.remainingSeconds;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const timeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  bar.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <div class="timed-wird-clock">
        <span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--color-gold);animation:ringBell 1.5s infinite">timer</span>
        <span>${State.toArabicNum(timeFormatted)}</span>
      </div>
      <div style="font-size:0.75rem;color:#D4BA94">
        الهدف: <strong>ص ${n(_timedWirdState.startPage)} - ص ${n(_timedWirdState.endPage)}</strong>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:6px">
      <button class="btn btn--sm" style="background:var(--color-gold);color:#1A1208;border:none;border-radius:var(--radius-pill);font-weight:700;font-size:0.75rem;padding:4px 10px;cursor:pointer" onclick="App.stopTimedWirdSession(true)">
        أنهيت الورد ✓
      </button>
      <button onclick="App.stopTimedWirdSession(false)" style="background:none;border:none;color:#A89582;cursor:pointer;padding:2px" title="إلغاء المؤقت">
        <span class="material-symbols-outlined" style="font-size:1.1rem">close</span>
      </button>
    </div>
  `;
}

function stopTimedWirdSession(finished = false) {
  if (_timedWirdState.timerId) {
    clearInterval(_timedWirdState.timerId);
    _timedWirdState.timerId = null;
  }
  const bar = document.getElementById('timed-wird-floating-bar');
  if (bar) bar.remove();

  if (finished) {
    playAlarmChime();
    const xpReward = _timedWirdState.minutes * 20;
    State.addXP(xpReward);
    State.set(s => {
      s.quranProgress.todayPages = (s.quranProgress.todayPages || 0) + _timedWirdState.targetPages;
      s.quranProgress.currentPage = Math.min(604, _timedWirdState.endPage + 1);
    });

    const n = State.toArabicNum;
    openModal(`
      <div style="text-align:center;padding:var(--space-4)">
        <div style="font-size:3.5rem;margin-bottom:var(--space-2)">🎉</div>
        <h3 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">
          هنيئاً لك الورد المبارك!
        </h3>
        <p style="font-size:var(--font-size-base);color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-4)">
          في <strong>${n(_timedWirdState.minutes)} دقائق</strong> فقط؛ أتممت قراءة <strong>${n(_timedWirdState.targetPages)} صفحات</strong> بتدبر وسكينة وغرست أجوراً عظيمة تظللك في دنياك وآخرتك.
        </p>
        <div class="chip chip--gold" style="font-size:0.85rem;padding:6px 16px;margin:0 auto var(--space-4) auto;display:inline-flex">
          ⭐ حصلت على +${n(xpReward)} نقطة خبرة (XP)
        </div>
        <button class="btn btn--primary" onclick="App.closeModal()" style="width:100%">
          الحمد لله 🌿
        </button>
      </div>
    `);
  }
}

// ── Feature 4: Memorization Masking (اختبار الحفظ) ───────────
function toggleMemorizationMode() {
  const active = !isMemorizationActive();
  setMemorizationMode(active);
  if (_currentScreen === 'wird') {
    navigate(_currentScreen);
  }
  State.showToast(active ? '🧠 تم تفعيل وضع اختبار الحفظ والتسميع' : '📖 تم العودة لوضع القراءة العادي');
}

function revealMaskedWord(el, event) {
  if (event) event.stopPropagation();
  if (el) el.classList.toggle('revealed');
}

function revealAllMaskedWords() {
  document.querySelectorAll('.masked-word').forEach(el => el.classList.add('revealed'));
  State.showToast('✨ تم كشف كل الكلمات للتأكد من حفظك');
}

// ── Feature 3: Khatma Certificate Preview ──────────────────
function openKhatmaCertificate() {
  const s = State.get();
  const n = State.toArabicNum;
  const curPage = Math.max(1, Math.min(604, s.quranProgress.currentPage || 1));
  const khatmaPct = Math.min(100, Math.round((curPage / 604) * 100));

  openModal(`
    <div style="text-align:center;direction:rtl;padding:var(--space-2)">
      <!-- Certificate Frame -->
      <div style="background:radial-gradient(circle, #FFFDF9 0%, #F5EDE0 100%);border:2.5px solid var(--color-gold);border-radius:var(--radius-2xl);padding:var(--space-5);box-shadow:0 12px 40px rgba(0,0,0,0.15);position:relative">
        <div style="font-size:0.8rem;color:var(--color-gold);font-weight:700;letter-spacing:1px;margin-bottom:6px">
          بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
        </div>
        <div style="font-size:1.5rem;font-weight:800;color:#2C2219;font-family:var(--font-quran);margin-bottom:var(--space-3)">
          شهادة ختم القرآن الكريم المبارك 📜
        </div>
        <p style="font-size:0.85rem;color:#6E6053;line-height:1.8;margin-bottom:var(--space-3)">
          تشهد منصة <strong>غِراس</strong> للعادات والقرآن بأن القارئ المبارك:
        </p>
        <div style="font-size:1.5rem;font-weight:800;color:var(--color-gold);font-family:var(--font-quran);padding:6px 0;margin-bottom:var(--space-3);border-bottom:1.5px dashed rgba(197,160,89,0.5)">
          ${s.user.name || 'سليمان'}
        </div>
        <p style="font-size:0.85rem;color:#4A3B2C;line-height:1.8;margin-bottom:var(--space-4)">
          يسير بخطى مباركة في تلاوة وتدبر آيات الذكر الحكيم، وقد أتم حتى الآن قراءة <strong>${n(curPage)} صفحة</strong> بنسبة إنجاز <strong>(${n(khatmaPct)}٪)</strong>.
        </p>
        <div style="font-size:0.75rem;color:#8C7355;font-style:italic;margin-bottom:var(--space-4);background:rgba(197,160,89,0.1);padding:8px;border-radius:var(--radius-lg)">
          "اللهم اجعل القرآن العظيم ربيع قلوبنا، ونور صدورنا، وجلاء أحزاننا، وذهاب همومنا"
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.72rem;color:#A89582;border-top:1px solid rgba(197,160,89,0.3);padding-top:8px">
          <span>🌿 تطبيق غِراس القرآني</span>
          <span>📅 ${new Date().toLocaleDateString('ar-EG')}</span>
        </div>
      </div>
      <div style="margin-top:var(--space-4)">
        <button class="btn btn--secondary" onclick="App.closeModal()" style="width:100%">
          إغلاق
        </button>
      </div>
    </div>
  `);
}

// ── Khatma Plan Handlers ───────────────────────────────────
function enableKhatma(enabled) {
  State.setKhatmaEnabled(enabled);
  if (_currentScreen === 'garden') {
    navigate('garden');
  }
  if (enabled) {
    State.showToast('🌿 مبارك! تم تفعيل مسار ختمة القرآن الكريم');
  } else {
    State.showToast('تم إيقاف مسار الختمة مؤقتاً');
  }
}

function selectKhatmaDuration(months) {
  State.setKhatmaDuration(months);
  if (_currentScreen === 'garden') {
    navigate('garden');
  }
  const m = Number(months);
  const text = m === 1 ? 'شهر واحد (٢٠ صفحة يومياً)' : m === 2 ? 'شهرين (١٠ صفحات يومياً)' : m === 3 ? '٣ أشهر (٧ صفحات يومياً)' : '٦ أشهر (٣ صفحات يومياً)';
  State.showToast(`⏱️ تم ضبط خطة الختم في: ${text}`);
}

function toggleKhatmaPrayer(prayerKey) {
  const isDone = State.toggleKhatmaPrayerDone(prayerKey);
  if (_currentScreen === 'garden') {
    navigate('garden');
  }
  if (isDone) {
    State.showToast('تقبّل الله طاعتكم! تم إنجاز ورد الصلاة (+١٥ XP) ✨');
  } else {
    State.showToast('تم إلغاء تحديد الورد');
  }
}

function goToKhatmaReading(targetPage) {
  const page = targetPage || State.get().quranProgress?.currentPage || 1;
  goToPage(page);
  State.showToast(`📖 ورد الصلاة المبارك — ص ${State.toArabicNum(page)}`);
}

function openFontSize() {
  const s = State.get();
  openModal(`
    <h3 style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:var(--space-4)">حجم خط القرآن</h3>
    <div style="display:flex;flex-direction:column;gap:var(--space-3)">
      ${['large', 'medium', 'small'].map(size => `
        <button onclick="App.setFontSize('${size}')" class="settings-row"
          style="background:${s.settings.quranFontSize === size ? 'var(--color-gold-light)' : ''}">
          <span class="settings-row__label">${size === 'large' ? 'كبير' : size === 'medium' ? 'متوسط' : 'صغير'}</span>
          ${s.settings.quranFontSize === size ? '<span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">check_circle</span>' : ''}
        </button>
      `).join('')}
    </div>
  `);
}

function setFontSize(size) {
  State.updateSettings({ quranFontSize: size });
  closeModal();
  State.showToast('✅ تم تحديث حجم الخط');
}

function confirmReset() {
  openModal(`
    <div style="text-align:center">
      <div style="font-size:3rem;margin-bottom:var(--space-4)">⚠️</div>
      <h3 style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:var(--space-3)">إعادة تعيين التطبيق؟</h3>
      <p style="color:var(--text-secondary);margin-bottom:var(--space-6);line-height:1.8">
        سيتم حذف جميع بيانات التقدم والعادات. لا يمكن التراجع عن هذا الإجراء.
      </p>
      <button class="btn btn--primary" style="background:var(--color-error);margin-bottom:var(--space-3)" onclick="App.doReset()">
        نعم، أعد التعيين
      </button>
      <button class="btn btn--secondary" onclick="App.closeModal()">إلغاء</button>
    </div>
  `);
}

function doReset() {
  State.resetState();
  closeModal();
  window.location.reload();
}

function editHabit(habitId) {
  const s = State.get();
  const h = s.habits.find(h => h.id === habitId);
  if (!h) return;
  openModal(`
    <h3 style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:var(--space-4)">${h.name}</h3>
    <div style="background:var(--color-bg-sage);border-radius:var(--radius-xl);padding:var(--space-4);margin-bottom:var(--space-4)">
      <div style="font-size:var(--font-size-base);color:var(--text-primary);font-weight:600">الهدف الأدنى الحالي:</div>
      <div style="font-size:var(--font-size-lg);color:var(--color-sage);font-weight:700;margin-top:var(--space-1)">${h.minGoal.label}</div>
    </div>
    ${h.extraGoal ? `
    <div style="background:var(--color-gold-light);border-radius:var(--radius-xl);padding:var(--space-4);margin-bottom:var(--space-4)">
      <div style="font-size:var(--font-size-base);color:var(--text-primary);font-weight:600">الهدف الإضافي:</div>
      <div style="font-size:var(--font-size-lg);color:var(--color-gold);font-weight:700;margin-top:var(--space-1)">${h.extraGoal.label}</div>
    </div>` : ''}
    <div style="font-size:var(--font-size-xs);color:var(--text-muted);text-align:center;padding:var(--space-3)">
      إمكانية تعديل الأهداف قادمة قريباً 🌿
    </div>
    <button class="btn btn--secondary" onclick="App.closeModal()">إغلاق</button>
  `);
}

function openAddHabit() {
  openModal(`
    <h3 style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:var(--space-2)">إضافة عادة جديدة</h3>
    <p style="color:var(--text-secondary);font-size:var(--font-size-base);margin-bottom:var(--space-4)">
      اختر الحد الأدنى الذي تستطيع الالتزام به حتى في أصعب الأيام
    </p>
    <div style="font-size:var(--font-size-xs);color:var(--text-muted);text-align:center;padding:var(--space-6);background:var(--color-bg-secondary);border-radius:var(--radius-xl)">
      🌿 هذه الميزة قيد التطوير — ترقّب الإصدار القادم
    </div>
    <button class="btn btn--secondary" style="margin-top:var(--space-4)" onclick="App.closeModal()">إغلاق</button>
  `);
}

function openGroup(groupId) {
  State.showToast('🌿 تفاصيل المجموعة قادمة قريباً');
}

// ── Suhba (Companions & Competition Groups) ──────────────────
let _lastFoundCompanion = null;

function copyMyUserTag(tag) {
  const t = tag || State.getUserTag() || 'GHR-1024';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(() => {
      State.showToast(`🌿 تم نسخ معرّفك (${t})! شاركه مع رفقائك ليضيفوك.`);
    }).catch(() => {
      prompt('انسخ معرّفك الشخصي لمشاركته مع أصدقائك:', t);
    });
  } else {
    prompt('انسخ معرّفك الشخصي لمشاركته مع أصدقائك:', t);
  }
}

function copyGroupCode(code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code).then(() => {
      State.showToast(`✨ تم نسخ رمز المجموعة (${code})! شاركه مع أحبابك.`);
    }).catch(() => {
      prompt('انسخ رمز المجموعة لمشاركته مع أصدقائك:', code);
    });
  } else {
    prompt('انسخ رمز المجموعة لمشاركته مع أصدقائك:', code);
  }
}

function switchSuhbaTab(tab) {
  setSuhbaTab(tab);
  if (_currentScreen === 'suhba') {
    navigate('suhba');
  }
}

async function openAddCompanionByIdModal() {
  _lastFoundCompanion = null;
  openModal(`
    <div style="direction:rtl;padding-bottom:var(--space-2)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-3)">
        <div style="width:2.8rem;height:2.8rem;border-radius:50%;background:rgba(184,142,79,0.15);color:var(--color-gold);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:1.5rem">person_add</span>
        </div>
        <div>
          <h3 style="font-size:var(--font-size-xl);font-weight:800;color:var(--text-primary);margin:0">إضافة رفيق بالمعرّف (ID)</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin:2px 0 0 0">ابحث عن رفيقك بالـ ID أو البريد لمتابعة تقدمه في القرآن</p>
        </div>
      </div>

      <div style="margin-bottom:var(--space-3)">
        <label style="display:block;font-size:0.8125rem;font-weight:700;color:var(--text-primary);margin-bottom:6px">معرّف الرفيق (User ID أو البريد):</label>
        <div style="display:flex;gap:8px">
          <input type="text" id="comp-search-query" class="form-input" placeholder="مثال: GHR-1042 أو 1042 أو البريد..." style="flex:1;direction:ltr;text-align:right" autofocus onkeydown="if(event.key==='Enter')App.searchCompanionByTag()">
          <button type="button" onclick="App.searchCompanionByTag()" class="btn btn--primary" style="padding:0 16px;white-space:nowrap;font-weight:700">
            <span>بحث</span>
            <span class="material-symbols-outlined" style="font-size:1.1rem">search</span>
          </button>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:6px">
          💡 جرّب إضافة: <button type="button" onclick="document.getElementById('comp-search-query').value='GHR-1042';App.searchCompanionByTag()" style="background:none;border:none;color:var(--color-gold-dark);font-weight:700;cursor:pointer;padding:0;text-decoration:underline">عمر (GHR-1042)</button> أو <button type="button" onclick="document.getElementById('comp-search-query').value='GHR-2085';App.searchCompanionByTag()" style="background:none;border:none;color:var(--color-gold-dark);font-weight:700;cursor:pointer;padding:0;text-decoration:underline">عبدالله (GHR-2085)</button>
        </div>
      </div>

      <!-- Live Search Result Container -->
      <div id="comp-search-result-box" style="margin-bottom:var(--space-3)"></div>

      <div id="comp-relation-box" style="display:none;margin-bottom:var(--space-4)">
        <label style="display:block;font-size:0.8125rem;font-weight:700;color:var(--text-primary);margin-bottom:6px">صفة الرفيق:</label>
        <select id="comp-rel-select" class="form-input">
          <option value="أخ / أخت">🏠 أخ / أخت (عائلة)</option>
          <option value="صديق مقرب" selected>🤝 صديق مقرب</option>
          <option value="رفيق حلقة قرآن">📖 رفيق حلقة قرآن</option>
          <option value="زميل دراسة / عمل">💼 زميل دراسة أو عمل</option>
          <option value="صاحب خير">🌱 صاحب خير</option>
        </select>
      </div>

      <div style="display:flex;gap:var(--space-2)">
        <button id="comp-add-submit-btn" class="btn btn--primary" onclick="App.submitAddFoundCompanion()" style="flex:1;display:none">
          <span class="material-symbols-outlined">check_circle</span>
          <span>إضافة إلى صحبتي</span>
        </button>
        <button class="btn btn--secondary" onclick="App.closeModal()" style="flex:1">
          إلغاء
        </button>
      </div>
    </div>
  `);
}

async function searchCompanionByTag() {
  const queryEl = document.getElementById('comp-search-query');
  const resultBox = document.getElementById('comp-search-result-box');
  const relationBox = document.getElementById('comp-relation-box');
  const submitBtn = document.getElementById('comp-add-submit-btn');

  if (!queryEl || !resultBox) return;
  const q = queryEl.value.trim();

  if (!q) {
    resultBox.innerHTML = `<div style="background:#FDF3E7;color:#B88E4F;padding:10px;border-radius:12px;font-size:0.8125rem;text-align:center">يرجى كتابة معرّف أو كود الرفيق للبحث</div>`;
    return;
  }

  resultBox.innerHTML = `
    <div style="text-align:center;padding:14px;color:var(--text-secondary);font-size:0.85rem">
      <div style="display:inline-block;animation:spin 1s linear infinite;font-size:1.4rem">⏳</div>
      <div>جاري البحث عن الرفيق بالـ ID...</div>
    </div>
  `;

  try {
    let foundUser = null;
    const apiBase = Auth.getApiBaseUrl();
    try {
      const res = await fetch(`${apiBase}/api/users/lookup?query=${encodeURIComponent(q)}`);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('json')) {
        const data = await res.json();
        if (data.success && data.user) {
          foundUser = data.user;
        }
      }
    } catch (e) {}

    // Fallback: check local storage users and pre-built companions
    if (!foundUser) {
      const MOCK_COMPANIONS = [
        { id: 'usr_mock_1', userTag: 'عمر#1042', name: 'عمر الفاروق', avatar: 'ع', currentPage: 124, currentSurahName: 'المائدة', currentJuzName: 'الجزء السادس', xp: 450, streak: 12, todayDone: true },
        { id: 'usr_mock_2', userTag: 'فاطمة#3819', name: 'فاطمة الزهراء', avatar: 'ف', currentPage: 45, currentSurahName: 'البقرة', currentJuzName: 'الجزء الثالث', xp: 620, streak: 19, todayDone: true },
        { id: 'usr_mock_3', userTag: 'عبدالله#7721', name: 'عبدالله بن مسعود', avatar: 'ع', currentPage: 280, currentSurahName: 'الإسراء', currentJuzName: 'الجزء الخامس عشر', xp: 890, streak: 30, todayDone: true },
        { id: 'usr_mock_4', userTag: 'مريم#5512', name: 'مريم الصديقة', avatar: 'م', currentPage: 512, currentSurahName: 'الفتح', currentJuzName: 'الجزء السادس والعشرون', xp: 340, streak: 8, todayDone: false }
      ];
      let localUsers = [];
      try {
        localUsers = JSON.parse(localStorage.getItem('ghiras_local_users_db') || '[]');
      } catch (e) {}
      const allCandidates = [...MOCK_COMPANIONS, ...localUsers];
      const qLower = q.toLowerCase();
      foundUser = allCandidates.find(u => 
        (u.userTag && u.userTag.toLowerCase() === qLower) ||
        (u.name && u.name.toLowerCase().includes(qLower)) ||
        (u.email && u.email.toLowerCase() === qLower)
      );
    }

    if (!foundUser) {
      resultBox.innerHTML = `
        <div style="background:#FDF3E7;border:1px solid rgba(184,142,79,0.3);color:#B88E4F;padding:12px;border-radius:14px;font-size:0.85rem;text-align:center;line-height:1.7">
          ⚠️ لم يتم العثور على مستخدم بهذا المعرّف.<br>
          <span style="font-size:0.75rem;color:var(--text-secondary)">جرّب البحث بأحد الرفقاء المقترحين مثل (عمر#1042 أو فاطمة#3819 أو عبدالله#7721)</span>
        </div>
      `;
      _lastFoundCompanion = null;
      if (relationBox) relationBox.style.display = 'none';
      if (submitBtn) submitBtn.style.display = 'none';
      return;
    }

    const u = foundUser;
    _lastFoundCompanion = u;

    resultBox.innerHTML = `
      <div style="background:linear-gradient(135deg, rgba(74,107,83,0.08) 0%, rgba(184,142,79,0.12) 100%);border:1.5px solid var(--color-gold);border-radius:16px;padding:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:3rem;height:3rem;border-radius:50%;background:var(--color-primary);color:var(--color-gold);display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:800">
              ${u.avatar || u.name.charAt(0)}
            </div>
            <div>
              <div style="font-weight:800;font-size:1.05rem;color:var(--text-primary)">${u.name}</div>
              <div style="font-family:monospace;font-size:0.75rem;color:var(--color-primary);font-weight:700;direction:ltr">
                ${u.userTag}
              </div>
            </div>
          </div>
          <span class="chip" style="background:#E8F0E9;color:#2D5A3D;font-weight:700;font-size:0.75rem;padding:4px 8px">
            تم العثور عليه ✨
          </span>
        </div>

        <div style="background:rgba(255,255,255,0.8);border-radius:12px;padding:10px;display:flex;justify-content:space-around;text-align:center;font-size:0.8rem">
          <div>
            <div style="font-weight:800;color:var(--color-gold)">📖 صفحة ${State.toArabicNum(u.currentPage || 1)}</div>
            <div style="font-size:0.6875rem;color:var(--text-muted)">${u.currentSurahName || 'الفاتحة'}</div>
          </div>
          <div style="width:1px;background:var(--color-border)"></div>
          <div>
            <div style="font-weight:800;color:var(--color-primary)">⭐ ${State.toArabicNum(u.xp || 0)}</div>
            <div style="font-size:0.6875rem;color:var(--text-muted)">XP نقطة</div>
          </div>
          <div style="width:1px;background:var(--color-border)"></div>
          <div>
            <div style="font-weight:800;color:var(--color-sage)">🔥 ${State.toArabicNum(u.streak || 0)}</div>
            <div style="font-size:0.6875rem;color:var(--text-muted)">أيام متتالية</div>
          </div>
        </div>
      </div>
    `;

    if (relationBox) relationBox.style.display = 'block';
    if (submitBtn) submitBtn.style.display = 'flex';

  } catch (err) {
    resultBox.innerHTML = `<div style="background:#fce8e6;color:#ba1a1a;padding:10px;border-radius:12px;font-size:0.8125rem;text-align:center">حدث خطأ في البحث، يرجى المحاولة لاحقاً</div>`;
  }
}

function submitAddFoundCompanion() {
  if (!_lastFoundCompanion) {
    State.showToast('⚠️ يرجى البحث عن الرفيق أولاً');
    return;
  }

  const relEl = document.getElementById('comp-rel-select');
  const relation = relEl ? relEl.value : 'رفيق درب';

  State.addCompanion({
    userId: _lastFoundCompanion.id,
    userTag: _lastFoundCompanion.userTag,
    name: _lastFoundCompanion.name,
    avatar: _lastFoundCompanion.avatar,
    currentPage: _lastFoundCompanion.currentPage,
    currentSurahName: _lastFoundCompanion.currentSurahName,
    currentJuzName: _lastFoundCompanion.currentJuzName,
    xp: _lastFoundCompanion.xp,
    streak: _lastFoundCompanion.streak,
    todayDone: _lastFoundCompanion.todayDone,
    relation: relation
  });

  closeModal();
  if (_currentScreen === 'suhba') {
    navigate('suhba');
  }
  State.showToast(`🌿 تم إضافة ${_lastFoundCompanion.name} إلى صحبتك الصالحة!`);
  _lastFoundCompanion = null;
}

async function addDemoCompanionQuick(tag) {
  const MOCK_COMPANIONS = [
    { id: 'usr_mock_1', userTag: 'عمر#1042', name: 'عمر الفاروق', avatar: 'ع', currentPage: 124, currentSurahName: 'المائدة', currentJuzName: 'الجزء السادس', xp: 450, streak: 12, todayDone: true },
    { id: 'usr_mock_2', userTag: 'فاطمة#3819', name: 'فاطمة الزهراء', avatar: 'ف', currentPage: 45, currentSurahName: 'البقرة', currentJuzName: 'الجزء الثالث', xp: 620, streak: 19, todayDone: true },
    { id: 'usr_mock_3', userTag: 'عبدالله#7721', name: 'عبدالله بن مسعود', avatar: 'ع', currentPage: 280, currentSurahName: 'الإسراء', currentJuzName: 'الجزء الخامس عشر', xp: 890, streak: 30, todayDone: true },
    { id: 'usr_mock_4', userTag: 'مريم#5512', name: 'مريم الصديقة', avatar: 'م', currentPage: 512, currentSurahName: 'الفتح', currentJuzName: 'الجزء السادس والعشرون', xp: 340, streak: 8, todayDone: false }
  ];

  let comp = MOCK_COMPANIONS.find(c => c.userTag === tag);
  const apiBase = Auth.getApiBaseUrl();
  if (!comp) {
    try {
      const res = await fetch(`${apiBase}/api/users/lookup?query=${encodeURIComponent(tag)}`);
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('json')) {
        const data = await res.json();
        if (data.success && data.user) comp = data.user;
      }
    } catch (e) {}
  }

  if (comp) {
    State.addCompanion({
      userId: comp.id,
      userTag: comp.userTag,
      name: comp.name,
      avatar: comp.avatar,
      currentPage: comp.currentPage,
      currentSurahName: comp.currentSurahName,
      currentJuzName: comp.currentJuzName,
      xp: comp.xp || 200,
      streak: comp.streak || 5,
      todayDone: comp.todayDone !== undefined ? comp.todayDone : true,
      relation: 'صديق مقرب'
    });
    if (_currentScreen === 'suhba') {
      navigate('suhba');
    }
    State.showToast(`🌿 تم إضافة ${comp.name} إلى صحبتك بنجاح!`);
  } else {
    State.showToast('تعذر إضافة الرفيق');
  }
}

// ── Competition Groups Handlers ──────────────────────────────
function openCreateGroupModal() {
  openModal(`
    <div style="direction:rtl;padding-bottom:var(--space-2)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-3)">
        <div style="width:2.8rem;height:2.8rem;border-radius:50%;background:rgba(184,142,79,0.15);color:var(--color-gold);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:1.5rem">groups</span>
        </div>
        <div>
          <h3 style="font-size:var(--font-size-xl);font-weight:800;color:var(--text-primary);margin:0">إنشاء حلقة تنافس جديدة</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin:2px 0 0 0">أنشئ مجموعة وشارك رمزها مع إخوانك أو أصدقائك للتنافس</p>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-3);margin-bottom:var(--space-4)">
        <div>
          <label style="display:block;font-size:0.8125rem;font-weight:700;color:var(--text-primary);margin-bottom:4px">اسم الحلقة أو المجموعة:</label>
          <input type="text" id="grp-name-input" class="form-input" placeholder="مثال: تحدي الإخوة في القرآن، صحبة الفجر..." maxlength="40" autofocus>
        </div>

        <div>
          <label style="display:block;font-size:0.8125rem;font-weight:700;color:var(--text-primary);margin-bottom:4px">فئة التنافس:</label>
          <select id="grp-cat-input" class="form-input">
            <option value="إخوة وعائلة" selected>👨‍👩‍👧‍👦 إخوة وعائلة</option>
            <option value="أصدقاء وأحباب">🤝 أصدقاء وأحباب</option>
            <option value="حلقة مسجد / تحفيظ">🕌 حلقة مسجد أو تحفيظ</option>
            <option value="زملاء دراسة">🎓 زملاء دراسة</option>
            <option value="عامة">🌿 عامة</option>
          </select>
        </div>

        <div>
          <label style="display:block;font-size:0.8125rem;font-weight:700;color:var(--text-primary);margin-bottom:4px">رسالة تشجيعية أو وصف:</label>
          <textarea id="grp-desc-input" class="form-input" rows="2" placeholder="مثال: نتنافس على قراءة جزء يومياً وتثبيت الورد..."></textarea>
        </div>
      </div>

      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn--primary" onclick="App.submitCreateGroup()" style="flex:1">
          <span class="material-symbols-outlined">add_circle</span>
          <span>إنشاء وتوليد الرمز</span>
        </button>
        <button class="btn btn--secondary" onclick="App.closeModal()">
          إلغاء
        </button>
      </div>
    </div>
  `);
}

async function submitCreateGroup() {
  const nameEl = document.getElementById('grp-name-input');
  const catEl = document.getElementById('grp-cat-input');
  const descEl = document.getElementById('grp-desc-input');

  const name = nameEl ? nameEl.value.trim() : '';
  const category = catEl ? catEl.value : 'أصدقاء';
  const description = descEl ? descEl.value.trim() : '';

  if (!name) {
    State.showToast('⚠️ يرجى كتابة اسم المجموعة');
    return;
  }

  try {
    const apiBase = Auth.getApiBaseUrl();
    const currentUser = Auth.getCurrentUser();
    let group = null;

    try {
      const token = Auth.getToken();
      const res = await fetch(`${apiBase}/api/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-guest-id': currentUser ? currentUser.id : 'guest_user'
        },
        body: JSON.stringify({ name, category, description })
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('json')) {
        const data = await res.json();
        if (data.success && data.group) {
          group = data.group;
        }
      }
    } catch (e) {}

    if (!group) {
      // Local fallback for GitHub Pages / offline mode
      const rndCode = 'GRP-' + Math.floor(1000 + Math.random() * 9000);
      group = {
        id: 'grp_' + Date.now().toString(36),
        code: rndCode,
        name,
        category,
        description,
        createdBy: currentUser ? currentUser.id : 'local_user',
        createdAt: new Date().toISOString(),
        membersCount: 1,
        members: [{
          userId: currentUser ? currentUser.id : 'me',
          name: currentUser ? currentUser.name : 'أنا',
          avatar: currentUser ? currentUser.avatar : 'غ',
          userTag: currentUser ? currentUser.userTag : 'قارئ#1001',
          xp: State.get()?.user?.xp || 0,
          streak: State.get()?.garden?.streakDays || 1,
          isOwner: true
        }]
      };
      try {
        const localGroups = JSON.parse(localStorage.getItem('ghiras_local_groups') || '[]');
        localGroups.push(group);
        localStorage.setItem('ghiras_local_groups', JSON.stringify(localGroups));
      } catch(e) {}
    }

    State.addGroupToState(group);
    closeModal();
    setSuhbaTab('groups');
    if (_currentScreen === 'suhba') {
      navigate('suhba');
    }
    State.showToast(`🎉 تم إنشاء حلقة "${name}" بنجاح! رمزها: ${group.code}`);
  } catch (err) {
    State.showToast('⚠️ حدث خطأ في إنشاء المجموعة');
  }
}

function openJoinGroupModal() {
  openModal(`
    <div style="direction:rtl;padding-bottom:var(--space-2)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-3)">
        <div style="width:2.8rem;height:2.8rem;border-radius:50%;background:rgba(184,142,79,0.15);color:var(--color-gold);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:1.5rem">login</span>
        </div>
        <div>
          <h3 style="font-size:var(--font-size-xl);font-weight:800;color:var(--text-primary);margin:0">الانضمام إلى حلقة تنافس</h3>
          <p style="font-size:0.8rem;color:var(--text-secondary);margin:2px 0 0 0">أدخل رمز المجموعة للمنافسة مع الأعضاء في لوحة الصدارة</p>
        </div>
      </div>

      <div style="margin-bottom:var(--space-4)">
        <label style="display:block;font-size:0.8125rem;font-weight:700;color:var(--text-primary);margin-bottom:6px">رمز المجموعة (Group Code):</label>
        <input type="text" id="grp-join-code-input" class="form-input" placeholder="مثال: GRP-7700" style="direction:ltr;text-align:center;font-family:monospace;font-size:1.15rem;font-weight:800;letter-spacing:1px" autofocus onkeydown="if(event.key==='Enter')App.submitJoinGroup()">
        <p style="font-size:0.75rem;color:var(--text-muted);margin:6px 0 0 0">
          💡 اسأل منشئ المجموعة عن رمزها الفريد المكوّن من 4 أرقام بعد GRP (أو جرّب GRP-7700)
        </p>
      </div>

      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn--primary" onclick="App.submitJoinGroup()" style="flex:1">
          <span class="material-symbols-outlined">login</span>
          <span>انضمام للمجموعة</span>
        </button>
        <button class="btn btn--secondary" onclick="App.closeModal()">
          إلغاء
        </button>
      </div>
    </div>
  `);
}

async function submitJoinGroup(codeOverride) {
  const codeEl = document.getElementById('grp-join-code-input');
  const code = codeOverride || (codeEl ? codeEl.value.trim().toUpperCase() : '');

  if (!code) {
    State.showToast('⚠️ يرجى إدخال رمز المجموعة');
    return;
  }

  try {
    const apiBase = Auth.getApiBaseUrl();
    const currentUser = Auth.getCurrentUser();
    let group = null;

    try {
      const token = Auth.getToken();
      const res = await fetch(`${apiBase}/api/groups/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          'x-guest-id': currentUser ? currentUser.id : 'guest_user'
        },
        body: JSON.stringify({ code })
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('json')) {
        const data = await res.json();
        if (data.success && data.group) {
          group = data.group;
        }
      }
    } catch (e) {}

    if (!group) {
      // Local fallback for GitHub Pages / offline mode
      if (code === 'GRP-7700') {
        group = {
          id: 'grp_demo_7700',
          code: 'GRP-7700',
          name: 'حلقة حفاظ القرآن الكريم',
          category: 'حلقة مسجد / تحفيظ',
          description: 'حلقة يومية لتثبيت ومراجعة الحفظ والتنافس الإيماني المبارك',
          membersCount: 4,
          members: [
            { userId: 'u1', name: 'أحمد الحافظ', avatar: 'أ', userTag: 'أحمد#2021', xp: 1250, streak: 45 },
            { userId: 'u2', name: 'سارة المحسن', avatar: 'س', userTag: 'سارة#4412', xp: 980, streak: 32 },
            { userId: 'u3', name: 'عمر الفاروق', avatar: 'ع', userTag: 'عمر#1042', xp: 850, streak: 21 },
            { userId: currentUser ? currentUser.id : 'me', name: currentUser ? currentUser.name : 'أنا', avatar: currentUser ? currentUser.avatar : 'غ', userTag: currentUser ? currentUser.userTag : 'أنا#0001', xp: State.get()?.user?.xp || 0, streak: State.get()?.garden?.streakDays || 1 }
          ]
        };
      } else {
        try {
          const localGroups = JSON.parse(localStorage.getItem('ghiras_local_groups') || '[]');
          const found = localGroups.find(g => g.code === code);
          if (found) {
            group = found;
          }
        } catch(e) {}
      }
    }

    if (!group) {
      State.showToast(`⚠️ لم يتم العثور على مجموعة برمز "${code}". جرّب رمز المجموعة التجريبية: GRP-7700`);
      return;
    }

    State.addGroupToState(group);
    closeModal();
    setSuhbaTab('groups');
    if (_currentScreen === 'suhba') {
      navigate('suhba');
    }
    State.showToast(`🌿 مرحباً بك في حلقة "${group.name}"!`);
  } catch (err) {
    State.showToast('⚠️ تعذر الانضمام للمجموعة حالياً');
  }
}

async function quickJoinDemoGroup() {
  await submitJoinGroup('GRP-7700');
}

function confirmLeaveGroup(groupId, groupName) {
  openModal(`
    <div style="text-align:center;padding:var(--space-3);direction:rtl">
      <div style="font-size:3rem;margin-bottom:var(--space-2)">🚪</div>
      <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">
        مغادرة حلقة «${groupName}»؟
      </h3>
      <p style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">
        هل أنت متأكد من رغبتك في مغادرة هذه الحلقة التنافسية؟ يمكنك الانضمام مجدداً في أي وقت برمز المجموعة.
      </p>
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn--primary" style="background:var(--color-error);flex:1" onclick="App.doLeaveGroup('${groupId}')">
          نعم، غادر
        </button>
        <button class="btn btn--secondary" style="flex:1" onclick="App.closeModal()">
          إلغاء
        </button>
      </div>
    </div>
  `);
}

async function doLeaveGroup(groupId) {
  try {
    const token = Auth.getToken();
    const currentUser = Auth.getCurrentUser();
    await fetch('/api/groups/leave', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-guest-id': currentUser ? currentUser.id : 'guest_user'
      },
      body: JSON.stringify({ groupId })
    });

    State.removeGroupFromState(groupId);
    closeModal();
    if (_currentScreen === 'suhba') {
      navigate('suhba');
    }
    State.showToast('تمت مغادرة الحلقة التنافسية');
  } catch (err) {
    State.showToast('فشل إتمام العملية');
  }
}

function openCompanionDetailModal(companionId) {
  const s = State.get();
  const c = s.suhba?.companions?.find(x => x.id === companionId);
  if (!c) return;

  const n = State.toArabicNum;
  const page = c.currentPage || 1;
  const percent = Math.min(100, Math.round((page / 604) * 100));

  openModal(`
    <div style="direction:rtl;text-align:center;padding:var(--space-2)">
      <div style="width:4.5rem;height:4.5rem;border-radius:50%;background:${c.color || '#4A6B53'};color:white;display:flex;align-items:center;justify-content:center;font-size:1.8rem;font-weight:800;margin:0 auto var(--space-3);box-shadow:0 8px 20px rgba(0,0,0,0.12)">
        ${c.avatar || c.name.charAt(0)}
      </div>

      <h3 style="font-size:1.3rem;font-weight:800;color:var(--text-primary);margin:0 0 4px">
        ${c.name}
      </h3>
      <div style="display:flex;justify-content:center;gap:6px;margin-bottom:var(--space-4)">
        <span class="chip" style="background:rgba(74,107,83,0.15);color:var(--color-sage);font-weight:700;font-size:0.75rem">
          ${c.relation || 'رفيق درب'}
        </span>
        ${c.userTag ? `
          <span style="font-family:monospace;font-size:0.75rem;background:rgba(44,34,25,0.06);padding:2px 8px;border-radius:6px;color:var(--text-secondary);font-weight:700;direction:ltr">
            ${c.userTag}
          </span>
        ` : ''}
      </div>

      <!-- Quran Reading Progress Card -->
      <div style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:var(--radius-xl);padding:var(--space-3);margin-bottom:var(--space-4);text-align:right">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:800;font-size:0.95rem;color:var(--text-primary);display:inline-flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="color:var(--color-gold);font-size:1.15rem">menu_book</span>
            <span>موقعه في المصحف:</span>
          </span>
          <span style="font-weight:800;color:var(--color-gold-dark);font-size:0.85rem">
            صفحة ${n(page)} من ٦٠٤
          </span>
        </div>
        <div style="font-size:0.8125rem;color:var(--text-secondary);margin-bottom:10px">
          ${c.currentSurahName || 'سورة الفاتحة'} — ${c.currentJuzName || 'الجزء الأول'}
        </div>
        <div style="height:8px;background:rgba(44,34,25,0.08);border-radius:99px;overflow:hidden">
          <div style="height:100%;width:${percent}%;background:linear-gradient(90deg, var(--color-gold), #4A6B53);border-radius:99px"></div>
        </div>
        <div style="font-size:0.75rem;color:var(--text-muted);text-align:left;margin-top:4px">
          ${n(percent)}% تم إنجازها
        </div>
      </div>

      <!-- Stats Grid -->
      <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;margin-bottom:var(--space-4)">
        <div style="background:var(--color-bg-secondary);padding:12px;border-radius:var(--radius-lg);text-align:center">
          <div style="font-size:1.3rem;font-weight:800;color:var(--color-gold)">⭐ ${n(c.xp || 0)}</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">إجمالي النقاط (XP)</div>
        </div>
        <div style="background:var(--color-bg-secondary);padding:12px;border-radius:var(--radius-lg);text-align:center">
          <div style="font-size:1.3rem;font-weight:800;color:var(--color-sage)">🔥 ${n(c.streak || 0)} أيام</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">سلسلة الاستمرار</div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn--primary" onclick="App.sendCheer('${c.name}')" style="flex:1">
          <span>💌 إرسال دعاء وتحفيز</span>
        </button>
        <button class="btn btn--secondary" onclick="App.closeModal()" style="flex:1">
          إغلاق
        </button>
      </div>
    </div>
  `);
}

function confirmDeleteCompanion(id, name) {
  openModal(`
    <div style="text-align:center;padding:var(--space-3);direction:rtl">
      <div style="font-size:3rem;margin-bottom:var(--space-2)">🗑️</div>
      <h3 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-2)">
        حذف الرفيق من صحبتك؟
      </h3>
      <p style="font-size:var(--font-size-sm);color:var(--text-secondary);margin-bottom:var(--space-4)">
        هل أنت متأكد من رغبتك في إزالة <strong>${name}</strong> من قائمة رفقاء دربك؟
      </p>
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn--primary" style="background:var(--color-error);flex:1" onclick="App.doDeleteCompanion('${id}')">
          نعم، احذف
        </button>
        <button class="btn btn--secondary" style="flex:1" onclick="App.closeModal()">
          إلغاء
        </button>
      </div>
    </div>
  `);
}

function doDeleteCompanion(id) {
  State.removeCompanion(id);
  closeModal();
  if (_currentScreen === 'suhba') {
    navigate('suhba');
  }
  State.showToast('تم حذف الرفيق من قائمتك');
}

function sendCheer(name) {
  const cheers = [
    `💌 بارك الله في همتك يا ${name} وتقبّل طاعاتك!`,
    `✨ ما شاء الله يا ${name}، استمر فـ «أحب الأعمال أدومها»!`,
    `🌿 هنيئاً لك الورد القرآني يا ${name}، زادك الله نوراً وتوفيقاً!`,
    `🤍 رفقة الخير تجمعنا على طاعة الله يا ${name}!`
  ];
  const msg = cheers[Math.floor(Math.random() * cheers.length)];
  State.showToast(msg);
}

// ── Spiritual Nudges (همسات الود والدعاء بين الأصدقاء) ────────
function openSendNudgeModal(companionUserTag, companionName) {
  const targetTag = companionUserTag || '';
  const targetName = companionName || 'رفيق دربك';

  const defaultMessages = [
    `أخوك ينتظرك في الورد القرآني.. لا تقطع غراسك اليوم يا ${targetName} 🌿`,
    `﴿وَفِي ذَٰلِكَ فَلْيَتَنَافَسِ الْمُتَنَافِسُونَ﴾ — أسأل الله أن يبارك في وقتك ويشرح صدرك يا ${targetName} 🤍`,
    `اللهم يسّر لأخي ${targetName} ورده، ونوّر قلبه بكتابك، واجعله من أهل القرآن وخاصته 🤲`,
    `صفحة واحدة تصنع فارقاً عظيماً في بركة يومك يا ${targetName}.. بانتظار إنجازك اليوم ✨`,
    `«أحب الأعمال إلى الله أدومها وإن قل» — همتك تشد همتي ونلتقي على طاعة الله 🌸`
  ];

  openModal(`
    <div style="direction:rtl;text-align:right;padding:var(--space-2)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-3)">
        <div style="width:3rem;height:3rem;border-radius:50%;background:rgba(184,142,79,0.18);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--color-gold);flex-shrink:0">
          🕊️
        </div>
        <div>
          <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">
            همسة ود ودعاء لـ ${targetName}
          </h3>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">
            اختر رسالة تذكير أو دعاء قرآني يشحذ همة رفيقك في الورد والطاعات
          </div>
        </div>
      </div>

      <!-- Quick Preset Messages -->
      <div style="font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:8px">
        اختر من همسات الخير:
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:var(--space-4);max-height:200px;overflow-y:auto;padding-left:4px">
        ${defaultMessages.map((msg, i) => `
          <div onclick="document.getElementById('nudge-custom-msg').value='${msg.replace(/'/g, "\\'")}'"
               style="background:var(--color-bg-secondary);border:1px solid rgba(184,142,79,0.25);border-radius:var(--radius-lg);padding:8px 12px;font-size:0.82rem;color:var(--text-primary);cursor:pointer;line-height:1.6;transition:all 0.15s ease"
               onmouseover="this.style.borderColor='var(--color-gold)';this.style.background='rgba(184,142,79,0.08)'"
               onmouseout="this.style.borderColor='rgba(184,142,79,0.25)';this.style.background='var(--color-bg-secondary)'">
            ${msg}
          </div>
        `).join('')}
      </div>

      <!-- Custom Input -->
      <div style="margin-bottom:var(--space-4)">
        <label style="display:block;font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:6px">
          أو اكتب دعاءً خاصاً من قلبك:
        </label>
        <textarea id="nudge-custom-msg" rows="2" style="width:100%;border:1px solid var(--color-border);border-radius:var(--radius-lg);padding:10px;font-size:0.85rem;font-family:inherit;background:var(--color-bg-card);color:var(--text-primary);box-sizing:border-box;resize:none" placeholder="اكتب دعاءً أو تذكيراً بالخير...">${defaultMessages[0]}</textarea>
      </div>

      <!-- Action Buttons -->
      <div style="display:flex;gap:var(--space-2)">
        <button class="btn btn--primary" style="flex:1;font-weight:700" onclick="App.submitSendNudge('${targetTag}', '${targetName}')">
          <span>إرسال الهمسة والدعاء 🕊️</span>
        </button>
        <button class="btn btn--secondary" style="flex:1" onclick="App.closeModal()">
          إلغاء
        </button>
      </div>
    </div>
  `);
}

async function submitSendNudge(toUserTag, toUserName) {
  const textarea = document.getElementById('nudge-custom-msg');
  const message = textarea ? textarea.value.trim() : '';
  if (!message) {
    State.showToast('يرجى كتابة أو اختيار رسالة دعاء');
    return;
  }

  const currentUser = Auth.getCurrentUser();
  const token = Auth.getToken();
  const apiBase = Auth.getApiBaseUrl();

  try {
    const res = await fetch(`${apiBase}/api/nudges/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-guest-id': currentUser ? currentUser.id : 'guest_user'
      },
      body: JSON.stringify({
        toUserTag: toUserTag,
        toUserName: toUserName,
        message: message
      })
    });

    closeModal();
    State.showToast(`🕊️ تم إرسال همسة الود والدعاء لـ ${toUserName} بنجاح!`);
  } catch(e) {
    closeModal();
    State.showToast(`🕊️ تم إرسال همسة الود والدعاء لـ ${toUserName} بنجاح!`);
  }
}

async function loadIncomingNudges() {
  const currentUser = Auth.getCurrentUser();
  const token = Auth.getToken();
  const myTag = State.getUserTag() || currentUser?.userTag || '';
  const apiBase = Auth.getApiBaseUrl();

  try {
    const res = await fetch(`${apiBase}/api/nudges/my?userTag=${encodeURIComponent(myTag)}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'x-guest-id': currentUser ? currentUser.id : 'guest_user'
      }
    });
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('json')) {
      const data = await res.json();
      if (data.success && Array.isArray(data.nudges)) {
        State.set(s => {
          if (!s.suhba) s.suhba = { companions: [], groups: [] };
          s.suhba.incomingNudges = data.nudges;
        });
      }
    }
  } catch(e) {}
}

async function replyThanksNudge(toUserTag, toUserName) {
  const currentUser = Auth.getCurrentUser();
  const token = Auth.getToken();
  const apiBase = Auth.getApiBaseUrl();
  try {
    await fetch(`${apiBase}/api/nudges/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-guest-id': currentUser ? currentUser.id : 'guest_user'
      },
      body: JSON.stringify({
        toUserTag: toUserTag,
        toUserName: toUserName,
        message: 'جزاك الله خيراً يا أخي وبارك فيك، تقبل الله منا ومنك 🤲🤍'
      })
    });
    State.showToast(`تم إرسال الشكر والدعاء لـ ${toUserName} 🤲`);
  } catch(e) {
    State.showToast(`تم إرسال الشكر والدعاء لـ ${toUserName} 🤲`);
  }
}

async function clearAllNudges() {
  const currentUser = Auth.getCurrentUser();
  const token = Auth.getToken();
  const myTag = State.getUserTag() || currentUser?.userTag || '';
  const apiBase = Auth.getApiBaseUrl();

  try {
    await fetch(`${apiBase}/api/nudges/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'x-guest-id': currentUser ? currentUser.id : 'guest_user'
      },
      body: JSON.stringify({ nudgeId: 'all', userTag: myTag })
    });
  } catch(e) {}

  State.set(s => {
    if (s.suhba) s.suhba.incomingNudges = [];
  });
  State.showToast('تم تحديد جميع الهمسات كمقروءة');
  if (_currentScreen === 'suhba') navigate('suhba');
}

// ── Cloud Sync Settings Modal ──────────────────────────────
function openCloudSettings() {
  const currentUrl = localStorage.getItem('ghiras_custom_api_url') || window.GHIRAS_API_URL || 'https://ghiras-backend-wq79.onrender.com';
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  openModal(`
    <div style="direction:rtl;text-align:right;padding-bottom:var(--space-2)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-3)">
        <div style="width:3rem;height:3rem;border-radius:50%;background:rgba(74,107,83,0.15);display:flex;align-items:center;justify-content:center;font-size:1.5rem;color:var(--color-primary);flex-shrink:0">
          ☁️
        </div>
        <div>
          <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0">السحابة المركزية المشتركة</h3>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">ربط جميع الأجهزة والمستخدمين بقاعدة بيانات وخادم موحد</div>
        </div>
      </div>

      <div style="background:var(--color-bg-secondary);border:1px solid rgba(184,142,79,0.25);border-radius:14px;padding:12px;margin-bottom:var(--space-3);font-size:0.82rem;line-height:1.7">
        <div><strong>حالة الاتصال:</strong> ${isLocalhost ? '💻 خادم محلي تجريبي (Localhost:5500)' : '🌐 السحابة الموحدة (Render Cloud)'}</div>
        <div style="margin-top:4px;color:var(--text-secondary)">
          عنوان السيرفر: <code style="direction:ltr;display:inline-block;font-size:0.75rem;background:rgba(0,0,0,0.06);padding:2px 6px;border-radius:6px">${currentUrl}</code>
        </div>
      </div>

      <div style="margin-bottom:var(--space-3)">
        <label style="display:block;font-size:0.8rem;font-weight:700;color:var(--text-primary);margin-bottom:6px">عنوان السيرفر السحابي (URL):</label>
        <input type="url" id="cloud-api-url-input" class="form-input" value="${currentUrl}" placeholder="https://ghiras-backend-wq79.onrender.com" style="direction:ltr;font-family:monospace;font-size:0.85rem">
        <p style="font-size:0.75rem;color:var(--text-muted);margin:6px 0 0 0">
          إذا نشرت السيرفر برابط خاص على Render، الصقه هنا واضغط حفظ.
        </p>
      </div>

      <div id="cloud-status-check" style="margin-bottom:var(--space-3);display:none"></div>

      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:var(--space-2)">
          <button class="btn btn--primary" style="flex:1" onclick="App.saveCloudApiUrl()">
            <span class="material-symbols-outlined">save</span>
            <span>حفظ وفحص الاتصال</span>
          </button>
          <button class="btn btn--secondary" onclick="App.testCloudConnection()">
            <span class="material-symbols-outlined">wifi_tethering</span>
            <span>فحص</span>
          </button>
        </div>

        <a href="https://render.com/deploy?repo=https://github.com/sulaiman-070/ghiras" target="_blank" class="btn" style="background:#4A6B53;color:#FFFFFF;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;padding:10px;border-radius:12px;margin-top:4px">
          <span>🚀 نشر الخادم على Render بضغطة واحدة</span>
          <span class="material-symbols-outlined" style="font-size:1.1rem">open_in_new</span>
        </a>
      </div>
    </div>
  `);
}

async function saveCloudApiUrl() {
  const input = document.getElementById('cloud-api-url-input');
  let url = input ? input.value.trim().replace(/\/+$/, '') : '';
  if (url) {
    localStorage.setItem('ghiras_custom_api_url', url);
    window.GHIRAS_API_URL = url;
    State.showToast('✅ تم حفظ رابط السيرفر السحابي');
    await testCloudConnection();
  }
}

async function testCloudConnection() {
  const box = document.getElementById('cloud-status-check');
  if (!box) return;
  box.style.display = 'block';
  box.innerHTML = `<div style="color:var(--text-secondary);font-size:0.8rem">⏳ جاري فحص الاتصال بالسيرفر السحابي...</div>`;

  const base = Auth.getApiBaseUrl();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${base}/api/health`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (data.status === 'ok') {
      box.innerHTML = `
        <div style="background:#E8F0E9;color:#2D5A3D;padding:10px;border-radius:10px;font-size:0.82rem;font-weight:700">
          ✅ السيرفر السحابي متصل بنجاح! جاهز لمزامنة الحسابات والمجموعات مع جميع المستخدمين.
        </div>
      `;
    } else {
      box.innerHTML = `
        <div style="background:#FFF3CD;color:#856404;padding:10px;border-radius:10px;font-size:0.82rem">
          ⚠️ استجاب السيرفر ولكن بحالة غير متوقعة.
        </div>
      `;
    }
  } catch (e) {
    box.innerHTML = `
      <div style="background:#FDF3E7;color:#B88E4F;padding:10px;border-radius:10px;font-size:0.82rem;line-height:1.6">
        ⏳ السيرفر السحابي يستيقظ (Spinning Up) أو لم يتم نشره بعد.<br>
        <span style="font-size:0.75rem;color:var(--text-secondary)">اضغط زر "نشر الخادم على Render" أعلاه لتفعيله مجاناً. التطبيق يعمل تلقائياً بالوضع المحلي الآمن حتى اكتمال النشر.</span>
      </div>
    `;
  }
}

// ── Modal ──────────────────────────────────────────────────
function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');
  if (!overlay || !content) return;
  content.innerHTML = html;
  overlay.classList.add('open');
}

function closeModal(event) {
  if (event && event.target !== event.currentTarget) return;
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.remove('open');
}

// ── Global App Object ──────────────────────────────────────
window.App = {
  navigate,
  // Onboarding
  onboardingNext,
  onboardingSkip,
  toggleOnboardingCategory,
  // Habits
  toggleHabit,
  toggleHabitActive,
  acceptUpgrade,
  dismissUpgrade,
  openAddHabit,
  editHabit,
  // Wird & Complete 604-Page Mushaf
  switchWirdTab,
  selectSurah,
  goToPage,
  refreshMushafView,
  scrollToMushafTop,
  openPageJumpModal,
  submitPageJump,
  openSurahIndex,
  filterSurahIndex,
  adjustMushafFontSize,
  toggleMushafFocus,
  openAyahAction,
  closeAyahAction,
  playCurrentAyahAudio,
  setAudioRepeatMode,
  audioCycleRepeatMode,
  audioTogglePlayPause,
  audioPlayNextAyah,
  audioPlayPrevAyah,
  stopAyahAudio,
  audioBarJumpToCurrentPage,
  bookmarkSelectedAyah,
  copySelectedAyah,
  markSelectedAyahAsRead,
  markAllRead,
  markPageRead,
  openTafseeer,
  bookmarkAyah,
  // Athkar & Prophetic Duas Hub
  switchAthkarCategory,
  switchPrayerSub,
  onAthkarSearch,
  clearAthkarSearch,
  countThikr,
  resetThikr,
  resetAllAthkar,
  copyThikr,
  completeAthkar,
  openAthkarCategory,
  simulateMidnightReset: () => {
    State.simulateMidnightReset();
    checkAndPerformDailyReset(true);
  },
  // Garden
  waterGarden,
  shareGarden,
  recoverGardenStreak: (method = 'token') => {
    State.recoverGardenStreak(method);
    if (_currentScreen === 'garden') {
      const container = document.getElementById('screen-container');
      if (container) container.innerHTML = renderGarden();
    }
  },
  compensateMissedWird: () => {
    State.compensateMissedWird();
    if (_currentScreen === 'garden') {
      const container = document.getElementById('screen-container');
      if (container) container.innerHTML = renderGarden();
    }
  },
  simulateMissedDay: () => {
    State.simulateMissedDay();
    if (_currentScreen === 'garden') {
      const container = document.getElementById('screen-container');
      if (container) container.innerHTML = renderGarden();
    }
  },
  setStreakStyle: (style) => {
    localStorage.setItem('ghiras_streak_style', style);
    if (_currentScreen === 'home') {
      const container = document.getElementById('screen-container');
      if (container) container.innerHTML = renderHome();
    }
  },
  // Social, Companions & Groups
  copyMyUserTag,
  copyGroupCode,
  switchSuhbaTab,
  openAddCompanionByIdModal,
  searchCompanionByTag,
  submitAddFoundCompanion,
  addDemoCompanionQuick,
  openCreateGroupModal,
  submitCreateGroup,
  openJoinGroupModal,
  submitJoinGroup,
  quickJoinDemoGroup,
  confirmLeaveGroup,
  doLeaveGroup,
  openCompanionDetailModal,
  openAddCompanionModal: openAddCompanionByIdModal,
  submitAddCompanion: submitAddFoundCompanion,
  confirmDeleteCompanion,
  doDeleteCompanion,
  sendCheer,
  openSendNudgeModal,
  submitSendNudge,
  loadIncomingNudges,
  replyThanksNudge,
  clearAllNudges,
  inviteFriend,
  encourageMember: (groupId, memberId) => openSendNudgeModal('', 'رفيقك'),
  createGroup: openCreateGroupModal,
  openGroup,
  // Settings & Reminders
  updateSetting,
  openReciterModal,
  selectReciter,
  openRemindersModal,
  openAddReminderModal,
  onReminderTargetChange,
  saveNewReminder,
  toggleReminderItem,
  deleteReminderItem,
  testAlarmSound,
  requestAlarmNotificationPermission,
  showAlarmTriggerModal,
  startReadingFromAlarm,
  snoozeAlarm,
  onAlarmNotificationClick,
  openFontSize,
  setFontSize,
  confirmReset,
  doReset,
  // 4 Signature Features (الابتكارات الكبرى)
  openSoulRemedyModal,
  incrementRemedyCounter,
  goToRemedyAyahInMushaf,
  startTimedWirdSession,
  stopTimedWirdSession,
  toggleMemorizationMode,
  revealMaskedWord,
  revealAllMaskedWords,
  openKhatmaCertificate,
  // Khatma Plan
  enableKhatma,
  selectKhatmaDuration,
  toggleKhatmaPrayer,
  goToKhatmaReading,
  // Modal
  openModal,
  closeModal,
  // Auth & Multi-User
  switchAuthMode,
  togglePasswordVisibility: toggleAuthPassword,
  dismissAuthError,
  handleAuthSubmit,
  continueAsGuest,
  openSwitchAccount,
  confirmLogout,
  doLogout,
  // Cloud Sync
  openCloudSettings,
  saveCloudApiUrl,
  testCloudConnection,
};

// ── Start ──────────────────────────────────────────────────
boot();
