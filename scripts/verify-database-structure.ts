import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabaseStructure() {
  console.log('=== データベース構造検証 ===');
  console.log('設計書 docs/database.md に準拠したテーブル構造を確認します\n');

  // 各テーブルのレコード数を確認
  const tables = [
    'birds',
    'bird_images', 
    'profiles',
    'quiz_results',
    'user_answers',
    'user_question_status',
    'comments',
    'question_ratings',
    'comment_ratings'
  ];

  console.log('📊 テーブル別レコード数:');
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: エラー - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} レコード`);
      }
    } catch (err) {
      console.log(`❌ ${table}: 例外 - ${err}`);
    }
  }

  console.log('\n🔍 bird_imagesテーブルの詳細構造確認:');
  try {
    // bird_imagesテーブルのサンプルデータを取得（存在する場合）
    const { data: birdImages, error: birdImagesError } = await supabase
      .from('bird_images')
      .select('*')
      .limit(1);
    
    if (birdImagesError) {
      console.log(`❌ bird_images構造確認エラー: ${birdImagesError.message}`);
    } else if (birdImages && birdImages.length > 0) {
      console.log('✅ bird_imagesテーブル構造:');
      console.log('カラム:', Object.keys(birdImages[0]));
    } else {
      console.log('ℹ️ bird_imagesテーブルは存在しますが、データが空です');
    }
  } catch (err) {
    console.log(`❌ bird_images構造確認例外: ${err}`);
  }

  console.log('\n🔍 birdsテーブルのサンプルデータ:');
  try {
    const { data: birds, error: birdsError } = await supabase
      .from('birds')
      .select('*')
      .limit(3);
    
    if (birdsError) {
      console.log(`❌ birds取得エラー: ${birdsError.message}`);
    } else if (birds && birds.length > 0) {
      console.log('✅ birdsテーブルサンプル:');
      birds.forEach((bird, index) => {
        console.log(`${index + 1}. ${bird.japanese_name} (${bird.scientific_name})`);
      });
    } else {
      console.log('ℹ️ birdsテーブルにデータがありません');
    }
  } catch (err) {
    console.log(`❌ birds取得例外: ${err}`);
  }

  console.log('\n✨ 検証完了');
}

verifyDatabaseStructure().catch(console.error);