-- 元气日记 数据库表结构
-- 在 Supabase SQL Editor 中执行

-- 1. 用户资料表（扩展 auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 新用户注册时自动创建 profile
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nickname', split_part(NEW.email, '@', 1)),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 打卡分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  emoji_icon TEXT NOT NULL DEFAULT '📋',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- 3. 打卡项目表
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'toggle' CHECK (type IN ('toggle', 'numeric')),
  unit TEXT,
  score INT NOT NULL DEFAULT 10,
  description TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- 4. 打卡记录表
CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  value NUMERIC,
  note TEXT NOT NULL DEFAULT '',
  is_backfill BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, item_id, check_date)
);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- ====== RLS 策略 ======

-- profiles: 用户只能看/改自己的，管理员可以看全部
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT
  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- categories: 所有登录用户可以查看，只有管理员可以修改
CREATE POLICY "categories_select_all" ON categories FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "categories_admin_all" ON categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- items: 所有登录用户可以查看，只有管理员可以修改
CREATE POLICY "items_select_all" ON items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "items_admin_all" ON items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- check_ins: 用户只能看/改自己的，管理员可以看全部
CREATE POLICY "check_ins_select_own" ON check_ins FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "check_ins_insert_own" ON check_ins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "check_ins_update_own" ON check_ins FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "check_ins_delete_own" ON check_ins FOR DELETE
  USING (auth.uid() = user_id);

-- ====== 初始种子数据 ======

-- 当 categories 和 items 为空时插入默认数据
INSERT INTO categories (name, emoji_icon, sort_order) VALUES
  ('运动', '🏃', 1),
  ('饮食', '🥗', 2),
  ('睡眠', '💤', 3),
  ('护肤', '🧴', 4)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  cat_id UUID;
BEGIN
  -- 运动项目
  SELECT id INTO cat_id FROM categories WHERE name = '运动' LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM items WHERE category_id = cat_id) THEN
    INSERT INTO items (category_id, name, type, unit, score, description, sort_order) VALUES
      (cat_id, '有氧运动', 'numeric', '分钟', 10, '建议每周3-5次，每次30分钟以上', 1),
      (cat_id, '抗阻运动', 'numeric', '分钟', 15, '力量训练，增肌有助于提高基础代谢', 2),
      (cat_id, '拉伸放松', 'toggle', NULL, 5, '运动后拉伸10分钟', 3);
  END IF;

  -- 饮食项目
  SELECT id INTO cat_id FROM categories WHERE name = '饮食' LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM items WHERE category_id = cat_id) THEN
    INSERT INTO items (category_id, name, type, unit, score, description, sort_order) VALUES
      (cat_id, '喝够2升水', 'toggle', NULL, 8, '每天饮水量达到2L', 1),
      (cat_id, '少糖饮食', 'toggle', NULL, 10, '减少添加糖摄入', 2);
  END IF;

  -- 睡眠项目
  SELECT id INTO cat_id FROM categories WHERE name = '睡眠' LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM items WHERE category_id = cat_id) THEN
    INSERT INTO items (category_id, name, type, unit, score, description, sort_order) VALUES
      (cat_id, '11点前入睡', 'toggle', NULL, 20, '黄金美容觉时间', 1),
      (cat_id, '睡眠时长', 'numeric', '小时', 15, '建议7-9小时', 2);
  END IF;

  -- 护肤项目
  SELECT id INTO cat_id FROM categories WHERE name = '护肤' LIMIT 1;
  IF cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM items WHERE category_id = cat_id) THEN
    INSERT INTO items (category_id, name, type, unit, score, description, sort_order) VALUES
      (cat_id, '早晚护肤', 'toggle', NULL, 6, '清洁+保湿+防晒', 1),
      (cat_id, '面部防晒', 'toggle', NULL, 10, '防晒是抗老的第一步', 2);
  END IF;
END $$;
