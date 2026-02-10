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
      { id: 'historical_battle', name: 'معركة تاريخية' },
      { id: 'world_changing_invention', name: 'اختراع غيّر العالم' },
      { id: 'lost_civilization', name: 'حضارة مفقودة' },
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
      { id: 'legendary_stadium', name: 'ملعب أسطوري' },
      { id: 'shocking_transfer', name: 'انتقال صادم' },
      { id: 'historic_derby', name: 'ديربي تاريخي' },
      { id: 'world_record', name: 'رقم قياسي' },
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
      { id: 'mystery_story', name: 'قصة غموض' },
      { id: 'scifi_story', name: 'قصة خيال علمي' },
      { id: 'survival_story', name: 'قصة بقاء' },
      { id: 'folk_legend', name: 'أسطورة شعبية' },
      { id: 'true_horror', name: 'قصة حقيقية مرعبة' },
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
      { id: 'space_planets', name: 'الفضاء والكواكب' },
      { id: 'strange_animals', name: 'حيوانات غريبة' },
      { id: 'human_body', name: 'جسم الإنسان' },
      { id: 'natural_disasters', name: 'كوارث طبيعية' },
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
      { id: 'pov_horror_movie', name: 'أنت في فيلم رعب' },
      { id: 'pov_deserted_island', name: 'أنت على جزيرة مهجورة' },
      { id: 'pov_space', name: 'أنت في الفضاء' },
      { id: 'pov_last_person', name: 'أنت آخر شخص على الأرض' },
      { id: 'pov_parallel_world', name: 'أنت في عالم موازي' },
    ],
  },
  {
    id: 'oddities',
    name: 'غرائب وعجائب',
    icon: '🔮',
    subcategories: [
      { id: 'mysterious_place', name: 'مكان غامض' },
      { id: 'unexplained_phenomenon', name: 'ظاهرة غير مفسرة' },
      { id: 'mythical_creature', name: 'مخلوق أسطوري' },
      { id: 'conspiracy_theory', name: 'نظرية مؤامرة' },
      { id: 'mysterious_disappearance', name: 'اختفاء غامض' },
      { id: 'strange_laws', name: 'أغرب القوانين' },
      { id: 'unbelievable_coincidence', name: 'صدفة لا تُصدّق' },
      { id: 'abandoned_city', name: 'مدينة مهجورة' },
    ],
  },
  {
    id: 'technology',
    name: 'تقنية',
    icon: '💻',
    subcategories: [
      { id: 'world_changing_app', name: 'تطبيق غيّر العالم' },
      { id: 'amazing_robot', name: 'روبوت مذهل' },
      { id: 'ai_achievement', name: 'ذكاء اصطناعي' },
      { id: 'failed_invention', name: 'اختراع فاشل' },
      { id: 'future_tech', name: 'مستقبل التقنية' },
      { id: 'tech_company_story', name: 'قصة شركة تقنية' },
      { id: 'legendary_videogame', name: 'ألعاب فيديو أسطورية' },
      { id: 'famous_hacker', name: 'هاكر شهير' },
    ],
  },
  {
    id: 'geography',
    name: 'جغرافيا وسفر',
    icon: '🌍',
    subcategories: [
      { id: 'beautiful_city', name: 'أجمل مدينة' },
      { id: 'dangerous_road', name: 'أخطر طريق' },
      { id: 'strange_island', name: 'جزيرة غريبة' },
      { id: 'architectural_wonder', name: 'عجائب معمارية' },
      { id: 'unique_people', name: 'شعب فريد' },
      { id: 'deepest_cave', name: 'أعمق كهف' },
      { id: 'strange_borders', name: 'حدود غريبة' },
      { id: 'smallest_country', name: 'أصغر دولة' },
    ],
  },
  {
    id: 'psychology',
    name: 'نفسية وتطوير ذات',
    icon: '🧠',
    subcategories: [
      { id: 'psychological_trick', name: 'خدعة نفسية' },
      { id: 'famous_experiment', name: 'تجربة نفسية شهيرة' },
      { id: 'body_language', name: 'لغة الجسد' },
      { id: 'success_habit', name: 'عادة ناجحين' },
      { id: 'psychological_effect', name: 'أثر نفسي' },
      { id: 'common_myth', name: 'خرافة شائعة' },
      { id: 'inspiring_success', name: 'قصة نجاح ملهمة' },
      { id: 'art_of_persuasion', name: 'فن الإقناع' },
    ],
  },
];

export const VOICE_TYPES = [
  { id: 'male_arabic', name: 'صوت ذكر عربي' },
  { id: 'female_arabic', name: 'صوت أنثى عربي' },
];

export const DURATION_OPTIONS = [15, 30, 60];
