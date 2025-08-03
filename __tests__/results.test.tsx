import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsPage from '@/app/results/page';

// Supabaseクライアントのモック
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn()
  },
  from: jest.fn()
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient
}));

// answer-serviceのモック
jest.mock('@/lib/answer-service', () => ({
  calculateUserStats: jest.fn(),
  getUserAnswerHistory: jest.fn()
}));

// quiz-serviceのモック
jest.mock('@/lib/quiz-service', () => ({
  getUserQuizHistory: jest.fn()
}));

import { calculateUserStats, getUserAnswerHistory } from '@/lib/answer-service';
import { getUserQuizHistory } from '@/lib/quiz-service';

const mockCalculateUserStats = calculateUserStats as jest.MockedFunction<typeof calculateUserStats>;
const mockGetUserAnswerHistory = getUserAnswerHistory as jest.MockedFunction<typeof getUserAnswerHistory>;
const mockGetUserQuizHistory = getUserQuizHistory as jest.MockedFunction<typeof getUserQuizHistory>;

describe('成績表示ページ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('認証状態の処理', () => {
    it('ログインしていない場合、ログインを促すメッセージを表示する', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      render(<ResultsPage />);

      await waitFor(() => {
        expect(screen.getByText('ログインが必要です')).toBeInTheDocument();
        expect(screen.getByText('成績を確認するにはログインしてください。')).toBeInTheDocument();
        expect(screen.getByText('ログインページへ')).toBeInTheDocument();
      });
    });

    it('ログイン中の場合、ローディング表示を行う', () => {
      mockSupabaseClient.auth.getUser.mockImplementation(() => new Promise(() => {}));

      render(<ResultsPage />);

      expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
    });
  });

  describe('成績データの表示', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      mockCalculateUserStats.mockResolvedValue({
        totalAnswers: 50,
        correctAnswers: 35,
        accuracy: 70
      });

      mockGetUserAnswerHistory.mockResolvedValue({
        data: [
          {
            id: 1,
            user_id: 'test-user',
            question_id: 1,
            user_answer: 'スズメ',
            is_correct: true,
            answered_at: '2024-01-01T10:00:00Z'
          }
        ],
        error: null
      });

      mockGetUserQuizHistory.mockResolvedValue({
        data: [
          {
            id: 1,
            user_id: 'test-user',
            score: 8,
            total_questions: 10,
            correct_answers: 8,
            time_taken: 300,
            difficulty_level: 'mixed',
            created_at: '2024-01-01T10:00:00Z'
          }
        ],
        error: null
      });
    });

    it('ページタイトルを表示する', async () => {
      render(<ResultsPage />);

      await waitFor(() => {
        expect(screen.getByText('学習成績')).toBeInTheDocument();
      });
    });

    it('統計カードのラベルを表示する', async () => {
      render(<ResultsPage />);

      await waitFor(() => {
        expect(screen.getByText('学習成績')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('データが空の場合の表示', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      mockCalculateUserStats.mockResolvedValue({
        totalAnswers: 0,
        correctAnswers: 0,
        accuracy: 0
      });

      mockGetUserAnswerHistory.mockResolvedValue({
        data: [],
        error: null
      });

      mockGetUserQuizHistory.mockResolvedValue({
        data: [],
        error: null
      });
    });

    it('データがない場合、適切なメッセージを表示する', async () => {
      render(<ResultsPage />);

      await waitFor(() => {
        expect(screen.getByText('まだクイズを完了していません')).toBeInTheDocument();
        expect(screen.getByText('まだ回答履歴がありません')).toBeInTheDocument();
      });
    });

    it('統計が0の場合、0を表示する', async () => {
      render(<ResultsPage />);

      await waitFor(() => {
        expect(screen.getAllByText('0')).toHaveLength(3); // 総回答数、正解数、クイズ回数
        expect(screen.getByText('0%')).toBeInTheDocument(); // 正答率
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('データ取得エラー時も適切に表示する', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });

      mockCalculateUserStats.mockRejectedValue(new Error('Database error'));
      mockGetUserAnswerHistory.mockRejectedValue(new Error('Database error'));
      mockGetUserQuizHistory.mockRejectedValue(new Error('Database error'));

      // コンソールエラーをモック
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<ResultsPage />);

      await waitFor(() => {
        expect(screen.getByText('学習成績')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('データの読み込みに失敗しました:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });
});