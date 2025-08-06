# Database Service Functions

各テーブルからデータを取得するための関数群です。

## 概要

`database-service.ts` には以下のテーブル用の関数が含まれています：

- **Birds** - 野鳥マスタデータ
- **Bird Images** - 野鳥画像データ
- **User Answers** - ユーザー回答履歴
- **Quiz Results** - クイズ結果

## 使用方法

### Birds テーブル関連

```typescript
import { 
  getAllBirds, 
  getBirdById, 
  getBirdsByFamily, 
  getBirdsByOrder, 
  searchBirdsByName 
} from '@/lib/database-service';

// 全ての野鳥データを取得
const birds = await getAllBirds();

// IDで野鳥データを取得
const bird = await getBirdById('bird-uuid');

// 科名で検索
const sparrows = await getBirdsByFamily('スズメ科');

// 目名で検索
const passerines = await getBirdsByOrder('スズメ目');

// 名前で検索（部分一致）
const searchResults = await searchBirdsByName('スズメ');
```

### Bird Images テーブル関連

```typescript
import { 
  getAllBirdImages, 
  getBirdImagesByBirdId, 
  getBirdImageById, 
  getRandomBirdImages 
} from '@/lib/database-service';

// 全ての野鳥画像を取得
const images = await getAllBirdImages();

// 特定の野鳥の画像を取得
const birdImages = await getBirdImagesByBirdId('bird-uuid');

// IDで画像データを取得
const image = await getBirdImageById('image-uuid');

// ランダムな画像を取得（クイズ用）
const randomImages = await getRandomBirdImages(10);
```

### User Answers テーブル関連

```typescript
import { 
  getUserAnswers, 
  getUserAnswersWithBirds, 
  getUserAnswersForBird, 
  getUserAccuracyStats 
} from '@/lib/database-service';

// ユーザーの全回答履歴を取得
const answers = await getUserAnswers('user-uuid');

// 野鳥情報と結合して取得
const answersWithBirds = await getUserAnswersWithBirds('user-uuid');

// 特定の野鳥に対する回答履歴
const birdAnswers = await getUserAnswersForBird('user-uuid', 'bird-uuid');

// ユーザーの正答率統計
const stats = await getUserAccuracyStats('user-uuid');
// 結果: { total: 100, correct: 85, incorrect: 15, accuracy: 85.0 }
```

### Quiz Results テーブル関連

```typescript
import { 
  getUserQuizResults, 
  getUserQuizResultsByDifficulty, 
  getUserBestScore, 
  getUserQuizStats 
} from '@/lib/database-service';

// ユーザーの全クイズ結果を取得
const results = await getUserQuizResults('user-uuid');

// 特定の難易度の結果を取得
const easyResults = await getUserQuizResultsByDifficulty('user-uuid', 'easy');

// 最高スコアを取得
const bestScore = await getUserBestScore('user-uuid');
const bestEasyScore = await getUserBestScore('user-uuid', 'easy');

// 詳細な統計情報を取得
const quizStats = await getUserQuizStats('user-uuid');
/*
結果例:
{
  totalQuizzes: 25,
  totalQuestions: 250,
  totalCorrect: 200,
  totalTime: 3600,
  averageScore: 80.0,
  averageAccuracy: 80.0,
  averageTime: 144,
  difficultyStats: {
    easy: { count: 10, averageScore: 90.0, averageAccuracy: 90.0, averageTime: 120 },
    medium: { count: 10, averageScore: 75.0, averageAccuracy: 75.0, averageTime: 150 },
    hard: { count: 5, averageScore: 65.0, averageAccuracy: 65.0, averageTime: 180 }
  }
}
*/
```

### 汎用関数

```typescript
import { checkDatabaseConnection, getTableCounts } from '@/lib/database-service';

// データベース接続確認
const isConnected = await checkDatabaseConnection();

// 各テーブルの行数を取得
const counts = await getTableCounts();
// 結果: { birds: 500, bird_images: 1200, user_answers: 5000, quiz_results: 250 }
```

## エラーハンドリング

全ての関数は適切なエラーハンドリングを行います：

```typescript
try {
  const birds = await getAllBirds();
  // 成功時の処理
} catch (error) {
  console.error('野鳥データの取得に失敗しました:', error);
  // エラー時の処理
}
```

## 注意事項

1. **認証が必要な関数**: `user_answers` と `quiz_results` 関連の関数は、適切なユーザー認証が必要です。

2. **RLS (Row Level Security)**: Supabaseの行レベルセキュリティにより、ユーザーは自分のデータのみアクセス可能です。

3. **パフォーマンス**: 大量のデータを扱う場合は、ページネーションの実装を検討してください。

4. **型安全性**: TypeScriptの型定義により、コンパイル時に型チェックが行われます。

## 今後の拡張

- ページネーション機能の追加
- キャッシュ機能の実装
- リアルタイム更新の対応
- より詳細な統計分析機能