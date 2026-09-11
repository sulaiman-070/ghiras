/**
 * GHIRAS — App Main Controller
 * Orchestrates routing, rendering, and all user interactions
 */

import { State } from './state.js';
import { renderHome }       from './screens/home.js';
import { renderWird, setWirdTab } from './screens/wird.js';
import { renderGarden }     from './screens/garden.js';
import { renderSuhba }      from './screens/suhba.js';
import { renderProfile }    from './screens/profile.js';
import { renderOnboarding, onboardingStepData } from './screens/onboarding.js';
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
  getPrevAyah
} from './data/quran.js';
import { getGardenStage }   from './data/habits.js';

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

  const pad3 = (num) => String(num).padStart(3, '0');
  const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${pad3(sNum)}${pad3(aNum)}.mp3`;

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

  // Repeat current ayah if mode requires
  if (repeatMode === Infinity || repeatCounter < repeatMode) {
    _audioState.repeatCounter++;
    updateAudioBarUI();
    const pad3 = (num) => String(num).padStart(3, '0');
    const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${pad3(surahNumber)}${pad3(ayahNumber)}.mp3`;
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

// Athkar counter
function countThikr(idx) {
  if (!_athkarCounts[idx]) _athkarCounts[idx] = 0;
  const thikr = QURAN_DATA.athkar.morning[idx];
  if (!thikr) return;
  if (_athkarCounts[idx] >= thikr.count) return;

  _athkarCounts[idx]++;
  const disp = document.getElementById(`count-display-${idx}`);
  const n = State.toArabicNum;
  if (disp) disp.textContent = `${n(_athkarCounts[idx])} / ${n(thikr.count)}`;

  // Visual feedback on completion
  if (_athkarCounts[idx] >= thikr.count) {
    const card = document.getElementById(`thikr-${idx}`);
    if (card) {
      card.style.background = 'var(--color-bg-sage)';
      card.style.borderColor = 'var(--color-sage-light)';
    }
    State.showToast('✅ أتممت هذا الذكر — بارك الله فيك');
  }
}

function completeAthkar() {
  State.completeHabit('morning-athkar', 'min');
  State.showToast('🤲 أتممت أذكار الصباح — بارك الله فيك');
  navigate(_currentScreen);
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

function openReminderTime() {
  openModal(`
    <h3 style="font-size:var(--font-size-xl);font-weight:700;margin-bottom:var(--space-4)">وقت التذكير</h3>
    <input type="time" value="${State.get().settings.reminderTime}" class="form-input" id="reminder-time-input" style="margin-bottom:var(--space-4)">
    <button class="btn btn--primary" onclick="App.saveReminderTime()">حفظ</button>
  `);
}

function saveReminderTime() {
  const v = document.getElementById('reminder-time-input')?.value;
  if (v) State.updateSettings({ reminderTime: v });
  closeModal();
  State.showToast('✅ تم حفظ وقت التذكير');
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
  countThikr,
  completeAthkar,
  // Garden
  waterGarden,
  shareGarden,
  // Social
  encourageMember,
  inviteFriend,
  createGroup,
  openGroup,
  // Settings
  updateSetting,
  openReminderTime,
  saveReminderTime,
  openFontSize,
  setFontSize,
  confirmReset,
  doReset,
  // Modal
  openModal,
  closeModal,
};

// ── Start ──────────────────────────────────────────────────
boot();
