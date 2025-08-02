import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// 環境変数の確認（ローカル環境優先）
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Supabaseクライアントを初期化
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = createClient(supabaseUrl, supabaseKey);

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
    
    // まずテーブルの存在確認
    console.log('テーブルの存在確認中...');
    const { error: tableError } = await supabase
      .from('birds')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('テーブルが存在しないか、アクセスできません:');
      console.error('エラーメッセージ:', tableError.message);
      console.error('エラー詳細:', tableError.details);
      console.error('エラーヒント:', tableError.hint);
      console.error('エラーコード:', tableError.code);
      throw tableError;
    }
    
    console.log('birdsテーブルが確認できました。');
    
    // 野鳥データの投入
    console.log('野鳥データを投入中...');
    
    // データベーススキーマに合わせてデータを変換
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedBirdsData = birdsData.map((bird: any) => ({
      japanese_name: bird.japanese_name,
      scientific_name: bird.scientific_name,
      family: bird.family || '不明',
      order: bird.order || '不明'
    }));
    
    // テスト用に最初の1件のみ投入
    const testData = transformedBirdsData.slice(0, 1);
    console.log('テストデータ:', JSON.stringify(testData, null, 2));
    
    const { error: birdsError } = await supabase
      .from('birds')
      .insert(testData);
    
    if (birdsError) {
      console.error('野鳥データの投入でエラーが発生しました:');
      console.error('エラーメッセージ:', birdsError.message);
      console.error('エラー詳細:', birdsError.details);
      console.error('エラーヒント:', birdsError.hint);
      console.error('エラーコード:', birdsError.code);
      throw birdsError;
    }
    
    console.log(`✅ 野鳥データの投入が完了しました: ${birdsData.length}件`);
    
    // TODO: クイズ問題データの投入は後で実装
    // questionsテーブルにはbird_image_idが必須のため、
    // まずbird_imagesテーブルを作成してからquestionsを投入する必要があります
    console.log('クイズ問題データの投入はスキップします（bird_image_idが必要）。');
    
    /*
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
      console.error('クイズ問題データの投入でエラーが発生しました:');
      console.error('エラーメッセージ:', questionsError.message);
      console.error('エラー詳細:', questionsError.details);
      console.error('エラーヒント:', questionsError.hint);
      console.error('エラーコード:', questionsError.code);
      throw questionsError;
    }
    
    console.log(`✅ クイズ問題データの投入が完了しました: ${questionsData.length}件`);
    */
    
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
    console.error('エラーが発生しました:');
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('スタックトレース:', error.stack);
    } else {
      console.error('エラー詳細:', error);
    }
    process.exit(1);
  }
}

// スクリプトを実行
(async () => {
  await insertData();
})();