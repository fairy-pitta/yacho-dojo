## データ構造（概要）

### Birds（野鳥マスタ）
- id: UUID
- japanese_name: 和名
- scientific_name: 学名
- family: 科
- order: 目
- created_at: 作成日時
- updated_at: 更新日時

### BirdImages（野鳥画像）
- id: UUID
- bird_id: 野鳥ID（外部キー）
- image_url: 画像URL
- source: 画像ソース（iNaturalist, Wikipedia等）
- license: ライセンス情報
- photographer: 撮影者
- is_active: 有効フラグ
- created_at: 作成日時

### Questions（問題）
- id: UUID
- bird_id: 野鳥ID（外部キー）
- bird_image_id: 野鳥画像ID（外部キー）
- correct_answer: 正解（和名）
- alternative_answers: 別名・表記ゆれ配列
- likes_count: いいね数
- dislikes_count: だめだね数
- difficulty: 問題難易度
- is_active: 有効フラグ
- created_at: 作成日時
- updated_at: 更新日時

### UserAnswers（回答履歴）
- id: UUID
- user_id: ユーザーID
- question_id: 問題ID
- selected_answer: 選択した回答
- is_correct: 正解フラグ
- answered_at: 回答日時

### Comments（コメント）
- id: UUID
- user_id: ユーザーID
- question_id: 問題ID
- content: コメント内容
- likes_count: いいね数
- dislikes_count: だめだね数
- created_at: 投稿日時

### QuestionRatings（問題評価）
- id: UUID
- user_id: ユーザーID
- question_id: 問題ID
- rating: 評価（like/dislike）
- created_at: 評価日時

### CommentRatings（コメント評価）
- id: UUID
- user_id: ユーザーID
- comment_id: コメントID
- rating: 評価（like/dislike）
- created_at: 評価日時