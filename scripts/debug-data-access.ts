import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDataAccess() {
  console.log('=== Supabase データアクセス調査 ===\n');
  
  // 1. 接続確認
  console.log('1. 接続設定確認:');
  console.log(`URL: ${supabaseUrl}`);
  console.log(`Key: ${supabaseKey.substring(0, 20)}...\n`);
  
  // 2. 基本的な接続テスト
  console.log('2. 基本接続テスト:');
  try {
    const { data, error } = await supabase.from('birds').select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ エラー: ${error.message}`);
      console.log(`コード: ${error.code}`);
      console.log(`詳細: ${JSON.stringify(error.details)}`);
    } else {
      console.log(`✅ 接続成功 - birds テーブル件数: ${data}`);
    }
  } catch (err) {
    console.log(`❌ 例外: ${err}`);
  }
  console.log('');
  
  // 3. 各テーブルの詳細確認
  const tables = ['birds', 'bird_images', 'user_answers', 'quiz_results'];
  
  for (const table of tables) {
    console.log(`3. ${table} テーブル詳細確認:`);
    
    // カウント取得
    try {
      const { count, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log(`  ❌ カウントエラー: ${countError.message}`);
        console.log(`     コード: ${countError.code}`);
      } else {
        console.log(`  ✅ 件数: ${count}`);
      }
    } catch (err) {
      console.log(`  ❌ カウント例外: ${err}`);
    }
    
    // データ取得テスト
    try {
      const { data, error: dataError } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (dataError) {
        console.log(`  ❌ データ取得エラー: ${dataError.message}`);
        console.log(`     コード: ${dataError.code}`);
      } else {
        console.log(`  ✅ データ取得成功: ${data ? data.length : 0} 件`);
        if (data && data.length > 0) {
          console.log(`     サンプル: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
        }
      }
    } catch (err) {
      console.log(`  ❌ データ取得例外: ${err}`);
    }
    console.log('');
  }
  
  // 4. RLSポリシー確認（システムテーブルから）
  console.log('4. RLSポリシー確認:');
  try {
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', tables);
    
    if (policyError) {
      console.log(`❌ ポリシー確認エラー: ${policyError.message}`);
    } else {
      console.log(`✅ ポリシー情報取得成功: ${policies ? policies.length : 0} 件`);
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`  - ${policy.tablename}: ${policy.policyname}`);
        });
      }
    }
  } catch (err) {
    console.log(`❌ ポリシー確認例外: ${err}`);
  }
  console.log('');
  
  // 5. 認証状態確認
  console.log('5. 認証状態確認:');
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log(`❌ 認証エラー: ${authError.message}`);
    } else {
      console.log(`✅ 認証状態: ${user ? 'ログイン済み' : '未ログイン'}`);
      if (user) {
        console.log(`   ユーザーID: ${user.id}`);
        console.log(`   メール: ${user.email}`);
      }
    }
  } catch (err) {
    console.log(`❌ 認証確認例外: ${err}`);
  }
  
  console.log('\n=== 調査完了 ===');
}

debugDataAccess().catch(console.error);