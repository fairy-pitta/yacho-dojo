## データ構造（詳細設計）

### Birds（野鳥マスタ）
- id: UUID PRIMARY KEY
- japanese_name: TEXT NOT NULL（和名）
- scientific_name: TEXT NOT NULL（学名）
- family: TEXT NOT NULL（科）
- order: TEXT NOT NULL（目）
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

### BirdImages（野鳥画像）
- id: UUID PRIMARY KEY
- bird_id: UUID NOT NULL REFERENCES birds(id)（野鳥ID）
- image_url: TEXT NOT NULL（画像URL）
- source: TEXT（画像ソース：iNaturalist, Wikipedia等）
- license: TEXT（ライセンス情報）
- photographer: TEXT（撮影者）
- attribution: TEXT（撮影者クレジット）
- credit: TEXT（クレジット）
- width: INTEGER（画像幅）
- height: INTEGER（画像高さ）
- file_size: BIGINT（ファイルサイズ）
- mime_type: TEXT（MIMEタイプ）
- quality_score: INTEGER（品質スコア）
- is_active: BOOLEAN DEFAULT true（有効フラグ）
- created_at: TIMESTAMPTZ DEFAULT NOW()

### Profiles（ユーザープロフィール）
- id: UUID PRIMARY KEY REFERENCES auth.users(id)
- username: TEXT UNIQUE（ユーザー名）
- full_name: TEXT（フルネーム）
- bio: TEXT（自己紹介）
- avatar_url: TEXT（アバターURL）
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()

### QuizResults（クイズ結果）
- id: UUID PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES auth.users(id)（ユーザーID）
- quiz_type: TEXT CHECK (quiz_type IN ('normal', 'review_red', 'review_yellow', 'review_green', 'review_all', 'family_filtered', 'order_filtered'))（クイズタイプ）
- filter_criteria: JSONB（絞り込み条件：科・目等）
  -- 例: {'family': ['カラス科', 'スズメ科']}, {'order': ['スズメ目']}, {'family': ['カラス科'], 'order': ['スズメ目']}
- session_id: INTEGER（セッションID）
- score: INTEGER NOT NULL（スコア）
- total_questions: INTEGER NOT NULL（総問題数：10,20,30,40,50,60）
- correct_answers: INTEGER NOT NULL（正解数）
- time_taken: INTEGER NOT NULL（所要時間：秒）
- difficulty_level: TEXT NOT NULL（難易度レベル）
- category: TEXT（カテゴリ）
- metadata: JSONB（メタデータ）
- created_at: TIMESTAMPTZ DEFAULT NOW()

### UserAnswers（回答履歴）
- id: UUID PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES auth.users(id)（ユーザーID）
- bird_id: UUID NOT NULL REFERENCES birds(id)（野鳥ID）
- bird_image_id: UUID NOT NULL REFERENCES bird_images(id)（画像ID）
- quiz_session_id: UUID REFERENCES quiz_results(id)（クイズセッションID）
- selected_answer: TEXT NOT NULL（選択した回答）
- correct_answer: TEXT NOT NULL（正解）
- is_correct: BOOLEAN NOT NULL（正解フラグ）
- flag_before: TEXT（回答前のフラグ状態）
- flag_after: TEXT（回答後のフラグ状態）
- answered_at: TIMESTAMPTZ DEFAULT NOW()

### UserQuestionStatus（ユーザー問題別学習状況）
**復習機能の核となるテーブル（応用情報技術者試験過去問道場スタイル）**
- id: UUID PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES auth.users(id)（ユーザーID）
- bird_image_id: UUID NOT NULL REFERENCES bird_images(id)（画像ID）
- flag_color: TEXT CHECK (flag_color IN ('red', 'yellow', 'green', 'none')) DEFAULT 'none'（フラグ色：赤=苦手、黄=要注意、緑=得意、none=未分類）
- last_answered_at: TIMESTAMPTZ（最終回答日時）
- correct_count: INTEGER DEFAULT 0（正解回数）
- total_attempts: INTEGER DEFAULT 0（総回答回数）
- created_at: TIMESTAMPTZ DEFAULT NOW()
- updated_at: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(user_id, bird_image_id)

### Comments（コメント）**Phase 3実装予定**
- id: UUID PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES auth.users(id)（ユーザーID）
- bird_image_id: UUID NOT NULL REFERENCES bird_images(id)（画像ID）
- content: TEXT NOT NULL（コメント内容）
- likes_count: INTEGER DEFAULT 0（いいね数）
- dislikes_count: INTEGER DEFAULT 0（だめだね数）
- created_at: TIMESTAMPTZ DEFAULT NOW()

### QuestionRatings（問題評価）**Phase 3実装予定**
- id: UUID PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES auth.users(id)（ユーザーID）
- bird_image_id: UUID NOT NULL REFERENCES bird_images(id)（画像ID）
- rating: TEXT CHECK (rating IN ('like', 'dislike'))（評価）
- created_at: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(user_id, bird_image_id)

### CommentRatings（コメント評価）**Phase 3実装予定**
- id: UUID PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES auth.users(id)（ユーザーID）
- comment_id: UUID NOT NULL REFERENCES comments(id)（コメントID）
- rating: TEXT CHECK (rating IN ('like', 'dislike'))（評価）
- created_at: TIMESTAMPTZ DEFAULT NOW()
- UNIQUE(user_id, comment_id)

## インデックス設計

