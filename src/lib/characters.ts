export interface SubCategory {
  id: string;
  name: string;
}

export interface MainCategory {
  id: string;
  name: string;
  icon: string;
  subcategories: SubCategory[];
}

export const CONTENT_CATEGORIES: MainCategory[] = [
  {
    id: 'history',
    name: 'تاريخ',
    icon: '🏛️',
    subcategories: [
      { id: 'historical_figure', name: 'شخصية تاريخية' },
      { id: 'companion', name: 'شخص من الصحابة' },
      { id: 'past_in_present', name: 'لو شخص من الماضي موجود حالياً' },
      { id: 'historical_event', name: 'حدث تاريخي' },
      { id: 'ancient_nation', name: 'دولة تاريخية قديمة' },
    ],
  },
  {
    id: 'sports',
    name: 'رياضة',
    icon: '⚽',
    subcategories: [
      { id: 'player', name: 'لاعب' },
      { id: 'coach', name: 'مدرب' },
      { id: 'team', name: 'فريق' },
      { id: 'football_event', name: 'حدث مؤثر في كرة القدم' },
    ],
  },
  {
    id: 'stories',
    name: 'قصص',
    icon: '📖',
    subcategories: [
      { id: 'children_story', name: 'قصة للأطفال' },
      { id: 'horror_story', name: 'قصة رعب' },
      { id: 'short_action', name: 'قصة حماسية قصيرة' },
    ],
  },
  {
    id: 'science',
    name: 'علوم',
    icon: '🔬',
    subcategories: [
      { id: 'mountains', name: 'معلومات عن جبال' },
      { id: 'seas', name: 'معلومات عن بحار' },
      { id: 'experiments', name: 'تجارب علمية' },
      { id: 'scientists', name: 'علماء' },
    ],
  },
  {
    id: 'pov',
    name: 'POV',
    icon: '👁️',
    subcategories: [
      { id: 'pov_past', name: 'أنت في الماضي' },
      { id: 'pov_future', name: 'أنت في المستقبل' },
      { id: 'pov_videogame', name: 'أنت في لعبة فيديو' },
    ],
  },
];

export const VOICE_TYPES = [
  { id: 'male_arabic', name: 'صوت ذكر عربي' },
  { id: 'female_arabic', name: 'صوت أنثى عربي' },
];

export const DURATION_OPTIONS = [15, 30, 60];
