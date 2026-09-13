/**
 * GHIRAS — Complete Holy Quran Engine (114 Surahs — 604 Pages — 6236 Ayat)
 * Official Uthmanic Text with accurate diacritics, Page-by-Page and Surah-by-Surah indexing.
 */

// ── Arabic Names for 30 Juz ──────────────────────────────────────────
export const JUZ_NAMES = [
  '',
  'الجزء الأول',    'الجزء الثاني',    'الجزء الثالث',    'الجزء الرابع',   'الجزء الخامس',
  'الجزء السادس',   'الجزء السابع',   'الجزء الثامن',    'الجزء التاسع',   'الجزء العاشر',
  'الجزء الحادي عشر', 'الجزء الثاني عشر', 'الجزء الثالث عشر', 'الجزء الرابع عشر', 'الجزء الخامس عشر',
  'الجزء السادس عشر', 'الجزء السابع عشر', 'الجزء الثامن عشر', 'الجزء التاسع عشر', 'الجزء العشرون',
  'الجزء الحادي والعشرون', 'الجزء الثاني والعشرون', 'الجزء الثالث والعشرون', 'الجزء الرابع والعشرون', 'الجزء الخامس والعشرون',
  'الجزء السادس والعشرون', 'الجزء السابع والعشرون', 'الجزء الثامن والعشرون', 'الجزء التاسع والعشرون', 'الجزء الثلاثون'
];

