-- 野鳥識別士試験 勉強サイト データベーステーブル作成
-- Supabase Dashboard の SQL Editor で実行してください
-- 設計書 docs/database.md に完全準拠

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

-- 野鳥画像テーブル（設計書準拠の完全版）
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

-- ユーザープロフィールテーブル
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- クイズ結果テーブル（設計書準拠の完全版）
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_type TEXT CHECK (quiz_type IN ('normal', 'review_red', 'review_yellow', 'review_green', 'review_all')),
  filter_criteria JSONB,
  session_id INTEGER,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  time_taken INTEGER NOT NULL,
  difficulty_level TEXT NOT NULL,
  category TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 回答履歴テーブル（設計書準拠の完全版）
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bird_id UUID NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
  bird_image_id UUID NOT NULL REFERENCES bird_images(id) ON DELETE CASCADE,
  quiz_session_id UUID REFERENCES quiz_results(id),
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  flag_before TEXT,
  flag_after TEXT,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザー問題別学習状況テーブル（復習機能の核）
CREATE TABLE IF NOT EXISTS user_question_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bird_image_id UUID NOT NULL REFERENCES bird_images(id) ON DELETE CASCADE,
  flag_color TEXT CHECK (flag_color IN ('red', 'yellow', 'green', 'none')) DEFAULT 'none',
  last_answered_at TIMESTAMP WITH TIME ZONE,
  correct_count INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bird_image_id)
);

-- Phase 3実装予定テーブル（コメント）
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bird_image_id UUID NOT NULL REFERENCES bird_images(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Phase 3実装予定テーブル（問題評価）
CREATE TABLE IF NOT EXISTS question_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bird_image_id UUID NOT NULL REFERENCES bird_images(id) ON DELETE CASCADE,
  rating TEXT CHECK (rating IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, bird_image_id)
);

-- Phase 3実装予定テーブル（コメント評価）
CREATE TABLE IF NOT EXISTS comment_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  rating TEXT CHECK (rating IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- 基本インデックスの作成
CREATE INDEX IF NOT EXISTS idx_bird_images_bird_id ON bird_images(bird_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_bird_id ON user_answers(bird_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_bird_image_id ON user_answers(bird_image_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);

-- 復習機能用インデックス
CREATE INDEX IF NOT EXISTS idx_user_question_status_user_flag ON user_question_status(user_id, flag_color);
CREATE INDEX IF NOT EXISTS idx_user_question_status_user_last_answered ON user_question_status(user_id, last_answered_at);
CREATE INDEX IF NOT EXISTS idx_user_answers_session ON user_answers(quiz_session_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_type ON quiz_results(user_id, quiz_type);

-- RLS (Row Level Security) の有効化
ALTER TABLE birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bird_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_ratings ENABLE ROW LEVEL SECURITY;

-- RLS ポリシーの作成
-- 野鳥マスタ: 全員が読み取り可能
CREATE POLICY "Birds are viewable by everyone" ON birds
  FOR SELECT USING (true);

-- 野鳥画像: 全員が読み取り可能
CREATE POLICY "Bird images are viewable by everyone" ON bird_images
  FOR SELECT USING (true);

-- プロフィール: ユーザーは自分のプロフィールのみ操作可能
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- クイズ結果: ユーザーは自分の結果のみ操作可能
CREATE POLICY "Users can view own quiz results" ON quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" ON quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 回答履歴: ユーザーは自分の回答のみ操作可能
CREATE POLICY "Users can view own answers" ON user_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON user_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ユーザー問題別学習状況: ユーザーは自分の学習状況のみ操作可能
CREATE POLICY "Users can view own question status" ON user_question_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question status" ON user_question_status
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question status" ON user_question_status
  FOR UPDATE USING (auth.uid() = user_id);

-- Phase 3実装予定のRLSポリシー
-- コメント: 全員が読み取り可能、ユーザーは自分のコメントのみ投稿可能
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 問題評価: ユーザーは自分の評価のみ操作可能
CREATE POLICY "Users can view own question ratings" ON question_ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question ratings" ON question_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question ratings" ON question_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- コメント評価: ユーザーは自分の評価のみ操作可能
CREATE POLICY "Users can view own comment ratings" ON comment_ratings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comment ratings" ON comment_ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment ratings" ON comment_ratings
  FOR UPDATE USING (auth.uid() = user_id);

-- updated_atトリガー関数の作成
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_atトリガーの作成
CREATE TRIGGER birds_updated_at
  BEFORE UPDATE ON birds
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER user_question_status_updated_at
  BEFORE UPDATE ON user_question_status
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- 新規ユーザー登録時のプロフィール自動作成関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー登録時のトリガー
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();