import { getUserAnswerHistory, calculateUserStats } from '@/lib/answer-service';
import { saveUserAnswer } from '@/lib/quiz-service';

// Supabaseクライアントのモック
const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });
const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
const mockInsert = jest.fn().mockReturnValue({ select: mockSelect });
const mockFrom = jest.fn();

const mockSupabaseClient = {
  from: mockFrom.mockImplementation((table) => {
    if (table === 'user_answers') {
      return {
        insert: mockInsert,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            {
              id: 1,
              user_id: 'test-user',
              question_id: 1,
              user_answer: 'スズメ',
              is_correct: true,
              answered_at: '2024-01-01T10:00:00Z'
            },
            {
              id: 2,
              user_id: 'test-user',
              question_id: 2,
              user_answer: 'カラス',
              is_correct: false,
              answered_at: '2024-01-01T10:05:00Z'
            }
          ],
          error: null
        })
      };
    }
    return {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null })
    };
  }),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user' } },
      error: null
    })
  }
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

describe('回答履歴機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('回答記録API', () => {
    it('ユーザーの回答を正しく保存できる', async () => {
      const answerData = {
        user_id: 'test-user',
        question_id: 1,
        user_answer: 'スズメ',
        is_correct: true
      };

      const result = await saveUserAnswer(answerData);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_answers');
      expect(result.error).toBeNull();
    });

    it('回答保存時にエラーが発生した場合、適切にハンドリングされる', async () => {
      const mockSingleError = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });
      const mockSelectError = jest.fn().mockReturnValue({ single: mockSingleError });
      const mockInsertError = jest.fn().mockReturnValue({ select: mockSelectError });
      
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        insert: mockInsertError
      }));

      const answerData = {
        user_id: 'test-user',
        question_id: 1,
        user_answer: 'スズメ',
        is_correct: true
      };

      const result = await saveUserAnswer(answerData);

      expect(result.error).toBeTruthy();
      expect(result.error).toBe('Database error');
    });
  });

  describe('履歴データ取得', () => {
    it('ユーザーの回答履歴を正しく取得できる', async () => {
      const userId = 'test-user';
      const history = await getUserAnswerHistory(userId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('user_answers');
      expect(history.data).toHaveLength(2);
      expect(history.data[0].user_answer).toBe('スズメ');
      expect(history.data[0].is_correct).toBe(true);
    });

    it('存在しないユーザーの履歴取得時は空配列を返す', async () => {
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      }));

      const userId = 'non-existent-user';
      const history = await getUserAnswerHistory(userId);

      expect(history.data).toHaveLength(0);
    });
  });

  describe('成績計算', () => {
    it('ユーザーの統計を正しく計算できる', async () => {
      const userId = 'test-user';
      const stats = await calculateUserStats(userId);

      expect(stats.totalAnswers).toBe(2);
      expect(stats.correctAnswers).toBe(1);
      expect(stats.accuracy).toBe(50);
    });

    it('回答履歴がない場合は0の統計を返す', async () => {
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      }));

      const userId = 'new-user';
      const stats = await calculateUserStats(userId);

      expect(stats.totalAnswers).toBe(0);
      expect(stats.correctAnswers).toBe(0);
      expect(stats.accuracy).toBe(0);
    });

    it('正答率を正しく計算する', async () => {
      // 3問中2問正解のケース
      mockSupabaseClient.from.mockImplementationOnce(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [
            { is_correct: true },
            { is_correct: true },
            { is_correct: false }
          ],
          error: null
        })
      }));

      const userId = 'test-user';
      const stats = await calculateUserStats(userId);

      expect(stats.totalAnswers).toBe(3);
      expect(stats.correctAnswers).toBe(2);
      expect(stats.accuracy).toBe(67); // 2/3 * 100 = 66.67 -> 67 (四捨五入)
    });
  });
});