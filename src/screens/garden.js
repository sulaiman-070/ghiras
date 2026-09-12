/**
 * GHIRAS — Garden Screen
 * Pure Islamic Aesthetic, Living Growth & Khatma Plan Tracker
 */

import { State } from '../state.js';
import { GARDEN_STAGES, ACHIEVEMENTS, getGardenStage, getGardenProgress } from '../data/habits.js';
import { JUZ_NAMES } from '../data/quran.js';

const JUZ_PAGES = [
  { juz: 1, name: 'الجزء الأول', startPage: 1 },
  { juz: 2, name: 'الجزء الثاني', startPage: 22 },
  { juz: 3, name: 'الجزء الثالث', startPage: 42 },
  { juz: 4, name: 'الجزء الرابع', startPage: 62 },
  { juz: 5, name: 'الجزء الخامس', startPage: 82 },
  { juz: 6, name: 'الجزء السادس', startPage: 102 },
  { juz: 7, name: 'الجزء السابع', startPage: 121 },
  { juz: 8, name: 'الجزء الثامن', startPage: 142 },
  { juz: 9, name: 'الجزء التاسع', startPage: 162 },
  { juz: 10, name: 'الجزء العاشر', startPage: 182 },
  { juz: 11, name: 'الجزء الحادي عشر', startPage: 201 },
  { juz: 12, name: 'الجزء الثاني عشر', startPage: 222 },
  { juz: 13, name: 'الجزء الثالث عشر', startPage: 242 },
  { juz: 14, name: 'الجزء الرابع عشر', startPage: 262 },
  { juz: 15, name: 'الجزء الخامس عشر', startPage: 282 },
  { juz: 16, name: 'الجزء السادس عشر', startPage: 302 },
  { juz: 17, name: 'الجزء السابع عشر', startPage: 322 },
  { juz: 18, name: 'الجزء الثامن عشر', startPage: 342 },
  { juz: 19, name: 'الجزء التاسع عشر', startPage: 362 },
  { juz: 20, name: 'الجزء العشرون', startPage: 382 },
  { juz: 21, name: 'الجزء الحادي والعشرون', startPage: 402 },
  { juz: 22, name: 'الجزء الثاني والعشرون', startPage: 422 },
  { juz: 23, name: 'الجزء الثالث والعشرون', startPage: 442 },
  { juz: 24, name: 'الجزء الرابع والعشرون', startPage: 462 },
  { juz: 25, name: 'الجزء الخامس والعشرون', startPage: 482 },
  { juz: 26, name: 'الجزء السادس والعشرون', startPage: 502 },
  { juz: 27, name: 'الجزء السابع والعشرون', startPage: 522 },
  { juz: 28, name: 'الجزء الثامن والعشرون', startPage: 542 },
  { juz: 29, name: 'الجزء التاسع والعشرون', startPage: 562 },
  { juz: 30, name: 'الجزء الثلاثون', startPage: 582 }
];

