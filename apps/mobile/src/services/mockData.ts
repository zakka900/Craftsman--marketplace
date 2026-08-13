import { Artisan } from '@artisan/shared';

const img = (seed: string) => `https://picsum.photos/seed/${seed}/500/340`;

export const ARTISANS: Artisan[] = [
  {
    id: 'a1', name: 'Ahmed Al-Fahad', categoryId: 'plumber', rating: 4.9, reviewsCount: 132,
    city: 'Riyadh', zone: 'Al Olaya', yearsActive: 9, jobsDone: 410, licenseVerified: true,
    badges: ['Top Pro', 'Fast responder'], distanceKm: 3.2, color: '#1D4ED8',
    bio: 'Licensed plumber specialized in leak detection and full bathroom systems. Team of 3.',
    portfolio: [
      { title: 'Bathroom pipe replacement', before: img('p1b'), after: img('p1a') },
      { title: 'Water heater install', before: img('p2b'), after: img('p2a') }
    ],
    reviews: [
      { id: 'r1', author: 'Khalid M.', rating: 5, text: 'Fixed a hidden leak in one visit. Very clean work.', date: '2026-06-20' },
      { id: 'r2', author: 'Sara A.', rating: 5, text: 'On time, fair price, professional.', date: '2026-05-11' }
    ]
  },
  {
    id: 'a2', name: 'Gulf Fix Services', categoryId: 'plumber', rating: 4.6, reviewsCount: 87,
    city: 'Riyadh', zone: 'Al Malaz', yearsActive: 5, jobsDone: 220, licenseVerified: true,
    badges: ['Verified CR'], distanceKm: 6.8, color: '#0F766E',
    bio: 'Plumbing and maintenance company serving all Riyadh districts, 24/7 emergency.',
    portfolio: [{ title: 'Kitchen sink & piping', before: img('p3b'), after: img('p3a') }],
    reviews: [{ id: 'r3', author: 'Omar T.', rating: 4, text: 'Good job, arrived a bit late.', date: '2026-04-02' }]
  },
  {
    id: 'a3', name: 'Yusuf Electric', categoryId: 'electrician', rating: 4.8, reviewsCount: 154,
    city: 'Dubai', zone: 'Al Barsha', yearsActive: 11, jobsDone: 530, licenseVerified: true,
    badges: ['Top Pro'], distanceKm: 4.1, color: '#A21CAF',
    bio: 'Master electrician. Panels, lighting design, smart-home wiring.',
    portfolio: [{ title: 'Villa lighting redesign', before: img('e1b'), after: img('e1a') }],
    reviews: [{ id: 'r4', author: 'Fatima H.', rating: 5, text: 'Excellent and safe work on our panel.', date: '2026-06-01' }]
  },
  {
    id: 'a4', name: 'Al Noor Renovations', categoryId: 'renovation', rating: 4.7, reviewsCount: 64,
    city: 'Doha', zone: 'Al Sadd', yearsActive: 8, jobsDone: 145, licenseVerified: true,
    badges: ['Verified CR', 'Insured'], distanceKm: 8.5, color: '#B45309',
    bio: 'Full renovations: bathrooms, kitchens, flooring. Fixed quotes, clear timelines.',
    portfolio: [
      { title: 'Full bathroom renovation', before: img('n1b'), after: img('n1a') },
      { title: 'Kitchen remodel', before: img('n2b'), after: img('n2a') }
    ],
    reviews: [{ id: 'r5', author: 'Ali R.', rating: 5, text: 'Finished 2 days early. Amazing result.', date: '2026-03-18' }]
  },
  {
    id: 'a5', name: 'CoolAir KW', categoryId: 'hvac', rating: 4.5, reviewsCount: 98,
    city: 'Kuwait City', zone: 'Salmiya', yearsActive: 6, jobsDone: 310, licenseVerified: false,
    badges: ['Fast responder'], distanceKm: 2.4, color: '#0E7490',
    bio: 'AC installation and maintenance, all major brands.',
    portfolio: [{ title: 'Split AC installation', before: img('c1b'), after: img('c1a') }],
    reviews: [{ id: 'r6', author: 'Noura S.', rating: 4, text: 'Quick and tidy installation.', date: '2026-05-30' }]
  },
  {
    id: 'a6', name: 'Hassan Painting Co.', categoryId: 'painter', rating: 4.8, reviewsCount: 76,
    city: 'Jeddah', zone: 'Al Hamra', yearsActive: 12, jobsDone: 280, licenseVerified: true,
    badges: ['Top Pro'], distanceKm: 5.0, color: '#BE123C',
    bio: 'Interior & exterior painting, decorative finishes.',
    portfolio: [{ title: 'Living room repaint', before: img('h1b'), after: img('h1a') }],
    reviews: [{ id: 'r7', author: 'Mona K.', rating: 5, text: 'Beautiful finish, zero mess.', date: '2026-06-25' }]
  }
];

// Suggerimenti AI (mock) per foto, per categoria — l'analisi testo ora è reale (vedi /ai/analyze-text).
export const AI_PHOTO_HINTS: Record<string, string[]> = {
  plumber: ['Add a photo of the water meter area', 'Add a wide shot of the whole bathroom/kitchen'],
  electrician: ['Add a photo of the electrical panel from a distance', 'Add a close-up of the faulty socket/switch'],
  renovation: ['Add photos of each corner of the room', 'Add a photo of the floor condition'],
  default: ['Add a wider photo of the area', 'Add a close-up of the problem']
};

export const QUOTE_NOTES = [
  'Price includes materials and cleanup. Can start this week.',
  'Labor only — materials billed at cost with receipts.',
  'Includes 6-month warranty on the work.'
];