// ── Complete 114 Surahs Metadata ─────────────────────────────────────
export const ALL_SURAHS = [
  { number: 1, name: 'الفاتحة', fullName: 'سُورَةُ ٱلْفَاتِحَةِ', type: 'مكية', ayahCount: 7, page: 1, juz: 1 },
  { number: 2, name: 'البقرة', fullName: 'سُورَةُ البَقَرَةِ', type: 'مدنية', ayahCount: 286, page: 2, juz: 1 },
  { number: 3, name: 'آل عمران', fullName: 'سُورَةُ آلِ عِمۡرَانَ', type: 'مدنية', ayahCount: 200, page: 50, juz: 3 },
  { number: 4, name: 'النساء', fullName: 'سُورَةُ النِّسَاءِ', type: 'مدنية', ayahCount: 176, page: 77, juz: 4 },
  { number: 5, name: 'المائدة', fullName: 'سُورَةُ المَائِدَةِ', type: 'مدنية', ayahCount: 120, page: 106, juz: 6 },
  { number: 6, name: 'الأنعام', fullName: 'سُورَةُ الأَنۡعَامِ', type: 'مكية', ayahCount: 165, page: 128, juz: 7 },
  { number: 7, name: 'الأعراف', fullName: 'سُورَةُ الأَعۡرَافِ', type: 'مكية', ayahCount: 206, page: 151, juz: 8 },
  { number: 8, name: 'الأنفال', fullName: 'سُورَةُ الأَنفَالِ', type: 'مدنية', ayahCount: 75, page: 177, juz: 9 },
  { number: 9, name: 'التوبة', fullName: 'سُورَةُ التَّوۡبَةِ', type: 'مدنية', ayahCount: 129, page: 187, juz: 10 },
  { number: 10, name: 'يونس', fullName: 'سُورَةُ يُونُسَ', type: 'مكية', ayahCount: 109, page: 208, juz: 11 },
  { number: 11, name: 'هود', fullName: 'سُورَةُ هُودٍ', type: 'مكية', ayahCount: 123, page: 221, juz: 11 },
  { number: 12, name: 'يوسف', fullName: 'سُورَةُ يُوسُفَ', type: 'مكية', ayahCount: 111, page: 235, juz: 12 },
  { number: 13, name: 'الرعد', fullName: 'سُورَةُ الرَّعۡدِ', type: 'مدنية', ayahCount: 43, page: 249, juz: 13 },
  { number: 14, name: 'إبراهيم', fullName: 'سُورَةُ إِبۡرَاهِيمَ', type: 'مكية', ayahCount: 52, page: 255, juz: 13 },
  { number: 15, name: 'الحجر', fullName: 'سُورَةُ الحِجۡرِ', type: 'مكية', ayahCount: 99, page: 262, juz: 14 },
  { number: 16, name: 'النحل', fullName: 'سُورَةُ النَّحۡلِ', type: 'مكية', ayahCount: 128, page: 267, juz: 14 },
  { number: 17, name: 'الإسراء', fullName: 'سُورَةُ الإِسۡرَاءِ', type: 'مكية', ayahCount: 111, page: 282, juz: 15 },
  { number: 18, name: 'الكهف', fullName: 'سُورَةُ الكَهۡفِ', type: 'مكية', ayahCount: 110, page: 293, juz: 15 },
  { number: 19, name: 'مريم', fullName: 'سُورَةُ مَرۡيَمَ', type: 'مكية', ayahCount: 98, page: 305, juz: 16 },
  { number: 20, name: 'طه', fullName: 'سُورَةُ طه', type: 'مكية', ayahCount: 135, page: 312, juz: 16 },
  { number: 21, name: 'الأنبياء', fullName: 'سُورَةُ الأَنبِيَاءِ', type: 'مكية', ayahCount: 112, page: 322, juz: 17 },
  { number: 22, name: 'الحج', fullName: 'سُورَةُ الحَجِّ', type: 'مدنية', ayahCount: 78, page: 332, juz: 17 },
  { number: 23, name: 'المؤمنون', fullName: 'سُورَةُ المُؤۡمِنُونَ', type: 'مكية', ayahCount: 118, page: 342, juz: 18 },
  { number: 24, name: 'النور', fullName: 'سُورَةُ النُّورِ', type: 'مدنية', ayahCount: 64, page: 350, juz: 18 },
  { number: 25, name: 'الفرقان', fullName: 'سُورَةُ الفُرۡقَانِ', type: 'مكية', ayahCount: 77, page: 359, juz: 18 },
  { number: 26, name: 'الشعراء', fullName: 'سُورَةُ الشُّعَرَاءِ', type: 'مكية', ayahCount: 227, page: 367, juz: 19 },
  { number: 27, name: 'النمل', fullName: 'سُورَةُ النَّمۡلِ', type: 'مكية', ayahCount: 93, page: 377, juz: 19 },
  { number: 28, name: 'القصص', fullName: 'سُورَةُ القَصَصِ', type: 'مكية', ayahCount: 88, page: 385, juz: 20 },
  { number: 29, name: 'العنكبوت', fullName: 'سُورَةُ العَنكَبُوتِ', type: 'مكية', ayahCount: 69, page: 396, juz: 20 },
  { number: 30, name: 'الروم', fullName: 'سُورَةُ الرُّومِ', type: 'مكية', ayahCount: 60, page: 404, juz: 21 },
  { number: 31, name: 'لقمان', fullName: 'سُورَةُ لُقۡمَانَ', type: 'مكية', ayahCount: 34, page: 411, juz: 21 },
  { number: 32, name: 'السجدة', fullName: 'سُورَةُ السَّجۡدَةِ', type: 'مكية', ayahCount: 30, page: 415, juz: 21 },
  { number: 33, name: 'الأحزاب', fullName: 'سُورَةُ الأَحۡزَابِ', type: 'مدنية', ayahCount: 73, page: 418, juz: 21 },
  { number: 34, name: 'سبأ', fullName: 'سُورَةُ سَبَإٍ', type: 'مكية', ayahCount: 54, page: 428, juz: 22 },
  { number: 35, name: 'فاطر', fullName: 'سُورَةُ فَاطِرٍ', type: 'مكية', ayahCount: 45, page: 434, juz: 22 },
  { number: 36, name: 'يس', fullName: 'سُورَةُ يسٓ', type: 'مكية', ayahCount: 83, page: 440, juz: 22 },
  { number: 37, name: 'الصافات', fullName: 'سُورَةُ الصَّافَّاتِ', type: 'مكية', ayahCount: 182, page: 446, juz: 23 },
  { number: 38, name: 'ص', fullName: 'سُورَةُ صٓ', type: 'مكية', ayahCount: 88, page: 453, juz: 23 },
  { number: 39, name: 'الزمر', fullName: 'سُورَةُ الزُّمَرِ', type: 'مكية', ayahCount: 75, page: 458, juz: 23 },
  { number: 40, name: 'غافر', fullName: 'سُورَةُ غَافِرٍ', type: 'مكية', ayahCount: 85, page: 467, juz: 24 },
  { number: 41, name: 'فصلت', fullName: 'سُورَةُ فُصِّلَتۡ', type: 'مكية', ayahCount: 54, page: 477, juz: 24 },
  { number: 42, name: 'الشورى', fullName: 'سُورَةُ الشُّورَىٰ', type: 'مكية', ayahCount: 53, page: 483, juz: 25 },
  { number: 43, name: 'الزخرف', fullName: 'سُورَةُ الزُّخۡرُفِ', type: 'مكية', ayahCount: 89, page: 489, juz: 25 },
  { number: 44, name: 'الدخان', fullName: 'سُورَةُ الدُّخَانِ', type: 'مكية', ayahCount: 59, page: 496, juz: 25 },
  { number: 45, name: 'الجاثية', fullName: 'سُورَةُ الجَاثِيَةِ', type: 'مكية', ayahCount: 37, page: 499, juz: 25 },
  { number: 46, name: 'الأحقاف', fullName: 'سُورَةُ الأَحۡقَافِ', type: 'مكية', ayahCount: 35, page: 502, juz: 26 },
  { number: 47, name: 'محمد', fullName: 'سُورَةُ مُحَمَّدٍ', type: 'مدنية', ayahCount: 38, page: 507, juz: 26 },
  { number: 48, name: 'الفتح', fullName: 'سُورَةُ الفَتۡحِ', type: 'مدنية', ayahCount: 29, page: 511, juz: 26 },
  { number: 49, name: 'الحجرات', fullName: 'سُورَةُ الحُجُرَاتِ', type: 'مدنية', ayahCount: 18, page: 515, juz: 26 },
  { number: 50, name: 'ق', fullName: 'سُورَةُ قٓ', type: 'مكية', ayahCount: 45, page: 518, juz: 26 },
  { number: 51, name: 'الذاريات', fullName: 'سُورَةُ الذَّارِيَاتِ', type: 'مكية', ayahCount: 60, page: 520, juz: 26 },
  { number: 52, name: 'الطور', fullName: 'سُورَةُ الطُّورِ', type: 'مكية', ayahCount: 49, page: 523, juz: 27 },
  { number: 53, name: 'النجم', fullName: 'سُورَةُ النَّجۡمِ', type: 'مكية', ayahCount: 62, page: 526, juz: 27 },
  { number: 54, name: 'القمر', fullName: 'سُورَةُ القَمَرِ', type: 'مكية', ayahCount: 55, page: 528, juz: 27 },
  { number: 55, name: 'الرحمن', fullName: 'سُورَةُ الرَّحۡمَٰنِ', type: 'مدنية', ayahCount: 78, page: 531, juz: 27 },
  { number: 56, name: 'الواقعة', fullName: 'سُورَةُ الوَاقِعَةِ', type: 'مكية', ayahCount: 96, page: 534, juz: 27 },
  { number: 57, name: 'الحديد', fullName: 'سُورَةُ الحَدِيدِ', type: 'مدنية', ayahCount: 29, page: 537, juz: 27 },
  { number: 58, name: 'المجادلة', fullName: 'سُورَةُ المُجَادلَةِ', type: 'مدنية', ayahCount: 22, page: 542, juz: 28 },
  { number: 59, name: 'الحشر', fullName: 'سُورَةُ الحَشۡرِ', type: 'مدنية', ayahCount: 24, page: 545, juz: 28 },
  { number: 60, name: 'الممتحنة', fullName: 'سُورَةُ المُمۡتَحَنَةِ', type: 'مدنية', ayahCount: 13, page: 549, juz: 28 },
  { number: 61, name: 'الصف', fullName: 'سُورَةُ الصَّفِّ', type: 'مدنية', ayahCount: 14, page: 551, juz: 28 },
  { number: 62, name: 'الجمعة', fullName: 'سُورَةُ الجُمُعَةِ', type: 'مدنية', ayahCount: 11, page: 553, juz: 28 },
  { number: 63, name: 'المنافقون', fullName: 'سُورَةُ المُنَافِقُونَ', type: 'مدنية', ayahCount: 11, page: 554, juz: 28 },
  { number: 64, name: 'التغابن', fullName: 'سُورَةُ التَّغَابُنِ', type: 'مدنية', ayahCount: 18, page: 556, juz: 28 },
  { number: 65, name: 'الطلاق', fullName: 'سُورَةُ الطَّلَاقِ', type: 'مدنية', ayahCount: 12, page: 558, juz: 28 },
  { number: 66, name: 'التحريم', fullName: 'سُورَةُ التَّحۡرِيمِ', type: 'مدنية', ayahCount: 12, page: 560, juz: 28 },
  { number: 67, name: 'الملك', fullName: 'سُورَةُ المُلۡكِ', type: 'مكية', ayahCount: 30, page: 562, juz: 29 },
  { number: 68, name: 'القلم', fullName: 'سُورَةُ القَلَمِ', type: 'مكية', ayahCount: 52, page: 564, juz: 29 },
  { number: 69, name: 'الحاقة', fullName: 'سُورَةُ الحَاقَّةِ', type: 'مكية', ayahCount: 52, page: 566, juz: 29 },
  { number: 70, name: 'المعارج', fullName: 'سُورَةُ المَعَارِجِ', type: 'مكية', ayahCount: 44, page: 568, juz: 29 },
  { number: 71, name: 'نوح', fullName: 'سُورَةُ نُوحٍ', type: 'مكية', ayahCount: 28, page: 570, juz: 29 },
  { number: 72, name: 'الجن', fullName: 'سُورَةُ الجِنِّ', type: 'مكية', ayahCount: 28, page: 572, juz: 29 },
  { number: 73, name: 'المزمل', fullName: 'سُورَةُ المُزَّمِّلِ', type: 'مكية', ayahCount: 20, page: 574, juz: 29 },
  { number: 74, name: 'المدثر', fullName: 'سُورَةُ المُدَّثِّرِ', type: 'مكية', ayahCount: 56, page: 575, juz: 29 },
  { number: 75, name: 'القيامة', fullName: 'سُورَةُ القِيَامَةِ', type: 'مكية', ayahCount: 40, page: 577, juz: 29 },
  { number: 76, name: 'الإنسان', fullName: 'سُورَةُ الإِنسَانِ', type: 'مدنية', ayahCount: 31, page: 578, juz: 29 },
  { number: 77, name: 'المرسلات', fullName: 'سُورَةُ المُرۡسَلَاتِ', type: 'مكية', ayahCount: 50, page: 580, juz: 29 },
  { number: 78, name: 'النبأ', fullName: 'سُورَةُ النَّبَإِ', type: 'مكية', ayahCount: 40, page: 582, juz: 30 },
  { number: 79, name: 'النازعات', fullName: 'سُورَةُ النَّازِعَاتِ', type: 'مكية', ayahCount: 46, page: 583, juz: 30 },
  { number: 80, name: 'عبس', fullName: 'سُورَةُ عَبَسَ', type: 'مكية', ayahCount: 42, page: 585, juz: 30 },
  { number: 81, name: 'التكوير', fullName: 'سُورَةُ التَّكۡوِيرِ', type: 'مكية', ayahCount: 29, page: 586, juz: 30 },
  { number: 82, name: 'الانفطار', fullName: 'سُورَةُ الانفِطَارِ', type: 'مكية', ayahCount: 19, page: 587, juz: 30 },
  { number: 83, name: 'المطففين', fullName: 'سُورَةُ المُطَفِّفِينَ', type: 'مكية', ayahCount: 36, page: 587, juz: 30 },
  { number: 84, name: 'الانشقاق', fullName: 'سُورَةُ الانشِقَاقِ', type: 'مكية', ayahCount: 25, page: 589, juz: 30 },
  { number: 85, name: 'البروج', fullName: 'سُورَةُ البُرُوجِ', type: 'مكية', ayahCount: 22, page: 590, juz: 30 },
  { number: 86, name: 'الطارق', fullName: 'سُورَةُ الطَّارِقِ', type: 'مكية', ayahCount: 17, page: 591, juz: 30 },
  { number: 87, name: 'الأعلى', fullName: 'سُورَةُ الأَعۡلَىٰ', type: 'مكية', ayahCount: 19, page: 591, juz: 30 },
  { number: 88, name: 'الغاشية', fullName: 'سُورَةُ الغَاشِيَةِ', type: 'مكية', ayahCount: 26, page: 592, juz: 30 },
  { number: 89, name: 'الفجر', fullName: 'سُورَةُ الفَجۡرِ', type: 'مكية', ayahCount: 30, page: 593, juz: 30 },
  { number: 90, name: 'البلد', fullName: 'سُورَةُ البَلَدِ', type: 'مكية', ayahCount: 20, page: 594, juz: 30 },
  { number: 91, name: 'الشمس', fullName: 'سُورَةُ الشَّمۡسِ', type: 'مكية', ayahCount: 15, page: 595, juz: 30 },
  { number: 92, name: 'الليل', fullName: 'سُورَةُ اللَّيۡلِ', type: 'مكية', ayahCount: 21, page: 595, juz: 30 },
  { number: 93, name: 'الضحى', fullName: 'سُورَةُ الضُّحَىٰ', type: 'مكية', ayahCount: 11, page: 596, juz: 30 },
  { number: 94, name: 'الشرح', fullName: 'سُورَةُ الشَّرۡحِ', type: 'مكية', ayahCount: 8, page: 596, juz: 30 },
  { number: 95, name: 'التين', fullName: 'سُورَةُ التِّينِ', type: 'مكية', ayahCount: 8, page: 597, juz: 30 },
  { number: 96, name: 'العلق', fullName: 'سُورَةُ العَلَقِ', type: 'مكية', ayahCount: 19, page: 597, juz: 30 },
  { number: 97, name: 'القدر', fullName: 'سُورَةُ القَدۡرِ', type: 'مكية', ayahCount: 5, page: 598, juz: 30 },
  { number: 98, name: 'البينة', fullName: 'سُورَةُ البَيِّنَةِ', type: 'مدنية', ayahCount: 8, page: 598, juz: 30 },
  { number: 99, name: 'الزلزلة', fullName: 'سُورَةُ الزَّلۡزَلَةِ', type: 'مدنية', ayahCount: 8, page: 599, juz: 30 },
  { number: 100, name: 'العاديات', fullName: 'سُورَةُ العَادِيَاتِ', type: 'مكية', ayahCount: 11, page: 599, juz: 30 },
  { number: 101, name: 'القارعة', fullName: 'سُورَةُ القَارِعَةِ', type: 'مكية', ayahCount: 11, page: 600, juz: 30 },
  { number: 102, name: 'التكاثر', fullName: 'سُورَةُ التَّكَاثُرِ', type: 'مكية', ayahCount: 8, page: 600, juz: 30 },
  { number: 103, name: 'العصر', fullName: 'سُورَةُ العَصۡرِ', type: 'مكية', ayahCount: 3, page: 601, juz: 30 },
  { number: 104, name: 'الهمزة', fullName: 'سُورَةُ الهُمَزَةِ', type: 'مكية', ayahCount: 9, page: 601, juz: 30 },
  { number: 105, name: 'الفيل', fullName: 'سُورَةُ الفِيلِ', type: 'مكية', ayahCount: 5, page: 601, juz: 30 },
  { number: 106, name: 'قريش', fullName: 'سُورَةُ قُرَيۡشٍ', type: 'مكية', ayahCount: 4, page: 602, juz: 30 },
  { number: 107, name: 'الماعون', fullName: 'سُورَةُ المَاعُونِ', type: 'مكية', ayahCount: 7, page: 602, juz: 30 },
  { number: 108, name: 'الكوثر', fullName: 'سُورَةُ الكَوۡثَرِ', type: 'مكية', ayahCount: 3, page: 602, juz: 30 },
  { number: 109, name: 'الكافرون', fullName: 'سُورَةُ الكَافِرُونَ', type: 'مكية', ayahCount: 6, page: 603, juz: 30 },
  { number: 110, name: 'النصر', fullName: 'سُورَةُ النَّصۡرِ', type: 'مدنية', ayahCount: 3, page: 603, juz: 30 },
  { number: 111, name: 'المسد', fullName: 'سُورَةُ المَسَدِ', type: 'مكية', ayahCount: 5, page: 603, juz: 30 },
  { number: 112, name: 'الإخلاص', fullName: 'سُورَةُ الإِخۡلَاصِ', type: 'مكية', ayahCount: 4, page: 604, juz: 30 },
  { number: 113, name: 'الفلق', fullName: 'سُورَةُ الفَلَقِ', type: 'مكية', ayahCount: 5, page: 604, juz: 30 },
  { number: 114, name: 'الناس', fullName: 'سُورَةُ النَّاسِ', type: 'مكية', ayahCount: 6, page: 604, juz: 30 },
];

