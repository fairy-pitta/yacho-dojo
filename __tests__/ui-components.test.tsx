import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Sidebar } from '@/components/layout/sidebar';
import { Modal } from '@/components/ui/modal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Toast } from '@/components/ui/toast';

// タイマーをモック化
jest.useFakeTimers();

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
jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  }),
}));

describe('レイアウトコンポーネント', () => {
  describe('Header', () => {
    it('ヘッダーが正しくレンダリングされる', () => {
      render(<Header />);
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });

    it('サイトタイトルが表示される', () => {
      render(<Header />);
      expect(screen.getByText('野鳥識別士道場')).toBeInTheDocument();
    });
  });

  describe('Footer', () => {
    it('フッターが正しくレンダリングされる', () => {
      render(<Footer />);
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('コピーライトが表示される', () => {
      render(<Footer />);
      expect(screen.getByText(/© 2024 野鳥識別士道場/)).toBeInTheDocument();
    });
  });

  describe('Sidebar', () => {
    it('サイドバーが正しくレンダリングされる', () => {
      render(<Sidebar />);
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    });

    it('ナビゲーションメニューが表示される', () => {
      render(<Sidebar />);
      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('クイズ')).toBeInTheDocument();
      expect(screen.getByText('成績')).toBeInTheDocument();
    });
  });
});

describe('共通UIコンポーネント', () => {
  describe('Modal', () => {
    it('モーダルが開いている時に表示される', () => {
      render(
        <Modal isOpen={true} onClose={() => {}} title="テストモーダル">
          <p>モーダルコンテンツ</p>
        </Modal>
      );
      expect(screen.getByText('テストモーダル')).toBeInTheDocument();
      expect(screen.getByText('モーダルコンテンツ')).toBeInTheDocument();
    });

    it('モーダルが閉じている時に表示されない', () => {
      render(
        <Modal isOpen={false} onClose={() => {}} title="テストモーダル">
          <p>モーダルコンテンツ</p>
        </Modal>
      );
      expect(screen.queryByText('テストモーダル')).not.toBeInTheDocument();
    });

    it('閉じるボタンでモーダルが閉じる', () => {
      const onClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="テストモーダル">
          <p>モーダルコンテンツ</p>
        </Modal>
      );
      
      const closeButton = screen.getByTestId('modal-close');
      fireEvent.click(closeButton);
      expect(onClose).toHaveBeenCalled();
    });

    it('オーバーレイクリックでモーダルが閉じる', () => {
      const onClose = jest.fn();
      render(
        <Modal isOpen={true} onClose={onClose} title="テストモーダル">
          <p>モーダルコンテンツ</p>
        </Modal>
      );
      
      const overlay = screen.getByTestId('modal-overlay');
      fireEvent.click(overlay);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('LoadingSpinner', () => {
    it('ローディングスピナーが表示される', () => {
      render(<LoadingSpinner />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('テキストが表示される', () => {
      render(<LoadingSpinner text="読み込み中..." />);
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('Toast', () => {
    it('トーストが表示される', () => {
      render(<Toast id="test" message="テストメッセージ" type="info" onClose={() => {}} />);
      expect(screen.getByTestId('toast')).toBeInTheDocument();
      expect(screen.getByText('テストメッセージ')).toBeInTheDocument();
    });

    it('成功タイプのスタイルが適用される', () => {
      render(<Toast id="test" message="成功" type="success" onClose={() => {}} />);
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('bg-green-50');
    });

    it('エラータイプのスタイルが適用される', () => {
      render(<Toast id="test" message="エラー" type="error" onClose={() => {}} />);
      const toast = screen.getByTestId('toast');
      expect(toast).toHaveClass('bg-red-50');
    });

    it('閉じるボタンでトーストが閉じる', () => {
      const onClose = jest.fn();
      render(<Toast id="test" message="テスト" type="info" onClose={onClose} />);
      
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);
      
      // タイマーをスキップしてアニメーション完了を待つ
      act(() => {
        jest.advanceTimersByTime(300);
      });
      
      expect(onClose).toHaveBeenCalledWith('test');
    });
  });
});

describe('レスポンシブデザイン', () => {
  test('デスクトップ表示でサイドバーが表示される', () => {
    render(<Sidebar />);
    const sidebar = screen.getByTestId('sidebar');
    expect(sidebar).toHaveClass('md:block');
  });
});