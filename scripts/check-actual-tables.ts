import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkActualTables() {
  console.log('=== 実際のデータベーステーブル構造確認 ===\n');
  
  // 1. 存在するテーブル一覧を取得
  console.log('1. 存在するテーブル一覧:');
  try {
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');
    
    if (error) {
      console.log(`❌ テーブル一覧取得エラー: ${error.message}`);
    } else {
      console.log('✅ 存在するテーブル:');
      tables?.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }
  } catch (err) {
    console.log(`❌ テーブル一覧取得例外: ${err}`);
  }
  console.log('');
  
  // 2. 各テーブルのカラム構造を確認
  const expectedTables = ['birds', 'bird_images', 'user_answers', 'quiz_results', 'profiles'];
  
  for (const tableName of expectedTables) {
    console.log(`2. ${tableName} テーブルのカラム構造:`);
    try {
      const { data: columns, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
        .order('ordinal_position');
      
      if (error) {
        console.log(`  ❌ カラム情報取得エラー: ${error.message}`);
      } else if (!columns || columns.length === 0) {
        console.log(`  ❌ テーブル '${tableName}' は存在しません`);
      } else {
        console.log(`  ✅ カラム一覧:`);
        columns.forEach(col => {
          console.log(`    - ${col.column_name}: ${col.data_type} (NULL: ${col.is_nullable})`);
        });
      }
    } catch (err) {
      console.log(`  ❌ カラム情報取得例外: ${err}`);
    }
    console.log('');
  }
  
  // 3. 各テーブルのデータ件数確認
  console.log('3. 各テーブルのデータ件数:');
  for (const tableName of expectedTables) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`  ${tableName}: ❌ エラー (${error.message})`);
      } else {
        console.log(`  ${tableName}: ${count} 件`);
      }
    } catch (err) {
      console.log(`  ${tableName}: ❌ 例外 (${err})`);
    }
  }
  
  console.log('\n=== 確認完了 ===');
}

checkActualTables().catch(console.error);