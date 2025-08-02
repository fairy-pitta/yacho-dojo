import XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

/**
 * jpbirdlist8ed_ver1.xlsxファイルから野鳥データを抽出する
 */
export async function extractBirdData(): Promise<BirdData[]> {
  try {
    // Excelファイルを読み込み
    const workbook = XLSX.readFile(path.join(__dirname, '../docs/jpbirdlist8ed_ver1.xlsx'));
    
    console.log('利用可能なシート名:');
    workbook.SheetNames.forEach((name, index) => {
      console.log(`${index}: ${name}`);
    });
    
    // 野鳥データが含まれていそうなシートを探す
     const targetSheetName = workbook.SheetNames.find(name => 
       name.includes('リスト') || name.includes('一覧') || name.includes('鳥') || name.includes('bird')
     ) || workbook.SheetNames[1] || workbook.SheetNames[0]; // 2番目のシートまたは最初のシートをフォールバック
    
    console.log(`\n使用するシート: ${targetSheetName}`);
    const worksheet = workbook.Sheets[targetSheetName];
    
    // シートをJSONに変換
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];
    
    console.log(`読み込んだデータ数: ${jsonData.length}`);
    console.log('最初の5行のサンプル:');
    console.log(JSON.stringify(jsonData.slice(0, 5), null, 2));
    
    // データ構造を分析
    if (jsonData.length > 0) {
      console.log('\n利用可能なカラム:');
      console.log(Object.keys(jsonData[0]));
    }
    
    // 種（鳥）のデータのみを抽出
    const birdSpecies = jsonData.filter((row: Record<string, unknown>) => 
      String(row['カテゴリ'] || '').trim() === '種'
    );
    
    console.log(`種のデータ数: ${birdSpecies.length}`);
    
    // 野鳥データを整形
    const birds: BirdData[] = birdSpecies.map((row, index) => {
      return {
        id: index + 1,
        japanese_name: String(row['和名'] || ''),
        english_name: '', // Excelファイルに英名がないため空文字
        scientific_name: String(row['学名'] || ''),
        family: '', // 科の情報は別の行にあるため、後で関連付けが必要
        order: '', // 目の情報は別の行にあるため、後で関連付けが必要
        habitat: '', // 生息地情報がないため空文字
        size: '', // サイズ情報がないため空文字
        description: `種番号: ${row['種番号'] || ''}, 著者: ${row['著者'] || ''}`.trim()
      };
    }).filter(bird => bird.japanese_name && bird.japanese_name.trim() !== '');
    
    console.log(`\n整形後のデータ数: ${birds.length}`);
    
    // SQLインサート文を生成
    const sqlInserts = generateBirdInsertSQL(birds);
    
    // ファイルに保存
    const outputDir = path.join(process.cwd(), 'data');
    try {
      await fs.promises.access(outputDir);
    } catch {
      await fs.promises.mkdir(outputDir, { recursive: true });
    }
    
    // JSONファイルとして保存
    await fs.promises.writeFile(
      path.join(outputDir, 'birds.json'),
      JSON.stringify(birds, null, 2),
      'utf8'
    );
    
    // SQLファイルとして保存
    await fs.promises.writeFile(
      path.join(outputDir, 'birds_insert.sql'),
      sqlInserts,
      'utf8'
    );
    
    console.log('\nファイルを保存しました:');
    console.log('- data/birds.json');
    console.log('- data/birds_insert.sql');
    
    return birds;
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    throw error;
  }
}

/**
 * 野鳥データからSQLインサート文を生成
 */
export function generateBirdInsertSQL(birds: BirdData[]): string {
  const sqlHeader = `-- 野鳥データのインサート文\n-- 生成日時: ${new Date().toISOString()}\n\n`;
  
  const insertStatements = birds.map(bird => {
    const values = [
      bird.id,
      `'${escapeSQLString(bird.japanese_name)}'`,
      `'${escapeSQLString(bird.english_name)}'`,
      `'${escapeSQLString(bird.scientific_name)}'`,
      `'${escapeSQLString(bird.family)}'`,
      `'${escapeSQLString(bird.order)}'`,
      `'${escapeSQLString(bird.habitat)}'`,
      `'${escapeSQLString(bird.size)}'`,
      `'${escapeSQLString(bird.description)}'`
    ].join(', ');
    
    return `INSERT INTO birds (id, japanese_name, english_name, scientific_name, family, \"order\", habitat, size, description) VALUES (${values});`;
  }).join('\n');
  
  return sqlHeader + insertStatements;
}

/**
 * SQL文字列をエスケープ
 */
function escapeSQLString(str: string): string {
  if (!str) return '';
  return str.toString().replace(/'/g, "''");
}

// スクリプトを実行
(async () => {
  await extractBirdData();
})();