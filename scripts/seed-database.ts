import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabaseクライアントの設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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



async function seedDatabase() {
  try {
    console.log('データベースのシード処理を開始します...');

    // 1. birdsテーブルにデータを挿入
    console.log('\n1. 鳥データを挿入中...');
    const birdsPath = path.join(process.cwd(), 'data', 'birds.json');
    const birdsData: BirdData[] = JSON.parse(fs.readFileSync(birdsPath, 'utf8'));
    
    // 最初の10件のみテスト用に挿入
    const testBirds = birdsData.slice(0, 10).map(bird => ({
      japanese_name: bird.japanese_name,
      scientific_name: bird.scientific_name,
      family: bird.family || 'その他',
      order: bird.order || 'その他'
    }));

    const { data: insertedBirds, error: birdsError } = await supabase
      .from('birds')
      .insert(testBirds)
      .select();

    if (birdsError) {
      console.error('鳥データの挿入エラー:', birdsError);
      return;
    }

    console.log(`✅ ${insertedBirds?.length || 0}件の鳥データを挿入しました`);

    // 2. bird_imagesテーブルにデータを挿入
    console.log('\n2. 鳥画像データを挿入中...');
    const imagesPath = path.join(process.cwd(), 'data', 'bird_images.csv');
    const csvContent = fs.readFileSync(imagesPath, 'utf8');
    const lines = csvContent.split('\n');
    
    // 最初の20件のみテスト用に挿入
    const testImages = lines.slice(1, 21)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',');
        return {
          id: values[0],
          bird_id: values[1],
          image_url: values[2],
          source: values[3],
          license: values[4],
          photographer: values[5],
          is_active: values[13] === 'True'
        };
      });

    const { data: insertedImages, error: imagesError } = await supabase
      .from('bird_images')
      .insert(testImages)
      .select();

    if (imagesError) {
      console.error('画像データの挿入エラー:', imagesError);
      return;
    }

    console.log(`✅ ${insertedImages?.length || 0}件の画像データを挿入しました`);

    console.log('\n🎉 データベースのシード処理が完了しました！');
    
  } catch (error) {
    console.error('シード処理中にエラーが発生しました:', error);
  }
}

// スクリプトを実行
if (require.main === module) {
  seedDatabase();
}

export { seedDatabase };