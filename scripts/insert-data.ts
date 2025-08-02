import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// 環境変数の確認
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Supabaseクライアントは環境変数が設定されている場合のみ初期化
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let supabase: any = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

interface BirdData {
  id: number;
  japanese_name: string;
  english_name: string;
  scientific_name: string;
  family: string;
  order: string;
  habitat: string;
  size: string;
  description: string;
}

interface QuestionData {
  id: number;
  bird_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  correct_answer: string;
  choices: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  explanation: string;
}

/**
 * データベースにデータを投入する
 */
async function insertData() {
  try {
    console.log('データベースへのデータ投入を開始します...');
    
    // 環境変数の確認
    if (!supabaseUrl || !supabaseKey) {
      console.log('⚠️  Supabaseの環境変数が設定されていません。');
      console.log('実際のデータベースに投入する場合は、以下の環境変数を設定してください:');
      console.log('- SUPABASE_URL');
      console.log('- SUPABASE_ANON_KEY');
      console.log('\n代わりにSQLファイルを使用してください:');
      console.log('- data/birds_insert.sql');
      console.log('- data/questions_insert.sql');
      return;
    }
    
    // 野鳥データを読み込み
    const birdsPath = path.join(process.cwd(), 'data', 'birds.json');
    const questionsPath = path.join(process.cwd(), 'data', 'questions.json');
    
    if (!fs.existsSync(birdsPath)) {
      throw new Error(`野鳥データファイルが見つかりません: ${birdsPath}`);
    }
    
    if (!fs.existsSync(questionsPath)) {
      throw new Error(`クイズデータファイルが見つかりません: ${questionsPath}`);
    }
    
    const birdsData: BirdData[] = JSON.parse(await fs.promises.readFile(birdsPath, 'utf8'));
    const questionsData: QuestionData[] = JSON.parse(await fs.promises.readFile(questionsPath, 'utf8'));
    
    console.log(`野鳥データ数: ${birdsData.length}`);
    console.log(`クイズ問題数: ${questionsData.length}`);
    
    // 野鳥データを投入
    console.log('\n野鳥データを投入中...');
    if (!supabase) {
      throw new Error('Supabaseクライアントが初期化されていません');
    }
    const { error: birdsError } = await supabase
      .from('birds')
      .insert(birdsData.map(bird => ({
        japanese_name: bird.japanese_name,
        english_name: bird.english_name || null,
        scientific_name: bird.scientific_name,
        family: bird.family || null,
        order: bird.order || null,
        habitat: bird.habitat || null,
        size: bird.size || null,
        description: bird.description || null
      })));
    
    if (birdsError) {
      console.error('野鳥データの投入でエラーが発生しました:', birdsError);
      throw birdsError;
    }
    
    console.log(`✅ 野鳥データの投入が完了しました: ${birdsData.length}件`);
    
    // クイズ問題データを投入
    console.log('\nクイズ問題データを投入中...');
    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData.map(question => ({
        bird_id: question.bird_id,
        question_text: question.question_text,
        question_type: question.question_type,
        correct_answer: question.correct_answer,
        choices: question.choices,
        difficulty: question.difficulty,
        explanation: question.explanation
      })));
    
    if (questionsError) {
      console.error('クイズ問題データの投入でエラーが発生しました:', questionsError);
      throw questionsError;
    }
    
    console.log(`✅ クイズ問題データの投入が完了しました: ${questionsData.length}件`);
    
    // データ確認
    console.log('\nデータベースの確認中...');
    
    const { count: birdsCount } = await supabase
      .from('birds')
      .select('*', { count: 'exact', head: true });
    
    const { count: questionsCount } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });
    
    console.log(`データベース内の野鳥データ数: ${birdsCount}`);
    console.log(`データベース内のクイズ問題数: ${questionsCount}`);
    
    console.log('\n🎉 データベースへのデータ投入が完了しました！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// スクリプトを実行
(async () => {
  await insertData();
})();