export const COPY = {
  mark: 'ORBITAL',
  tagline: 'Nothing you see is happening now.',
  hero: {
    whisper: 'The Moon, one and a quarter seconds ago.',
    sub: 'It is the shortest delay the sky can offer.',
    strapline: 'An instrument for reading old light.',
    body: 'Eight rungs, from a laser bounced off a mirror on the Moon to the oldest glow in the universe. Every rung is a delay between something happening and you finding out.',
    primary: 'Begin at the nearest thing',
    secondary: 'How to read this',
    meta: '8 rungs · 13.8 billion years · 0 photographs',
    scrollCue: 'Scroll to look further back',
  },
  instrument: {
    kicker: 'Reading the instrument',
    title: 'Light is a message with a date on it.',
    body: 'Nothing arrives instantly. Scroll and you move backwards: seconds, minutes, hours, years, millennia, millions of years. The ruler at the foot of the page is the navigation, and every mark on it is one of those delays.',
    rules: [
      { k: 'The number', v: 'Each rung is labelled with how long its light has been travelling.' },
      { k: 'The scenes', v: 'Each object is staged at a size the eye can follow. The distances are not to scale; the numbers are.' },
      { k: 'The experiments', v: 'Every rung can be operated: run the photon, fire the laser, change the light.' },
    ],
    note: 'Distances here are compressed so they can be seen. The numbers are not.',
  },
  close: {
    kicker: 'End of the ladder',
    title: 'The oldest light is the edge of seeing.',
    body: 'You started one and a quarter seconds from the Moon and finished 13.8 billion years ago, at the first light that was ever free to travel. Same eye, same instrument; the only thing that changed was the delay.',
    again: 'Look again',
    copy: 'Copy this rung',
    copied: 'Link copied',
    colophon:
      'ORBITAL — a look-back ladder. Every number is sourced on the rung it belongs to; the staging is a diagram, the figures are not. No photographs, no textures, no tracking, no backend.',
  },
  chrome: {
    index: 'Index',
    close: 'Close',
    skip: 'Skip to the ladder',
    hero: 'Opening',
    instrument: 'The instrument',
  },
  boot: ['optics ·· aligning', 'photon path ·· traced', 'ladder ·· 8 rungs'],
  why: {
    title: 'Why a ladder and not a tour',
    body: 'A tour of the planets tells you what things are. The ladder tells you what looking costs. No rocket can show you the gap between a star exploding and you hearing about it. A clock can.',
  },
} as const
