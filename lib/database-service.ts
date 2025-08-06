import { createClient } from '@/lib/supabase/client';
import { createClient as createServerClient } from '@/lib/supabase/server';

// クライアントサイド用のSupabaseクライアント
const supabase = createClient();

// サーバーサイド用のSupabaseクライアント取得関数
export async function getServerClient() {
  return await createServerClient();
}

// 型定義
type Bird = {
  id: string;
  japanese_name: string;
  scientific_name: string;
  family: string;
  order: string;
  created_at: string;
  updated_at: string;
};

type BirdImage = {
  id: string;
  bird_id: string;
  image_url: string;
  source: string | null;
  license: string | null;
  photographer: string | null;
  is_active: boolean;
  created_at: string;
};

type UserAnswer = {
  id: string;
  user_id: string;
  bird_id: string;
  bird_image_id: string;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  answered_at: string;
};

type QuizResult = {
  id: string;
  user_id: string;
  session_id: number | null;
  score: number;
  total_questions: number;
  correct_answers: number;
  time_taken: number;
  difficulty_level: string;
  category: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

// ===== Birds テーブル関連 =====

/**
 * 全ての野鳥データを取得
 */
export async function getAllBirds(): Promise<Bird[]> {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .order('japanese_name');

  if (error) {
    console.error('Error fetching birds:', error);
    throw error;
  }

  return data || [];
}

/**
 * IDで野鳥データを取得
 */
export async function getBirdById(id: string): Promise<Bird | null> {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching bird by ID:', error);
    return null;
  }

  return data;
}

/**
 * 科名で野鳥データを検索
 */
export async function getBirdsByFamily(family: string): Promise<Bird[]> {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .eq('family', family)
    .order('japanese_name');

  if (error) {
    console.error('Error fetching birds by family:', error);
    throw error;
  }

  return data || [];
}

/**
 * 目名で野鳥データを検索
 */
export async function getBirdsByOrder(order: string): Promise<Bird[]> {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .eq('order', order)
    .order('japanese_name');

  if (error) {
    console.error('Error fetching birds by order:', error);
    throw error;
  }

  return data || [];
}

/**
 * 野鳥名で検索（部分一致）
 */
export async function searchBirdsByName(searchTerm: string): Promise<Bird[]> {
  const { data, error } = await supabase
    .from('birds')
    .select('*')
    .or(`japanese_name.ilike.%${searchTerm}%,scientific_name.ilike.%${searchTerm}%`)
    .order('japanese_name');

  if (error) {
    console.error('Error searching birds by name:', error);
    throw error;
  }

  return data || [];
}

// ===== Bird Images テーブル関連 =====

/**
 * 全ての野鳥画像データを取得
 */
export async function getAllBirdImages(): Promise<BirdImage[]> {
  const { data, error } = await supabase
    .from('bird_images')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bird images:', error);
    throw error;
  }

  return data || [];
}

/**
 * 特定の野鳥の画像を取得
 */
export async function getBirdImagesByBirdId(birdId: string): Promise<BirdImage[]> {
  const { data, error } = await supabase
    .from('bird_images')
    .select('*')
    .eq('bird_id', birdId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bird images by bird ID:', error);
    throw error;
  }

  return data || [];
}

/**
 * IDで野鳥画像データを取得
 */
export async function getBirdImageById(id: string): Promise<BirdImage | null> {
  const { data, error } = await supabase
    .from('bird_images')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching bird image by ID:', error);
    return null;
  }

  return data;
}

/**
 * ランダムな野鳥画像を取得（クイズ用）
 */
export async function getRandomBirdImages(limit: number = 10): Promise<BirdImage[]> {
  const { data, error } = await supabase
    .rpc('get_random_bird_images', { limit_count: limit });

  if (error) {
    console.error('Error fetching random bird images:', error);
    // RPCが存在しない場合のフォールバック
    return getAllBirdImages().then(images => 
      images.sort(() => Math.random() - 0.5).slice(0, limit)
    );
  }

  return data || [];
}

// ===== User Answers テーブル関連 =====

/**
 * ユーザーの全回答履歴を取得
 */
export async function getUserAnswers(userId: string): Promise<UserAnswer[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false });

  if (error) {
    console.error('Error fetching user answers:', error);
    throw error;
  }

  return data || [];
}

/**
 * ユーザーの回答履歴を野鳥情報と結合して取得
 */
export async function getUserAnswersWithBirds(userId: string) {
  const { data, error } = await supabase
    .from('user_answers')
    .select(`
      *,
      birds:bird_id(*),
      bird_images:bird_image_id(*)
    `)
    .eq('user_id', userId)
    .order('answered_at', { ascending: false });

  if (error) {
    console.error('Error fetching user answers with birds:', error);
    throw error;
  }

  return data || [];
}