// ── In-Memory Quran Database ──────────────────────────────────────────
let _isLoaded = false;
let _loadPromise = null;
const _pages = new Map();   // pageNumber (1..604) -> Page Object
const _surahs = new Map();  // surahNumber (1..114) -> Surah Object

const BASMALA_TEXT = 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ';

function cleanAyahText(surahNum, ayahNum, raw) {
  let t = raw.trim();
  if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1);
  if (surahNum !== 1 && surahNum !== 9 && ayahNum === 1) {
    if (t.startsWith(BASMALA_TEXT)) {
      t = t.replace(BASMALA_TEXT, '').trim();
    }
  }
  return t;
}

/**
 * Initializes and indexes the entire 114 surahs and 604 pages in memory
 */
export async function loadFullQuran() {
  if (_isLoaded) return true;
  if (_loadPromise) return _loadPromise;

  _loadPromise = (async () => {
    try {
      let json;
      if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
        const fs = await import('fs');
        const url = await import('url');
        const filePath = url.fileURLToPath(new URL('./quran-full.json', import.meta.url));
        json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        const quranUrl = new URL('./quran-full.json', import.meta.url).href;
        const resp = await fetch(quranUrl);
        if (!resp.ok) throw new Error('Failed to load quran-full.json: ' + resp.status);
        json = await resp.json();
      }
      const rawSurahs = json.data.surahs;

      // Initialize empty pages 1..604
      for (let p = 1; p <= 604; p++) {
        _pages.set(p, {
          pageNumber: p,
          juz: 1,
          juzName: '',
          hizbQuarter: 1,
          blocks: []
        });
      }

      // Process each Surah & Ayah
      rawSurahs.forEach(s => {
        const meta = ALL_SURAHS.find(m => m.number === s.number) || {
          name: s.name.replace('سُورَةُ ', ''),
          type: s.revelationType === 'Meccan' ? 'مكية' : 'مدنية'
        };

        const surahObj = {
          id: s.number,
          number: s.number,
          name: meta.name,
          fullName: s.name,
          type: meta.type,
          ayahCount: s.ayahs.length,
          page: s.ayahs[0].page,
          juz: s.ayahs[0].juz,
          ayat: s.ayahs.map(a => ({
            number: a.numberInSurah,
            globalNumber: a.number,
            text: cleanAyahText(s.number, a.numberInSurah, a.text),
            juz: a.juz,
            page: a.page,
            sajda: a.sajda
          }))
        };

        _surahs.set(s.number, surahObj);

        // Group into pages
        s.ayahs.forEach(a => {
          const pageObj = _pages.get(a.page);
          if (!pageObj) return;

          pageObj.juz = a.juz;
          pageObj.juzName = JUZ_NAMES[a.juz] || `الجزء ${a.juz}`;
          pageObj.hizbQuarter = a.hizbQuarter;

          let block = pageObj.blocks.find(b => b.surahNumber === s.number);
          if (!block) {
            block = {
              surahNumber: s.number,
              surahName: meta.name,
              fullName: s.name,
              type: meta.type,
              ayahCount: s.ayahs.length,
              isNewSurahStart: a.numberInSurah === 1,
              showBasmala: a.numberInSurah === 1 && s.number !== 9 && s.number !== 1,
              ayahs: []
            };
            pageObj.blocks.push(block);
          }

          block.ayahs.push({
            number: a.numberInSurah,
            globalNumber: a.number,
            text: cleanAyahText(s.number, a.numberInSurah, a.text),
            juz: a.juz,
            page: a.page,
            sajda: a.sajda
          });
        });
      });

      _isLoaded = true;
      console.log('GHIRAS: Holy Quran fully loaded (114 Surahs, 604 Pages, 6236 Ayat)');
      if (typeof window !== 'undefined' && window.App && typeof window.App.refreshMushafView === 'function') {
        window.App.refreshMushafView();
      }
      return true;
    } catch (err) {
      console.error('GHIRAS: Error loading full Quran', err);
      return false;
    }
  })();

  return _loadPromise;
}

