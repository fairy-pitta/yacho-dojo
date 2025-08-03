import { createClient } from '@/lib/supabase/client';

export interface UserAnswerHistory {
  id: number;
  user_id: string;
  question_id: number;
  user_answer: string;
  is_correct: boolean;
  answered_at: string;
  questions?: {
    id: number;
    bird_name: string;
    image_url: string | null;
  };
}

export interface UserStats {
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
}

// saveUserAnswer関数はquiz-serviceで実装済みのため、そちらを使用してください

/**
 * ユーザーの回答履歴を取得する
 */
export async function getUserAnswerHistory(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false });

  return { data: data as UserAnswerHistory[] || [], error };
}

/**
 * ユーザーの統計を計算する
 */
export async function calculateUserStats(userId: string): Promise<UserStats> {
  const { data: answers } = await getUserAnswerHistory(userId);
  
  if (!answers || answers.length === 0) {
    return {
      totalAnswers: 0,
      correctAnswers: 0,
      accuracy: 0
    };
  }

  const totalAnswers = answers.length;
  const correctAnswers = answers.filter(answer => answer.is_correct).length;
  const accuracy = Math.round((correctAnswers / totalAnswers) * 100);

  return {
    totalAnswers,
    correctAnswers,
    accuracy
  };
}

/**
 * 最近の回答履歴を取得する（指定した件数）
 */
export async function getRecentAnswerHistory(userId: string, limit: number = 10) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_answers')
    .select(`
      *,
      questions (
        id,
        bird_name,
        image_url
      )
    `)
    .eq('user_id', userId)
    .order('answered_at', { ascending: false })
    .limit(limit);

  return { data, error };
}

/**
 * 間違えた問題のIDリストを取得する
 */
export async function getIncorrectQuestionIds(userId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('user_answers')
    .select('question_id')
    .eq('user_id', userId)
    .eq('is_correct', false);

  if (error || !data) {
    return { data: [], error };
  }

  // 重複を除去
  const uniqueQuestionIds = [...new Set(data.map(item => item.question_id))];
  
  return { data: uniqueQuestionIds, error: null };
}