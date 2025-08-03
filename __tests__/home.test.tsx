import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '@/app/page';

// Next.jsのナビゲーションをモック化
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Supabaseクライアントをモック化
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {},
        },
      },
      error: null,
    }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
  },
  from: jest.fn().mockImplementation((table) => {
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    };
    
    if (table === 'quiz_results') {
      // quiz_resultsテーブルの場合、モックデータを返す
      mockChain.eq.mockReturnThis();
      mockChain.order.mockReturnThis();
      mockChain.limit.mockResolvedValue({
        data: [
          { id: 1, score: 85, total_questions: 10, created_at: '2024-01-01T00:00:00Z', user_id: 'test-user-id' },
          { id: 2, score: 92, total_questions: 15, created_at: '2024-01-02T00:00:00Z', user_id: 'test-user-id' },
        ],
        error: null,
      });
    } else {
      mockChain.limit.mockResolvedValue({ data: [], error: null });
      mockChain.eq.mockResolvedValue({ data: [], error: null });
    }
    
    return mockChain;
  }),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

describe('ホーム画面', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ログアウト状態', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    });

    it('ホーム画面が正しくレンダリングされる', async () => {
      render(<Home />);
      expect(await screen.findByRole('heading', { name: '野鳥識別士道場' }, { timeout: 10000 })).toBeInTheDocument();
    }, 15000);

    it('ログインボタンが表示される', async () => {
      render(<Home />);
      expect(await screen.findByText('学習を始めるにはログインしてください')).toBeInTheDocument();
      
      // メインコンテンツ内のログインボタンを確認
      const loginButtons = screen.getAllByRole('link', { name: 'ログイン' });
      expect(loginButtons.length).toBeGreaterThan(0);
      
      const signupButtons = screen.getAllByRole('link', { name: '新規登録' });
      expect(signupButtons.length).toBeGreaterThan(0);
    });
  });

  describe('ログイン状態', () => {
    beforeEach(() => {
      // ユーザーがログインしている状態をモック
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      });
      
      // モック関数をリセット
      jest.clearAllMocks();
      
      // 再度ログイン状態を設定
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      });
    });

    it('学習メニューが表示される', async () => {
      render(<Home />);
      // ダッシュボードグリッドが表示されるまで待機
      const dashboardGrid = await screen.findByTestId('dashboard-grid', {}, { timeout: 3000 });
      expect(within(dashboardGrid).getByText('学習メニュー')).toBeInTheDocument();
      expect(within(dashboardGrid).getByText('問題演習')).toBeInTheDocument();
      expect(within(dashboardGrid).getByText('学習資料')).toBeInTheDocument();
      expect(within(dashboardGrid).getByText('成績確認')).toBeInTheDocument();
    });

    it('成績サマリーが表示される', async () => {
      render(<Home />);
      // ダッシュボードグリッドが表示されるまで待機
      const dashboardGrid = await screen.findByTestId('dashboard-grid', {}, { timeout: 3000 });
      expect(within(dashboardGrid).getByText('学習進捗')).toBeInTheDocument();
      expect(within(dashboardGrid).getByText('最近の成績')).toBeInTheDocument();
    });

    it('クイズ開始ボタンが表示される', async () => {
      render(<Home />);
      // ダッシュボードグリッドが表示されるまで待機
      const dashboardGrid = await screen.findByTestId('dashboard-grid', {}, { timeout: 3000 });
      const startButton = within(dashboardGrid).getByText('問題演習');
      expect(startButton).toBeInTheDocument();
    });
  });

  describe('ナビゲーション', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });
    });

    it('クイズ開始ボタンをクリックできる', async () => {
      render(<Home />);
      await screen.findByTestId('dashboard-grid', {}, { timeout: 3000 });
      const startButton = screen.getByText('クイズを始める');
      fireEvent.click(startButton);
      // ナビゲーションの動作確認は実際の実装で行う
    });

    it('学習資料リンクが機能する', async () => {
      render(<Home />);
      const dashboardGrid = await screen.findByTestId('dashboard-grid', {}, { timeout: 3000 });
      const studyLink = within(dashboardGrid).getByRole('link', { name: '学習資料' });
      expect(studyLink).toHaveAttribute('href', '/study');
    });

    it('成績確認リンクが機能する', async () => {
      render(<Home />);
      const dashboardGrid = await screen.findByTestId('dashboard-grid', {}, { timeout: 3000 });
      const resultsLink = within(dashboardGrid).getByRole('link', { name: '成績確認' });
      expect(resultsLink).toHaveAttribute('href', '/results');
    });
  });

  describe('レスポンシブデザイン', () => {
    it('モバイル表示でレイアウトが適切に調整される', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      render(<Home />);
      const mainContent = await screen.findByRole('main');
      expect(mainContent).toHaveClass('container');
    });

    it('デスクトップ表示でグリッドレイアウトが適用される', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });
      render(<Home />);
      const dashboardGrid = await screen.findByTestId('dashboard-grid');
      expect(dashboardGrid).toHaveClass('grid');
    });
  });

  describe('データ表示', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null
      });
    });

    it('基本的な要素が表示される', async () => {
      render(<Home />);
      
      // ローディングが完了するまで待機
      await screen.findByRole('heading', { name: '野鳥識別士道場' }, { timeout: 10000 });
      
      // ページタイトルが表示されることを確認
      expect(screen.getByRole('heading', { name: '野鳥識別士道場' })).toBeInTheDocument();
      
      // ユーザーがログインしていることを確認
      await screen.findByText(/ようこそ、test@example\.com/, {}, { timeout: 10000 });
      
      // ログインしているユーザーには基本的な要素が表示される
      expect(screen.getByText('野鳥識別士試験の合格を目指して学習しましょう')).toBeInTheDocument();
    }, 15000);
  });
});