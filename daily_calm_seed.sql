-- daily_calm_seed.sql

-- =========================
-- archetypes
-- =========================
insert into public.dc_archetypes
(code, name, number_value, weekday_name, weekday_order, summary, positive_traits, shadow_traits, health_focus, emotional_tendency)
values
(
  'sun','Sun',1,'Sunday',0,
  'Warm, optimistic, vital, purposeful.',
  array['optimistic','warm','vital','purposeful'],
  array['self-centered','judgmental'],
  array['eyes','heart'],
  null
),
(
  'moon','Moon',2,'Monday',1,
  'Nurturing, creative, family-oriented, emotionally sensitive.',
  array['nurturing','creative','family-oriented','sensitive'],
  array['unstable','indecisive','poor boundaries','selfish when imbalanced'],
  array['skin','lumps','growths','breasts'],
  'anxiety'
),
(
  'mars','Mars',9,'Tuesday',2,
  'Independent, fierce, loyal, fast-moving, action-oriented.',
  array['independent','fierce','loyal','courageous'],
  array['reckless','impatient','trouble from acting too fast'],
  array['sinus','blood','muscle'],
  'loneliness'
),
(
  'mercury','Mercury',5,'Wednesday',3,
  'Messenger and communicator, adaptable, humorous, quick-minded.',
  array['communicative','adaptable','clever','humorous'],
  array['shallow','manipulative','insincere'],
  array['headaches','kidneys','thyroid'],
  'anxiety'
),
(
  'jupiter','Jupiter',3,'Thursday',4,
  'Abundant, wise, lawful, celebratory, expansive.',
  array['abundant','lucky','wise','appreciates law and order'],
  array['overindulgent','controlling','expands too far'],
  array['obesity','liver issues','skin issues','hips'],
  'overindulgence'
),
(
  'venus','Venus',6,'Friday',5,
  'Love, beauty, harmony, flow, sensual appreciation.',
  array['loving','beautiful','harmonious','intuitive','sees the best'],
  array['vain','perfectionistic','sensual excess','idealizing'],
  array['reproductive issues','skin issues'],
  'anxiety'
),
(
  'saturn','Saturn',8,'Saturday',6,
  'Discipline, teacher, endurance, responsibility through hardship.',
  array['disciplined','wise','enduring','great teacher'],
  array['heavy','restricted','hardship','depressed','angry from loss'],
  array['bones','teeth','unusual disease'],
  'depression'
),
(
  'uranus','Uranus',4,null,null,
  'Grounded, strategic, roots for the underdog, square and revolutionary.',
  array['grounded','strategic','revolutionary','unconditional love','sees around corners'],
  array['communication difficulties','misunderstood','misunderstands others'],
  array[]::text[],
  null
),
(
  'neptune','Neptune',7,null,null,
  'Dreamer, creative, flamboyant, story-driven, higher-realm imagination.',
  array['creative','dreamy','fun','flamboyant','runs to own rhythm'],
  array[]::text[],
  array[]::text[],
  null
)
on conflict (code) do update set
  name = excluded.name,
  number_value = excluded.number_value,
  weekday_name = excluded.weekday_name,
  weekday_order = excluded.weekday_order,
  summary = excluded.summary,
  positive_traits = excluded.positive_traits,
  shadow_traits = excluded.shadow_traits,
  health_focus = excluded.health_focus,
  emotional_tendency = excluded.emotional_tendency;

-- =========================
-- moon rules
-- =========================
insert into public.dc_moon_rules
(phase_code, name, summary, themes, emotional_effect)
values
(
  'waxing',
  'Waxing Moon',
  'Adding, inviting, expansion, building.',
  array['adding','inviting new energy','expansion','growth','creativity','optimism'],
  'Positive side tends to overlap more; energy feels easier to build with.'
),
(
  'waning',
  'Waning Moon',
  'Letting go, healing, moving on, release.',
  array['letting go','healing','release','forgiveness','endings','reflection'],
  'Shadow side may pull more; people may have a harder time because healing brings up unresolved material.'
)
on conflict (phase_code) do update set
  name = excluded.name,
  summary = excluded.summary,
  themes = excluded.themes,
  emotional_effect = excluded.emotional_effect;