### 基本インデックス
```sql
-- 外部キー用インデックス
CREATE INDEX idx_bird_images_bird_id ON bird_images(bird_id);
CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_bird_id ON user_answers(bird_id);
CREATE INDEX idx_user_answers_bird_image_id ON user_answers(bird_image_id);
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
```

### 復習機能用インデックス
```sql
-- フラグ別問題抽出用
CREATE INDEX idx_user_question_status_user_flag ON user_question_status(user_id, flag_color);
-- 学習履歴分析用
CREATE INDEX idx_user_question_status_user_last_answered ON user_question_status(user_id, last_answered_at);
-- セッション管理用
CREATE INDEX idx_user_answers_session ON user_answers(quiz_session_id);
-- クイズタイプ別検索用
CREATE INDEX idx_quiz_results_user_type ON quiz_results(user_id, quiz_type);
```

### 科・目フィルタリング用インデックス
```sql
-- 科での絞り込み用
CREATE INDEX idx_birds_family ON birds(family);
-- 目での絞り込み用
CREATE INDEX idx_birds_order ON birds(order);
-- 科・目複合インデックス
CREATE INDEX idx_birds_family_order ON birds(family, order);
-- 画像の有効性チェック用
CREATE INDEX idx_bird_images_active ON bird_images(is_active) WHERE is_active = true;
-- 科・目別学習進捗分析用
CREATE INDEX idx_user_question_status_bird_image ON user_question_status(bird_image_id);
```

## 主要クエリパターン

### 復習問題の抽出
```sql
-- 赤フラグ（苦手）問題の取得
SELECT bi.*, b.japanese_name, uqs.flag_color, uqs.correct_count, uqs.total_attempts
FROM bird_images bi
JOIN birds b ON bi.bird_id = b.id
JOIN user_question_status uqs ON bi.id = uqs.bird_image_id
WHERE uqs.user_id = $1 AND uqs.flag_color = 'red'
ORDER BY uqs.last_answered_at ASC
LIMIT $2;
```

### 科・目での絞り込みクイズ問題抽出
```sql
-- 特定の科での問題抽出
SELECT bi.*, b.japanese_name, b.family, b.order
FROM bird_images bi
JOIN birds b ON bi.bird_id = b.id
WHERE b.family = ANY($1::text[])  -- 複数科指定可能
  AND bi.is_active = true
ORDER BY RANDOM()
LIMIT $2;

-- 特定の目での問題抽出
SELECT bi.*, b.japanese_name, b.family, b.order
FROM bird_images bi
JOIN birds b ON bi.bird_id = b.id
WHERE b.order = ANY($1::text[])  -- 複数目指定可能
  AND bi.is_active = true
ORDER BY RANDOM()
LIMIT $2;

-- 科と目の組み合わせフィルタ
SELECT bi.*, b.japanese_name, b.family, b.order
FROM bird_images bi
JOIN birds b ON bi.bird_id = b.id
WHERE (b.family = ANY($1::text[]) OR $1 IS NULL)
  AND (b.order = ANY($2::text[]) OR $2 IS NULL)
  AND bi.is_active = true
ORDER BY RANDOM()
LIMIT $3;
```

### 学習進捗の集計
```sql
-- ユーザーの学習状況サマリー
SELECT 
  flag_color,
  COUNT(*) as question_count,
  AVG(correct_count::float / NULLIF(total_attempts, 0)) as avg_accuracy
FROM user_question_status 
WHERE user_id = $1 
GROUP BY flag_color;

-- 科・目別の学習進捗
SELECT 
  b.family,
  b.order,
  COUNT(*) as total_questions,
  COUNT(CASE WHEN uqs.flag_color = 'green' THEN 1 END) as mastered,
  COUNT(CASE WHEN uqs.flag_color = 'red' THEN 1 END) as struggling,
  AVG(uqs.correct_count::float / NULLIF(uqs.total_attempts, 0)) as avg_accuracy
FROM user_question_status uqs
JOIN bird_images bi ON uqs.bird_image_id = bi.id
JOIN birds b ON bi.bird_id = b.id
WHERE uqs.user_id = $1
GROUP BY b.family, b.order
ORDER BY avg_accuracy DESC;
```

### 利用可能な科・目の一覧取得
```sql
-- 科の一覧（問題数付き）
SELECT 
  b.family,
  COUNT(DISTINCT bi.id) as image_count
FROM birds b
JOIN bird_images bi ON b.id = bi.bird_id
WHERE bi.is_active = true
GROUP BY b.family
ORDER BY b.family;

-- 目の一覧（問題数付き）
SELECT 
  b.order,
  COUNT(DISTINCT bi.id) as image_count
FROM birds b
JOIN bird_images bi ON b.id = bi.bird_id
WHERE bi.is_active = true
GROUP BY b.order
ORDER BY b.order;
```

## 設計方針

### 1. 復習機能重視
- 応用情報技術者試験過去問道場をモデルとした3色フラグシステム
- ユーザーが問題に対して直感的にフラグ付け可能
- フラグ別での効率的な復習が可能

### 2. 問題数の柔軟性
- 10, 20, 30, 40, 50, 60問から選択可能
- クイズタイプによる分類（通常・復習別・科目別・目別）
- 科・目での絞り込み機能（複数選択可能）
- フィルタ条件の履歴保存（filter_criteria JSONB）

### 3. パフォーマンス最適化
- 復習機能での高速な問題抽出
- 学習履歴の効率的な集計
- 適切なインデックス設計

### 4. 段階的実装
- Phase 1: 基本クイズ + 復習機能
- Phase 2: 詳細分析機能
- Phase 3: コミュニティ機能