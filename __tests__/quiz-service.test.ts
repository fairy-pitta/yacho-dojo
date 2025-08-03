import { saveUserAnswer, saveQuizResult, getUserQuizHistory, getIncorrectQuestions } from '@/lib/quiz-service';
import { createClient } from '@/lib/supabase/client';
import { UserAnswer, QuizResult } from '@/types/quiz';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

describe('Quiz Service', () => {
  let mockSupabase: {
    from: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = {
      from: jest.fn(),
    };
    
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('saveUserAnswer', () => {
    const mockUserAnswer: Omit<UserAnswer, 'id' | 'answered_at'> = {
      user_id: 'test-user-id',
      bird_id: '1',
      bird_image_id: '1',
      selected_answer: 'スズメ',
      correct_answer: 'スズメ',
      is_correct: true,
      time_taken: 30,
    };

    test('正常に回答を保存できる', async () => {
      const expectedResult = {
        ...mockUserAnswer,
        id: 1,
        answered_at: '2024-01-01T00:00:00.000Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: expectedResult,
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveUserAnswer(mockUserAnswer);

      expect(result.data).toEqual(expectedResult);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('user_answers');
    });

    test('データベースエラーを適切に処理する', async () => {
      const mockError = { message: 'Database error' };
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveUserAnswer(mockUserAnswer);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });

    test('例外を適切に処理する', async () => {
      const mockSingle = jest.fn().mockRejectedValue(
        new Error('Network error')
      );
      
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveUserAnswer(mockUserAnswer);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Network error');
    });
  });

  describe('saveQuizResult', () => {
    const mockQuizResult: Omit<QuizResult, 'id' | 'created_at'> = {
      user_id: 'test-user-id',
      score: 8,
      total_questions: 10,
      correct_answers: 8,
      time_taken: 300,
      difficulty_level: 'mixed',
      metadata: {
        difficulty_distribution: {
          easy: 3,
          medium: 4,
          hard: 3,
        },
      },
    };

    test('正常にクイズ結果を保存できる', async () => {
      const expectedResult = {
        ...mockQuizResult,
        id: 1,
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: expectedResult,
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from.mockReturnValue({ insert: mockInsert });

      const result = await saveQuizResult(mockQuizResult);

      expect(result.data).toEqual(expectedResult);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('quiz_results');
    });

    test('データベースエラーを適切に処理する', async () => {
      const mockError = { message: 'Database error' };
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
      const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });
      mockSupabase.from = mockFrom;

      const result = await saveQuizResult(mockQuizResult);

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });
  });

  describe('getUserQuizHistory', () => {
    const mockQuizResults = [
      {
        id: 1,
        user_id: 'test-user-id',
        score: 8,
        total_questions: 10,
        correct_answers: 8,
        time_taken: 300,
        difficulty_level: 'mixed',
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 2,
        user_id: 'test-user-id',
        score: 6,
        total_questions: 10,
        correct_answers: 6,
        time_taken: 250,
        difficulty_level: 'easy',
        created_at: '2024-01-02T00:00:00.000Z',
      },
    ];

    test('正常にクイズ履歴を取得できる', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: mockQuizResults,
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = mockFrom;

      const result = await getUserQuizHistory('test-user-id', 10);

      expect(result.data).toEqual(mockQuizResults);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('quiz_results');
    });

    test('空の履歴を適切に処理する', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = mockFrom;

      const result = await getUserQuizHistory('test-user-id');

      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    test('データベースエラーを適切に処理する', async () => {
      const mockError = { message: 'Database error' };
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = mockFrom;

      const result = await getUserQuizHistory('test-user-id');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });
  });

  describe('getIncorrectQuestions', () => {
    const mockIncorrectQuestions = [
      {
        question_id: 1,
        questions: {
          id: 1,
          question_text: 'この野鳥の名前は？',
          image_url: 'https://example.com/bird1.jpg',
          correct_answer: 'スズメ',
          options: ['スズメ', 'ツバメ', 'カラス', 'ハト'],
          difficulty: 'easy',
          category: '身近な野鳥',
          bird_id: 1,
          created_at: '2024-01-01T00:00:00.000Z',
          updated_at: '2024-01-01T00:00:00.000Z',
        },
      },
    ];

    test('正常に間違えた問題を取得できる', async () => {
      const mockLimit = jest.fn().mockResolvedValue({
        data: mockIncorrectQuestions,
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = mockFrom;

      const result = await getIncorrectQuestions('test-user-id', 10);

      expect(result.data).toHaveLength(1);
      expect(result.data?.[0]).toEqual(mockIncorrectQuestions[0].questions);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith('user_answers');
    });

    test('重複する問題を適切に除去する', async () => {
      const duplicateQuestions = [
        ...mockIncorrectQuestions,
        ...mockIncorrectQuestions, // 同じ問題を重複
      ];

      const mockLimit = jest.fn().mockResolvedValue({
        data: duplicateQuestions,
        error: null,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = mockFrom;

      const result = await getIncorrectQuestions('test-user-id', 10);

      expect(result.data).toHaveLength(1); // 重複が除去されて1つだけ
      expect(result.error).toBeNull();
    });

    test('データベースエラーを適切に処理する', async () => {
      const mockError = { message: 'Database error' };
      const mockLimit = jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
      const mockEq2 = jest.fn().mockReturnValue({ order: mockOrder });
      const mockEq1 = jest.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq1 });
      const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
      mockSupabase.from = mockFrom;

      const result = await getIncorrectQuestions('test-user-id');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });
  });

  describe('統合テスト', () => {
    test('回答保存からクイズ結果保存まで一連の流れが正常に動作する', async () => {
      // 回答保存のモック
      const mockUserAnswer: Omit<UserAnswer, 'id' | 'answered_at'> = {
        user_id: 'test-user-id',
        question_id: 1,
        user_answer: 'スズメ',
        is_correct: true,
        time_taken: 30,
      };

      const savedAnswer = {
        ...mockUserAnswer,
        id: 1,
        answered_at: '2024-01-01T00:00:00.000Z',
      };

      const mockSingle1 = jest.fn().mockResolvedValueOnce({
        data: savedAnswer,
        error: null,
      });
      const mockSelect1 = jest.fn().mockReturnValue({ single: mockSingle1 });
      const mockInsert1 = jest.fn().mockReturnValue({ select: mockSelect1 });
      const mockFrom1 = jest.fn().mockReturnValue({ insert: mockInsert1 });
      mockSupabase.from = mockFrom1;

      // クイズ結果保存のモック
      const mockQuizResult: Omit<QuizResult, 'id' | 'created_at'> = {
        user_id: 'test-user-id',
        score: 1,
        total_questions: 1,
        correct_answers: 1,
        time_taken: 30,
        difficulty_level: 'easy',
      };

      const savedResult = {
        ...mockQuizResult,
        id: 1,
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const mockSingle2 = jest.fn().mockResolvedValueOnce({
        data: savedResult,
        error: null,
      });
      const mockSelect2 = jest.fn().mockReturnValue({ single: mockSingle2 });
      const mockInsert2 = jest.fn().mockReturnValue({ select: mockSelect2 });
      
      // 2回目の呼び出し用にモックを再設定
      mockSupabase.from = jest.fn()
        .mockReturnValueOnce({ insert: mockInsert1 })
        .mockReturnValueOnce({ insert: mockInsert2 });

      // 実行
      const answerResult = await saveUserAnswer(mockUserAnswer);
      const quizResult = await saveQuizResult(mockQuizResult);

      // 検証
      expect(answerResult.data).toEqual(savedAnswer);
      expect(answerResult.error).toBeNull();
      expect(quizResult.data).toEqual(savedResult);
      expect(quizResult.error).toBeNull();
    });
  });
});