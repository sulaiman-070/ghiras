/**
 * GHIRAS — Complete Holy Quran (القرآن الكريم كاملاً)
 * 114 Surahs — 604 Pages — 6236 Ayat
 * Authentic Madinah Mushaf Page-by-Page and Surah-by-Surah Navigation
 */

import { State } from '../state.js?v=4.0';
import {
  getPage,
  getSurah,
  getAllSurahs,
  getSurahForPage,
  getJuzForPage,
  JUZ_NAMES,
  ATHKAR,
  isQuranLoaded,
  getReciter
} from '../data/quran.js?v=4.0';
import {
  ATHKAR_CATEGORIES,
  ATHKAR_DUAS,
  getAthkarByCategory
} from '../data/athkar_duas.js?v=4.0';

let _activeTab = 'quran';       // 'quran' | 'athkar'
let _readingMode = 'page';      // 'page' (1..604) | 'surah' (1..114)
let _isMemorizationMode = false; // Memorization masking mode
let _activeAthkarCat = 'morning';
let _activePrayerSub = 'all';
let _athkarSearchQuery = '';

export function setAthkarCategory(catId) {
  _activeAthkarCat = catId;
}

export function setPrayerSub(sub) {
  _activePrayerSub = sub;
}

export function setAthkarSearch(q) {
  _athkarSearchQuery = q;
}

export function getAthkarState() {
  return { cat: _activeAthkarCat, prayerSub: _activePrayerSub, search: _athkarSearchQuery };
}

export function setMemorizationMode(val) {
  _isMemorizationMode = val;
}

export function isMemorizationActive() {
  return _isMemorizationMode;
}

function renderAyahTextWithMask(text, isMemo) {
  if (!isMemo) return text;
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) return text;
  const maskStartIndex = Math.max(1, words.length - Math.ceil(words.length * 0.45));
  return words.map((w, idx) => {
    if (idx >= maskStartIndex) {
      return `<span class="masked-word" onclick="App.revealMaskedWord(this, event)" title="انقر لكشف الكلمة للتأكد">${w}</span>`;
    }
    return w;
  }).join(' ');
}

