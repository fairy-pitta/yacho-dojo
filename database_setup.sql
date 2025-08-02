-- 野鳥識別士試験 勉強サイト データベーステーブル作成
-- Supabase Dashboard の SQL Editor で実行してください

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
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 問題テーブル
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bird_id UUID NOT NULL REFERENCES birds(id) ON DELETE CASCADE,
  bird_image_id UUID NOT NULL REFERENCES bird_images(id) ON DELETE CASCADE,
  correct_answer TEXT NOT NULL,
  alternative_answers TEXT[],
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 回答履歴テーブル
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- コメントテーブル
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  dislikes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 問題評価テーブル
CREATE TABLE IF NOT EXISTS question_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  rating TEXT CHECK (rating IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- コメント評価テーブル
CREATE TABLE IF NOT EXISTS comment_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  rating TEXT CHECK (rating IN ('like', 'dislike')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_bird_images_bird_id ON bird_images(bird_id);
CREATE INDEX IF NOT EXISTS idx_questions_bird_id ON questions(bird_id);
CREATE INDEX IF NOT EXISTS idx_questions_bird_image_id ON questions(bird_image_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_question_id ON comments(question_id);
CREATE INDEX IF NOT EXISTS idx_question_ratings_user_id ON question_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_question_ratings_question_id ON question_ratings(question_id);
CREATE INDEX IF NOT EXISTS idx_comment_ratings_user_id ON comment_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_ratings_comment_id ON comment_ratings(comment_id);

-- RLS (Row Level Security) の有効化
ALTER TABLE birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bird_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
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

-- 問題: 全員が読み取り可能
CREATE POLICY "Questions are viewable by everyone" ON questions
  FOR SELECT USING (true);

-- 回答履歴: ユーザーは自分の回答のみ操作可能
CREATE POLICY "Users can view own answers" ON user_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON user_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- コメント: 全員が読み取り可能、認証ユーザーが投稿可能
CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- 問題評価: 認証ユーザーが操作可能
CREATE POLICY "Authenticated users can manage question ratings" ON question_ratings
  FOR ALL USING (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- コメント評価: 認証ユーザーが操作可能
CREATE POLICY "Authenticated users can manage comment ratings" ON comment_ratings
  FOR ALL USING (auth.role() = 'authenticated' AND auth.uid() = user_id);