-- =========================
-- rules
-- =========================
insert into public.dc_rules
(rule_key, rule_group, summary, details)
values
(
  'daily_structure',
  'interpretation',
  'Overall picture is the ruling day; quality of thread is the reduced date number.',
  jsonb_build_object(
    'model', 'day_energy_plus_thread',
    'notes', 'Keep it simple. The ruling day sets the overall tone. The daily number colors the style of thought.'
  )
),
(
  'number_reduction',
  'daily_number',
  'Reduce date numbers by summing digits until under 10.',
  jsonb_build_object(
    'examples', jsonb_build_array(
      jsonb_build_object('input',17,'reduced',8),
      jsonb_build_object('input',29,'reduced',2)
    )
  )
),
(
  'special_16',
  'special_case',
  'The number 16 is bad luck / Av (Aleph Vav).',
  jsonb_build_object(
    'number', 16,
    'meaning', 'ego correction, disruption, collapse of illusion'
  )
),
(
  'moon_subtlety',
  'interpretation',
  'Moon influence is subtle. It does not drastically change the archetype combination, but colors how the day is felt.',
  jsonb_build_object(
    'notes', 'Most people do not notice this without deep meditation practice. Waning may surface junk for healing; waxing may feel more constructive.'
  )
),
(
  'waxing_overlap',
  'interpretation',
  'On the waxing moon, positive aspects tend to overlap more.',
  jsonb_build_object(
    'phase', 'waxing',
    'effect', 'constructive amplification'
  )
),
(
  'waning_pull',
  'interpretation',
  'On the waning moon, shadow material may pull more because healing and letting go trigger unresolved material.',
  jsonb_build_object(
    'phase', 'waning',
    'effect', 'shadow more visible, healing through release'
  )
),
(
  'year_cycle',
  'yearly_cycle',
  'Yearly archetype cycle begins on March 21 and changes every 52 days.',
  jsonb_build_object(
    'starts_on', '03-21',
    'days_per_phase', 52,
    'sequence', jsonb_build_array('sun','moon','mars','mercury','jupiter','venus','saturn'),
    'seasonal_notes', jsonb_build_object(
      'sun', 'beginning of spring',
      'moon', 'switches by May / nurturing growth',
      'mars', 'heat of summer',
      'mercury', 'return to school',
      'jupiter', 'thanksgiving / abundance',
      'venus', 'christmas',
      'saturn', 'taxes / responsibility'
    )
  )
),
(
  'emotion_theory',
  'interpretation',
  'Emotional root causes used in Daily Calm.',
  jsonb_build_object(
    'anxiety', 'lack of faith in the future; fear of what has not occurred',
    'depression', 'holding onto the past; anger about what has happened',
    'loneliness', 'mars struggle',
    'overindulgence', 'jupiter tendency'
  )
),
(
  'breath_emotion_signals',
  'interpretation',
  'Breath mechanics reflect emotional tendencies.',
  jsonb_build_object(
    'short_inhale', 'frustration',
    'short_hold_in', 'not in the moment',
    'short_exhale', 'anxiety',
    'short_hold_out', 'fear of death'
  )
)
on conflict (rule_key) do update set
  rule_group = excluded.rule_group,
  summary = excluded.summary,
  details = excluded.details;