export function renderWird(pageOverride) {
  const s = State.get();
  const n = State.toArabicNum;
  const qp = s.quranProgress || {};
  const activeReciter = getReciter(s.settings?.reciterId);

  const currentPageNum = Math.max(1, Math.min(604, parseInt(pageOverride, 10) || qp.currentPage || 1));
  const surahMeta = getSurahForPage(currentPageNum);
  const currentSurahNum = surahMeta ? surahMeta.number : Math.max(1, Math.min(114, qp.currentSurahId || 1));

  // Get Page Data or Surah Data based on active mode
  const pageData = getPage(currentPageNum);
  const surahData = getSurah(currentSurahNum);

  const athkarMorning = ATHKAR.morning;
  const progress = qp.todayAyahsRead || 0;

  return `
<div class="screen-content" id="wird-content">

  <!-- Floating Button to Exit Focus Mode -->
  <button class="mushaf-exit-focus-btn" onclick="App.toggleMushafFocus(false)">
    <span class="material-symbols-outlined">fullscreen_exit</span>
    <span>إنهاء وضع الخشوع</span>
  </button>

  <!-- Header: Mode Toggle & Today's Progress -->
  <section>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3)">
      <div>
        <h1 style="font-size:var(--font-size-xl);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:var(--space-2)">
          <span>المصحف الشريف</span>
          <span style="font-size:1.1rem">📖</span>
        </h1>
        <p style="font-size:var(--font-size-xs);color:var(--text-muted);margin-top:2px">
          القرآن الكريم كاملاً (٦٠٤ صفحات • ١١٤ سورة • ٦٢٣٦ آية)
        </p>
      </div>

      <div class="chip chip--sage" style="cursor:pointer" onclick="App.markPageRead()" title="اضغط لتسجيل صفحة في وردك اليومي">
        <span class="material-symbols-outlined icon-fill" style="font-size:1rem">check_circle</span>
        <span>${n(progress)} آية اليوم</span>
      </div>
    </div>

    <!-- Mode Tabs: Quran vs Athkar -->
    <div style="display:flex;gap:var(--space-2);padding:var(--space-1);background:var(--color-bg-secondary);border-radius:var(--radius-xl);border:1px solid var(--color-border);margin-bottom:var(--space-3)">
      <button id="wird-tab-quran" onclick="App.switchWirdTab('quran')"
        style="flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:none;font-family:var(--font-family);font-size:var(--font-size-base);font-weight:600;cursor:pointer;transition:all 0.2s;
        background:${_activeTab === 'quran' ? 'var(--color-primary)' : 'transparent'};
        color:${_activeTab === 'quran' ? 'var(--text-inverted)' : 'var(--text-secondary)'}">
        📖 القرآن الكريم
      </button>
      <button id="wird-tab-athkar" onclick="App.switchWirdTab('athkar')"
        style="flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:none;font-family:var(--font-family);font-size:var(--font-size-base);font-weight:600;cursor:pointer;transition:all 0.2s;
        background:${_activeTab === 'athkar' ? 'var(--color-primary)' : 'transparent'};
        color:${_activeTab === 'athkar' ? 'var(--text-inverted)' : 'var(--text-secondary)'}">
        🤲 الأذكار والمأثورات
      </button>
    </div>
  </section>

  <!-- ═════════════════════════════════════════════════
       QURAN TAB: COMPLETE MADINAH MUSHAF
       ═════════════════════════════════════════════════ -->
  <div id="wird-quran-tab" style="${_activeTab === 'quran' ? '' : 'display:none'}">

    <div class="mushaf-wrapper">

      <!-- ── Mushaf Controls Toolbar ── -->
      <div class="mushaf-toolbar">

        <!-- Right: Surah Index & Page Jumper -->
        <div class="mushaf-toolbar__group">
          <button class="mushaf-tool-btn" onclick="App.openSurahIndex()" title="فهرس سور القرآن (114 سورة)">
            <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">menu_book</span>
            <span>فهرس السور</span>
            <span class="material-symbols-outlined" style="font-size:0.9rem">arrow_drop_down</span>
          </button>

          <button class="mushaf-tool-btn" onclick="App.openPageJumpModal()" title="انتقال مباشر إلى أي صفحة (1..604)">
            <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-sage)">find_in_page</span>
            <span>ص ${n(currentPageNum)}</span>
          </button>
        </div>

        <!-- Middle: Page Flip Controls (RTL Arabic Quran Reading Order: Right is Prev, Left is Next) -->
        <div class="mushaf-toolbar__group">
          <!-- Previous Page Button (Right in RTL: goes back towards page 1) -->
          <button type="button" class="mushaf-tool-btn" ${currentPageNum > 1 ? `onclick="App.goToPage(${currentPageNum - 1}, 'prev')"` : 'disabled style="opacity:0.3;cursor:default"'} title="الصفحة السابقة (${currentPageNum - 1})">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>

          <!-- Current Page Number Badge -->
          <span style="font-family:var(--font-quran);font-weight:700;font-size:1rem;color:var(--mushaf-gold-dark);padding:0 var(--space-1);min-width:3.2rem;text-align:center;cursor:pointer" title="رقم الصفحة الحالية — اضغط للانتقال السريع" onclick="App.openPageJumpModal()">
            ${n(currentPageNum)} / ٦٠٤
          </span>

          <!-- Next Page Button (Left in RTL: advances forward into the Quran) -->
          <button type="button" class="mushaf-tool-btn" ${currentPageNum < 604 ? `onclick="App.goToPage(${currentPageNum + 1}, 'next')"` : 'disabled style="opacity:0.3;cursor:default"'} title="الصفحة التالية (${currentPageNum + 1})">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
        </div>

        <!-- Left: Font Zoom & Fullscreen Focus Mode -->
        <div class="mushaf-toolbar__group">
          <button class="mushaf-tool-btn ${_isMemorizationMode ? 'is-active' : ''}" onclick="App.toggleMemorizationMode()" id="memo-mode-btn" title="وضع اختبار الحفظ والتسميع (إخفاء الكلمات للتأكد غيباً)">
            <span class="material-symbols-outlined" style="font-size:1.1rem;color:${_isMemorizationMode ? '#1A1208' : 'var(--color-gold)'}">psychology</span>
            <span style="font-size:0.75rem;font-weight:700">${_isMemorizationMode ? 'الحفظ: مفعّل' : 'اختبار الحفظ'}</span>
          </button>
          <button class="mushaf-tool-btn" onclick="App.adjustMushafFontSize(-2)" title="تصغير الخط">
            <span style="font-size:0.8rem;font-weight:700">A-</span>
          </button>
          <button class="mushaf-tool-btn" onclick="App.adjustMushafFontSize(2)" title="تكبير الخط">
            <span style="font-size:0.95rem;font-weight:700">A+</span>
          </button>
          <button class="mushaf-tool-btn" onclick="App.toggleMushafFocus(true)" title="وضع الخشوع (ملء الشاشة)">
            <span class="material-symbols-outlined">fullscreen</span>
          </button>
        </div>
      </div>

      <!-- Memorization Mode Banner if active -->
      ${_isMemorizationMode ? `
        <div class="memo-mode-banner">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--color-gold)">visibility_off</span>
            <span style="font-size:0.8rem;color:var(--text-primary);font-weight:600">وضع اختبار الحفظ والتسميع مفعّل — انقر على أي كلمة مموّهة لكشفها والتأكد.</span>
          </div>
          <button class="btn btn--ghost" style="color:var(--color-gold);padding:3px 10px;font-size:0.75rem;border:1px solid rgba(197,160,89,0.4);border-radius:var(--radius-pill)" onclick="App.revealAllMaskedWords()">
            كشف كل الكلمات
          </button>
        </div>
      ` : ''}

      <!-- ── The Authentic Classical Mushaf Page (1..604) ── -->
      <div class="mushaf-page" id="mushaf-page">

        <!-- Double Gilded Frame with Ornate Islamic Corners -->
        <div class="mushaf-frame">

          <!-- Corner Rosettes -->
          <span class="mushaf-corner mushaf-corner--tl">✤</span>
          <span class="mushaf-corner mushaf-corner--tr">✤</span>
          <span class="mushaf-corner mushaf-corner--bl">✤</span>
          <span class="mushaf-corner mushaf-corner--br">✤</span>

          <!-- Upper Header: Juz, Surah Name, Hizb -->
          <div class="mushaf-page-header">
            <div class="mushaf-page-header__juz">
              <span>${pageData.juzName || JUZ_NAMES[pageData.juz || 1] || 'الجزء الأول'}</span>
            </div>
            <div class="mushaf-page-header__center">
              <span>۞ ${pageData.blocks.length > 0 ? pageData.blocks.map(b => `سورة ${b.surahName}`).join(' • ') : 'القرآن الكريم'} ۞</span>
            </div>
            <div class="mushaf-page-header__hizb">
              <span>الحزب ${n(Math.ceil((pageData.hizbQuarter || 1) / 4))}</span>
            </div>
          </div>

          <!-- Page Content: Render all Surah blocks appearing on this page -->
          ${pageData.blocks.map(block => `
            <!-- If a new Surah starts on this page, render the iconic gilded headpiece -->
            ${block.isNewSurahStart ? `
              <div class="mushaf-surah-cartouche">
                <div class="mushaf-surah-badge">${block.type}</div>
                <div class="mushaf-surah-title">
                  <span class="mushaf-surah-title__ornament">❁</span>
                  <span>سُورَةُ ${block.surahName}</span>
                  <span class="mushaf-surah-title__ornament">❁</span>
                </div>
                <div class="mushaf-surah-badge">آيَاتُهَا ${n(block.ayahCount)}</div>
              </div>

              <!-- Basmala if applicable -->
              ${block.showBasmala ? `
              <div class="mushaf-basmala">
                <span class="mushaf-basmala__flourish">❦</span>
                <span>بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ</span>
                <span class="mushaf-basmala__flourish">❦</span>
              </div>` : ''}
            ` : ''}

            <!-- Continuous Flowing Justified Quran Text -->
            <div class="mushaf-body" id="mushaf-text-flow-${block.surahNumber}">
              ${block.ayahs.map(ayah => {
                const isSelected = qp.lastReadSurahId === block.surahNumber && qp.lastReadAyah === ayah.number;
                return `
                  <span class="mushaf-ayah ${isSelected ? 'selected' : ''}"
                        id="mushaf-ayah-${block.surahNumber}-${ayah.number}"
                        onclick="App.openAyahAction(${block.surahNumber}, ${ayah.number}, event)"
                        title="سورة ${block.surahName} • آية ${ayah.number} — اضغط للتفسير والاستماع">
                    ${renderAyahTextWithMask(ayah.text, _isMemorizationMode)}
                  </span>
                  <span class="mushaf-ayah-end"
                        onclick="App.openAyahAction(${block.surahNumber}, ${ayah.number}, event)"
                        title="آية ${ayah.number}">
                    <span class="mushaf-ayah-num">${n(ayah.number)}</span>
                  </span>
                `;
              }).join('')}
            </div>
          `).join('')}

          <!-- Bottom Footer: Mushaf Page Number -->
          <div class="mushaf-page-footer">
            <div class="mushaf-page-num-badge" onclick="App.openPageJumpModal()" style="cursor:pointer" title="اضغط للانتقال إلى أي صفحة">
              <span>— ﴿ ${n(currentPageNum)} ﴾ —</span>
            </div>
          </div>

        </div>
      </div>

      <!-- Swipe & Navigation Hint Banner -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0 var(--space-2);font-size:0.75rem;color:var(--text-muted);user-select:none">
        <span style="display:inline-flex;align-items:center;gap:3px">
          <span class="material-symbols-outlined" style="font-size:0.95rem">chevron_right</span>
          <span>السابقة (يمين)</span>
        </span>
        <span style="display:inline-flex;align-items:center;gap:4px;color:var(--color-gold);font-weight:600">
          <span class="material-symbols-outlined" style="font-size:0.9rem">swipe</span>
          <span>اسحب لليمين للانتقال للصفحة اليسرى</span>
        </span>
        <span style="display:inline-flex;align-items:center;gap:3px">
          <span>التالية (يسار)</span>
          <span class="material-symbols-outlined" style="font-size:0.95rem">chevron_left</span>
        </span>
      </div>

      <!-- Quick Page Navigation Bottom Bar (RTL Quran System) -->
      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-2)">
        <!-- Previous Page (Right side in RTL): Return towards page 1 -->
        <button type="button" class="btn btn--secondary btn--sm" ${currentPageNum > 1 ? `onclick="App.goToPage(${currentPageNum - 1}, 'prev')"` : 'disabled style="opacity:0.35;cursor:default"'} style="flex:1" title="الصفحة السابقة (ص ${currentPageNum - 1})">
          <span class="material-symbols-outlined">chevron_right</span>
          <span>السابقة (ص ${n(Math.max(1, currentPageNum - 1))})</span>
        </button>

        <!-- Center: Mark Done / Bookmark in Wird -->
        <button type="button" class="btn btn--secondary btn--sm" onclick="App.markPageRead()" style="flex:1.2;font-weight:600;display:inline-flex;align-items:center;justify-content:center;gap:4px" title="تسجيل هذه الصفحة في وردك اليومي">
          <span class="material-symbols-outlined" style="color:var(--color-gold);font-size:1.1rem">bookmark_add</span>
          <span>تسجيل في الورد</span>
        </button>

        <!-- Next Page (Left side in RTL): Advance towards page 604 -->
        <button type="button" class="btn btn--secondary btn--sm" ${currentPageNum < 604 ? `onclick="App.goToPage(${currentPageNum + 1}, 'next')"` : 'disabled style="opacity:0.35;cursor:default"'} style="flex:1" title="الصفحة التالية (ص ${currentPageNum + 1})">
          <span>التالية (ص ${n(Math.min(604, currentPageNum + 1))})</span>
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
      </div>

    </div>

  </div>

  <!-- ═════════════════════════════════════════════════
       ATHKAR & DUAS TAB (حصن الأذكار وجامع الأدعية النبوية)
       ═════════════════════════════════════════════════ -->
  <div id="wird-athkar-tab" style="${_activeTab === 'athkar' ? '' : 'display:none'}">
    ${renderAthkarTabContent()}
  </div>

  <!-- ═════════════════════════════════════════════════
       AYAH ACTION BOTTOM SHEET (تلاوة • تفسير • نسخ • حفظ)
       ═════════════════════════════════════════════════ -->
  <div id="ayah-action-sheet" class="ayah-sheet">
    <div class="modal-handle"></div>
    <div class="ayah-sheet__header">
      <div class="ayah-sheet__title" id="ayah-sheet-title">
        <span class="material-symbols-outlined icon-fill" style="color:var(--color-gold)">auto_stories</span>
        <span>سورة الفاتحة — آية ١</span>
      </div>
      <button onclick="App.closeAyahAction()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);padding:4px">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <!-- Ayah Text Snippet -->
    <div id="ayah-sheet-text" style="font-family:var(--font-quran);font-size:1.3rem;line-height:2.2;color:var(--mushaf-text-ink);text-align:right;margin-bottom:var(--space-3);background:var(--mushaf-paper-bg);padding:var(--space-3);border-radius:var(--radius-xl);border:1px solid var(--mushaf-gold-border-soft)">
      بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
    </div>

    <!-- Tafseer Box -->
    <div class="ayah-sheet__tafseer-box" id="ayah-sheet-tafseer">
      التفسير الميسر يظهر هنا...
    </div>

    <!-- Recitation & Repeat Control -->
    <div style="background:var(--color-bg-secondary);padding:var(--space-3);border-radius:var(--radius-xl);border:1px solid var(--color-border);margin-bottom:var(--space-3);display:flex;flex-direction:column;gap:var(--space-2)">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:var(--font-size-xs);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:4px">
          <span class="material-symbols-outlined" style="font-size:1.1rem;color:var(--color-gold)">record_voice_over</span>
          <span id="current-reciter-name">تلاوة الشيخ ${activeReciter.name}</span>
        </span>
        <div style="display:flex;align-items:center;gap:6px">
          <button class="btn btn--ghost" style="padding:2px 8px;font-size:0.75rem;border:1px solid rgba(197,160,89,0.4);border-radius:var(--radius-pill);color:var(--color-gold);cursor:pointer;display:inline-flex;align-items:center;gap:3px" onclick="App.openReciterModal()" title="تغيير القارئ">
            <span class="material-symbols-outlined" style="font-size:0.95rem">swap_horiz</span>
            <span>تغيير</span>
          </button>
          <span id="ayah-repeat-indicator" style="font-size:0.75rem;color:var(--color-gold);font-weight:600">بدون تكرار</span>
        </div>
      </div>

      <!-- Repeat Mode Selector Chips -->
      <div style="display:flex;align-items:center;gap:6px;overflow-x:auto;padding-bottom:2px">
        <button class="chip audio-repeat-chip active" id="chip-repeat-1" onclick="App.setAudioRepeatMode(1)" style="font-size:0.75rem;cursor:pointer">
          مستمر (بدون تكرار)
        </button>
        <button class="chip audio-repeat-chip" id="chip-repeat-2" onclick="App.setAudioRepeatMode(2)" style="font-size:0.75rem;cursor:pointer">
          تكرار مرتين (٢x)
        </button>
        <button class="chip audio-repeat-chip" id="chip-repeat-3" onclick="App.setAudioRepeatMode(3)" style="font-size:0.75rem;cursor:pointer">
          تكرار ٣ مرات (٣x)
        </button>
        <button class="chip audio-repeat-chip" id="chip-repeat-inf" onclick="App.setAudioRepeatMode(Infinity)" style="font-size:0.75rem;cursor:pointer">
          تكرار دائم (∞)
        </button>
      </div>

      <button class="btn btn--primary" id="ayah-play-audio-btn" onclick="App.playCurrentAyahAudio()" style="width:100%;margin-top:2px">
        <span class="material-symbols-outlined">play_circle</span>
        <span>تشغيل التلاوة المستمرة من هذه الآية</span>
      </button>
    </div>

    <!-- Other Ayah Actions -->
    <div class="ayah-sheet__actions">
      <button class="btn btn--secondary" onclick="App.bookmarkSelectedAyah()" title="حفظ علامة مرجعية" style="flex:1">
        <span class="material-symbols-outlined">bookmark</span>
        <span>علامة</span>
      </button>

      <button class="btn btn--secondary" onclick="App.copySelectedAyah()" title="نسخ الآية" style="flex:1">
        <span class="material-symbols-outlined">content_copy</span>
        <span>نسخ</span>
      </button>

      <button class="btn btn--sage" onclick="App.markSelectedAyahAsRead()" title="سجّل قراءة هذه الآية في وردك" style="flex:1.2">
        <span class="material-symbols-outlined icon-fill">check</span>
        <span>حفظ الورد</span>
      </button>
    </div>
  </div>

  <!-- ═════════════════════════════════════════════════
       FLOATING STICKY MUSHAF AUDIO PLAYER BAR
       ═════════════════════════════════════════════════ -->
  <div id="mushaf-audio-bar" class="mushaf-audio-bar">
    <div class="mushaf-audio-bar__header">
      <div class="mushaf-audio-bar__info">
        <div class="mushaf-audio-bar__avatar" onclick="App.openReciterModal()" style="cursor:pointer" title="تغيير القارئ">
          <span class="material-symbols-outlined" style="font-size:1.3rem">graphic_eq</span>
        </div>
        <div class="mushaf-audio-bar__meta">
          <div class="mushaf-audio-bar__title" id="audio-bar-title">سورة الفاتحة • آية ١</div>
          <div class="mushaf-audio-bar__subtitle" style="cursor:pointer" onclick="App.openReciterModal()" title="انقر لتغيير القارئ">
            <span id="audio-bar-reciter-name">${activeReciter.name}</span>
            <span class="material-symbols-outlined" style="font-size:0.9rem;color:var(--color-gold)">expand_more</span>
            <span>•</span>
            <span id="audio-bar-status">جاري التلاوة</span>
          </div>
        </div>
      </div>
      <button class="mushaf-audio-bar__close" onclick="App.stopAyahAudio()" title="إيقاف التلاوة وإغلاق المشغل">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>

    <div class="mushaf-audio-bar__controls">
      <!-- Repeat Mode Cycle Button -->
      <button class="mushaf-audio-repeat-btn" id="audio-bar-repeat-btn" onclick="App.audioCycleRepeatMode()" title="تغيير وضع التكرار">
        <span class="material-symbols-outlined" style="font-size:1.1rem">repeat</span>
        <span id="audio-bar-repeat-label">مستمر</span>
      </button>

      <!-- Player Controls (RTL Quran Order) -->
      <div style="display:flex;align-items:center;gap:10px">
        <button class="mushaf-audio-btn" onclick="App.audioPlayPrevAyah()" title="الآية السابقة">
          <span class="material-symbols-outlined rtl-flip" style="font-size:1.6rem">skip_previous</span>
        </button>

        <button class="mushaf-audio-btn mushaf-audio-btn--play" id="audio-bar-play-toggle" onclick="App.audioTogglePlayPause()" title="تشغيل / إيقاف مؤقت">
          <span class="material-symbols-outlined" id="audio-bar-play-icon" style="font-size:1.8rem">pause</span>
        </button>

        <button class="mushaf-audio-btn" onclick="App.audioPlayNextAyah()" title="الآية التالية">
          <span class="material-symbols-outlined rtl-flip" style="font-size:1.6rem">skip_next</span>
        </button>
      </div>

      <!-- Current Page Jump Quick View -->
      <div id="audio-bar-page-badge" style="font-size:0.75rem;color:#C5A059;font-weight:700;padding:4px 8px;background:rgba(255,255,255,0.06);border-radius:var(--radius-md);cursor:pointer" onclick="App.audioBarJumpToCurrentPage()">
        ص ١
      </div>
    </div>
  </div>

</div>
`;
}

