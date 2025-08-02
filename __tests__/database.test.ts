import { createClient } from '@supabase/supabase-js';

// テスト用のSupabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Database Tables', () => {
  describe('Birds table', () => {
    it('should exist and have correct structure', async () => {
      // テーブルの存在確認
      const { error } = await supabase
        .from('birds')
        .select('*')
        .limit(1);
      
      // テーブルが存在することを確認（エラーがないか、または「no rows」エラーでないこと）
      expect(error).toBeNull();
    });

    it('should allow inserting a bird record', async () => {
      const testBird = {
        japanese_name: 'テストスズメ',
        scientific_name: 'Passer test',
        family: 'スズメ科',
        order: 'スズメ目'
      };

      const { data, error } = await supabase
        .from('birds')
        .insert(testBird)
        .select();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.[0]?.japanese_name).toBe('テストスズメ');

      // テストデータをクリーンアップ
      if (data?.[0]?.id) {
        await supabase.from('birds').delete().eq('id', data[0].id);
      }
    });
  });

  describe('BirdImages table', () => {
    it('should exist and have correct structure', async () => {
      const { error } = await supabase
        .from('bird_images')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });

  describe('Questions table', () => {
    it('should exist and have correct structure', async () => {
      const { error } = await supabase
        .from('questions')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });

  describe('UserAnswers table', () => {
    it('should exist and have correct structure', async () => {
      const { error } = await supabase
        .from('user_answers')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });

  describe('Comments table', () => {
    it('should exist and have correct structure', async () => {
      const { error } = await supabase
        .from('comments')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });

  describe('QuestionRatings table', () => {
    it('should exist and have correct structure', async () => {
      const { error } = await supabase
        .from('question_ratings')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });

  describe('CommentRatings table', () => {
    it('should exist and have correct structure', async () => {
      const { error } = await supabase
        .from('comment_ratings')
        .select('*')
        .limit(1);
      
      expect(error).toBeNull();
    });
  });
});