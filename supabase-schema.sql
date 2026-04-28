-- Run this in your Supabase SQL Editor

-- 1. Create Subjects Table
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  color TEXT,
  bg TEXT,
  icon_name TEXT,
  bar_color TEXT
);

-- 2. Create Units Table
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_order INTEGER NOT NULL
);

-- 3. Create Lessons Table
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_order INTEGER NOT NULL,
  video_url TEXT,
  summary_content TEXT
);

-- 4. Create Exercises Table
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exercise_order INTEGER NOT NULL,
  content TEXT,
  solution TEXT
);

-- 5. Insert Sample Data
INSERT INTO subjects (id, name, progress, color, bg, icon_name, bar_color)
VALUES 
  ('math', 'الرياضيات', 80, 'text-blue-500', 'bg-blue-100', 'Calculator', 'bg-blue-500'),
  ('physics', 'الفيزياء', 65, 'text-indigo-500', 'bg-indigo-100', 'FlaskConical', 'bg-indigo-500'),
  ('science', 'العلوم الطبيعية', 40, 'text-emerald-500', 'bg-emerald-100', 'Globe', 'bg-emerald-500');

INSERT INTO units (id, subject_id, name, unit_order)
VALUES 
  ('m_u1', 'math', 'الدوال العددية', 1),
  ('m_u2', 'math', 'الدوال الأسية', 2),
  ('p_u1', 'physics', 'المتابعة الزمنية للتحول الكيميائي', 1),
  ('s_u1', 'science', 'تركيب البروتين', 1);

INSERT INTO lessons (id, unit_id, title, lesson_order)
VALUES
  ('m_l1', 'm_u1', 'الاستمرارية', 1),
  ('m_l2', 'm_u1', 'الاشتقاقية', 2),
  ('m_l3', 'm_u2', 'تعريف وخواص', 1),
  ('m_l4', 'm_u2', 'دراسة الدالة الأسية', 2),
  ('p_l1', 'p_u1', 'طرق المتابعة الزمنية', 1),
  ('p_l2', 'p_u1', 'سرعة التفاعل', 2),
  ('s_l1', 's_u1', 'مقر تركيب البروتين', 1),
  ('s_l2', 's_u1', 'الاستنساخ والترجمة', 2);

INSERT INTO exercises (id, unit_id, title, exercise_order)
VALUES
  ('m_e1', 'm_u1', 'تمرين 1: الاستمرارية', 1),
  ('m_e2', 'm_u1', 'تمرين 2: الاشتقاقية', 2),
  ('m_e3', 'm_u2', 'تمرين 1: خواص الدالة الأسية', 1),
  ('m_e4', 'm_u2', 'تمرين 2: دراسة شاملة', 2),
  ('p_e1', 'p_u1', 'تمرين: المتابعة عن طريق المعايرة', 1),
  ('p_e2', 'p_u1', 'تمرين: حساب سرعة التفاعل', 2),
  ('s_e1', 's_u1', 'تمرين الاستنساخ', 1),
  ('s_e2', 's_u1', 'تمرين الترجمة', 2);

-- Set up Row Level Security (RLS) if you add users later. 
-- For now, allow read access to everyone:
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to units" ON units FOR SELECT USING (true);
CREATE POLICY "Allow public read access to lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Allow public read access to exercises" ON exercises FOR SELECT USING (true);
