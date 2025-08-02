import '@testing-library/jest-dom';

// Next.js ルーターのモック
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Supabase クライアントのモック
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn((tableName) => {
        // テーブルが作成された後の状態をシミュレート
        const tableExists = [
          'birds', 'bird_images', 'questions', 'user_answers', 
          'comments', 'question_ratings', 'comment_ratings'
        ].includes(tableName);
        
        const mockResponse = tableExists 
          ? { data: [], error: null }
          : { data: null, error: { message: `relation "public.${tableName}" does not exist` } };
        
        return {
          select: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve(mockResponse)),
            eq: jest.fn(() => Promise.resolve(mockResponse)),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => Promise.resolve({
              data: [{ id: 'test-id', japanese_name: 'テストスズメ' }],
              error: null
            })),
          })),
          update: jest.fn(() => Promise.resolve(mockResponse)),
          delete: jest.fn(() => ({
            eq: jest.fn(() => Promise.resolve(mockResponse)),
          })),
        };
      }),
  })),
}));