-- Run this in your Supabase SQL Editor

-- 1. Create Subjects Table
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  color TEXT,
  bg TEXT,
  icon_name TEXT,
  bar_color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Units Table
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  subject_id TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  unit_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Lessons Table
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  lesson_order INTEGER NOT NULL,
  video_url TEXT,
  summary_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Exercises Table
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  unit_id TEXT REFERENCES units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  exercise_order INTEGER NOT NULL,
  content TEXT,
  solution TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- 6. Admin Settings Table
CREATE TABLE admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  api_key TEXT,
  ai_model TEXT,
  bac_date TEXT
);

-- Set up Row Level Security (RLS) if you add users later. 
-- For now, allow read access to everyone:
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to subjects" ON subjects FOR SELECT USING (true);
CREATE POLICY "Allow public read access to units" ON units FOR SELECT USING (true);
CREATE POLICY "Allow public read access to lessons" ON lessons FOR SELECT USING (true);
CREATE POLICY "Allow public read access to exercises" ON exercises FOR SELECT USING (true);
CREATE POLICY "Allow public read access to admin_settings" ON admin_settings FOR SELECT USING (true);

CREATE POLICY "Allow public insert to subjects" ON subjects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to units" ON units FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to lessons" ON lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to exercises" ON exercises FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete to subjects" ON subjects FOR DELETE USING (true);
CREATE POLICY "Allow public delete to units" ON units FOR DELETE USING (true);
CREATE POLICY "Allow public delete to lessons" ON lessons FOR DELETE USING (true);
CREATE POLICY "Allow public delete to exercises" ON exercises FOR DELETE USING (true);

CREATE POLICY "Allow public update to subjects" ON subjects FOR UPDATE USING (true);
CREATE POLICY "Allow public update to units" ON units FOR UPDATE USING (true);
CREATE POLICY "Allow public update to lessons" ON lessons FOR UPDATE USING (true);
CREATE POLICY "Allow public update to exercises" ON exercises FOR UPDATE USING (true);
CREATE POLICY "Allow public insert/update to admin_settings" ON admin_settings FOR ALL USING (true);



-- 7. Create User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  progress_value INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to user_progress" ON user_progress;
DROP POLICY IF EXISTS "Allow public insert to user_progress" ON user_progress;
DROP POLICY IF EXISTS "Allow public update to user_progress" ON user_progress;
DROP POLICY IF EXISTS "Allow public delete to user_progress" ON user_progress;

CREATE POLICY "Allow users to read their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
-- prevent users from modifying system records (e.g. is_vip)
CREATE POLICY "Allow users to insert gamification" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id AND item_type != 'system');
CREATE POLICY "Allow users to update gamification" ON user_progress FOR UPDATE USING (auth.uid() = user_id AND item_type != 'system');
CREATE POLICY "Allow users to delete gamification" ON user_progress FOR DELETE USING (auth.uid() = user_id AND item_type != 'system');

-- 8. Create Secure Leaderboard RPC
-- This safely joins auth.users to get only the full_name without exposing emails or private data
CREATE OR REPLACE FUNCTION get_public_leaderboard()
RETURNS TABLE (
  user_id UUID,
  progress_value INTEGER,
  full_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id, 
    p.progress_value, 
    (u.raw_user_meta_data->>'full_name')::TEXT as full_name
  FROM user_progress p
  JOIN auth.users u ON p.user_id = u.id
  WHERE p.item_type = 'gamification' AND p.item_id = 'xp'
  ORDER BY p.progress_value DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_public_leaderboard() TO anon, authenticated;