/**
 * 特定の野鳥に対するユーザーの回答履歴を取得
 */
export async function getUserAnswersForBird(userId: string, birdId: string): Promise<UserAnswer[]> {
  const { data, error } = await supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .eq('bird_id', birdId)
    .order('answered_at', { ascending: false });

  if (error) {
    console.error('Error fetching user answers for bird:', error);
    throw error;
  }

  return data || [];
}

/**
 * ユーザーの正答率を取得
 */
export async function getUserAccuracyStats(userId: string) {
  const { data, error } = await supabase
    .from('user_answers')
    .select('is_correct')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user accuracy stats:', error);
    throw error;
  }

  const total = data?.length || 0;
  const correct = data?.filter(answer => answer.is_correct).length || 0;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  return {
    total,
    correct,
    incorrect: total - correct,
    accuracy: Math.round(accuracy * 100) / 100
  };
}

// ===== Quiz Results テーブル関連 =====

/**
 * ユーザーの全クイズ結果を取得
 */
export async function getUserQuizResults(userId: string): Promise<QuizResult[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user quiz results:', error);
    throw error;
  }

  return data || [];
}

/**
 * 特定の難易度のクイズ結果を取得
 */
export async function getUserQuizResultsByDifficulty(userId: string, difficulty: string): Promise<QuizResult[]> {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId)
    .eq('difficulty_level', difficulty)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user quiz results by difficulty:', error);
    throw error;
  }

  return data || [];
}

/**
 * ユーザーの最高スコアを取得
 */
export async function getUserBestScore(userId: string, difficulty?: string) {
  let query = supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', userId);

  if (difficulty) {
    query = query.eq('difficulty_level', difficulty);
  }

  const { data, error } = await query
    .order('score', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching user best score:', error);
    return null;
  }

  return data;
}

/**
 * ユーザーのクイズ統計を取得
 */
export async function getUserQuizStats(userId: string) {
  const { data, error } = await supabase
    .from('quiz_results')
    .select('score, total_questions, correct_answers, time_taken, difficulty_level')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user quiz stats:', error);
    throw error;
  }

  const results = data || [];
  const totalQuizzes = results.length;
  const totalQuestions = results.reduce((sum, result) => sum + result.total_questions, 0);
  const totalCorrect = results.reduce((sum, result) => sum + result.correct_answers, 0);
  const totalTime = results.reduce((sum, result) => sum + result.time_taken, 0);
  const averageScore = totalQuizzes > 0 ? results.reduce((sum, result) => sum + result.score, 0) / totalQuizzes : 0;
  const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
  const averageTime = totalQuizzes > 0 ? totalTime / totalQuizzes : 0;

  // 難易度別統計
  const difficultyStats = results.reduce((acc, result) => {
    const difficulty = result.difficulty_level;
    if (!acc[difficulty]) {
      acc[difficulty] = {
        count: 0,
        totalScore: 0,
        totalQuestions: 0,
        totalCorrect: 0,
        totalTime: 0
      };
    }
    acc[difficulty].count++;
    acc[difficulty].totalScore += result.score;
    acc[difficulty].totalQuestions += result.total_questions;
    acc[difficulty].totalCorrect += result.correct_answers;
    acc[difficulty].totalTime += result.time_taken;
    return acc;
  }, {} as Record<string, {
    count: number;
    totalScore: number;
    totalQuestions: number;
    totalCorrect: number;
    totalTime: number;
    averageScore?: number;
    averageAccuracy?: number;
    averageTime?: number;
  }>);

  // 難易度別の平均値を計算
  Object.keys(difficultyStats).forEach(difficulty => {
    const stats = difficultyStats[difficulty];
    stats.averageScore = stats.totalScore / stats.count;
    stats.averageAccuracy = (stats.totalCorrect / stats.totalQuestions) * 100;
    stats.averageTime = stats.totalTime / stats.count;
  });

  return {
    totalQuizzes,
    totalQuestions,
    totalCorrect,
    totalTime,
    averageScore: Math.round(averageScore * 100) / 100,
    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
    averageTime: Math.round(averageTime),
    difficultyStats
  };
}

// ===== 汎用関数 =====

/**
 * データベースの接続状態を確認
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('birds')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

/**
 * テーブルの行数を取得
 */
export async function getTableCounts() {
  const tables = ['birds', 'bird_images', 'user_answers', 'quiz_results'];
  const counts: Record<string, number> = {};

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Error counting ${table}:`, error);
        counts[table] = 0;
      } else {
        counts[table] = count || 0;
      }
    } catch (error) {
      console.error(`Error counting ${table}:`, error);
      counts[table] = 0;
    }
  }

  return counts;
}