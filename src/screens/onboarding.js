/**
 * GHIRAS — Onboarding Screen
 */

import { State } from '../state.js';

let _step = 0;
let _userName = '';
let _selectedCategories = ['quran', 'prayer', 'athkar'];

const STEPS = [
  {
    emoji: '🌿',
    title: 'أهلاً بك في غِراس',
    desc: 'رحلة هادئة لبناء عادات روحية راسخة. القليل المستمر أفضل من الكثير المنقطع.',
    action: 'ابدأ رحلتك',
  },
  {
    emoji: '🌱',
    title: 'الحد الأدنى هو الأصل',
    desc: 'كل عادة لها هدف أدنى بسيط جداً — كآية واحدة فقط. يمكنك دائماً فعل أكثر، لكن الحد الأدنى يكفي.',
    action: 'فهمت، تابع',
  },
  {
    emoji: '🏡',
    title: 'حديقتك تنمو معك',
    desc: 'كل يوم من الالتزام يُسقي حديقتك ويطوّرها من بذرة إلى واحة مثمرة. لا عقاب هنا — فقط محبة وعودة.',
    action: 'جميل جداً، تابع',
  },
  {
    emoji: '✏️',
    title: 'ما اسمك؟',
    desc: 'حتى يُرحّب بك التطبيق بالاسم',
    action: 'التالي',
    hasInput: true,
  },
  {
    emoji: '🎯',
    title: 'ما الذي تودّ البدء به؟',
    desc: 'اختر عاداتك الأولى — يمكنك تعديلها في أي وقت',
    action: 'ابدأ رحلتي',
    hasCategories: true,
  }
];

const CATEGORIES = [
  { id: 'quran',   label: 'قراءة القرآن',  emoji: '📖' },
  { id: 'prayer',  label: 'صلاة الفجر',    emoji: '🕌' },
  { id: 'athkar',  label: 'الأذكار',        emoji: '🤲' },
];

export function renderOnboarding() {
  _step = 0;
  return `
<div id="onboarding-screen" class="onboarding-screen">
  <div class="onboarding-art" id="onboarding-art">
    ${STEPS[0].emoji}
  </div>

  <div class="onboarding-content">
    <!-- Dots -->
    <div class="onboarding-dots" id="onboarding-dots">
      ${STEPS.map((_, i) => `<div class="onboarding-dot ${i === 0 ? 'active' : ''}"></div>`).join('')}
    </div>

    <!-- Title + Desc -->
    <div id="onboarding-text">
      <h2 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary);margin-bottom:var(--space-3)">${STEPS[0].title}</h2>
      <p style="font-size:var(--font-size-md);color:var(--text-secondary);line-height:1.8">${STEPS[0].desc}</p>
    </div>

    <!-- Dynamic Content Area -->
    <div id="onboarding-dynamic"></div>

    <!-- Action Button -->
    <button class="btn btn--primary btn--large" id="onboarding-action" onclick="App.onboardingNext()">
      ${STEPS[0].action}
    </button>

    <!-- Skip -->
    ${_step < STEPS.length - 1 ? `
    <button onclick="App.onboardingSkip()" class="btn--ghost btn" style="text-align:center;justify-content:center">
      تخطّ المقدمة
    </button>` : ''}
  </div>
</div>`;
}

export function onboardingStepData() {
  return {
    steps: STEPS,
    getStep: () => _step,
    setStep: (n) => { _step = n; },
    getUserName: () => _userName,
    setUserName: (n) => { _userName = n; },
    getCategories: () => _selectedCategories,
    toggleCategory: (id) => {
      const idx = _selectedCategories.indexOf(id);
      if (idx >= 0) {
        if (_selectedCategories.length > 1) _selectedCategories.splice(idx, 1);
      } else {
        _selectedCategories.push(id);
      }
    },
    categories: CATEGORIES,
  };
}
