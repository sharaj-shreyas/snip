-- ============================================================================
-- Snip: starter cards (one per topic). Run AFTER schema.sql.
-- Re-running updates the existing rows (matched on source_url).
-- Wrap keywords in **double asterisks** to highlight them in the app.
-- ============================================================================

insert into public.cards
  (source_url, topic_tag, hook_headline, hook_body, breakdown_bullets,
   real_world_impact, quiz_question, quiz_options, correct_index, quiz_explanation)
values
(
  'https://en.wikipedia.org/wiki/Large_language_model',
  'AI',
  'Your AI can''t actually read words.',
  'Chatbots see your sentence as a pile of number-chunks, which is why some famously miscount the r''s in “strawberry.”',
  '["Text is chopped into **tokens**, chunks of roughly 4 characters each.",
    "Every token becomes a **vector**, a list of thousands of numbers that encodes meaning.",
    "The model only ever predicts the **next token**, one at a time, over and over."]',
  'Tokens are why AI is billed “per token,” why some languages cost more to process, and why letter-by-letter tasks still trip up very large models.',
  'Why do language models struggle to count letters in a word?',
  '["They see tokens, not individual letters",
    "They weren''t trained on English text",
    "Counting requires an internet connection"]',
  0,
  '“strawberry” may be just 2–3 tokens to the model, so the individual letters are never directly visible.'
),
(
  'https://science.nasa.gov/mission/webb/',
  'Space',
  'A telescope that sees the past.',
  'The James Webb Space Telescope catches light that left its galaxy more than 13 billion years ago.',
  '["It sits at **L2**, about 1.5 million km from Earth, always facing away from the Sun.",
    "A tennis-court-sized, **5-layer sunshield** keeps its mirrors below −220 °C.",
    "It sees in **infrared**, because cosmic expansion stretches ancient light to longer wavelengths."]',
  'Webb is spotting galaxies that formed surprisingly early and reading the chemistry of exoplanet atmospheres, rewriting textbooks on how the universe grew up.',
  'Why does Webb observe mainly in infrared?',
  '["Infrared is always brighter than visible light",
    "Expansion stretches old light into longer wavelengths",
    "Visible light can''t travel through space"]',
  1,
  'As space expands, light from the early universe gets “redshifted” all the way into the infrared, so that''s where Webb has to look.'
),
(
  'https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapies-treat-patients-sickle-cell-disease',
  'Biotech',
  'Editing DNA like a text document.',
  'A defense system borrowed from bacteria became the first approved CRISPR medicine in 2023.',
  '["**Cas9** is a protein that cuts DNA like molecular scissors.",
    "A **guide RNA** tells it exactly which 20-letter sequence to find.",
    "Bacteria evolved it as an **immune system** to shred invading viruses."]',
  'Casgevy, approved in 2023, treats sickle cell disease by editing a patient''s own blood stem cells: a one-time therapy instead of a lifetime of transfusions.',
  'What tells Cas9 where to cut?',
  '["A magnetic field", "A ribosome", "A guide RNA"]',
  2,
  'The guide RNA carries a sequence that matches the target DNA, steering Cas9 to the exact spot to cut.'
),
(
  'https://en.wikipedia.org/wiki/Extreme_ultraviolet_lithography',
  'Hardware',
  'Your phone chip was printed with exploding tin.',
  'To etch the most advanced chips, machines blast tiny tin droplets with a laser about 50,000 times a second.',
  '["**EUV light** has a 13.5 nm wavelength, far shorter than anything your eyes can see.",
    "It''s made by vaporizing **tin droplets** into plasma hotter than the Sun''s surface.",
    "Only one company, **ASML**, builds these machines, and each costs well over $150M."]',
  'EUV lets chipmakers pack roughly 20 billion transistors into a phone chip. Nearly every flagship phone and AI accelerator today depends on it.',
  'Why do chipmakers use extreme ultraviolet light?',
  '["Shorter wavelengths can print smaller features",
    "It''s cheaper than visible light",
    "It keeps the silicon wafer cool"]',
  0,
  'Like using a finer brush, a shorter wavelength can draw smaller lines, so more transistors fit on the same chip.'
),
(
  'https://en.wikipedia.org/wiki/Error_analysis_for_the_Global_Positioning_System',
  'Physics',
  'Your GPS runs on Einstein.',
  'Clocks on GPS satellites tick about 38 microseconds a day faster than yours, and your map would drift kilometres without a fix.',
  '["**Special relativity**: fast-moving satellite clocks run slow by about 7 µs a day.",
    "**General relativity**: weaker gravity up high makes them run fast by about 45 µs a day.",
    "Engineers **pre-tune** the satellite clocks so the net +38 µs is cancelled out."]',
  'Light travels about 11 km in 38 microseconds. Without relativity corrections, GPS positions would drift by kilometres every single day.',
  'Why do GPS satellite clocks tick faster than clocks on the ground overall?',
  '["They use more accurate atomic clocks",
    "Weaker gravity in orbit speeds up time more than their speed slows it",
    "Solar radiation charges their batteries faster"]',
  1,
  'Gravity''s effect (+45 µs/day) beats the speed effect (−7 µs/day), so the satellite clocks gain about 38 µs per day.'
)
on conflict (source_url) do update set
  topic_tag         = excluded.topic_tag,
  hook_headline     = excluded.hook_headline,
  hook_body         = excluded.hook_body,
  breakdown_bullets = excluded.breakdown_bullets,
  real_world_impact = excluded.real_world_impact,
  quiz_question     = excluded.quiz_question,
  quiz_options      = excluded.quiz_options,
  correct_index     = excluded.correct_index,
  quiz_explanation  = excluded.quiz_explanation;