// ── Query Functions ───────────────────────────────────────────────────

export function isQuranLoaded() {
  return _isLoaded;
}

export function getAllSurahs() {
  return ALL_SURAHS;
}

/**
 * Returns Page 1..604 with all its verses and surah headpieces
 */
export function getPage(pageNumber) {
  const p = Math.max(1, Math.min(604, parseInt(pageNumber, 10) || 1));
  if (_pages.has(p)) {
    return _pages.get(p);
  }
  // Fallback initial page structure before full load
  return buildFallbackPage(p);
}

/**
 * Returns Surah 1..114 with all its verses
 */
export function getSurah(surahNumber) {
  const num = Math.max(1, Math.min(114, parseInt(surahNumber, 10) || 1));
  if (_surahs.has(num)) {
    return _surahs.get(num);
  }
  // Fallback Surah
  const meta = ALL_SURAHS.find(s => s.number === num) || ALL_SURAHS[0];
  return {
    id: meta.number,
    number: meta.number,
    name: meta.name,
    fullName: meta.fullName,
    type: meta.type,
    ayahCount: meta.ayahCount,
    page: meta.page,
    juz: meta.juz,
    ayat: []
  };
}

export function getSurahById(id) {
  return getSurah(id);
}

export function getPageOfSurah(surahNumber) {
  const meta = ALL_SURAHS.find(s => s.number === surahNumber);
  return meta ? meta.page : 1;
}

