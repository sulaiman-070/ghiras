/**
 * GHIRAS — Profile Screen
 */

import { State } from '../state.js';
import { GARDEN_STAGES, getGardenStage } from '../data/habits.js';
import { getReciter } from '../data/quran.js';

export function renderProfile() {
  const s = State.get();
  const n = State.toArabicNum;
  const activeReciter = getReciter(s.settings.reciterId);
  const stage = getGardenStage(s.garden.streakDays);
  const xpPct = Math.round((s.user.xp / s.user.xpToNextLevel) * 100);
  const joinDate = new Date(s.user.joinDate);
  const totalCompletions = s.habits.reduce((sum, h) => sum + h.totalCompletions, 0);
  const activeHabits = s.habits.filter(h => h.active).length;

  return `
<div class="screen-content" id="profile-content">

  <!-- User Hero Card -->
  <section style="background:var(--color-primary);border-radius:var(--radius-3xl);padding:var(--space-6);position:relative;overflow:hidden">
    <!-- Background decoration -->
    <div style="position:absolute;top:-3rem;left:-3rem;width:10rem;height:10rem;border-radius:50%;background:rgba(184,142,79,0.1);pointer-events:none"></div>
    <div style="position:absolute;bottom:-2rem;right:-2rem;width:8rem;height:8rem;border-radius:50%;background:rgba(184,142,79,0.08);pointer-events:none"></div>

    <!-- Avatar + Name -->
    <div style="position:relative;z-index:1;display:flex;align-items:center;gap:var(--space-4);margin-bottom:var(--space-5)">
      <div style="width:4.5rem;height:4.5rem;border-radius:50%;background:rgba(184,142,79,0.2);border:2px solid var(--color-gold);display:flex;align-items:center;justify-content:center;font-size:var(--font-size-2xl);font-weight:700;color:var(--color-gold)">
        ${s.user.avatar}
      </div>
      <div>
        <h1 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-inverted)">${s.user.name}</h1>
        <div style="display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-1)">
          <div class="chip" style="background:rgba(184,142,79,0.25);color:var(--color-gold);border:1px solid rgba(184,142,79,0.4)">
            <span class="material-symbols-outlined icon-fill" style="font-size:0.875rem">eco</span>
            <span>المستوى ${n(s.user.level)}</span>
          </div>
          <span style="font-size:var(--font-size-xs);color:rgba(255,253,249,0.7)">${stage.label}</span>
        </div>
      </div>
    </div>

    <!-- XP Progress -->
    <div style="position:relative;z-index:1">
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
        <span style="font-size:var(--font-size-xs);color:rgba(255,253,249,0.7)">نقاط الخبرة</span>
        <span style="font-size:var(--font-size-xs);color:var(--color-gold);font-weight:600">
          ${n(s.user.xp)} / ${n(s.user.xpToNextLevel)} XP
        </span>
      </div>
      <div style="height:0.5rem;background:rgba(255,255,255,0.15);border-radius:9999px;overflow:hidden">
        <div style="height:100%;width:${xpPct}%;background:var(--color-gold);border-radius:9999px;transition:width 0.6s ease"></div>
      </div>
      <div style="font-size:0.625rem;color:rgba(255,253,249,0.5);margin-top:var(--space-1)">
        باقي ${n(s.user.xpToNextLevel - s.user.xp)} نقطة للمستوى التالي
      </div>
    </div>
  </section>

  <!-- Stats Grid -->
  <section>
    <h2 class="section-title" style="margin-bottom:var(--space-3)">
      <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">bar_chart</span>
      إحصائياتي
    </h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div style="font-size:1.5rem;margin-bottom:var(--space-1)">🔥</div>
        <div class="stat-card__value">${n(s.garden.streakDays)}</div>
        <div class="stat-card__label">أيام متتالية حالية</div>
      </div>
      <div class="stat-card">
        <div style="font-size:1.5rem;margin-bottom:var(--space-1)">⭐</div>
        <div class="stat-card__value">${n(s.garden.longestStreak)}</div>
        <div class="stat-card__label">أطول سلسلة</div>
      </div>
      <div class="stat-card">
        <div style="font-size:1.5rem;margin-bottom:var(--space-1)">✅</div>
        <div class="stat-card__value">${n(totalCompletions)}</div>
        <div class="stat-card__label">إجمالي الأوراد</div>
      </div>
      <div class="stat-card">
        <div style="font-size:1.5rem;margin-bottom:var(--space-1)">🌿</div>
        <div class="stat-card__value">${n(s.garden.badges.length)}</div>
        <div class="stat-card__label">أوسمة مكتملة</div>
      </div>
    </div>
  </section>

  <!-- Active Habits -->
  <section>
    <div class="section-header">
      <h2 class="section-title">
        <span class="material-symbols-outlined">task_alt</span>
        عاداتي النشطة
      </h2>
      <button onclick="App.openAddHabit()" class="section-link">
        <span class="material-symbols-outlined" style="font-size:0.875rem">add</span>
        أضف
      </button>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">
      ${s.habits.map(h => `
        <div class="settings-row" onclick="App.editHabit('${h.id}')">
          <div class="settings-row__left">
            <div class="settings-row__icon" style="background:${h.iconBg};color:${h.iconColor}">
              <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem">${h.icon}</span>
            </div>
            <div>
              <div class="settings-row__label">${h.name}</div>
              <div class="settings-row__desc">
                ${h.active ? `🌱 ${h.minGoal.label} • ${n(h.currentStreak)} أيام` : '⏸ متوقفة'}
              </div>
            </div>
          </div>
          <label class="toggle" onclick="event.stopPropagation()">
            <input type="checkbox" ${h.active ? 'checked' : ''} onchange="App.toggleHabitActive('${h.id}', this.checked)">
            <div class="toggle__track"></div>
            <div class="toggle__thumb"></div>
          </label>
        </div>
      `).join('')}
    </div>
  </section>

  <!-- Settings -->
  <section>
    <h2 class="section-title" style="margin-bottom:var(--space-3)">
      <span class="material-symbols-outlined">settings</span>
      الإعدادات
    </h2>
    <div style="display:flex;flex-direction:column;gap:var(--space-2)">

      <!-- Notifications -->
      <div class="settings-row">
        <div class="settings-row__left">
          <div class="settings-row__icon" style="background:var(--color-gold-light)">
            <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem;color:var(--color-gold)">notifications</span>
          </div>
          <div>
            <div class="settings-row__label">التذكيرات</div>
            <div class="settings-row__desc">تذكير هادئ كل يوم</div>
          </div>
        </div>
        <label class="toggle">
          <input type="checkbox" ${s.settings.notifications ? 'checked' : ''} onchange="App.updateSetting('notifications', this.checked)">
          <div class="toggle__track"></div>
          <div class="toggle__thumb"></div>
        </label>
      </div>

      <!-- Smart Quran Reminders & Alarms -->
      <div class="settings-row" onclick="App.openRemindersModal()">
        <div class="settings-row__left">
          <div class="settings-row__icon" style="background:var(--color-bg-sage)">
            <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem;color:var(--color-sage)">alarm</span>
          </div>
          <div>
            <div class="settings-row__label">منبّه القرآن والتذكيرات الذكية</div>
            <div class="settings-row__desc">${(s.reminders || []).filter(r => r.enabled).length} منبهات مفعلة • ضبط وتخصيص الأوقات</div>
          </div>
        </div>
        <span class="material-symbols-outlined rtl-flip" style="color:var(--text-muted)">chevron_right</span>
      </div>

      <!-- Quran Reciter Selection -->
      <div class="settings-row" onclick="App.openReciterModal()">
        <div class="settings-row__left">
          <div class="settings-row__icon" style="background:rgba(197, 160, 89, 0.15)">
            <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem;color:var(--color-gold)">record_voice_over</span>
          </div>
          <div>
            <div class="settings-row__label">القارئ المفضل لتلاوة القرآن</div>
            <div class="settings-row__desc">الشيخ ${activeReciter.name} (${activeReciter.badge})</div>
          </div>
        </div>
        <span class="material-symbols-outlined rtl-flip" style="color:var(--text-muted)">chevron_right</span>
      </div>

      <!-- Font Size -->
      <div class="settings-row" onclick="App.openFontSize()">
        <div class="settings-row__left">
          <div class="settings-row__icon" style="background:var(--color-bg-secondary)">
            <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem;color:var(--text-secondary)">format_size</span>
          </div>
          <div>
            <div class="settings-row__label">حجم خط القرآن</div>
            <div class="settings-row__desc">${s.settings.quranFontSize === 'large' ? 'كبير' : s.settings.quranFontSize === 'medium' ? 'متوسط' : 'صغير'}</div>
          </div>
        </div>
        <span class="material-symbols-outlined rtl-flip" style="color:var(--text-muted)">chevron_right</span>
      </div>

      <!-- Reset (Dev) -->
      <div class="settings-row" onclick="App.confirmReset()" style="border-color:rgba(186,26,26,0.2)">
        <div class="settings-row__left">
          <div class="settings-row__icon" style="background:rgba(186,26,26,0.08)">
            <span class="material-symbols-outlined" style="font-size:1.125rem;color:var(--color-error)">restart_alt</span>
          </div>
          <div>
            <div class="settings-row__label" style="color:var(--color-error)">إعادة تعيين التطبيق</div>
            <div class="settings-row__desc">حذف جميع البيانات (للتطوير)</div>
          </div>
        </div>
        <span class="material-symbols-outlined rtl-flip" style="color:var(--color-error);opacity:0.6">chevron_right</span>
      </div>

    </div>
  </section>

  <!-- App Info -->
  <div style="text-align:center;padding:var(--space-4);color:var(--text-muted);font-size:var(--font-size-xs)">
    <div style="font-size:1.5rem;margin-bottom:var(--space-2)">🌿</div>
    <div style="font-weight:600;color:var(--text-secondary)">غِراس — GHIRAS</div>
    <div style="margin-top:var(--space-1)">الإصدار 1.0.0</div>
    <div style="margin-top:var(--space-1)">"القليل المستمر أفضل من الكثير المنقطع"</div>
  </div>

</div>`;
}
