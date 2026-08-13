-- SEED ARTIGIANI DEMO — eseguire in Supabase → SQL Editor.
-- 6 artigiani + portfolio (stessi dati del vecchio mock dell'app).
-- Sicuro da rieseguire: ON CONFLICT DO NOTHING.

INSERT INTO "Artisan" (id, name, "categoryId", city, country, bio, verified, rating, "jobsDone") VALUES
  ('a1', 'Ahmed Al-Fahad',      'plumber',     'Riyadh',      'SA', 'Licensed plumber specialized in leak detection and full bathroom systems. Team of 3.', true,  4.9, 410),
  ('a2', 'Gulf Fix Services',   'plumber',     'Riyadh',      'SA', 'Plumbing and maintenance company serving all Riyadh districts, 24/7 emergency.',      true,  4.6, 220),
  ('a3', 'Yusuf Electric',      'electrician', 'Dubai',       'AE', 'Master electrician. Panels, lighting design, smart-home wiring.',                     true,  4.8, 530),
  ('a4', 'Al Noor Renovations', 'renovation',  'Doha',        'QA', 'Full renovations: bathrooms, kitchens, flooring. Fixed quotes, clear timelines.',     true,  4.7, 145),
  ('a5', 'CoolAir KW',          'hvac',        'Kuwait City', 'KW', 'AC installation and maintenance, all major brands.',                                  false, 4.5, 310),
  ('a6', 'Hassan Painting Co.', 'painter',     'Jeddah',      'SA', 'Interior & exterior painting, decorative finishes.',                                  true,  4.8, 280)
ON CONFLICT (id) DO NOTHING;

INSERT INTO "PortfolioItem" (id, "artisanId", "beforeUrl", "afterUrl", description) VALUES
  ('p1', 'a1', 'https://picsum.photos/seed/p1b/500/340', 'https://picsum.photos/seed/p1a/500/340', 'Bathroom pipe replacement'),
  ('p2', 'a1', 'https://picsum.photos/seed/p2b/500/340', 'https://picsum.photos/seed/p2a/500/340', 'Water heater install'),
  ('p3', 'a2', 'https://picsum.photos/seed/p3b/500/340', 'https://picsum.photos/seed/p3a/500/340', 'Kitchen sink & piping'),
  ('p4', 'a3', 'https://picsum.photos/seed/e1b/500/340', 'https://picsum.photos/seed/e1a/500/340', 'Villa lighting redesign'),
  ('p5', 'a4', 'https://picsum.photos/seed/n1b/500/340', 'https://picsum.photos/seed/n1a/500/340', 'Full bathroom renovation'),
  ('p6', 'a4', 'https://picsum.photos/seed/n2b/500/340', 'https://picsum.photos/seed/n2a/500/340', 'Kitchen remodel'),
  ('p7', 'a5', 'https://picsum.photos/seed/c1b/500/340', 'https://picsum.photos/seed/c1a/500/340', 'Split AC installation'),
  ('p8', 'a6', 'https://picsum.photos/seed/h1b/500/340', 'https://picsum.photos/seed/h1a/500/340', 'Living room repaint')
ON CONFLICT (id) DO NOTHING;
