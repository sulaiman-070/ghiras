/**
 * GHIRAS — Default Habits Seed Data
 */

export const DEFAULT_HABITS = [
  {
    id: 'quran-reading',
    name: 'قراءة القرآن',
    icon: 'menu_book',
    iconBg: '#EAF0EA',
    iconColor: '#4A6B53',
    description: 'اقرأ من كتاب الله كل يوم',
    minGoal: { value: 1, unit: 'page', label: 'صفحة واحدة', arabicNum: '١' },
    extraGoal: { value: 5, unit: 'pages', label: '٥ صفحات', arabicNum: '٥' },
    frequency: 'daily',
    category: 'quran',
    active: true,
  },
  {
    id: 'morning-athkar',
    name: 'أذكار الصباح',
    icon: 'wb_sunny',
    iconBg: '#F2E4CB',
    iconColor: '#B88E4F',
    description: 'أذكار الصباح المأثورة',
    minGoal: { value: 1, unit: 'set', label: 'مجموعة واحدة', arabicNum: '١' },
    extraGoal: { value: 3, unit: 'sets', label: 'المجموعة الكاملة', arabicNum: '٣' },
    frequency: 'daily',
    category: 'athkar',
    active: true,
  },
  {
    id: 'fajr-prayer',
    name: 'قرآن الفجر',
    icon: 'wb_twilight',
    iconBg: '#EAF0EA',
    iconColor: '#4A6B53',
    description: '﴿إِنَّ قُرۡءَانَ ٱلۡفَجۡرِ كَانَ مَشۡهُودٗا﴾ • صفحة مباركة',
    minGoal: { value: 1, unit: 'page', label: 'صفحة واحدة', arabicNum: '١' },
    extraGoal: { value: 4, unit: 'pages', label: '٤ صفحات (نصف حزب)', arabicNum: '٤' },
    frequency: 'daily',
    category: 'quran',
    active: true,
  },
  {
    id: 'evening-athkar',
    name: 'أذكار المساء',
    icon: 'nights_stay',
    iconBg: '#F6EFE9',
    iconColor: '#6E6053',
    description: 'أذكار المساء المأثورة',
    minGoal: { value: 1, unit: 'set', label: 'مجموعة واحدة', arabicNum: '١' },
    extraGoal: { value: 3, unit: 'sets', label: 'المجموعة الكاملة', arabicNum: '٣' },
    frequency: 'daily',
    category: 'athkar',
    active: false, // not active by default — user can activate
  },
];

export const HABIT_CATEGORIES = [
  { id: 'quran',   label: 'القرآن',    icon: 'menu_book' },
  { id: 'prayer',  label: 'الصلاة',    icon: 'mosque' },
  { id: 'athkar',  label: 'الأذكار',   icon: 'favorite' },
  { id: 'sadaqa',  label: 'الصدقة',    icon: 'volunteer_activism' },
  { id: 'custom',  label: 'مخصص',     icon: 'add_circle' },
];

export const GARDEN_STAGES = [
  { id: 'seed',    emoji: '🌱', label: 'بذرة الإيمان',    minDays: 0,  maxDays: 2,  color: '#B88E4F' },
  { id: 'sprout',  emoji: '🌿', label: 'البادرة الخضراء', minDays: 3,  maxDays: 6,  color: '#4A6B53' },
  { id: 'plant',   emoji: '🌵', label: 'الشتلة اليانعة',  minDays: 7,  maxDays: 13, color: '#4A6B53' },
  { id: 'tree',    emoji: '🌳', label: 'شجرة مورقة',     minDays: 14, maxDays: 29, color: '#2C5F2E' },
  { id: 'oasis',   emoji: '🌴', label: 'واحة مثمرة',     minDays: 30, maxDays: Infinity, color: '#1A3A1A' },
];

export const ACHIEVEMENTS = [
  {
    id: 'first-step',
    name: 'الخطوة الأولى',
    desc: 'أكمل وردك اليومي لأول مرة',
    icon: 'footprint',
    iconBg: '#EAF0EA',
    iconColor: '#4A6B53',
    xp: 50,
    condition: (stats) => stats.totalCompletions >= 1,
  },
  {
    id: 'week-streak',
    name: 'سلسلة الأسبوع',
    desc: '٧ أيام متصلة من الورد اليومي',
    icon: 'hotel_class',
    iconBg: '#F2E4CB',
    iconColor: '#B88E4F',
    xp: 200,
    condition: (stats) => stats.longestStreak >= 7,
  },
  {
    id: 'fajr-friend',
    name: 'قرآن الفجر المشهود',
    desc: 'قراءة قرآن الفجر لـ ٥ أيام',
    icon: 'wb_twilight',
    iconBg: '#EAF0EA',
    iconColor: '#4A6B53',
    xp: 150,
    condition: (stats) => stats.fajrCount >= 5,
  },
  {
    id: 'steady-step',
    name: 'الخطوة الثابتة',
    desc: 'أحب العمل أدومه وإن قل — ٣٠ يوم استمرار',
    icon: 'footprint',
    iconBg: '#F6EFE9',
    iconColor: '#6E6053',
    xp: 500,
    condition: (stats) => stats.longestStreak >= 30,
  },
  {
    id: 'quran-friend',
    name: 'صديق القرآن',
    desc: 'قراءة ١٠ أيام متتالية من القرآن',
    icon: 'menu_book',
    iconBg: '#EAF0EA',
    iconColor: '#4A6B53',
    xp: 300,
    condition: (stats) => stats.quranStreak >= 10,
  },
];

export function getGardenStage(streakDays) {
  return GARDEN_STAGES.find(s => streakDays >= s.minDays && streakDays <= s.maxDays)
    || GARDEN_STAGES[GARDEN_STAGES.length - 1];
}

export function getGardenProgress(streakDays) {
  const stage = getGardenStage(streakDays);
  if (stage.maxDays === Infinity) return 100;
  const range = stage.maxDays - stage.minDays + 1;
  const progress = streakDays - stage.minDays;
  return Math.round((progress / range) * 100);
}

export function toArabicNumeral(n) {
  return String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}