-- =========================
-- library
-- =========================
insert into public.dc_library
(library_id, category, technique, short_name, description, best_for, moon_preference, archetype_fit, health_focus, emotional_focus, notes, active)
values
(
  'BR01','breathwork','Breath of Glow','glow_breath',
  'Focus on the exhale. The inhale becomes automatic. Helps clear waste from the lungs, cleans blood, supports skin, and helps let go.',
  array['letting go','skin','lungs','detox','release'],
  'waning',
  array['venus','moon','jupiter'],
  array['skin','lungs','blood'],
  array['release'],
  'Do not emphasize inhaling; let inhale happen naturally.',
  true
),
(
  'BR02','breathwork','Sitali Pranayama','sitali',
  'Inhale slowly through the tongue rolled like a taco or burrito, exhale slowly through the nose. Cooling on the throat and calming.',
  array['anxiety','cooling','soothing','nervous system'],
  'either',
  array['moon','venus'],
  array['throat'],
  array['anxiety','calm'],
  null,
  true
),
(
  'BR03','breathwork','Dragon Breath','dragon_breath',
  'In and out through the mouth with lips puckered like blowing out a candle. Fast, energizing, easy even with a busy mind.',
  array['energy','reset','busy mind','quick activation'],
  'either',
  array['mars','mercury'],
  array[]::text[],
  array['stagnation','loneliness'],
  null,
  true
),
(
  'BR04','breathwork','Three Point Breath','three_point_breath',
  'Even inhale, hold, and exhale. The focus is on making it even and pleasant, not hard.',
  array['balance','focus','discipline','clarity'],
  'either',
  array['mercury','venus','saturn'],
  array[]::text[],
  array['anxiety','emotional balance'],
  'Common mistake: either too easy or too hard.',
  true
),
(
  'BR05','breathwork','Breath of Fire','breath_of_fire',
  'Fast even inhale and exhale through the nose. Intense, energizing, initiative-building.',
  array['energy','initiative','activation'],
  'waxing',
  array['mars','sun'],
  array[]::text[],
  array['low energy'],
  'Strong practice; use with discernment.',
  true
),
(
  'BR06','breathwork','Square Breath','square_breath',
  'Even inhale, hold, exhale, hold. Grounding, balancing, and gives perspective.',
  array['grounding','balance','perspective'],
  'either',
  array['saturn','mercury','moon'],
  array[]::text[],
  array['anxiety','grounding'],
  null,
  true
),
(
  'BR07','breathwork','Sweeping Breath','sweeping_breath',
  'Four quick inhales through the nose and one hard fast exhale through the mouth like blowing out a candle. Erases the mind and resets.',
  array['reset','clear mind','overthinking'],
  'either',
  array['mercury','mars'],
  array[]::text[],
  array['overthinking','mental clutter'],
  null,
  true
),
(
  'JR01','journaling','Gratitude List','gratitude_list',
  'Write a gratitude list.',
  array['appreciation','hope','heart opening'],
  'waxing',
  array['venus','jupiter','moon'],
  array[]::text[],
  array['anxiety','hope'],
  null,
  true
),
(
  'JR02','journaling','Letter of Forgiveness','forgiveness_letter',
  'Write a letter of forgiveness.',
  array['release','forgiveness','healing'],
  'waning',
  array['moon','venus','saturn'],
  array[]::text[],
  array['depression','release'],
  null,
  true
),
(
  'JR03','journaling','Story of What You Want to Happen','future_story',
  'Write the story of what you want to happen.',
  array['vision','manifesting','direction'],
  'waxing',
  array['sun','jupiter','venus'],
  array[]::text[],
  array['hope','direction'],
  null,
  true
),
(
  'JR04','journaling','How You Will Handle What You Are Worried About','worry_plan',
  'Journal how you will handle something you are worried about.',
  array['worry processing','planning','agency'],
  'either',
  array['mercury','saturn','moon'],
  array[]::text[],
  array['anxiety'],
  'Can be waxing or waning depending on spin.',
  true
),
(
  'CM01','communication','Use Could Instead of Should','could_not_should',
  'Replace should with could.',
  array['reduce guilt','soften pressure','more choice'],
  'either',
  array['mercury','venus','moon'],
  array[]::text[],
  array['anxiety','guilt'],
  null,
  true
),
(
  'CM02','communication','No Is a Full Sentence','no_full_sentence',
  'Practice letting no stand on its own.',
  array['boundaries','self-respect'],
  'either',
  array['mars','saturn','venus'],
  array[]::text[],
  array['boundaries','loneliness'],
  null,
  true
),
(
  'CM03','communication','Use We Over I','we_over_i',
  'Incorporate we instead of I where appropriate.',
  array['connection','teamwork','softening separation'],
  'either',
  array['venus','jupiter','mercury'],
  array[]::text[],
  array['connection','loneliness'],
  null,
  true
),
(
  'CM04','communication','Active Listening','active_listening',
  'Repeat back what you heard before responding.',
  array['clarity','de-escalation','understanding'],
  'either',
  array['mercury','venus','moon'],
  array[]::text[],
  array['anxiety','connection'],
  null,
  true
),
(
  'MD01','meditation','Heart Centered Gratitude','heart_gratitude',
  'A gratitude meditation centered in the heart.',
  array['gratitude','warmth','connection'],
  'waxing',
  array['venus','jupiter','sun'],
  array['heart'],
  array['hope','appreciation'],
  null,
  true
),
(
  'MD02','meditation','Moment of Silence','moment_of_silence',
  'A simple moment of silence.',
  array['reset','stillness','clarity'],
  'either',
  array['saturn','moon','mercury'],
  array[]::text[],
  array['heaviness','overthinking'],
  null,
  true
),
(
  'MD03','meditation','Internal OM Vibration','internal_om',
  'Thumbs in ears with internal om vibration. Calming and isolates the mind in a good way.',
  array['calming','inward focus','nervous system'],
  'either',
  array['moon','mercury','venus'],
  array[]::text[],
  array['anxiety','mental noise'],
  null,
  true
),
(
  'MD04','meditation','Manifesting Through Third Eye','third_eye_manifest',
  'Visualization through the third eye.',
  array['vision','manifesting','imagination'],
  'waxing',
  array['jupiter','sun','neptune'],
  array[]::text[],
  array['direction','expansion'],
  null,
  true
),
(
  'MV01','movement','Slow Neck Recovery','neck_recovery',
  'Slow neck recovery movement.',
  array['neck tension','circulation','head tension'],
  'either',
  array['saturn','mercury'],
  array['headaches','neck'],
  array['tension'],
  null,
  true
),
(
  'MV02','movement','Shoulders and Chest Expansion','chest_expansion',
  'Shoulders and chest expansion and movement.',
  array['posture','breathing','open heart'],
  'either',
  array['sun','venus','mars'],
  array['heart','chest'],
  array['vitality','openness'],
  null,
  true
),
(
  'MV03','movement','Shoulders and Hand Shaking and Spinning','shake_release',
  'Shake and spin shoulders and hands to release energy.',
  array['release tension','energize','shake off stress'],
  'either',
  array['mars','mercury'],
  array['muscle','hands','shoulders'],
  array['stress release'],
  null,
  true
),
(
  'MV04','movement','Pinky Thumb Brain Trickery','pinky_thumb_brain',
  'Coordination exercise using pinky and thumb.',
  array['coordination','brain wake-up','lightness'],
  'either',
  array['mercury','venus'],
  array['hands'],
  array['mental lightness'],
  null,
  true
)
on conflict (library_id) do update set
  category = excluded.category,
  technique = excluded.technique,
  short_name = excluded.short_name,
  description = excluded.description,
  best_for = excluded.best_for,
  moon_preference = excluded.moon_preference,
  archetype_fit = excluded.archetype_fit,
  health_focus = excluded.health_focus,
  emotional_focus = excluded.emotional_focus,
  notes = excluded.notes,
  active = excluded.active;

