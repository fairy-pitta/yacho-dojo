-- 野鳥マスタテーブル
CREATE TABLE IF NOT EXISTS birds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  japanese_name TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  family TEXT NOT NULL,
  "order" TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 野鳥画像テーブル
CREATE TABLE IF NOT EXISTS bird_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bird_id UUID NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  source TEXT,
  license TEXT,
  photographer TEXT,
  attribution TEXT,
  credit TEXT,
  width INTEGER,
  height INTEGER,
  file_size BIGINT,
  mime_type TEXT,
  quality_score INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 問題テーブルは削除（bird_imagesテーブルから直接クイズを生成）

-- 回答履歴テーブル
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bird_id UUID NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
  bird_image_id UUID NOT NULL REFERENCES bird_images(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クイズ結果テーブル
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id INTEGER,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER NOT NULL, -- seconds
  difficulty_level TEXT NOT NULL,
  category TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- コメント機能と評価機能は削除（シンプルなクイズシステムに集中）

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_bird_images_bird_id ON bird_images(bird_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_bird_id ON user_answers(bird_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_bird_image_id ON user_answers(bird_image_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);

-- RLS (Row Level Security) の有効化
ALTER TABLE birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bird_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS ポリシーの作成
-- 野鳥マスタ: 全員が読み取り可能
CREATE POLICY "Birds are viewable by everyone" ON birds
  FOR SELECT USING (true);

-- 野鳥画像: 全員が読み取り可能
CREATE POLICY "Bird images are viewable by everyone" ON bird_images
  FOR SELECT USING (true);

-- 回答履歴: ユーザーは自分の回答のみ操作可能
CREATE POLICY "Users can view own answers" ON user_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON user_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- クイズ結果: ユーザーは自分の結果のみ操作可能
CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);