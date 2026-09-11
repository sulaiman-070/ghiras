/**
 * GHIRAS — Home Screen
 */

import { State } from '../state.js';
import { GARDEN_STAGES, getGardenStage, getGardenProgress, toArabicNumeral } from '../data/habits.js';
import { getDailyAyah } from '../data/quran.js';
import { SOUL_REMEDIES } from '../data/remedies.js';

export function renderHome() {
  const s = State.get();
  const n = State.toArabicNum;
  const streakDays = s.garden.streakDays;
  const last7 = State.getLast7Days();
  const progress = State.getTodayProgress();
  const activeHabits = State.getActiveHabits();
  const gardenStage = getGardenStage(streakDays);
  const gardenPct = getGardenProgress(streakDays);
  const dailyAyah = getDailyAyah();
  const maxStreak = State.getMaxStreak();

  // Micro-habit upgrade suggestion (show after 7-day streak)
  const showUpgradeSuggestion = streakDays >= 7 && !s._upgradeAcknowledged;

  return `
<div class="screen-content stagger" id="home-content">

  <!-- ① Greeting + Date -->
  <section class="animate-fadeInUp" style="animation-delay:0ms">
    <div class="chip chip--neutral" style="margin-bottom:var(--space-2)">
      <span class="material-symbols-outlined" style="color:var(--color-gold)">calendar_month</span>
      <span>${State.getHijriDate()}</span>
    </div>
    <h1 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary);line-height:1.25;display:flex;align-items:center;gap:var(--space-2)">
      ${State.getTodayGreeting()}، ${s.user.name}
      <span style="font-size:1.375rem">🌿</span>
    </h1>
    <p style="font-size:var(--font-size-base);color:var(--text-secondary);margin-top:var(--space-2);line-height:1.8">
      كل خطوة صغيرة اليوم تصنع أثراً يمتد ويزهر في قلبك وغدك.
    </p>
  </section>

  <!-- ② Today Progress Bar -->
  ${progress > 0 ? `
  <div class="animate-fadeInUp" style="animation-delay:40ms;background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-4);display:flex;align-items:center;gap:var(--space-4)">
    <div style="flex:1">
      <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
        <span style="font-size:var(--font-size-base);font-weight:600;color:var(--text-primary)">تقدم اليوم</span>
        <span style="font-size:var(--font-size-base);font-weight:700;color:var(--color-sage)">${n(progress)}٪</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar__fill" style="width:${progress}%"></div>
      </div>
    </div>
    <div style="width:2.5rem;height:2.5rem;border-radius:50%;background:var(--color-bg-sage);display:flex;align-items:center;justify-content:center;font-size:1.25rem">
      ${progress === 100 ? '✅' : '🌱'}
    </div>
  </div>
  ` : ''}

  <!-- ③ Hero Card — Daily Wird -->
  <section class="card animate-fadeInUp" style="animation-delay:80ms;background:var(--color-bg-card)">
    <!-- Ambient glows -->
    <div style="position:absolute;top:-3rem;left:-3rem;width:9rem;height:9rem;border-radius:50%;background:rgba(242,228,203,0.4);filter:blur(30px);pointer-events:none"></div>
    <div style="position:absolute;bottom:-2.5rem;right:-2.5rem;width:8rem;height:8rem;border-radius:50%;background:rgba(234,240,234,0.5);filter:blur(24px);pointer-events:none"></div>

    <!-- Header -->
    <div style="position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:var(--space-2)">
      <div class="chip chip--sage">
        <span class="material-symbols-outlined icon-fill">eco</span>
        <span>الحد الأدنى: آية واحدة فقط</span>
      </div>
      <div class="chip chip--neutral">
        <span class="material-symbols-outlined" style="color:var(--color-gold);font-size:0.875rem">timer</span>
        <span>أقل من دقيقة</span>
      </div>
    </div>

    <!-- Ayah Display -->
    <div class="ayah-box" style="position:relative;z-index:1;margin-top:var(--space-4)">
      <div class="ayah-box__ref">${dailyAyah.ref}</div>
      <p class="ayah-box__text">﴿ ${dailyAyah.text} ﴾</p>
      <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-1);margin-top:var(--space-3);font-size:var(--font-size-xs);color:var(--text-secondary)">
        <span class="material-symbols-outlined" style="font-size:0.9375rem;color:var(--color-gold)">menu_book</span>
        <span>تفسير ميسّر وبسيط متاح بالداخل</span>
      </div>
    </div>

    <!-- CTA Button -->
    <div style="position:relative;z-index:1;margin-top:var(--space-4)">
      <button class="btn btn--primary btn--large" id="start-wird-btn" onclick="App.navigate('wird')">
        <span class="material-symbols-outlined icon-fill">play_circle</span>
        <span>ابدأ وردك الآن</span>
        <span class="material-symbols-outlined rtl-flip">arrow_forward</span>
      </button>
      <div style="display:flex;align-items:center;justify-content:center;gap:var(--space-4);margin-top:var(--space-3);font-size:var(--font-size-xs);color:var(--text-secondary)">
        <span style="display:flex;align-items:center;gap:var(--space-1)">
          <span class="material-symbols-outlined" style="font-size:0.9375rem;color:var(--color-gold)">headphones</span>
          استماع هادئ
        </span>
        <span style="color:var(--color-border)">•</span>
        <span style="display:flex;align-items:center;gap:var(--space-1)">
          <span class="material-symbols-outlined" style="font-size:0.9375rem;color:var(--color-gold)">edit_note</span>
          خاطرة تدبّر
        </span>
      </div>

      <!-- Time-based Quick Launch: اقرأ حسب وقتك -->
      <div style="margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px dashed rgba(184,142,79,0.3);text-align:center">
        <div style="font-size:0.75rem;font-weight:700;color:var(--text-secondary);margin-bottom:var(--space-2);display:flex;align-items:center;justify-content:center;gap:5px">
          <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">schedule</span>
          <span>معك وقت يسير؟ اقرأ وردك بالدقائق:</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap">
          <button class="chip time-wird-chip" onclick="App.startTimedWirdSession(2)" title="قراءة صفحة واحدة في دقيقتين">
            <span>⏱️ دقيقتان (صفحة)</span>
          </button>
          <button class="chip time-wird-chip" onclick="App.startTimedWirdSession(5)" title="قراءة صفحتين في ٥ دقائق">
            <span>⏱️ ٥ دقائق (صفحتان)</span>
          </button>
          <button class="chip time-wird-chip" onclick="App.startTimedWirdSession(10)" title="قراءة ٤ صفحات في ١٠ دقائق">
            <span>⏱️ ١٠ دقائق (٤ صفحات)</span>
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- ④ Smart Quran Alarms & Reminders Card -->
  <section class="card animate-fadeInUp" style="animation-delay:100ms;background:linear-gradient(135deg, rgba(232,195,113,0.12) 0%, rgba(74,107,83,0.08) 100%);border:1px solid rgba(197,160,89,0.35);display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);cursor:pointer;padding:var(--space-3) var(--space-4)" onclick="App.openRemindersModal()">
    <div style="display:flex;align-items:center;gap:var(--space-3)">
      <div style="width:2.6rem;height:2.6rem;border-radius:var(--radius-xl);background:var(--color-gold-light);border:1.5px solid var(--color-gold);display:flex;align-items:center;justify-content:center;color:var(--mushaf-gold-dark);flex-shrink:0">
        <span class="material-symbols-outlined" style="font-size:1.4rem">alarm</span>
      </div>
      <div>
        <div style="font-size:var(--font-size-base);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:6px">
          <span>منبّه وتذكيرات القرآن</span>
          <span class="chip chip--gold" style="font-size:0.65rem;padding:2px 6px">${n((s.reminders || []).filter(r => r.enabled).length)} منبهات</span>
        </div>
        <p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:2px">
          اضبط أوقات تذكير لقراءة سورة الملك، الكهف، أو وردك اليومي
        </p>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:2px;color:var(--color-gold);font-size:0.8rem;font-weight:700;flex-shrink:0">
      <span>ضبط</span>
      <span class="material-symbols-outlined rtl-flip" style="font-size:1.1rem">chevron_left</span>
    </div>
  </section>

  <!-- ⑤ Soul Remedy Compass Card (بوصلة القلب وصيدلية الروح) -->
  <section class="card animate-fadeInUp" style="animation-delay:115ms;background:linear-gradient(135deg, rgba(74,107,83,0.10) 0%, rgba(184,142,79,0.10) 100%);border:1px solid rgba(197,160,89,0.35);padding:var(--space-4)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
      <div style="display:flex;align-items:center;gap:var(--space-2)">
        <div style="width:2.2rem;height:2.2rem;border-radius:50%;background:rgba(197,160,89,0.2);display:flex;align-items:center;justify-content:center;color:var(--color-gold)">
          <span class="material-symbols-outlined icon-fill" style="font-size:1.3rem">favorite</span>
        </div>
        <div>
          <h3 style="font-size:0.95rem;font-weight:700;color:var(--text-primary);margin:0">بوصلة القلب وصيدلية الروح</h3>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:2px">بماذا يشعر قلبك الآن؟ القرآن يواسيك ويداويك</div>
        </div>
      </div>
      <span class="chip chip--gold" style="font-size:0.65rem;padding:2px 8px">طب القلوب 🌿</span>
    </div>

    <!-- Emotion Selector Chips -->
    <div class="soul-remedy-pills-row">
      ${SOUL_REMEDIES.map(r => `
        <button class="soul-remedy-pill" onclick="App.openSoulRemedyModal('${r.id}')" title="${r.title}">
          <span style="font-size:1.15rem">${r.emoji}</span>
          <span style="font-weight:600">${r.emotion}</span>
        </button>
      `).join('')}
    </div>
  </section>

  <!-- ⑤ Active Habits -->
  ${activeHabits.length > 0 ? `
  <section class="animate-fadeInUp" style="animation-delay:120ms">
    <div class="section-header">
      <h2 class="section-title">
        <span class="material-symbols-outlined">task_alt</span>
        عاداتي اليوم
      </h2>
      <span style="font-size:var(--font-size-xs);color:var(--text-secondary);font-weight:600">
        ${n(activeHabits.filter(h => h.minGoalDone).length)} / ${n(activeHabits.length)} ✓
      </span>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-3)">
      ${activeHabits.map(h => renderHabitCard(h)).join('')}
    </div>
  </section>
  ` : `
  <section class="empty-state animate-fadeInUp" style="animation-delay:120ms">
    <div class="empty-state__icon">🌱</div>
    <h2 class="empty-state__title">ابدأ بعادة واحدة</h2>
    <p class="empty-state__desc">أضف عادتك الأولى وابدأ رحلة التحسن الهادئ</p>
    <button class="btn btn--primary" style="width:auto;margin-top:var(--space-4)" onclick="App.openAddHabit()">
      <span class="material-symbols-outlined">add</span>
      أضف عادة
    </button>
  </section>
  `}

  <!-- ⑤ Streak Card -->
  <section class="card animate-fadeInUp" style="animation-delay:160ms">
    <div class="card__header" style="margin-bottom:var(--space-4)">
      <div class="card__title-group">
        <div class="card__icon card__icon--gold">
          <span class="material-symbols-outlined icon-fill animate-fire">local_fire_department</span>
        </div>
        <div>
          <div class="card__title">سلسلة الأيام المتتالية</div>
          <div class="card__subtitle">تبني عادة مباركة يوماً بعد يوم</div>
        </div>
      </div>
      <div class="chip chip--gold">
        <span>${n(maxStreak)} أيام</span>
        <span>🔥</span>
      </div>
    </div>
    <!-- 7-day tracker -->
    <div class="streak-row">
      ${last7.map(day => `
        <div class="streak-day ${day.isToday ? 'today' : ''}">
          <span class="streak-day__label">${day.label}</span>
          <div class="streak-day__dot ${day.isToday ? 'streak-day__dot--today' : day.done ? 'streak-day__dot--done' : 'streak-day__dot--empty'}">
            <span class="material-symbols-outlined" style="font-size:1rem">
              ${day.isToday ? 'star' : day.done ? 'check' : 'radio_button_unchecked'}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
    <!-- Motivational caption -->
    <div style="margin-top:var(--space-4);padding:var(--space-3) var(--space-4);border-radius:var(--radius-xl);background:var(--color-bg);border:1px solid var(--color-border);display:flex;align-items:center;gap:var(--space-2)">
      <span class="material-symbols-outlined" style="font-size:1.125rem;color:var(--color-gold)">verified</span>
      <p style="font-size:var(--font-size-xs);color:var(--text-secondary);font-weight:500">
        ${maxStreak >= 7
          ? 'استمر، أنت تبني عادة جميلة تثمر كل يوم بإذن الله.'
          : 'خطوة صغيرة كل يوم تصنع الفارق. أنت في البداية الجميلة 🌱'}
      </p>
    </div>
  </section>

  <!-- ⑥ Garden Glimpse -->
  <section class="card animate-fadeInUp" style="animation-delay:200ms">
    <div class="card__header">
      <div class="card__title-group">
        <div class="card__icon card__icon--sage">
          <span class="material-symbols-outlined icon-fill">yard</span>
        </div>
        <div>
          <div class="card__title">لمحة من حديقتك المباركة</div>
          <div class="card__subtitle">المستوى ${n(s.user.level)} • ${gardenStage.label}</div>
        </div>
      </div>
      <button class="section-link" onclick="App.navigate('garden')">
        <span>زيارة حديقتي</span>
        <span class="material-symbols-outlined rtl-flip" style="font-size:0.875rem;color:var(--color-gold)">arrow_forward</span>
      </button>
    </div>
    <!-- Garden status -->
    <div style="display:flex;align-items:center;gap:var(--space-4);padding:var(--space-3);border-radius:var(--radius-xl);background:var(--color-bg);border:1px solid var(--color-border)">
      <div style="width:4rem;height:4rem;border-radius:var(--radius-lg);background:var(--color-bg-sage);border:1px solid var(--color-sage-light);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0">
        ${gardenStage.emoji}
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-2)">
          <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-primary)">نمو ${gardenStage.label}</span>
          <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--color-gold)">${n(gardenPct)}٪</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar__fill" style="width:${gardenPct}%"></div>
        </div>
        <p style="font-size:0.6875rem;color:var(--text-secondary);margin-top:var(--space-1)">
          ${streakDays < 30
            ? `باقي ${n(Math.min(30 - streakDays, 7))} أيام من الالتزام لتزهر وردتك 🌸`
            : 'واحتك المثمرة في أوج إشراقها 🌴'}
        </p>
      </div>
    </div>

    <!-- Upgrade Suggestion (shown after 7 days) -->
    ${showUpgradeSuggestion ? `
    <div id="upgrade-suggestion" style="margin-top:var(--space-4);padding:var(--space-4);border-radius:var(--radius-xl);background:var(--color-bg-secondary);border:1px solid var(--color-border)">
      <div style="display:flex;align-items:flex-start;gap:var(--space-3)">
        <div style="width:1.75rem;height:1.75rem;border-radius:var(--radius-md);background:var(--color-primary);color:var(--color-gold);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:0.125rem">
          <span class="material-symbols-outlined" style="font-size:1rem">auto_awesome</span>
        </div>
        <div>
          <p style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-primary)">رائع! لقد التزمت ${n(streakDays)} أيام 🌱</p>
          <p style="font-size:var(--font-size-xs);color:var(--text-secondary);margin-top:var(--space-1);line-height:1.8">
            هل ترغب في زيادة وردك قليلاً؟ (من آية واحدة ← آيتين تدريجياً دون أي مشقة)
          </p>
        </div>
      </div>
      <div style="display:flex;gap:var(--space-2);margin-top:var(--space-3)">
        <button class="btn btn--primary btn--sm" style="flex:1" onclick="App.acceptUpgrade('quran-reading')">
          نعم، زيادة هادئة مباركة 🌿
        </button>
        <button class="btn btn--secondary btn--sm" style="width:auto" onclick="App.dismissUpgrade()">
          مرتاح هكذا
        </button>
      </div>
    </div>
    ` : ''}
  </section>

