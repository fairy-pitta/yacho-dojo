import { createClient } from '@/lib/supabase/client';
import { Question, UserAnswer, QuizResult, QuizSettings } from '@/types/quiz';
import { shuffleQuestions } from '@/utils/quiz';

/**
 * ランダムな問題を取得する
 */
export async function getRandomQuestions(
  count: number = 10,
  settings?: QuizSettings
): Promise<{ data: Question[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    let query = supabase
      .from('questions')
      .select(`
        id,
        question_text,
        image_url,
        correct_answer,
        options,
        difficulty,
        category,
        bird_id,
        created_at,
        updated_at
      `);

    // 難易度フィルタ
    if (settings?.difficulty && settings.difficulty !== 'mixed') {
      query = query.eq('difficulty', settings.difficulty);
    }

    // カテゴリフィルタ
    if (settings?.category) {
      query = query.eq('category', settings.category);
    }

    // 画像の有無フィルタ
    if (settings?.includeImages === false) {
      query = query.is('image_url', null);
    } else if (settings?.includeImages === true) {
      query = query.not('image_url', 'is', null);
    }

    const { data, error } = await query.limit(count * 2); // 余分に取得してシャッフル

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: null, error: '問題が見つかりませんでした' };
    }

    // シャッフルして指定数に制限
    const shuffledQuestions = shuffleQuestions(data).slice(0, count);

    return { data: shuffledQuestions, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '問題の取得に失敗しました' 
    };
  }
}

/**
 * 特定の問題を取得する
 */
export async function getQuestionById(
  id: number
): Promise<{ data: Question | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        image_url,
        correct_answer,
        options,
        difficulty,
        category,
        bird_id,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '問題の取得に失敗しました' 
    };
  }
}

/**
 * ユーザーの回答を記録する
 */
export async function saveUserAnswer(
  answer: Omit<UserAnswer, 'id' | 'answered_at'>
): Promise<{ data: UserAnswer | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const answerData = {
      ...answer,
      answered_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_answers')
      .insert(answerData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '回答の保存に失敗しました' 
    };
  }
}

/**
 * クイズ結果を保存する
 */
export async function saveQuizResult(
  result: Omit<QuizResult, 'id' | 'created_at'>
): Promise<{ data: QuizResult | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const resultData = {
      ...result,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('quiz_results')
      .insert(resultData)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '結果の保存に失敗しました' 
    };
  }
}

/**
 * ユーザーの過去の成績を取得する
 */
export async function getUserQuizHistory(
  userId: string,
  limit: number = 10
): Promise<{ data: QuizResult[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '履歴の取得に失敗しました' 
    };
  }
}

/**
 * ユーザーの間違えた問題を取得する
 */
export async function getIncorrectQuestions(
  userId: string,
  limit: number = 10
): Promise<{ data: Question[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('user_answers')
      .select(`
        question_id,
        questions!inner (
          id,
          question_text,
          image_url,
          correct_answer,
          options,
          difficulty,
          category,
          bird_id,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_correct', false)
      .order('answered_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { data: null, error: error.message };
    }

    // 重複を除去して問題データのみを抽出
    const uniqueQuestions: Question[] = [];
    const seenIds = new Set<number>();
    
    data?.forEach((item) => {
      const question = item.questions as unknown as Question;
      if (question && !seenIds.has(question.id)) {
        seenIds.add(question.id);
        uniqueQuestions.push(question);
      }
    });

    return { data: uniqueQuestions, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '間違えた問題の取得に失敗しました' 
    };
  }
}

/**
 * 利用可能なカテゴリ一覧を取得する
 */
export async function getQuestionCategories(): Promise<{ data: string[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('questions')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      return { data: null, error: error.message };
    }

    // 重複を除去してソート
    const categories = [...new Set(data.map(item => item.category))]
      .filter(Boolean)
      .sort();

    return { data: categories, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'カテゴリの取得に失敗しました' 
    };
  }
}