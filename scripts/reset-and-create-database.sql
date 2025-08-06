-- 既存テーブルを全て削除（依存関係を考慮した順序）
DROP TABLE IF EXISTS comment_ratings CASCADE;
DROP TABLE IF EXISTS question_ratings CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS user_question_status CASCADE;
DROP TABLE IF EXISTS user_answers CASCADE;
DROP TABLE IF EXISTS quiz_results CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS bird_images CASCADE;
DROP TABLE IF EXISTS birds CASCADE;

-- 関数とトリガーも削除
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Birds（野鳥マスタ）
CREATE TABLE birds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    japanese_name TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    family TEXT NOT NULL,
    "order" TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BirdImages（野鳥画像）
CREATE TABLE bird_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bird_id UUID NOT NULL REFERENCES birds(id),
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles（ユーザープロフィール）
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QuizResults（クイズ結果）
CREATE TABLE quiz_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- UserAnswers（回答履歴）
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bird_id UUID NOT NULL REFERENCES birds(id),
    bird_image_id UUID NOT NULL REFERENCES bird_images(id),
    quiz_session_id UUID REFERENCES quiz_results(id),
    selected_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    flag_before TEXT,
    flag_after TEXT,
    answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- UserQuestionStatus（ユーザー問題別学習状況）
CREATE TABLE user_question_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bird_image_id UUID NOT NULL REFERENCES bird_images(id),
    flag_color TEXT CHECK (flag_color IN ('red', 'yellow', 'green', 'none')) DEFAULT 'none',
    last_answered_at TIMESTAMPTZ,
    correct_count INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bird_image_id)
);

-- Comments（コメント）**Phase 3実装予定**
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bird_image_id UUID NOT NULL REFERENCES bird_images(id),
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    dislikes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QuestionRatings（問題評価）**Phase 3実装予定**
CREATE TABLE question_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    bird_image_id UUID NOT NULL REFERENCES bird_images(id),
    rating TEXT CHECK (rating IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, bird_image_id)
);

-- CommentRatings（コメント評価）**Phase 3実装予定**
CREATE TABLE comment_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    comment_id UUID NOT NULL REFERENCES comments(id),
    rating TEXT CHECK (rating IN ('like', 'dislike')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, comment_id)
);

-- インデックス作成
-- 外部キー用インデックス
CREATE INDEX idx_bird_images_bird_id ON bird_images(bird_id);
CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_bird_id ON user_answers(bird_id);
CREATE INDEX idx_user_answers_bird_image_id ON user_answers(bird_image_id);
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);

-- 復習機能用インデックス
CREATE INDEX idx_user_question_status_user_flag ON user_question_status(user_id, flag_color);
CREATE INDEX idx_user_question_status_user_last_answered ON user_question_status(user_id, last_answered_at);
CREATE INDEX idx_user_answers_session ON user_answers(quiz_session_id);
CREATE INDEX idx_quiz_results_user_type ON quiz_results(user_id, quiz_type);

-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_atトリガー
CREATE TRIGGER update_birds_updated_at BEFORE UPDATE ON birds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_question_status_updated_at BEFORE UPDATE ON user_question_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 新規ユーザー登録時のプロフィール作成関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- 新規ユーザー登録トリガー
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS（Row Level Security）ポリシー設定
ALTER TABLE birds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bird_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_ratings ENABLE ROW LEVEL SECURITY;

-- Birds: 全ユーザーが読み取り可能
CREATE POLICY "Birds are viewable by everyone" ON birds
    FOR SELECT USING (true);

-- BirdImages: 全ユーザーが読み取り可能
CREATE POLICY "Bird images are viewable by everyone" ON bird_images
    FOR SELECT USING (true);

-- Profiles: 自分のプロフィールのみ操作可能、他人のプロフィールは読み取りのみ
CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- QuizResults: 自分の結果のみ操作可能
CREATE POLICY "Users can view own quiz results" ON quiz_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results" ON quiz_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz results" ON quiz_results
    FOR UPDATE USING (auth.uid() = user_id);

-- UserAnswers: 自分の回答のみ操作可能
CREATE POLICY "Users can view own answers" ON user_answers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON user_answers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers" ON user_answers
    FOR UPDATE USING (auth.uid() = user_id);

-- UserQuestionStatus: 自分の学習状況のみ操作可能
CREATE POLICY "Users can view own question status" ON user_question_status
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own question status" ON user_question_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question status" ON user_question_status
    FOR UPDATE USING (auth.uid() = user_id);

-- Comments: 全ユーザーが読み取り可能、自分のコメントのみ操作可能
CREATE POLICY "Comments are viewable by everyone" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- QuestionRatings: 全ユーザーが読み取り可能、自分の評価のみ操作可能
CREATE POLICY "Question ratings are viewable by everyone" ON question_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own question ratings" ON question_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own question ratings" ON question_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own question ratings" ON question_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- CommentRatings: 全ユーザーが読み取り可能、自分の評価のみ操作可能
CREATE POLICY "Comment ratings are viewable by everyone" ON comment_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own comment ratings" ON comment_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comment ratings" ON comment_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comment ratings" ON comment_ratings
    FOR DELETE USING (auth.uid() = user_id);