</div>`;
}

function renderHabitCard(habit) {
  const n = State.toArabicNum;
  const streak = habit.currentStreak;
  return `
  <div class="habit-card ${habit.todayStatus !== 'pending' ? (habit.todayStatus === 'extra_done' ? 'completed' : 'min-done') : ''}"
       onclick="App.toggleHabit('${habit.id}', event)">
    <div class="habit-card__check">
      <span class="material-symbols-outlined icon-fill">
        ${habit.todayStatus === 'extra_done' ? 'check_circle' : habit.todayStatus === 'min_done' ? 'check' : 'radio_button_unchecked'}
      </span>
    </div>
    <div class="habit-card__body">
      <div class="habit-card__name">${habit.name}</div>
      <div class="habit-card__meta">
        <span style="display:flex;align-items:center;gap:var(--space-1)">
          <span class="material-symbols-outlined icon-fill" style="font-size:0.875rem;color:var(--color-gold)">eco</span>
          الحد الأدنى: ${habit.minGoal.label}
        </span>
        ${streak > 0 ? `
        <span class="habit-card__streak">
          <span class="material-symbols-outlined icon-fill" style="font-size:0.875rem">local_fire_department</span>
          ${n(streak)}
        </span>` : ''}
      </div>
      ${habit.extraGoal ? `
      <div class="habit-card__progress" style="margin-top:var(--space-2)">
        <div class="progress-bar" style="height:0.25rem">
          <div class="progress-bar__fill ${habit.todayStatus === 'extra_done' ? '' : 'progress-bar--gold'}"
               style="width:${habit.todayStatus === 'extra_done' ? 100 : habit.minGoalDone ? 50 : 0}%"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:var(--space-1)">
          <span style="font-size:0.625rem;color:var(--text-muted)">${habit.minGoal.label}</span>
          <span style="font-size:0.625rem;color:var(--text-muted)">${habit.extraGoal.label}</span>
        </div>
      </div>
      ` : ''}
    </div>
    <div style="display:flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:var(--radius-md);background:${habit.iconBg};color:${habit.iconColor};flex-shrink:0">
      <span class="material-symbols-outlined icon-fill" style="font-size:1.125rem">${habit.icon}</span>
    </div>
  </div>`;
}