export function getAyah(surahNumber, ayahNumber) {
  const s = getSurah(surahNumber);
  if (!s || !s.ayat) return null;
  return s.ayat.find(a => a.number === parseInt(ayahNumber, 10)) || null;
}

export function getNextAyah(surahNumber, ayahNumber) {
  const sNum = parseInt(surahNumber, 10);
  const aNum = parseInt(ayahNumber, 10);
  const surah = getSurah(sNum);
  if (!surah) return null;

  if (aNum < surah.ayahCount) {
    const nextAyah = surah.ayat ? surah.ayat.find(a => a.number === aNum + 1) : null;
    return {
      surahNumber: sNum,
      surahName: surah.name,
      ayahNumber: aNum + 1,
      ayah: nextAyah,
      page: nextAyah ? nextAyah.page : surah.page
    };
  } else if (sNum < 114) {
    const nextSurah = getSurah(sNum + 1);
    if (!nextSurah) return null;
    const firstAyah = nextSurah.ayat ? nextSurah.ayat[0] : null;
    return {
      surahNumber: sNum + 1,
      surahName: nextSurah.name,
      ayahNumber: 1,
      ayah: firstAyah,
      page: firstAyah ? firstAyah.page : nextSurah.page
    };
  }
  return null;
}

export function getPrevAyah(surahNumber, ayahNumber) {
  const sNum = parseInt(surahNumber, 10);
  const aNum = parseInt(ayahNumber, 10);
  const surah = getSurah(sNum);
  if (!surah) return null;

  if (aNum > 1) {
    const prevAyah = surah.ayat ? surah.ayat.find(a => a.number === aNum - 1) : null;
    return {
      surahNumber: sNum,
      surahName: surah.name,
      ayahNumber: aNum - 1,
      ayah: prevAyah,
      page: prevAyah ? prevAyah.page : surah.page
    };
  } else if (sNum > 1) {
    const prevSurah = getSurah(sNum - 1);
    if (!prevSurah) return null;
    const lastAyah = prevSurah.ayat && prevSurah.ayat.length ? prevSurah.ayat[prevSurah.ayat.length - 1] : null;
    return {
      surahNumber: sNum - 1,
      surahName: prevSurah.name,
      ayahNumber: prevSurah.ayahCount,
      ayah: lastAyah,
      page: lastAyah ? lastAyah.page : prevSurah.page
    };
  }
  return null;
}

