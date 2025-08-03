import { createClient } from '@/lib/supabase/client';
import { Question, UserAnswer, QuizResult, QuizSettings } from '@/types/quiz';
import { shuffleQuestions } from '@/utils/quiz';

/**
 * ランダムな問題を動的に生成する
 */
export async function getRandomQuestions(
  count: number = 10,
  settings?: QuizSettings
): Promise<{ data: Question[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    // birdsテーブルからランダムに鳥を選択
    let birdsQuery = supabase
      .from('birds')
      .select('id, japanese_name, scientific_name, family');

    // カテゴリフィルタ（family で代用）
    if (settings?.category) {
      birdsQuery = birdsQuery.eq('family', settings.category);
    }

    const { data: birds, error: birdsError } = await birdsQuery;

    if (birdsError) {
      return { data: null, error: birdsError.message };
    }

    if (!birds || birds.length === 0) {
      return { data: null, error: '鳥のデータが見つかりませんでした' };
    }

    // ランダムに鳥を選択
    const shuffledBirds = birds.sort(() => Math.random() - 0.5);
    const selectedBirds = shuffledBirds.slice(0, count);

    // 各鳥に対して画像を取得し、問題を生成
    const generatedQuestions: Question[] = [];
    
    for (const bird of selectedBirds) {
      // その鳥の画像をランダムに1つ選択
      const { data: images, error: imagesError } = await supabase
        .from('bird_images')
        .select('id, image_url')
        .eq('bird_id', bird.id);

      if (imagesError || !images || images.length === 0) {
        continue; // この鳥の画像がない場合はスキップ
      }

      const randomImage = images[Math.floor(Math.random() * images.length)];
      
      // 他の鳥から間違いの選択肢を生成
      const otherBirds = birds
        .filter(b => b.id !== bird.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(b => b.japanese_name);

      const options = [bird.japanese_name, ...otherBirds]
        .sort(() => Math.random() - 0.5);
      
      // 難易度を設定
      let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
      if (settings?.difficulty && settings.difficulty !== 'mixed') {
        difficulty = settings.difficulty as 'easy' | 'medium' | 'hard';
      } else {
        // ランダムに難易度を設定
        const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
        difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      }

      // 問題を生成
      const question: Question = {
        id: `generated-${bird.id}-${randomImage.id}`,
        question_text: `この鳥の名前は何ですか？`,
        image_url: randomImage.image_url,
        correct_answer: bird.japanese_name,
        options,
        difficulty,
        category: bird.family || '野鳥',
        bird_id: bird.id.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      generatedQuestions.push(question);
    }

    if (generatedQuestions.length === 0) {
      return { data: null, error: '問題を生成できませんでした' };
    }

    return { data: generatedQuestions, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '問題の取得に失敗しました' 
    };
  }
}

/**
 * 特定の問題を取得する（動的生成対応）
 */
export async function getQuestionById(
  id: string
): Promise<{ data: Question | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    // 動的生成されたIDの場合
    if (id.startsWith('generated-')) {
      // IDから bird_id と bird_image_id を抽出
      const parts = id.split('-');
      if (parts.length < 3) {
        return { data: null, error: '無効な問題IDです' };
      }
      
      const birdId = parts[1];
      const imageId = parts[2];
      
      // 鳥の情報を取得
      const { data: birdData, error: birdError } = await supabase
        .from('birds')
        .select('id, japanese_name, scientific_name, family')
        .eq('id', birdId)
        .single();

      if (birdError || !birdData) {
        return { data: null, error: '鳥のデータが見つかりませんでした' };
      }

      // 画像情報を取得
      const { data: imageData, error: imageError } = await supabase
        .from('bird_images')
        .select('id, image_url')
        .eq('id', imageId)
        .single();

      if (imageError || !imageData) {
        return { data: null, error: '画像データが見つかりませんでした' };
      }

      // 問題を生成
      const question: Question = {
        id,
        question_text: `この鳥の名前は何ですか？`,
        image_url: imageData.image_url,
        correct_answer: birdData.japanese_name,
        options: [birdData.japanese_name],
        difficulty: 'medium',
        category: birdData.family || '野鳥',
        bird_id: birdData.id.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return { data: question, error: null };
    }

    // 従来の静的な問題の場合（questionsテーブルから取得）
    const { data, error } = await supabase
      .from('questions')
      .select(`
        id,
        correct_answer,
        alternative_answers,
        difficulty,
        bird_id,
        bird_image_id,
        created_at,
        updated_at
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data) {
      return { data: null, error: '問題が見つかりませんでした' };
    }

    // 鳥の情報を取得
    const { data: birdData } = await supabase
      .from('birds')
      .select('family, japanese_name')
      .eq('id', data.bird_id)
      .single();

    // 画像情報を取得
    const { data: imageData } = await supabase
      .from('bird_images')
      .select('image_url')
      .eq('id', data.bird_image_id)
      .single();

    // データベースの結果をQuestion型に変換
    const options = [data.correct_answer, ...(data.alternative_answers || [])]
      .filter(Boolean)
      .sort(() => Math.random() - 0.5);

    const question: Question = {
      id: data.id,
      question_text: `この野鳥の名前は何ですか？`,
      image_url: imageData?.image_url,
      correct_answer: data.correct_answer,
      options,
      difficulty: data.difficulty as 'easy' | 'medium' | 'hard',
      category: birdData?.family || 'その他',
      bird_id: data.bird_id.toString(),
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    return { data: question, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '問題の取得に失敗しました' 
    };
  }
}

/**
 * ユーザーの回答を保存する
 */
export async function saveUserAnswer(
  answer: Omit<UserAnswer, 'id' | 'answered_at'>
): Promise<{ data: UserAnswer | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('user_answers')
      .insert({
        ...answer,
        answered_at: new Date().toISOString()
      })
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
    
    const { data, error } = await supabase
      .from('quiz_results')
      .insert({
        ...result,
        created_at: new Date().toISOString()
      })
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
 * ユーザーのクイズ履歴を取得する
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

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '履歴の取得に失敗しました' 
    };
  }
}

/**
 * 間違えた問題を取得する（復習用）
 */
export async function getIncorrectQuestions(
  userId: string,
  limit: number = 10
): Promise<{ data: Question[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    // 間違えた回答から問題IDを取得
    const { data: incorrectAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('question_id, questions(*)')
      .eq('user_id', userId)
      .eq('is_correct', false)
      .order('answered_at', { ascending: false })
      .limit(limit);

    if (answersError) {
      return { data: null, error: answersError.message };
    }

    if (!incorrectAnswers || incorrectAnswers.length === 0) {
      return { data: [], error: null };
    }

    // 重複を除去して問題データを抽出
    const uniqueQuestions = incorrectAnswers
      .map(answer => answer.questions as unknown as Question)
      .filter((question, index, self) => 
        question && self.findIndex(q => q && q.id === question.id) === index
      )
      .filter(Boolean);

    return { data: uniqueQuestions, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '間違えた問題の取得に失敗しました' 
    };
  }
}

/**
 * 問題のカテゴリ一覧を取得する
 */
export async function getQuestionCategories(): Promise<{ data: string[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('birds')
      .select('family')
      .not('family', 'is', null);

    if (error) {
      return { data: null, error: error.message };
    }

    // 重複を除去してカテゴリ一覧を作成
    const categories = [...new Set(data.map(item => item.family))].filter(Boolean);
    
    return { data: categories, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'カテゴリの取得に失敗しました' 
    };
  }
}