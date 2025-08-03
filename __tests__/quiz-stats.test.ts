import { calculateScore, formatTime } from '@/utils/quiz';
import { UserAnswer, Question } from '@/types/quiz';

describe('Quiz Statistics', () => {
  const mockQuestions: Question[] = [
    {
      id: 1,
      question_text: 'この野鳥の名前は？',
      correct_answer: 'スズメ',
      options: ['スズメ', 'ツバメ', 'カラス', 'ハト'],
      difficulty: 'easy',
      category: '身近な野鳥',
    },
    {
      id: 2,
      question_text: 'この野鳥の名前は？',
      correct_answer: 'ツバメ',
      options: ['スズメ', 'ツバメ', 'カラス', 'ハト'],
      difficulty: 'medium',
      category: '身近な野鳥',
    },
    {
      id: 3,
      question_text: 'この野鳥の名前は？',
      correct_answer: 'カラス',
      options: ['スズメ', 'ツバメ', 'カラス', 'ハト'],
      difficulty: 'hard',
      category: '身近な野鳥',
    },
  ];

  describe('calculateScore', () => {
    test('全問正解の場合のスコア計算', () => {
      const answers: UserAnswer[] = [
        {
          id: 1,
          user_id: 'test-user',
          question_id: 1,
          user_answer: 'スズメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 10,
        },
        {
          id: 2,
          user_id: 'test-user',
          question_id: 2,
          user_answer: 'ツバメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 15,
        },
        {
          id: 3,
          user_id: 'test-user',
          question_id: 3,
          user_answer: 'カラス',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 20,
        },
      ];

      const score = calculateScore(answers, mockQuestions);
      expect(score).toBe(3); // 全問正解
    });

    test('一部正解の場合のスコア計算', () => {
      const answers: UserAnswer[] = [
        {
          id: 1,
          user_id: 'test-user',
          question_id: 1,
          user_answer: 'スズメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 10,
        },
        {
          id: 2,
          user_id: 'test-user',
          question_id: 2,
          user_answer: 'スズメ', // 間違い
          is_correct: false,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 15,
        },
        {
          id: 3,
          user_id: 'test-user',
          question_id: 3,
          user_answer: 'カラス',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 20,
        },
      ];

      const score = calculateScore(answers, mockQuestions);
      expect(score).toBe(2); // 2問正解
    });

    test('全問不正解の場合のスコア計算', () => {
      const answers: UserAnswer[] = [
        {
          id: 1,
          user_id: 'test-user',
          question_id: 1,
          user_answer: 'ツバメ', // 間違い
          is_correct: false,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 10,
        },
        {
          id: 2,
          user_id: 'test-user',
          question_id: 2,
          user_answer: 'スズメ', // 間違い
          is_correct: false,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 15,
        },
        {
          id: 3,
          user_id: 'test-user',
          question_id: 3,
          user_answer: 'ハト', // 間違い
          is_correct: false,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 20,
        },
      ];

      const score = calculateScore(answers, mockQuestions);
      expect(score).toBe(0); // 全問不正解
    });

    test('空の回答配列の場合', () => {
      const answers: UserAnswer[] = [];
      const score = calculateScore(answers, mockQuestions);
      expect(score).toBe(0);
    });

    test('難易度による重み付けスコア計算', () => {
      // 難易度による重み付けがある場合のテスト
      // 現在の実装では単純な正解数カウントだが、将来的に重み付けが追加される可能性
      const answers: UserAnswer[] = [
        {
          id: 1,
          user_id: 'test-user',
          question_id: 1,
          user_answer: 'スズメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 10,
        }, // easy: 1点
        {
          id: 3,
          user_id: 'test-user',
          question_id: 3,
          user_answer: 'カラス',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 20,
        }, // hard: 1点（現在の実装では同じ重み）
      ];

      const score = calculateScore(answers, mockQuestions);
      expect(score).toBe(2); // 現在の実装では単純な正解数
    });
  });

  describe('formatTime', () => {
    test('秒のフォーマット（1分未満）', () => {
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(59)).toBe('0:59');
    });

    test('分のフォーマット（1時間未満）', () => {
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(90)).toBe('1:30');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(3599)).toBe('59:59');
    });

    test('時間のフォーマット（1時間以上）', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3661)).toBe('1:01:01');
      expect(formatTime(7200)).toBe('2:00:00');
      expect(formatTime(7325)).toBe('2:02:05');
    });

    test('0秒の場合', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    test('負の値の場合', () => {
      expect(formatTime(-10)).toBe('0:00'); // 負の値は0として扱う
    });
  });

  describe('統計計算', () => {
    test('正解率の計算', () => {
      const answers: UserAnswer[] = [
        {
          id: 1,
          user_id: 'test-user',
          question_id: 1,
          user_answer: 'スズメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 2,
          user_id: 'test-user',
          question_id: 2,
          user_answer: 'スズメ',
          is_correct: false,
          answered_at: '2024-01-01T00:00:00.000Z',
        },
        {
          id: 3,
          user_id: 'test-user',
          question_id: 3,
          user_answer: 'カラス',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
        },
      ];

      const correctAnswers = answers.filter(a => a.is_correct).length;
      const totalAnswers = answers.length;
      const accuracy = (correctAnswers / totalAnswers) * 100;

      expect(correctAnswers).toBe(2);
      expect(totalAnswers).toBe(3);
      expect(Math.round(accuracy)).toBe(67); // 66.67% -> 67%
    });

    test('平均回答時間の計算', () => {
      const answers: UserAnswer[] = [
        {
          id: 1,
          user_id: 'test-user',
          question_id: 1,
          user_answer: 'スズメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 10,
        },
        {
          id: 2,
          user_id: 'test-user',
          question_id: 2,
          user_answer: 'ツバメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 20,
        },
        {
          id: 3,
          user_id: 'test-user',
          question_id: 3,
          user_answer: 'カラス',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
          time_taken: 30,
        },
      ];

      const totalTime = answers.reduce((sum, a) => sum + (a.time_taken || 0), 0);
      const averageTime = totalTime / answers.length;

      expect(totalTime).toBe(60);
      expect(averageTime).toBe(20);
    });

    test('難易度別正解率の計算', () => {
      const answers: UserAnswer[] = [
        {
          id: 1,
          user_id: 'test-user',
          question_id: 1,
          user_answer: 'スズメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
        }, // easy
        {
          id: 2,
          user_id: 'test-user',
          question_id: 2,
          user_answer: 'ツバメ',
          is_correct: true,
          answered_at: '2024-01-01T00:00:00.000Z',
        }, // medium
        {
          id: 3,
          user_id: 'test-user',
          question_id: 3,
          user_answer: 'ハト',
          is_correct: false,
          answered_at: '2024-01-01T00:00:00.000Z',
        }, // hard
      ];

      // 難易度別の統計
      const easyQuestions = mockQuestions.filter(q => q.difficulty === 'easy');
      const mediumQuestions = mockQuestions.filter(q => q.difficulty === 'medium');
      const hardQuestions = mockQuestions.filter(q => q.difficulty === 'hard');

      const easyAnswers = answers.filter(a => 
        easyQuestions.some(q => q.id === a.question_id)
      );
      const mediumAnswers = answers.filter(a => 
        mediumQuestions.some(q => q.id === a.question_id)
      );
      const hardAnswers = answers.filter(a => 
        hardQuestions.some(q => q.id === a.question_id)
      );

      expect(easyAnswers.filter(a => a.is_correct).length).toBe(1);
      expect(mediumAnswers.filter(a => a.is_correct).length).toBe(1);
      expect(hardAnswers.filter(a => a.is_correct).length).toBe(0);
    });
  });
});