-- =========================
-- april 2026 calendar
-- =========================
insert into public.dc_calendar_entries
(entry_date, month_label, day_energy_code, thread_number, moon_phase_code, library_id, title, goal, hashtags, notes)
values
('2026-04-01','2026-04','mercury',1,'waxing','BR03','Daily Calm – Dragon Breath Reset','energize mind',array['dailycalm','breathwork','mindreset','mindfulness'],null),
('2026-04-02','2026-04','jupiter',2,'waxing','MD01','Daily Calm – Heart Gratitude Meditation','cultivate appreciation',array['gratitude','dailycalm','mindfulness','heartcenter'],null),
('2026-04-03','2026-04','venus',3,'waxing','JR01','Daily Calm – Gratitude Journaling','cultivate joy',array['gratitude','journaling','dailycalm','mindfulness'],null),
('2026-04-04','2026-04','saturn',4,'waxing','BR06','Daily Calm – Square Breath Grounding','grounding and balance',array['breathwork','grounding','dailycalm','stressrelief'],null),
('2026-04-05','2026-04','sun',5,'waxing','MV02','Daily Calm – Chest Opening Reset','vitality and posture',array['movement','posture','dailycalm','energy'],null),
('2026-04-06','2026-04','moon',6,'waxing','BR02','Daily Calm – Cooling Breath for Anxiety','calm anxiety',array['anxietyrelief','breathwork','dailycalm','calming'],null),
('2026-04-07','2026-04','mars',7,'waxing','MV03','Daily Calm – Shake Out Stress','release tension',array['stressrelease','movement','dailycalm'],null),
('2026-04-08','2026-04','mercury',8,'waxing','CM04','Daily Calm – Practice Active Listening','improve clarity',array['communication','mindfulness','dailycalm'],null),
('2026-04-09','2026-04','jupiter',9,'waxing','BR01','Daily Calm – Glow Breath Detox','clean lungs and skin',array['breathwork','detox','dailycalm'],null),
('2026-04-10','2026-04','venus',1,'waxing','MD02','Daily Calm – One Minute of Silence','mental reset',array['meditation','mindreset','dailycalm'],null),
('2026-04-11','2026-04','saturn',2,'waxing','MV01','Daily Calm – Slow Neck Recovery','release tension',array['neckpain','movement','dailycalm'],null),
('2026-04-12','2026-04','sun',3,'waxing','JR03','Daily Calm – Write the Future You Want','vision and intention',array['journaling','manifest','dailycalm'],null),
('2026-04-13','2026-04','moon',4,'waning','BR06','Daily Calm – Breath to Let Go','emotional release',array['lettinggo','breathwork','dailycalm'],null),
('2026-04-14','2026-04','mars',5,'waning','BR03','Daily Calm – Release Loneliness Breath','release loneliness',array['loneliness','breathwork','dailycalm'],null),
('2026-04-15','2026-04','mercury',6,'waning','BR07','Daily Calm – Clear the Mind Breath','quiet thoughts',array['overthinking','breathwork','dailycalm'],null),
('2026-04-16','2026-04','jupiter',7,'waning','JR02','Daily Calm – Forgiveness Journaling','letting go',array['forgiveness','journaling','dailycalm'], 'Special day number 16 / Av can be referenced in future logic if desired.'),
('2026-04-17','2026-04','venus',8,'waning','BR04','Daily Calm – Balanced Breath Reset','emotional balance',array['breathwork','balance','dailycalm'],null),
('2026-04-18','2026-04','saturn',9,'waning','MD02','Daily Calm – Sit With the Moment','process heaviness',array['meditation','reflection','dailycalm'],null),
('2026-04-19','2026-04','sun',1,'waning','MV02','Daily Calm – Open the Heart Stretch','open heart energy',array['movement','heartopening','dailycalm'],null),
('2026-04-20','2026-04','moon',2,'waning','BR02','Daily Calm – Calm Emotional Breath','soothe emotions',array['calm','breathwork','dailycalm'],null),
('2026-04-21','2026-04','mars',3,'waning','BR05','Daily Calm – Ignite Your Energy','rebuild energy',array['breathwork','energy','dailycalm'],null),
('2026-04-22','2026-04','mercury',4,'waning','CM01','Daily Calm – Replace Should With Could','reduce guilt',array['communication','mindset','dailycalm'],null),
('2026-04-23','2026-04','jupiter',5,'waning','MD01','Daily Calm – Gratitude Perspective Shift','perspective and appreciation',array['gratitude','mindfulness','dailycalm'],null),
('2026-04-24','2026-04','venus',6,'waning','MV04','Daily Calm – Brain Coordination Trick','lighten mood',array['brainexercise','movement','dailycalm'],null),
('2026-04-25','2026-04','saturn',7,'waning','MV01','Daily Calm – Neck Reset Practice','release tension',array['neckpain','movement','dailycalm'],null),
('2026-04-26','2026-04','sun',8,'waning','BR06','Daily Calm – Grounding Breath Practice','grounding',array['breathwork','grounding','dailycalm'],null),
('2026-04-27','2026-04','moon',9,'waxing','JR01','Daily Calm – Gratitude Reset','nurture hope',array['gratitude','journaling','dailycalm'],null),
('2026-04-28','2026-04','mars',1,'waxing','BR05','Daily Calm – Energizing Breath','initiative and drive',array['energy','breathwork','dailycalm'],null),
('2026-04-29','2026-04','mercury',2,'waxing','CM04','Daily Calm – Listen Before Responding','connection',array['communication','listening','dailycalm'],null),
('2026-04-30','2026-04','jupiter',3,'waxing','MD04','Daily Calm – Third Eye Visualization','expansion and vision',array['manifestation','meditation','dailycalm'],null)
on conflict (entry_date) do update set
  month_label = excluded.month_label,
  day_energy_code = excluded.day_energy_code,
  thread_number = excluded.thread_number,
  moon_phase_code = excluded.moon_phase_code,
  library_id = excluded.library_id,
  title = excluded.title,
  goal = excluded.goal,
  hashtags = excluded.hashtags,
  notes = excluded.notes;