import { AnswerValidationResult, Question, UserAnswer } from '@/types/quiz';

/**
 * 回答の正解判定を行う
 * 完全一致、部分一致、表記ゆれに対応
 */
export function validateAnswer(
  userAnswer: string,
  correctAnswer: string
): AnswerValidationResult {
  const normalizedUserAnswer = normalizeText(userAnswer);
  const normalizedCorrectAnswer = normalizeText(correctAnswer);

  // 完全一致チェック
  if (normalizedUserAnswer === normalizedCorrectAnswer) {
    return {
      isCorrect: true,
      normalizedAnswer: normalizedUserAnswer,
      matchType: 'exact',
      confidence: 1.0,
    };
  }

  // 部分一致チェック（正解が回答に含まれる場合）
  if (normalizedCorrectAnswer.includes(normalizedUserAnswer) ||
      normalizedUserAnswer.includes(normalizedCorrectAnswer)) {
    const confidence = Math.min(
      normalizedUserAnswer.length / normalizedCorrectAnswer.length,
      normalizedCorrectAnswer.length / normalizedUserAnswer.length
    );
    
    if (confidence >= 0.7) {
      return {
        isCorrect: true,
        normalizedAnswer: normalizedUserAnswer,
        matchType: 'partial',
        confidence,
      };
    }
  }

  // ファジーマッチング（レーベンシュタイン距離）
  const distance = levenshteinDistance(normalizedUserAnswer, normalizedCorrectAnswer);
  const maxLength = Math.max(normalizedUserAnswer.length, normalizedCorrectAnswer.length);
  const similarity = 1 - (distance / maxLength);

  if (similarity >= 0.8) {
    return {
      isCorrect: true,
      normalizedAnswer: normalizedUserAnswer,
      matchType: 'fuzzy',
      confidence: similarity,
    };
  }

  return {
    isCorrect: false,
    normalizedAnswer: normalizedUserAnswer,
    matchType: 'exact',
    confidence: 0,
  };
}

/**
 * テキストの正規化（ひらがな・カタカナ統一、記号除去など）
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s\-_・]/g, '') // スペース、ハイフン、アンダースコア、中点を除去
    .replace(/[ァ-ヶ]/g, (match) => {
      // カタカナをひらがなに変換
      return String.fromCharCode(match.charCodeAt(0) - 0x60);
    })
    .trim();
}

/**
 * レーベンシュタイン距離の計算
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len2][len1];
}

/**
 * スコア計算
 */
export function calculateScore(
  answers: UserAnswer[],
  questions: Question[]
): number {
  let baseScore = 0;
  const totalQuestions = questions.length;

  answers.forEach((answer) => {
    if (answer.is_correct) {
      const question = questions.find(q => q.id === answer.question_id);
      if (question) {
        // 難易度による基本点数
        let questionScore = 10; // base score
        switch (question.difficulty) {
          case 'easy':
            questionScore = 10;
            break;
          case 'medium':
            questionScore = 15;
            break;
          case 'hard':
            questionScore = 20;
            break;
        }

        // 時間ボーナス（制限時間内の回答）
        if (answer.time_taken && answer.time_taken <= 30) {
          const timeBonus = Math.max(0, (30 - answer.time_taken) / 30 * 5);
          questionScore += timeBonus;
        }

        baseScore += questionScore;
      }
    }
  });

  // 正解率ボーナス
  const correctCount = answers.filter(a => a.is_correct).length;
  const accuracy = correctCount / totalQuestions;
  if (accuracy >= 0.9) {
    baseScore *= 1.2; // 90%以上で20%ボーナス
  } else if (accuracy >= 0.8) {
    baseScore *= 1.1; // 80%以上で10%ボーナス
  }

  return Math.round(baseScore);
}

/**
 * 問題をシャッフルする
 */
export function shuffleQuestions(questions: Question[]): Question[] {
  const shuffled = [...questions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 選択肢をシャッフルする
 */
export function shuffleOptions(options: string[]): string[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 時間を分:秒形式でフォーマット
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * 難易度に基づいて問題をフィルタリング
 */
export function filterQuestionsByDifficulty(
  questions: Question[],
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed'
): Question[] {
  if (difficulty === 'mixed') {
    return questions;
  }
  return questions.filter(q => q.difficulty === difficulty);
}

/**
 * カテゴリに基づいて問題をフィルタリング
 */
export function filterQuestionsByCategory(
  questions: Question[],
  category?: string
): Question[] {
  if (!category) {
    return questions;
  }
  return questions.filter(q => q.category === category);
}