export function renderGarden() {
  const s = State.get();
  const n = State.toArabicNum;
  const streak = s.garden.streakDays;
  const stage = getGardenStage(streak);
  const isThirsty = s.garden.isThirsty || false;
  const graceTokens = s.garden.graceTokens !== undefined ? s.garden.graceTokens : 2;
  const daysUntilNextToken = State.getDaysUntilNextGraceToken ? State.getDaysUntilNextGraceToken() : 15;
  const curPage = Math.max(1, Math.min(604, s.quranProgress.currentPage || 1));
  const khatmaPct = Math.min(100, Math.round((curPage / 604) * 100));
  const currentJuz = Math.min(30, Math.max(1, Math.ceil(curPage / 20.13)));
  const unlockedIds = (s.garden.badges || []).map(b => b.id);

  // Khatma Plan Settings
  const khatma = s.khatmaPlan || {
    enabled: false,
    durationMonths: 1,
    prayersDone: {}
  };
  const duration = khatma.durationMonths || 1;
  const prayersDone = khatma.prayersDone || {};

  // Plan presets data
  const plans = {
    1: {
      months: 1,
      title: 'ختمة في شهر',
      days: 30,
      dailyPages: 20,
      badgeText: 'جزء كامل يومياً',
      prayers: [
        { key: 'fajr', name: 'صلاة الفجر', icon: 'wb_twilight', pages: 4, desc: '٤ صفحات (ورقتان)' },
        { key: 'dhuhr', name: 'صلاة الظهر', icon: 'wb_sunny', pages: 4, desc: '٤ صفحات (ورقتان)' },
        { key: 'asr', name: 'صلاة العصر', icon: 'filter_drama', pages: 4, desc: '٤ صفحات (ورقتان)' },
        { key: 'maghrib', name: 'صلاة المغرب', icon: 'wb_shade', pages: 4, desc: '٤ صفحات (ورقتان)' },
        { key: 'isha', name: 'صلاة العشاء', icon: 'nights_stay', pages: 4, desc: '٤ صفحات (ورقتان)' },
      ]
    },
    2: {
      months: 2,
      title: 'ختمة في شهرين',
      days: 60,
      dailyPages: 10,
      badgeText: 'نصف جزء يومياً',
      prayers: [
        { key: 'fajr', name: 'صلاة الفجر', icon: 'wb_twilight', pages: 2, desc: 'صفحتان (ورقة واحدة)' },
        { key: 'dhuhr', name: 'صلاة الظهر', icon: 'wb_sunny', pages: 2, desc: 'صفحتان (ورقة واحدة)' },
        { key: 'asr', name: 'صلاة العصر', icon: 'filter_drama', pages: 2, desc: 'صفحتان (ورقة واحدة)' },
        { key: 'maghrib', name: 'صلاة المغرب', icon: 'wb_shade', pages: 2, desc: 'صفحتان (ورقة واحدة)' },
        { key: 'isha', name: 'صلاة العشاء', icon: 'nights_stay', pages: 2, desc: 'صفحتان (ورقة واحدة)' },
      ]
    },
    3: {
      months: 3,
      title: 'ختمة في ٣ أشهر',
      days: 90,
      dailyPages: 7,
      badgeText: 'ثلث جزء يومياً',
      prayers: [
        { key: 'fajr', name: 'صلاة الفجر', icon: 'wb_twilight', pages: 2, desc: 'صفحتان' },
        { key: 'dhuhr', name: 'صلاة الظهر', icon: 'wb_sunny', pages: 1, desc: 'صفحة واحدة' },
        { key: 'asr', name: 'صلاة العصر', icon: 'filter_drama', pages: 1, desc: 'صفحة واحدة' },
        { key: 'maghrib', name: 'صلاة المغرب', icon: 'wb_shade', pages: 1, desc: 'صفحة واحدة' },
        { key: 'isha', name: 'صلاة العشاء', icon: 'nights_stay', pages: 2, desc: 'صفحتان' },
      ]
    },
    6: {
      months: 6,
      title: 'ختمة في ٦ أشهر',
      days: 180,
      dailyPages: 3,
      badgeText: 'تدرج ميسر',
      prayers: [
        { key: 'fajr', name: 'صلاة الفجر', icon: 'wb_twilight', pages: 1, desc: 'صفحة واحدة' },
        { key: 'dhuhr', name: 'صلاة الظهر', icon: 'wb_sunny', pages: 1, desc: 'صفحة واحدة' },
        { key: 'asr', name: 'صلاة العصر', icon: 'filter_drama', pages: 1, desc: 'صفحة واحدة' },
        { key: 'maghrib', name: 'صلاة المغرب', icon: 'wb_shade', pages: 0, desc: 'استراحة / مراجعة' },
        { key: 'isha', name: 'صلاة العشاء', icon: 'nights_stay', pages: 1, desc: 'صفحة واحدة' },
      ]
    }
  };

  const currentPlan = plans[duration] || plans[1];
  const prayersList = currentPlan.prayers;
  const completedPrayersCount = prayersList.filter(p => !!prayersDone[p.key]).length;
  const prayersProgressPct = Math.round((completedPrayersCount / 5) * 100);

  // Milestones data for plant growth
  const milestones = [
    { id: 'seed',   label: 'بذرة الإيمان',   emoji: '🌱', day: 1 },
    { id: 'sprout', label: 'البادرة الخضراء', emoji: '🌿', day: 3 },
    { id: 'plant',  label: 'شتلة يانعة',     emoji: '🌵', day: 7 },
    { id: 'tree',   label: 'شجرة مورقة',     emoji: '🌳', day: 14 },
    { id: 'oasis',  label: 'واحة مثمرة',     emoji: '🌴', day: 30 },
  ];

  function milestoneStatus(m, index) {
    if (streak >= m.day) return 'done';
    if (streak >= (milestones[index - 1]?.day ?? 0)) return 'active';
    return streak >= (milestones[index - 1]?.day ?? -1) ? 'next' : 'locked';
  }

  return `
<div class="screen-content" id="garden-content">

  <!-- ═════════════════════════════════════════════════
       HEADER
       ═════════════════════════════════════════════════ -->
  <section>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-2)">
      <div class="chip chip--sage">
        <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">eco</span>
        <span>المستوى ${n(s.user.level)} · ${stage.label}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="chip" style="background:rgba(184,142,79,0.15);color:var(--color-gold-dark);font-size:var(--font-size-xs);font-weight:700;padding:4px 10px;border-radius:var(--radius-full);border:1px solid rgba(184,142,79,0.3)" title="رخص استدراك تحمي نبتتك من التصفير عند الانشغال، تكسب رخصة كل ٧ أيام">
          <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">shield</span>
          <span>درع الغِراس: ${n(graceTokens)} رخص</span>
        </span>
        <div style="display:flex;align-items:center;gap:var(--space-1);font-size:var(--font-size-xs);color:var(--color-gold);font-weight:600">
          <span class="material-symbols-outlined" style="font-size:1.1rem">water_drop</span>
          <span>عمر النبتة: ${n(streak)} أيام</span>
        </div>
      </div>
    </div>
    <h1 style="font-size:var(--font-size-2xl);font-weight:700;color:var(--text-primary);margin:0">حديقتي المباركة 🌿</h1>
    <p style="font-size:var(--font-size-base);color:var(--text-secondary);margin-top:var(--space-2);line-height:1.7">
      كل طاعة تؤديها وورد تتلوه يروي نبتتك الطيبة بالسكينة، فتنمو وتورق مع استمرارك الهادئ.
    </p>
  </section>

  <!-- ═════════════════════════════════════════════════
       🌧️ COMPASSIONATE STREAK RECOVERY & COMPENSATION CARD (الاستدراك والتعويض الرحيم)
       ═════════════════════════════════════════════════ -->
  ${isThirsty ? `
  <section class="animate-fadeInUp" style="background:linear-gradient(135deg, rgba(255,253,249,1) 0%, rgba(249,243,234,0.95) 100%);border:2px solid var(--color-gold);border-radius:var(--radius-3xl);padding:var(--space-5);margin-bottom:var(--space-5);box-shadow:0 10px 30px rgba(184,142,79,0.16);position:relative">
    
    <!-- Header -->
    <div style="display:flex;align-items:flex-start;gap:var(--space-4);margin-bottom:var(--space-4)">
      <div style="width:3.4rem;height:3.4rem;border-radius:50%;background:linear-gradient(135deg, #F3CF7A 0%, #B88E4F 100%);display:flex;align-items:center;justify-content:center;font-size:1.6rem;flex-shrink:0;box-shadow:0 4px 14px rgba(184,142,79,0.3);color:#FFF">
        💧
      </div>
      <div style="flex:1">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <h3 style="font-size:1.15rem;font-weight:800;color:var(--text-primary);margin:0;display:flex;align-items:center;gap:6px">
            <span>نبتتك بانتظار غيثك المبارك</span>
            <span>🌱</span>
          </h3>
          <span class="chip" style="background:#FFF;color:var(--color-gold-dark);font-weight:800;font-size:0.75rem;padding:4px 12px;border:1px solid rgba(184,142,79,0.35);border-radius:var(--radius-full)">
            عمر النبتة محفوظ: ${n(streak)} يوماً 🛡️
          </span>
        </div>
        <p style="font-size:0.875rem;color:var(--text-secondary);margin:6px 0 0 0;line-height:1.7">
          انشغلت بالأمس؟ لا بأس على الإطلاق، العبرة دائماً بالاستمرار الهادئ. لم يُصفّر عدادك ولم تمت نبتتك، ولديك طريقتان ميسرتان لإعادتها للنضارة:
        </p>
      </div>
    </div>

    <!-- 2 Clear Recovery Pathways -->
    <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(260px, 1fr));gap:12px;margin-bottom:var(--space-4)">
      
      <!-- Pathway 1: Compensation (Recommended & Free) -->
      <div style="background:linear-gradient(135deg, rgba(74,107,83,0.08) 0%, #FFFDF9 100%);border:1.5px solid var(--color-sage);border-radius:var(--radius-2xl);padding:14px;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:0.75rem;font-weight:800;color:var(--color-sage);background:rgba(74,107,83,0.12);padding:2px 8px;border-radius:var(--radius-full)">
              ⭐ الخيار الموصى به (بدون خصم رخص)
            </span>
          </div>
          <h4 style="font-size:0.95rem;font-weight:800;color:var(--text-primary);margin:0 0 4px 0">
            📖 تعويض الورد (أمس + اليوم)
          </h4>
          <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;margin:0 0 12px 0">
            اقرأ ما فاتك مع ورد اليوم امتثالاً لهدي النبي ﷺ. ترتوي نبتتك فوراً وتحتفظ بكامل رخصك!
          </p>
        </div>
        <button onclick="App.compensateMissedWird()" class="btn btn--primary" style="background:linear-gradient(135deg, #3D8557 0%, #25653C 100%);color:#FFF;border:none;border-radius:var(--radius-xl);padding:10px 14px;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 3px 10px rgba(37,101,60,0.25);width:100%">
          <span class="material-symbols-outlined" style="font-size:1.1rem">auto_stories</span>
          <span>عوضت ورودي، أعد نضارة نبتتي 🌿</span>
        </button>
      </div>

      <!-- Pathway 2: Emergency Grace Token -->
      <div style="background:rgba(184,142,79,0.05);border:1.5px solid rgba(184,142,79,0.3);border-radius:var(--radius-2xl);padding:14px;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:0.75rem;font-weight:800;color:var(--color-gold-dark);background:rgba(184,142,79,0.15);padding:2px 8px;border-radius:var(--radius-full)">
              رصيدك: ${n(graceTokens)} من ٣ رخص 💧
            </span>
          </div>
          <h4 style="font-size:0.95rem;font-weight:800;color:var(--text-primary);margin:0 0 4px 0">
            💧 رخصة استدراك
          </h4>
          <p style="font-size:0.78rem;color:var(--text-secondary);line-height:1.5;margin:0 0 12px 0">
            تستعيد نبتتك فوراً وتثبّت سلسلتك بخصم رخصة واحدة من رصيدك.
          </p>
        </div>
        ${graceTokens > 0 ? `
          <button onclick="App.recoverGardenStreak('token')" class="btn btn--secondary" style="border:1px solid rgba(184,142,79,0.4);border-radius:var(--radius-xl);padding:10px 14px;font-weight:700;font-size:0.85rem;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;width:100%">
            <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-gold)">water_drop</span>
            <span>استخدم رخصة استدراك (متبقي ${n(graceTokens)})</span>
          </button>
        ` : `
          <div style="text-align:center;padding:8px;border-radius:var(--radius-xl);background:rgba(184,142,79,0.1);font-size:0.75rem;color:var(--color-gold-dark);font-weight:700">
            ⚠️ استهلكت جميع الرخص (٣/٣) — يمكنك استخدام "تعويض الورد" أعلاه مجاناً
          </div>
        `}
      </div>

    </div>

    <!-- Motivational Rules Note -->
    <div style="padding:8px 12px;border-radius:var(--radius-lg);background:rgba(184,142,79,0.08);border:1px dashed rgba(184,142,79,0.25);display:flex;align-items:center;gap:8px">
      <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-gold)">info</span>
      <p style="font-size:0.72rem;color:var(--text-secondary);margin:0;font-weight:600;line-height:1.4">
        تتجدد رخصة جديدة تلقائياً كل ١٥ يوماً من الالتزام المتواصل (متبقي ${n(daysUntilNextToken)} يوماً على الرخصة القادمة، بحد أقصى ٣ رخص لمنع التكاسل).
      </p>
    </div>

  </section>
  ` : ''}

  <!-- ═════════════════════════════════════════════════
       1. THE LIVING PLANT (النبته الرئيسية وتطورها أولاً)
       ═════════════════════════════════════════════════ -->
  <section style="background:linear-gradient(to bottom, var(--color-bg-card), var(--color-bg-sage));border:1px solid var(--color-sage-light);border-radius:var(--radius-3xl);padding:var(--space-6);position:relative;overflow:hidden;box-shadow:0 12px 32px rgba(74,107,83,0.07)">
    
    <!-- Ambient Sparkles -->
    <div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;overflow:hidden">
      <div class="garden-sparkle" style="position:absolute;top:15%;right:15%;font-size:0.875rem">✨</div>
      <div class="garden-sparkle" style="position:absolute;top:35%;left:12%;font-size:0.75rem;animation-delay:0.7s">🌸</div>
      <div class="garden-sparkle" style="position:absolute;bottom:25%;right:10%;font-size:0.75rem;animation-delay:1.2s">💫</div>
      <div class="garden-sparkle" style="position:absolute;bottom:15%;left:20%;font-size:0.875rem;animation-delay:0.3s">🍃</div>
    </div>

    <!-- Status Ribbon -->
    <div style="display:flex;justify-content:center;margin-bottom:var(--space-5)">
      <div style="display:flex;align-items:center;gap:var(--space-2);background:rgba(255,253,249,0.92);backdrop-filter:blur(8px);padding:var(--space-2) var(--space-4);border-radius:var(--radius-full);box-shadow:var(--shadow-sm);border:1px solid var(--color-border)">
        <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">sparkles</span>
        <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-primary)">
          ${isThirsty
            ? 'نبتتك عطشى وتنتظر قطرة ماء مباركة لتستعيد نموها 🌧️'
            : streak >= 7
              ? `الحديقة في أوج نضارتها بفضل استمرارك لـ ${n(streak)} أيام ✨`
              : streak > 0
                ? `نبتتك تنمو بخطوات هادئة ومباركة (${stage.label}) 🌱`
                : 'ابدأ غِراسك اليوم بخطوة هادئة ومباركة 🌿'}
        </span>
      </div>
    </div>

    <!-- Main Plant Visual -->
    <div style="display:flex;justify-content:center;margin-bottom:var(--space-5)">
      <div style="position:relative">
        <!-- Glow -->
        <div style="position:absolute;inset:-10%;background:radial-gradient(circle,rgba(74,107,83,0.15) 0%,transparent 70%);border-radius:50%;pointer-events:none"></div>
        <!-- Plant Container -->
        <div style="width:13rem;height:13rem;border-radius:50%;background:linear-gradient(to bottom,var(--color-bg-card),var(--color-bg-sage));box-shadow:0 8px 32px rgba(74,107,83,0.15);display:flex;align-items:center;justify-content:center;border:2px solid var(--color-sage-light);overflow:hidden;font-size:5.5rem;position:relative">
          <span class="animate-float" style="${isThirsty ? 'filter:saturate(0.55) sepia(0.25);opacity:0.85;' : ''}">${stage.emoji}</span>
          ${isThirsty ? `
            <div style="position:absolute;top:0.75rem;background:rgba(255,253,249,0.96);border:1.5px solid var(--color-gold);border-radius:var(--radius-full);padding:3px 10px;font-size:0.72rem;font-weight:800;color:var(--color-gold-dark);display:flex;align-items:center;gap:4px;box-shadow:0 2px 8px rgba(184,142,79,0.25)">
              <span>🍂</span>
              <span>عطشى وبانتظار الغيث</span>
            </div>
          ` : ''}
        </div>
        <!-- Water Button -->
        <button onclick="App.waterGarden()" id="water-btn" title="اسقِ نبتتك الآن"
          style="position:absolute;bottom:0.5rem;left:0.5rem;width:2.75rem;height:2.75rem;border-radius:50%;background:var(--color-primary);color:var(--color-gold);border:2px solid var(--color-gold);display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-md);cursor:pointer;transition:transform 0.2s"
          onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <span class="material-symbols-outlined icon-fill" style="font-size:1.25rem">water_drop</span>
        </button>
      </div>
    </div>

    <!-- Care Indicator -->
    <div style="background:rgba(255,253,249,0.9);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);display:flex;align-items:center;justify-content:space-between;border:1px solid var(--color-border)">
      <div style="display:flex;align-items:center;gap:var(--space-3)">
        <div style="width:2.25rem;height:2.25rem;border-radius:50%;background:var(--color-gold-light);display:flex;align-items:center;justify-content:center;color:var(--color-gold)">
          <span class="material-symbols-outlined" style="font-size:1.2rem">local_florist</span>
        </div>
        <div>
          <div style="font-size:var(--font-size-base);font-weight:700;color:var(--text-primary)">درجة الرعاية اليومية</div>
          <div style="font-size:var(--font-size-xs);color:var(--text-secondary)">${State.getTodayProgress() > 0 ? 'تم ري النبتة بالقرآن والأذكار' : 'في انتظار رعايتك وإنجاز أورادك اليوم'}</div>
        </div>
      </div>
      <div style="font-size:var(--font-size-lg);font-weight:700;color:var(--color-sage);display:flex;align-items:center;gap:4px">
        <span>${State.toArabicNum(State.getTodayProgress())}٪</span>
        <span class="material-symbols-outlined icon-fill" style="font-size:1.25rem;color:var(--color-sage)">
          ${State.getTodayProgress() === 100 ? 'check_circle' : 'radio_button_unchecked'}
        </span>
      </div>
    </div>

    <!-- Garden XP -->
    <div style="margin-top:var(--space-3);text-align:center;font-size:var(--font-size-xs);color:var(--text-secondary)">
      <span>إجمالي نقاط النبتة: </span>
      <span style="font-weight:700;color:var(--color-gold)">${n(s.garden.totalXP)} نقطة ⭐</span>
    </div>
  </section>

  <!-- Growth Milestone Timeline -->
  <section>
    <div class="section-header">
      <h2 class="section-title">
        <span class="material-symbols-outlined">conversion_path</span>
        مراحل نمو وتطور نبتتك
      </h2>
      <span style="font-size:var(--font-size-xs);color:var(--text-secondary);font-weight:600">${n(streak)} / ${n(30)} يوماً</span>
    </div>
    <div style="background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-4);overflow-x:auto">
      <div style="display:flex;align-items:center;min-width:560px;padding:var(--space-2) 0">
        ${milestones.map((m, i) => {
          const status = milestoneStatus(m, i);
          const isLast = i === milestones.length - 1;
          return `
          <div style="display:flex;flex-direction:column;align-items:center;gap:var(--space-1);text-align:center;min-width:96px">
            <div class="milestone-node__dot milestone-node__dot--${status === 'done' ? 'done' : status === 'active' ? 'active' : status === 'next' ? 'next' : 'locked'}" style="font-size:1.5rem">
              ${status === 'done' ? '✓' : m.emoji}
            </div>
            <span style="font-size:var(--font-size-xs);font-weight:${status === 'active' ? '700' : '500'};color:${status === 'active' ? 'var(--color-gold)' : status === 'done' ? 'var(--text-primary)' : 'var(--text-muted)'}">
              ${m.label}
            </span>
            <span style="font-size:0.625rem;color:var(--text-muted)">يوم ${n(m.day)} ${status === 'active' ? '· أنت هنا' : status === 'done' ? '· تم' : ''}</span>
          </div>
          ${!isLast ? `<div style="flex:1;height:2px;border-radius:9999px;background:${status === 'done' ? 'var(--color-primary)' : 'var(--color-border)'}"></div>` : ''}
          `;
        }).join('')}
      </div>
    </div>
  </section>

  <!-- Compassion Card -->
  <section style="background:var(--color-bg-secondary);border:1px solid var(--color-border);border-radius:var(--radius-2xl);padding:var(--space-5);display:flex;gap:var(--space-4);align-items:flex-start">
    <div style="width:2.5rem;height:2.5rem;border-radius:50%;background:var(--color-gold-light);display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--color-gold)">
      <span class="material-symbols-outlined icon-fill" style="font-size:1.375rem">favorite</span>
    </div>
    <div>
      <h3 style="font-size:var(--font-size-md);font-weight:700;color:var(--text-primary);margin:0 0 var(--space-2)">مساحة لطف وأمان 🌱</h3>
      <p style="font-size:var(--font-size-base);color:var(--text-secondary);line-height:1.7;margin:0">
        إذا انشغلت يوماً، نبتتك تنتظر عودتك لتزهر من جديد بدون لوم أو انكسار. العبرة دائماً بالاستمرار الهادئ وحسن الإقبال، ومع كل ١٥ يوماً من الالتزام تكسب رخصة استدراك جديدة (بحد أقصى ٣ رخص).
      </p>
    </div>
  </section>

  <!-- ═════════════════════════════════════════════════
       2. KHATMA TRACK SECTION (مسار ختمة القرآن كخيار أسفل النبتة)
       ═════════════════════════════════════════════════ -->
  ${!khatma.enabled ? `
    <!-- Khatma Inactive: Optional Opt-In Card -->
    <section class="card animate-fadeInUp" style="background:linear-gradient(135deg, #FAF7F2 0%, #F5EFEB 100%);border:1.5px dashed var(--color-gold);border-radius:var(--radius-3xl);padding:var(--space-6);position:relative;overflow:hidden">
      <div style="display:flex;align-items:flex-start;gap:var(--space-4)">
        <div style="width:3.25rem;height:3.25rem;border-radius:var(--radius-2xl);background:rgba(184, 142, 79, 0.15);border:1px solid var(--color-gold);display:flex;align-items:center;justify-content:center;color:var(--color-gold);flex-shrink:0">
          <span class="material-symbols-outlined" style="font-size:1.875rem">menu_book</span>
        </div>
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span class="chip" style="background:rgba(184, 142, 79, 0.2);color:var(--color-gold-dark);font-size:0.75rem;padding:2px 8px;font-weight:700">خيار متاح</span>
            <h2 style="font-size:1.2rem;font-weight:700;color:var(--text-primary);margin:0">مسار ختمة القرآن الكريم 📖</h2>
          </div>
          <p style="font-size:0.875rem;color:var(--text-secondary);line-height:1.7;margin:0 0 var(--space-4)">
            هل ترغب في ختم القرآن الكريم بتدرج وسكينة؟ يمكنك تفعيل خطة الختمة واختيار المدة المناسبة لك (شهر، شهرين، ٣ أشهر، أو ٦ أشهر) لنقسّم لك الصفحات بدقة مع كل صلاة من الصلوات الخمس.
          </p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:var(--space-4)">
            <div style="background:#FFFFFF;border:1px solid var(--color-border);padding:8px 12px;border-radius:var(--radius-lg);font-size:0.75rem;color:var(--text-primary)">
              <div style="font-weight:700;color:var(--color-primary)">⏱️ ختمة في شهر:</div>
              <div style="color:var(--text-secondary)">٤ صفحات بعد كل صلاة (جزء/يوم)</div>
            </div>
            <div style="background:#FFFFFF;border:1px solid var(--color-border);padding:8px 12px;border-radius:var(--radius-lg);font-size:0.75rem;color:var(--text-primary)">
              <div style="font-weight:700;color:var(--color-primary)">⏱️ ختمة في شهرين:</div>
              <div style="color:var(--text-secondary)">صفحتان بعد كل صلاة (نصف جزء)</div>
            </div>
          </div>

          <button onclick="App.enableKhatma(true)" class="btn btn--primary" style="width:100%;padding:12px;border-radius:var(--radius-xl);display:flex;align-items:center;justify-content:center;gap:8px;font-size:0.9375rem;font-weight:700;cursor:pointer">
            <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">check_circle</span>
            <span>تفعيل خطة الختمة الآن</span>
          </button>
        </div>
      </div>
    </section>
  ` : `
    <!-- Khatma Active: Full Plan & Prayer Distribution Hub -->
    <section class="card animate-fadeInUp" style="background:linear-gradient(135deg, rgba(24, 18, 12, 0.96) 0%, rgba(38, 30, 20, 0.96) 100%);border:1.5px solid var(--color-gold);color:#FAF7F2;position:relative;overflow:hidden;padding:var(--space-5);border-radius:var(--radius-3xl)">
      
      <!-- Golden Background Aura -->
      <div style="position:absolute;top:-4rem;right:-4rem;width:14rem;height:14rem;background:radial-gradient(circle, rgba(197,160,89,0.25) 0%, transparent 70%);border-radius:50%;pointer-events:none"></div>
      <div style="position:absolute;bottom:-4rem;left:-4rem;width:12rem;height:12rem;background:radial-gradient(circle, rgba(74,107,83,0.25) 0%, transparent 70%);border-radius:50%;pointer-events:none"></div>

      <div style="position:relative;z-index:1">
        
        <!-- Khatma Header Controls -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);flex-wrap:wrap;gap:8px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:2.6rem;height:2.6rem;border-radius:50%;background:rgba(197,160,89,0.2);border:1px solid var(--color-gold);display:flex;align-items:center;justify-content:center;color:var(--color-gold)">
              <span class="material-symbols-outlined" style="font-size:1.4rem">park</span>
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:6px">
                <h2 style="font-size:1.15rem;font-weight:700;color:#FFF8EE;margin:0">مسار ختمة القرآن الكريم 🌳</h2>
                <span class="chip" style="background:rgba(184, 142, 79, 0.3);color:var(--color-gold);font-size:0.7rem;padding:2px 6px">مفعّل</span>
              </div>
              <div style="font-size:0.75rem;color:#D4BA94;margin-top:2px">خطة: ${currentPlan.title} (${currentPlan.badgeText})</div>
            </div>
          </div>

          <div style="display:flex;align-items:center;gap:6px">
            <button class="btn btn--sm" style="background:rgba(197,160,89,0.2);color:var(--color-gold);border:1px solid var(--color-gold);border-radius:var(--radius-pill);font-size:0.75rem;padding:4px 10px;cursor:pointer;display:inline-flex;align-items:center;gap:4px" onclick="App.openKhatmaCertificate()">
              <span class="material-symbols-outlined" style="font-size:1rem">workspace_premium</span>
              <span>شهادة الختمة</span>
            </button>
            <button onclick="App.enableKhatma(false)" style="background:none;border:none;color:#B9A590;font-size:0.75rem;cursor:pointer;display:flex;align-items:center;gap:2px;padding:4px" title="إيقاف مؤقت">
              <span class="material-symbols-outlined" style="font-size:0.95rem">pause_circle</span>
              <span>إيقاف</span>
            </button>
          </div>
        </div>

        <!-- Duration Picker Tabs -->
        <div style="margin-bottom:var(--space-4)">
          <div style="font-size:0.75rem;color:#D4BA94;margin-bottom:6px;font-weight:600">اختر مدة الختمة المرغوبة:</div>
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px;background:rgba(0,0,0,0.3);padding:4px;border-radius:var(--radius-xl);border:1px solid rgba(197,160,89,0.2)">
            ${[
              { m: 1, label: 'شهر', sub: '٣٠ يوم' },
              { m: 2, label: 'شهرين', sub: '٦٠ يوم' },
              { m: 3, label: '٣ أشهر', sub: '٩٠ يوم' },
              { m: 6, label: '٦ أشهر', sub: '١٨٠ يوم' },
            ].map(tab => `
              <button onclick="App.selectKhatmaDuration(${tab.m})" style="
                border:none;
                background:${duration === tab.m ? 'linear-gradient(135deg, #B88E4F 0%, #D4BA94 100%)' : 'transparent'};
                color:${duration === tab.m ? '#2C2219' : '#FAF7F2'};
                font-weight:${duration === tab.m ? '700' : '500'};
                border-radius:var(--radius-lg);
                padding:8px 4px;
                cursor:pointer;
                transition:all 0.2s;
                font-family:inherit;
                text-align:center;
              ">
                <div style="font-size:0.8125rem">${tab.label}</div>
                <div style="font-size:0.625rem;opacity:0.8">${tab.sub}</div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Khatma Progress Statistics -->
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(197,160,89,0.3);border-radius:var(--radius-xl);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:0.85rem;color:#E6C887;font-weight:600">تقدّم الختمة المباركة:</span>
            <span style="font-size:1rem;font-weight:700;color:var(--color-gold)">
              ${n(curPage)} / ٦٠٤ صفحة (${n(khatmaPct)}٪)
            </span>
          </div>
          <div class="progress-bar" style="background:rgba(255,255,255,0.12);height:8px">
            <div class="progress-bar__fill" style="width:${khatmaPct}%;background:linear-gradient(90deg, #B88E4F 0%, #E6C887 100%)"></div>
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;font-size:0.75rem;color:#D4BA94;margin-top:8px">
            <span>أنت الآن في: ${JUZ_NAMES[currentJuz] || 'الجزء الأول'}</span>
            <span>المتبقي: ${n(Math.max(0, 604 - curPage))} صفحة (~${n(Math.ceil((604 - curPage) / currentPlan.dailyPages))} يوماً)</span>
          </div>
        </div>

        <!-- Daily 5-Prayers Distribution Checklist -->
        <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(197,160,89,0.25);border-radius:var(--radius-2xl);padding:var(--space-4);margin-bottom:var(--space-4)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
            <div style="font-size:0.875rem;font-weight:700;color:#FFF8EE;display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-gold)">schedule</span>
              <span>توزيع ورد اليوم على الصلوات الخمس:</span>
            </div>
            <span style="font-size:0.75rem;color:var(--color-gold);font-weight:700">
              ${n(completedPrayersCount)} / ٥ صلوات (${n(prayersProgressPct)}٪)
            </span>
          </div>

          <!-- Prayers list -->
          <div style="display:flex;flex-direction:column;gap:8px">
            ${prayersList.map((prayer, idx) => {
              const isDone = !!prayersDone[prayer.key];
              // Calculate page target for this prayer
              let prayerTargetPage = curPage;
              return `
                <div style="
                  display:flex;
                  align-items:center;
                  justify-content:space-between;
                  background:${isDone ? 'rgba(74, 107, 83, 0.35)' : 'rgba(255,255,255,0.05)'};
                  border:1px solid ${isDone ? 'rgba(74, 107, 83, 0.7)' : 'rgba(197,160,89,0.2)'};
                  padding:10px 12px;
                  border-radius:var(--radius-xl);
                  transition:all 0.25s ease;
                ">
                  <div style="display:flex;align-items:center;gap:10px">
                    <div style="
                      width:2.2rem;
                      height:2.2rem;
                      border-radius:50%;
                      background:${isDone ? 'var(--color-sage)' : 'rgba(197,160,89,0.15)'};
                      color:${isDone ? '#FFFFFF' : 'var(--color-gold)'};
                      display:flex;
                      align-items:center;
                      justify-content:center;
                    ">
                      <span class="material-symbols-outlined" style="font-size:1.15rem">${prayer.icon}</span>
                    </div>
                    <div>
                      <div style="font-size:0.875rem;font-weight:700;color:${isDone ? '#A2D4B1' : '#FFF8EE'}">
                        ${prayer.name}
                        ${isDone ? '<span style="font-size:0.75rem;color:#A2D4B1">✓ مكتمل</span>' : ''}
                      </div>
                      <div style="font-size:0.75rem;color:#D4BA94">${prayer.desc}</div>
                    </div>
                  </div>

                  <div style="display:flex;align-items:center;gap:8px">
                    <button onclick="App.goToKhatmaReading(${prayerTargetPage})" style="
                      background:rgba(197,160,89,0.15);
                      border:1px solid rgba(197,160,89,0.4);
                      color:#FAF7F2;
                      padding:6px 10px;
                      border-radius:var(--radius-lg);
                      font-size:0.75rem;
                      font-weight:600;
                      cursor:pointer;
                      display:inline-flex;
                      align-items:center;
                      gap:4px;
                      font-family:inherit;
                    ">
                      <span class="material-symbols-outlined" style="font-size:0.875rem;color:var(--color-gold)">menu_book</span>
                      <span>اقرأ ص ${n(curPage)}</span>
                    </button>

                    <button onclick="App.toggleKhatmaPrayer('${prayer.key}')" style="
                      background:${isDone ? 'var(--color-sage)' : 'rgba(255,255,255,0.1)'};
                      border:1px solid ${isDone ? 'var(--color-sage)' : 'rgba(197,160,89,0.3)'};
                      color:${isDone ? '#FFFFFF' : '#D4BA94'};
                      padding:6px 10px;
                      border-radius:var(--radius-lg);
                      font-size:0.75rem;
                      font-weight:700;
                      cursor:pointer;
                      display:inline-flex;
                      align-items:center;
                      gap:4px;
                      font-family:inherit;
                    ">
                      <span class="material-symbols-outlined icon-fill" style="font-size:0.9rem">
                        ${isDone ? 'check_circle' : 'circle'}
                      </span>
                      <span>${isDone ? 'تم' : 'إتمام'}</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- 30-Juz Interactive Branches Grid -->
        <div style="margin-bottom:var(--space-1)">
          <div style="font-size:0.8rem;font-weight:700;color:#FFF8EE;margin-bottom:8px;display:flex;align-items:center;gap:6px">
            <span class="material-symbols-outlined" style="font-size:1rem;color:var(--color-gold)">eco</span>
            <span>أغصان الأجزاء الثلاثين (اضغط للانتقال لمصحفك):</span>
          </div>
          <div class="khatma-branches-grid">
            ${JUZ_PAGES.map(j => {
              const nextStart = JUZ_PAGES[j.juz]?.startPage || 605;
              const isCompleted = curPage >= nextStart;
              const isCurrent = curPage >= j.startPage && curPage < nextStart;
              const statusClass = isCompleted ? 'bloomed' : (isCurrent ? 'active' : 'bud');
              const icon = isCompleted ? '🌸' : (isCurrent ? '🌿' : '🌱');
              return `
                <div class="khatma-branch-leaf ${statusClass}" onclick="App.goToPage(${j.startPage})" title="${j.name} (يبدأ ص ${j.startPage})">
                  <span class="khatma-branch-icon">${icon}</span>
                  <span class="khatma-branch-num">ج ${n(j.juz)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>
    </section>
  `}

  <!-- ═════════════════════════════════════════════════
       3. ACHIEVEMENTS / BADGES (ثمار الحديقة)
       ═════════════════════════════════════════════════ -->
  <section>
    <div class="section-header">
      <h2 class="section-title">
        <span class="material-symbols-outlined" style="color:var(--color-gold)">stars</span>
        ثمار الحديقة (الأوسمة المباركة)
      </h2>
      <span style="font-size:var(--font-size-xs);color:var(--color-sage);font-weight:600">
        ${n(unlockedIds.length)} مكتملة
      </span>
    </div>
    <div class="badge-grid">
      ${ACHIEVEMENTS.map(ach => {
        const unlocked = unlockedIds.includes(ach.id);
        return `
        <div class="badge-card ${unlocked ? '' : 'locked'}">
          <div class="badge-card__icon ${unlocked ? 'badge-card__icon--gold' : 'badge-card__icon--dark'}">
            <span class="material-symbols-outlined icon-fill" style="font-size:1.25rem">${ach.icon}</span>
          </div>
          ${unlocked ? `<span class="material-symbols-outlined icon-fill" style="font-size:1.125rem;color:var(--color-sage);position:absolute;top:var(--space-3);left:var(--space-3)">verified</span>` : ''}
          <div class="badge-card__name">${ach.name}</div>
          <div class="badge-card__desc">${ach.desc}</div>
          <div class="badge-card__status">
            ${unlocked
              ? `<span class="material-symbols-outlined icon-fill" style="font-size:0.875rem">check_circle</span> مكتملة ومُزهرة ✓`
              : `<span class="material-symbols-outlined" style="font-size:0.875rem">lock</span> ${n(ach.xp)} نقطة`
            }
          </div>
        </div>`;
      }).join('')}
    </div>
  </section>

  <!-- ═════════════════════════════════════════════════
       4. SHARE GARDEN
       ═════════════════════════════════════════════════ -->
  <button id="share-garden-btn" onclick="App.shareGarden()"
    style="width:100%;padding:var(--space-4);border-radius:var(--radius-2xl);background:var(--color-primary);color:var(--text-inverted);border:1px solid var(--color-gold);font-family:var(--font-family);font-size:var(--font-size-base);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:var(--space-2);box-shadow:var(--shadow-button);transition:all 0.2s">
    <span class="material-symbols-outlined icon-fill">share</span>
    شارك حديقتك مع أصحابك
  </button>

</div>`;
}