export function setWirdTab(tab) {
  _activeTab = tab;
}

export function setReadingMode(mode) {
  _readingMode = mode;
}

function toArabicNum(n) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

export function renderAthkarTabContent() {
  const n = toArabicNum;
  const s = State.get();
  const counters = s.athkarCounters || {};

  // Dynamic subcategories based on active category
  const subCategoryConfigs = {
    prayers: [
      { id: 'all', label: 'الكل (جميع الصلوات)' },
      { id: 'دبر المكتوبة', label: 'دبر الصلوات المكتوبة 🕌' },
      { id: 'الفجر', label: 'صلاة الفجر 🌅' },
      { id: 'الفجر والمغرب', label: 'الفجر والمغرب 🌇' },
      { id: 'الوتر والعشاء', label: 'الوتر والعشاء 🌙' },
      { id: 'السجود والركوع', label: 'السجود والركوع 🤲' }
    ],
    quranic: [
      { id: 'all', label: 'الكل 📖' },
      { id: 'جوامع الكلم', label: 'جوامع الكلم 🌟' },
      { id: 'الرزق والتيسير', label: 'الرزق والتيسير 🌾' },
      { id: 'الأنبياء', label: 'أدعية الأنبياء 🕊️' },
      { id: 'الهداية والثبات', label: 'الهداية والثبات 🧭' },
      { id: 'المغفرة والرحمة', label: 'المغفرة والرحمة 💎' }
    ],
    daily_life: [
      { id: 'all', label: 'الكل 🗺️' },
      { id: 'المنزل', label: 'المنزل 🏠' },
      { id: 'المسجد', label: 'المسجد 🕌' },
      { id: 'السفر والدابة', label: 'السفر والركوب 🚗' },
      { id: 'الطعام والشراب', label: 'الطعام والشراب 🍲' },
      { id: 'أحوال أخرى', label: 'أحوال أخرى 🌧️' }
    ]
  };

  const activeSubFilters = subCategoryConfigs[_activeAthkarCat] || null;

  // Determine which items to display
  let displayItems = [];
  let isSearchActive = Boolean(_athkarSearchQuery && _athkarSearchQuery.trim());

  if (isSearchActive) {
    const q = _athkarSearchQuery.trim().toLowerCase();
    displayItems = ATHKAR_DUAS.filter(item => {
      return (item.title && item.title.toLowerCase().includes(q)) ||
             (item.text && item.text.toLowerCase().includes(q)) ||
             (item.benefit && item.benefit.toLowerCase().includes(q)) ||
             (item.subCategory && item.subCategory.toLowerCase().includes(q));
    });
  } else {
    displayItems = ATHKAR_DUAS.filter(item => {
      if (item.category !== _activeAthkarCat) return false;
      if (activeSubFilters && _activePrayerSub !== 'all') {
        return item.subCategory === _activePrayerSub || item.subCategory === 'جميع الصلوات';
      }
      return true;
    });
  }

  // Active Category info
  const activeCatMeta = ATHKAR_CATEGORIES.find(c => c.id === _activeAthkarCat) || ATHKAR_CATEGORIES[0];

  // Habit status for morning / evening
  let habitBannerHtml = '';
  if (!isSearchActive && (_activeAthkarCat === 'morning' || _activeAthkarCat === 'evening')) {
    const habitId = _activeAthkarCat === 'morning' ? 'morning-athkar' : 'evening-athkar';
    const habit = (s.habits || []).find(h => h.id === habitId);
    const isDone = habit && (habit.minGoalDone || habit.todayStatus === 'min_done' || habit.todayStatus === 'extra_done');
    const habitTitle = _activeAthkarCat === 'morning' ? 'أذكار الصباح اليومية' : 'أذكار المساء اليومية';

    habitBannerHtml = `
      <div style="background:linear-gradient(135deg, rgba(197, 160, 89, 0.14) 0%, rgba(74, 107, 83, 0.12) 100%);border:1.5px solid ${isDone ? 'var(--color-sage)' : 'rgba(197, 160, 89, 0.4)'};border-radius:var(--radius-xl);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-3);display:flex;align-items:center;justify-content:space-between;gap:var(--space-2)">
        <div style="display:flex;align-items:center;gap:var(--space-3)">
          <div style="width:2.4rem;height:2.4rem;border-radius:50%;background:${isDone ? 'var(--color-sage)' : 'var(--color-gold)'};color:#FFF;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0">
            <span class="material-symbols-outlined">${isDone ? 'task_alt' : 'verified'}</span>
          </div>
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary)">
              ${habitTitle}
            </div>
            <div style="font-size:var(--font-size-xs);color:${isDone ? 'var(--color-sage-dark)' : 'var(--text-muted)'}">
              ${isDone ? '✨ مكتملة في وردك اليومي، تقبل الله منك' : '🌱 اقرأ أذكارك واضغط لتسجيلها في مهامك اليومية'}
            </div>
          </div>
        </div>
        <button class="btn ${isDone ? 'btn--secondary' : 'btn--primary'}" style="padding:6px 14px;font-size:0.8rem;white-space:nowrap" onclick="App.completeAthkar('${habitId}')">
          <span class="material-symbols-outlined" style="font-size:1rem">${isDone ? 'check' : 'done_all'}</span>
          <span>${isDone ? 'مكتملة ✓' : 'تسجيل الإتمام'}</span>
        </button>
      </div>
    `;
  }

  return `
    <div class="athkar-container" style="display:flex;flex-direction:column;gap:var(--space-3)">

      <!-- 1. Search Bar -->
      <div class="thikr-search-box">
        <span class="material-symbols-outlined thikr-search-icon">search</span>
        <input type="text" class="thikr-search-input" id="athkar-search-input"
          placeholder="ابحث في أكثر من ٨٠ ذكراً ودعاء وفضائلها (مثال: الرزق، الفجر، محو الذنوب، استخارة)..."
          value="${_athkarSearchQuery}"
          oninput="App.onAthkarSearch(this.value)">
        ${_athkarSearchQuery ? `
          <button onclick="App.clearAthkarSearch()" style="background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;padding:4px" title="مسح البحث">
            <span class="material-symbols-outlined" style="font-size:1.2rem">close</span>
          </button>
        ` : ''}
      </div>

      <!-- 2. Categories Horizontal Chips -->
      <div class="athkar-nav-chips">
        ${ATHKAR_CATEGORIES.map(cat => {
          const isActive = !isSearchActive && _activeAthkarCat === cat.id;
          return `
            <button class="athkar-cat-chip ${isActive ? 'active' : ''}" onclick="App.switchAthkarCategory('${cat.id}')">
              <span class="material-symbols-outlined" style="font-size:1.15rem">${cat.icon}</span>
              <span>${cat.label}</span>
            </button>
          `;
        }).join('')}
      </div>

      <!-- 3. Sub-filter Chips (when active category has subcategories) -->
      ${!isSearchActive && activeSubFilters ? `
        <div class="athkar-subfilters-row">
          ${activeSubFilters.map(sub => `
            <button class="athkar-subfilter-btn ${_activePrayerSub === sub.id ? 'active' : ''}" onclick="App.switchPrayerSub('${sub.id}')">
              ${sub.label}
            </button>
          `).join('')}
        </div>
      ` : ''}

      <!-- 4. Habit Banner (for Morning & Evening) -->
      ${habitBannerHtml}

      <!-- 5. Active Header Info / Search Results Count -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:2px 4px">
        <div style="display:flex;align-items:center;gap:6px">
          <span class="material-symbols-outlined" style="font-size:1.2rem;color:var(--color-gold)">
            ${isSearchActive ? 'manage_search' : activeCatMeta.icon}
          </span>
          <span style="font-weight:700;font-size:0.95rem;color:var(--text-primary)">
            ${isSearchActive ? `نتائج البحث عن «${_athkarSearchQuery}»` : activeCatMeta.label}
          </span>
          <span class="chip chip--neutral" style="font-size:0.7rem;padding:2px 8px">
            ${n(displayItems.length)} ذكر ودعاء
          </span>
        </div>
        ${!isSearchActive && activeCatMeta.badge ? `
          <span style="font-size:0.75rem;color:var(--text-muted);font-weight:600">
            ${activeCatMeta.badge}
          </span>
        ` : ''}
      </div>

      <!-- 6. List of Dhikr & Dua Cards -->
      <div class="athkar-list" style="display:flex;flex-direction:column;gap:var(--space-3)">
        ${displayItems.length === 0 ? `
          <div style="text-align:center;padding:var(--space-8);background:var(--color-bg-card);border:1px dashed var(--color-border);border-radius:var(--radius-xl);color:var(--text-muted)">
            <span class="material-symbols-outlined" style="font-size:2.5rem;color:var(--color-gold);margin-bottom:var(--space-2)">search_off</span>
            <p style="font-weight:600;font-size:1rem;color:var(--text-primary);margin:0">لم يتم العثور على أذكار مطابقة</p>
            <p style="font-size:var(--font-size-xs);margin-top:4px">جرب البحث بكلمة أخرى مثل: استغفار، بركة، نوم، فجر</p>
            <button class="btn btn--secondary" style="margin-top:var(--space-3)" onclick="App.clearAthkarSearch()">
              عرض جميع الأذكار
            </button>
          </div>
        ` : displayItems.map(item => {
          const currentCount = counters[item.id] || 0;
          const isDone = currentCount >= item.count;
          const target = item.count;

          return `
            <div class="thikr-card" id="thikr-card-${item.id}" style="${isDone ? 'border-color:var(--color-sage) !important;background:linear-gradient(180deg, #FFFFFF 0%, rgba(74, 107, 83, 0.05) 100%) !important;' : ''}">
              
              <!-- Card Header -->
              <div class="thikr-card-header">
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="material-symbols-outlined icon-fill" style="font-size:1.15rem;color:var(--color-gold)">verified</span>
                  <span style="font-weight:700;font-size:0.92rem;color:var(--text-primary)">
                    ${item.title}
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:6px">
                  ${item.subCategory ? `
                    <span class="chip chip--neutral" style="font-size:0.68rem;padding:2px 7px">
                      ${item.subCategory}
                    </span>
                  ` : ''}
                  <button class="thikr-action-btn" onclick="App.copyThikr('${item.id}')" title="نسخ الذكر كاملاً">
                    <span class="material-symbols-outlined" style="font-size:1.05rem">content_copy</span>
                  </button>
                </div>
              </div>

              <!-- Dhikr Arabic Text -->
              <div class="thikr-card-text">
                ${item.text}
              </div>

              <!-- Crucial Feature: "في مو يفيد" / Benefit & Virtue Box -->
              <div class="thikr-benefit-box">
                <div class="thikr-benefit-badge">
                  <span class="material-symbols-outlined icon-fill" style="font-size:0.95rem">auto_awesome</span>
                  <span>فيمَ يفيد وفضله وبركته:</span>
                </div>
                <p class="thikr-benefit-desc">
                  ${item.benefit}
                </p>
                ${item.source ? `
                  <div class="thikr-source">
                    <span style="font-weight:600">المصدر:</span> ${item.source}
                  </div>
                ` : ''}
              </div>

              <!-- Repetition Counter & Interaction Row -->
              <div class="thikr-counter-row">
                <button class="thikr-tap-btn ${isDone ? 'completed' : ''}" id="thikr-btn-${item.id}"
                  onclick="App.countThikr('${item.id}', ${target})">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="material-symbols-outlined" style="font-size:1.2rem">${isDone ? 'check_circle' : 'touch_app'}</span>
                    <span id="thikr-label-${item.id}">${isDone ? 'تم بحمد الله' : 'انقر للعد والتكرار'}</span>
                  </div>
                  <span class="thikr-badge-count" id="thikr-count-${item.id}">
                    ${isDone ? `تم (${n(target)})` : `${n(currentCount)} / ${n(target)}`}
                  </span>
                </button>

                <button class="thikr-action-btn" onclick="App.resetThikr('${item.id}')" title="إعادة تصفير العدّاد">
                  <span class="material-symbols-outlined" style="font-size:1.1rem">restart_alt</span>
                </button>
              </div>

            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}
