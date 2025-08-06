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
- quiz_type: TEXT CHECK (quiz_type IN ('normal', 'review_red', 'review_yellow', 'review_green', 'review_all'))（クイズタイプ）
- filter_criteria: JSONB（絞り込み条件：科・目等）
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
```

## 設計方針

### 1. 復習機能重視
- 応用情報技術者試験過去問道場をモデルとした3色フラグシステム
- ユーザーが問題に対して直感的にフラグ付け可能
- フラグ別での効率的な復習が可能

### 2. 問題数の柔軟性
- 10, 20, 30, 40, 50, 60問から選択可能
- クイズタイプによる分類（通常・復習別）

### 3. パフォーマンス最適化
- 復習機能での高速な問題抽出
- 学習履歴の効率的な集計
- 適切なインデックス設計

### 4. 段階的実装
- Phase 1: 基本クイズ + 復習機能
- Phase 2: 詳細分析機能
- Phase 3: コミュニティ機能