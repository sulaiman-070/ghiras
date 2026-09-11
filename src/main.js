/**
 * GHIRAS — App Main Controller
 * Orchestrates routing, rendering, and all user interactions
 */

import { State } from './state.js';
import { renderHome }       from './screens/home.js';
import {
  renderWird,
  setWirdTab,
  setMemorizationMode,
  isMemorizationActive,
  setAthkarCategory,
  setPrayerSub,
  setAthkarSearch,
  renderAthkarTabContent
} from './screens/wird.js';
import { ATHKAR_DUAS, ATHKAR_CATEGORIES } from './data/athkar_duas.js';
import { renderGarden }     from './screens/garden.js';
import { renderSuhba }      from './screens/suhba.js';
import { renderProfile }    from './screens/profile.js';
import { renderOnboarding, onboardingStepData } from './screens/onboarding.js';
import { SOUL_REMEDIES, getSoulRemedy } from './data/remedies.js';
import {
  getSurahById,
  getSurah,
  getPage,
  getAllSurahs,
  getPageOfSurah,
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
} from './data/quran.js';
import { getGardenStage }   from './data/habits.js';
import {
  playAlarmChime,
  requestNotificationPermission,
  sendAlarmNotification,
  startAlarmClock
} from './data/alarm.js';

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
function boot() {
  const s = State.get();

  if (!s.isOnboarded) {
    showOnboarding();
  } else {
    showApp();
    navigate(s.ui.activeTab || 'home');
  }

  // Subscribe to state changes for reactive re-render
  State.subscribe((s) => {
    updateHeader();
    updateNavBadges();
  });

  // Start Smart Quran Alarm Clock (checks every 15s)
  startAlarmClock(() => State.getReminders(), handleAlarmTrigger);
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
function navigate(screenId) {
  if (!SCREENS[screenId]) return;
  _currentScreen = screenId;
  State.setActiveTab(screenId);

  // Render screen
  const container = document.getElementById('screen-container');
  if (!container) return;

  container.innerHTML = `
    <div class="screen active" id="screen-${screenId}" role="tabpanel">
      ${SCREENS[screenId].render()}
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

  // Scroll to top
  container.scrollTop = 0;
  updateHeader();
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
    if (athkarTab) athkarTab.style.display = '';
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

function goToPage(pageNum) {
  closeAyahAction();
  const p = Math.max(1, Math.min(604, parseInt(pageNum, 10) || 1));
  State.set(s => {
    s.quranProgress.currentPage = p;
    s.quranProgress.lastReadPage = p;
  });
  navigate('wird');

  // Smooth scroll to top of Mushaf page
  setTimeout(() => {
    const page = document.getElementById('mushaf-page');
    if (page) page.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (_audioState.isPlaying || _audioInstance) {
      highlightPlayingAyah(_audioState.surahNumber, _audioState.ayahNumber);
      updateAudioBarUI();
    }
  }, 100);
}

function selectSurah(surahId) {
  closeAyahAction();
  const page = getPageOfSurah(surahId) || 1;
  State.set(s => {
    s.quranProgress.currentSurahId = surahId;
    s.quranProgress.currentPage = page;
    s.quranProgress.lastReadPage = page;
  });
  navigate('wird');

  // Smooth scroll to top of Mushaf page
  setTimeout(() => {
    const pageEl = document.getElementById('mushaf-page');
    if (pageEl) pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
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

  State.updateQuranProgress(15, s.quranProgress.currentSurahId, 1, curPage);
  State.completeHabit('quran-reading', 'min');
  State.showToast(`📖 تم تسجيل صفحة ${n(curPage)} في وردك — بارك الله فيك ✨`);

  // Visual feedback: mark all ayahs on current page as read
  document.querySelectorAll('.mushaf-ayah').forEach(el => el.classList.add('read-done'));
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
  copyThikr,
  completeAthkar,
  openAthkarCategory,
  // Garden
  waterGarden,
  shareGarden,
  // Social
  encourageMember,
  inviteFriend,
  createGroup,
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
  // Modal
  openModal,
  closeModal,
};

// ── Start ──────────────────────────────────────────────────
boot();
