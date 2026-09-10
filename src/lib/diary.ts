export type DiaryEntry = {
  id: 'reading' | 'learning' | 'watching' | 'listening' | 'making';
  glyph: string;
  label: string;
  title: string;
  description: string;
};

/** Same five things as the original site, in constellation-line order. */
export const diary: DiaryEntry[] = [
  {
    id: 'reading',
    glyph: '♡',
    label: 'Currently reading',
    title: '12 Angry Men',
    description: 'Stories, people, arguments and all the messy little things in between.',
  },
  {
    id: 'learning',
    glyph: '✦',
    label: 'Currently learning',
    title: 'React · GSAP · AI',
    description: 'Building things and slowly figuring out how everything works.',
  },
  {
    id: 'listening',
    glyph: '♫',
    label: 'Currently listening',
    title: 'Quit Playing Games',
    description: 'Because apparently some songs belong to midnight.',
  },
  {
    id: 'watching',
    glyph: '☾',
    label: 'Currently watching',
    title: 'Mare of Easttown',
    description: 'Dark mysteries, complicated people and excellent television.',
  },
  {
    id: 'making',
    glyph: '✧',
    label: 'Currently obsessed with',
    title: 'Making little universes',
    description: 'Designing, coding, drawing, thinking and making things just because I can.',
  },
];