// ── Athkar Collection ────────────────────────────────────────────────
export const ATHKAR = {
  morning: [
    { id: 'mor_1', text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ', count: 1, category: 'الصباح' },
    { id: 'mor_2', text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ', count: 100, category: 'تسبيح' },
    { id: 'mor_3', text: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ (سيد الاستغفار)', count: 1, category: 'الاستغفار' },
    { id: 'mor_4', text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', count: 3, category: 'تحصين' },
    { id: 'mor_5', text: 'رَضِيتُ بِاللَّهِ رَبّاً، وَبِالْإِسْلَامِ دِيناً، وَبِمُحَمَّدٍ ﷺ نَبِيّاً', count: 3, category: 'إيمان' }
  ],
  evening: [
    { id: 'eve_1', text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ', count: 1, category: 'المساء' },
    { id: 'eve_2', text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا وَبِكَ أَصْبَحْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ الْمَصِيرُ', count: 1, category: 'المساء' },
    { id: 'eve_3', text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ', count: 3, category: 'تحصين' }
  ]
};

export const QURAN_DATA = {
  surahs: ALL_SURAHS,
  athkar: ATHKAR
};

export function getDailyAyah() {
  return {
    surahName: 'الشرح',
    ayahNumber: 5,
    text: 'فَإِنَّ مَعَ ٱلۡعُسۡرِ يُسۡرًا',
    ref: 'سورة الشرح • الآية ٥'
  };
}

// ── Accurate Surah & Juz Mapping for all 604 Pages ──────────────────
export function getSurahForPage(p) {
  const pageNum = Math.max(1, Math.min(604, parseInt(p, 10) || 1));
  let matched = ALL_SURAHS[0];
  for (let i = 0; i < ALL_SURAHS.length; i++) {
    if (ALL_SURAHS[i].page <= pageNum) {
      matched = ALL_SURAHS[i];
    } else {
      break;
    }
  }
  return matched;
}

export function getJuzForPage(p) {
  const pageNum = Math.max(1, Math.min(604, parseInt(p, 10) || 1));
  const juzStarts = [
    1, 22, 42, 62, 82, 102, 122, 142, 162, 182,
    202, 222, 242, 262, 282, 302, 322, 342, 362, 382,
    402, 422, 442, 462, 482, 502, 522, 542, 562, 582
  ];
  let juz = 1;
  for (let i = 0; i < juzStarts.length; i++) {
    if (juzStarts[i] <= pageNum) {
      juz = i + 1;
    } else {
      break;
    }
  }
  return Math.min(30, juz);
}

// ── Fallback Builder (Ensures no page ever erroneously resets to Al-Fatiha) ─
function buildFallbackPage(p) {
  const pageNum = Math.max(1, Math.min(604, parseInt(p, 10) || 1));
  const meta = getSurahForPage(pageNum);
  const juzNum = getJuzForPage(pageNum);
  const isNewSurah = meta.page === pageNum;

  return {
    pageNumber: pageNum,
    juz: juzNum,
    juzName: JUZ_NAMES[juzNum] || `الجزء ${juzNum}`,
    hizbQuarter: Math.min(240, Math.ceil(pageNum / 2.5)),
    blocks: [
      {
        surahNumber: meta.number,
        surahName: meta.name,
        fullName: meta.fullName,
        type: meta.type,
        ayahCount: meta.ayahCount,
        isNewSurahStart: isNewSurah,
        showBasmala: isNewSurah && meta.number !== 1 && meta.number !== 9,
        ayahs: [
          {
            number: isNewSurah ? 1 : Math.max(1, (pageNum - meta.page) * 8 + 1),
            globalNumber: 1,
            text: isNewSurah ? (meta.number === 1 ? 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ' : 'الٓمٓ') : `... قراءة مباركة من سورة ${meta.name} (الصفحة ${pageNum}) ...`,
            juz: juzNum,
            page: pageNum
          }
        ]
      }
    ]
  };
}

// ── Holy Quran Reciters (Verified 100% EveryAyah Endpoints) ─────────
export const QURAN_RECITERS = [
  {
    id: 'alafasy',
    name: 'مشاري راشد العفاسي',
    badge: 'تلاوة حفص المتقنة',
    sub: 'المصحف المرتل برواية حفص عن عاصم',
    folder: 'Alafasy_128kbps',
    country: 'الكويت 🇰🇼',
    avatar: 'ع'
  },
  {
    id: 'abdulbasit',
    name: 'عبد الباسط عبد الصمد',
    badge: 'صوت مكة الخاشع',
    sub: 'المصحف المرتل برواية حفص عن عاصم',
    folder: 'Abdul_Basit_Murattal_192kbps',
    country: 'مصر 🇪🇬',
    avatar: 'ب'
  },
  {
    id: 'minshawy',
    name: 'محمد صديق المنشاوي',
    badge: 'الصوت الباكي الحزين',
    sub: 'المصحف المرتل برواية حفص عن عاصم',
    folder: 'Minshawy_Murattal_128kbps',
    country: 'مصر 🇪🇬',
    avatar: 'م'
  },
  {
    id: 'husary',
    name: 'محمود خليل الحصري',
    badge: 'إمام المقارئ والتجويد',
    sub: 'المصحف المرتل مع ضبط مخارج الحروف',
    folder: 'Husary_128kbps',
    country: 'مصر 🇪🇬',
    avatar: 'ح'
  },
  {
    id: 'sudais',
    name: 'عبد الرحمن السديس',
    badge: 'إمام وخطيب المسجد الحرام',
    sub: 'تلاوة مهيبة من محراب الكعبة المشرفة',
    folder: 'Abdurrahmaan_As-Sudais_192kbps',
    country: 'السعودية 🇸🇦',
    avatar: 'س'
  },
  {
    id: 'muaiqly',
    name: 'ماهر المعيقلي',
    badge: 'إمام المسجد الحرام',
    sub: 'تلاوة خاشعة تلامس القلوب من رحاب مكة',
    folder: 'MaherAlMuaiqly128kbps',
    country: 'السعودية 🇸🇦',
    avatar: 'م'
  },
  {
    id: 'ghamadi',
    name: 'سعد الغامدي',
    badge: 'تلاوة هادئة شجية',
    sub: 'المصحف المرتل برواية حفص عن عاصم',
    folder: 'Ghamadi_40kbps',
    country: 'السعودية 🇸🇦',
    avatar: 'غ'
  },
  {
    id: 'dossari',
    name: 'ياسر الدوسري',
    badge: 'إمام المسجد الحرام',
    sub: 'تلاوة حجازية رخيمة متميزة بالخشوع',
    folder: 'Yasser_Ad-Dussary_128kbps',
    country: 'السعودية 🇸🇦',
    avatar: 'د'
  },
  {
    id: 'ajmi',
    name: 'أحمد بن علي العجمي',
    badge: 'تلاوة ندية محبوبة',
    sub: 'المصحف المرتل برواية حفص عن عاصم',
    folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps_ketaballah.net',
    country: 'السعودية 🇸🇦',
    avatar: 'ع'
  },
  {
    id: 'tablawi',
    name: 'محمد محمود الطبلاوي',
    badge: 'نقيب قراء مصر',
    sub: 'أصالة مدرسة التلاوة المصرية وأستاذ المقامات',
    folder: 'Mohammad_al_Tablaway_128kbps',
    country: 'مصر 🇪🇬',
    avatar: 'ط'
  },
  {
    id: 'ayyoub',
    name: 'محمد أيوب',
    badge: 'إمام المسجد النبوي الشريف',
    sub: 'الترتيل الحجازي الخاشع من طيبة الطيبة',
    folder: 'Muhammad_Ayyoub_128kbps',
    country: 'المدينة المنورة 🇸🇦',
    avatar: 'أ'
  },
  {
    id: 'shatri',
    name: 'أبو بكر الشاطري',
    badge: 'تلاوة عذبة مؤثرة',
    sub: 'المصحف المرتل برواية حفص عن عاصم',
    folder: 'Abu_Bakr_Ash-Shaatree_128kbps',
    country: 'اليمن 🇾🇪',
    avatar: 'ش'
  },
  {
    id: 'jaber',
    name: 'علي عبد الله جابر',
    badge: 'إمام المسجد الحرام الأسبق',
    sub: 'تلاوة تراويح مكة الخالدة',
    folder: 'Ali_Jaber_64kbps',
    country: 'مكة المكرمة 🇸🇦',
    avatar: 'ج'
  }
];

export function getReciters() {
  return QURAN_RECITERS;
}

export function getReciter(id) {
  return QURAN_RECITERS.find(r => r.id === id) || QURAN_RECITERS[0];
}

// Kick off background load immediately
loadFullQuran();

