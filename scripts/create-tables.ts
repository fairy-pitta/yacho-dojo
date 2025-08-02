import * as fs from 'fs';
import * as path from 'path';

console.log('='.repeat(60));
console.log('📋 Supabaseデータベーステーブル作成手順');
console.log('='.repeat(60));
console.log();
console.log('以下の手順でSupabaseにテーブルを作成してください:');
console.log();
console.log('1. Supabase Dashboard にアクセス:');
console.log('   https://app.supabase.com/project/navmxpnvuxvtcylmhmao');
console.log();
console.log('2. 左サイドバーの「SQL Editor」をクリック');
console.log();
console.log('3. 以下のSQLを実行してください:');
console.log();

// database_setup.sqlファイルを読み込み
const sqlFilePath = path.join(process.cwd(), 'database_setup.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

console.log('--- SQL開始 ---');
console.log(sqlContent);
console.log('--- SQL終了 ---');
console.log();
console.log('4. SQLを実行後、以下のコマンドでデータを投入してください:');
console.log('   npx ts-node scripts/insert-data.ts');
console.log();
console.log('='.repeat(60));