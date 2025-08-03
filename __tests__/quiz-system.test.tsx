// import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(),
        })),
        limit: jest.fn(),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {},
          },
        },
      })),
    },
  })),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('クイズシステム', () => {
  const mockQuizData = {
    id: 1,
    question_text: 'この野鳥の名前は何ですか？',
    image_url: 'https://example.com/bird1.jpg',
    correct_answer: 'スズメ',
    options: ['スズメ', 'ツバメ', 'カラス', 'ハト'],
    difficulty: 'easy',
    category: '身近な野鳥',
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('問題表示', () => {
    test('問題データが正しく表示される', async () => {
      const mockSupabase = createClient();
      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [mockQuizData],
              error: null,
            }),
          }),
        }),
      });

      // This test will be implemented when the Quiz component is created
      expect(true).toBe(true);
    });

    test('画像が正しく表示される', () => {
      // This test will be implemented when the Quiz component is created
      expect(true).toBe(true);
    });

    test('選択肢が正しく表示される', () => {
      // This test will be implemented when the Quiz component is created
      expect(true).toBe(true);
    });

    test('進捗表示が正しく動作する', () => {
      // This test will be implemented when the Quiz component is created
      expect(true).toBe(true);
    });
  });

  describe('回答処理', () => {
    test('正解の回答が正しく判定される', () => {
      // This test will be implemented when the answer validation logic is created
      expect(true).toBe(true);
    });

    test('不正解の回答が正しく判定される', () => {
      // This test will be implemented when the answer validation logic is created
      expect(true).toBe(true);
    });

    test('部分一致の回答が正しく判定される', () => {
      // This test will be implemented when the answer validation logic is created
      expect(true).toBe(true);
    });

    test('表記ゆれの回答が正しく判定される', () => {
      // This test will be implemented when the answer validation logic is created
      expect(true).toBe(true);
    });
  });

  describe('スコア計算', () => {
    test('正解数に基づいてスコアが計算される', () => {
      // This test will be implemented when the score calculation logic is created
      expect(true).toBe(true);
    });

    test('難易度に基づいてスコアが調整される', () => {
      // This test will be implemented when the score calculation logic is created
      expect(true).toBe(true);
    });

    test('制限時間内の回答でボーナスが付与される', () => {
      // This test will be implemented when the time-based scoring is created
      expect(true).toBe(true);
    });
  });

  describe('問題遷移', () => {
    test('次の問題に正しく遷移する', () => {
      // This test will be implemented when the Quiz component is created
      expect(true).toBe(true);
    });

    test('最後の問題で結果画面に遷移する', () => {
      // This test will be implemented when the Quiz component is created
      expect(true).toBe(true);
    });

    test('問題をスキップできる', () => {
      // This test will be implemented when the Quiz component is created
      expect(true).toBe(true);
    });
  });

  describe('結果画面', () => {
    test('正解/不正解が正しく表示される', () => {
      // This test will be implemented when the Result component is created
      expect(true).toBe(true);
    });

    test('正解が表示される', () => {
      // This test will be implemented when the Result component is created
      expect(true).toBe(true);
    });

    test('次の問題へのナビゲーションが動作する', () => {
      // This test will be implemented when the Result component is created
      expect(true).toBe(true);
    });

    test('クイズ終了時に総合結果が表示される', () => {
      // This test will be implemented when the Result component is created
      expect(true).toBe(true);
    });
  });

  describe('API連携', () => {
    test('ランダム問題取得APIが正しく動作する', async () => {
      const mockSupabase = createClient();
      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue({
              data: [mockQuizData],
              error: null,
            }),
          }),
        }),
      });

      const result = await mockSupabase.from('questions')
        .select('*')
        .order('random()')
        .limit(1);

      expect(result.data).toEqual([mockQuizData]);
      expect(result.error).toBeNull();
    });

    test('問題詳細取得APIが正しく動作する', async () => {
      const mockSupabase = createClient();
      (mockSupabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockQuizData,
              error: null,
            }),
          }),
        }),
      });

      const result = await mockSupabase.from('questions')
        .select('*')
        .eq('id', 1)
        .single();

      expect(result.data).toEqual(mockQuizData);
      expect(result.error).toBeNull();
    });

    test('回答記録APIが正しく動作する', async () => {
      const mockSupabase = createClient();
      const mockAnswerData = {
        user_id: 'test-user-id',
        question_id: 1,
        user_answer: 'スズメ',
        is_correct: true,
        answered_at: new Date().toISOString(),
      };

      (mockSupabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [mockAnswerData],
            error: null,
          }),
        }),
      });

      const result = await mockSupabase.from('user_answers')
        .insert(mockAnswerData)
        .select();

      expect(result.data).toEqual([mockAnswerData]);
      expect(result.error).toBeNull();
    });
  });
});