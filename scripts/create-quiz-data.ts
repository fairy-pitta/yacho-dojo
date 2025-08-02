import * as fs from 'fs';
import * as path from 'path';

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
 * 野鳥データからクイズ問題を生成する
 */
async function createQuizData() {
  try {
    console.log('クイズデータの作成を開始します...');
    
    // 野鳥データを読み込み
    const birdsPath = path.join(process.cwd(), 'data', 'birds.json');
    if (!fs.existsSync(birdsPath)) {
      throw new Error(`野鳥データファイルが見つかりません: ${birdsPath}`);
    }
    
    const birdsData: BirdData[] = JSON.parse(await fs.promises.readFile(birdsPath, 'utf8'));
    console.log(`読み込んだ野鳥データ数: ${birdsData.length}`);
    
    const questions: QuestionData[] = [];
    let questionId = 1;
    
    // 各野鳥について複数の問題を生成
    for (const bird of birdsData.slice(0, 50)) { // 最初の50種について問題を作成
      // 1. 和名から学名を答える問題
      if (bird.scientific_name) {
        const otherBirds = birdsData.filter(b => b.id !== bird.id && b.scientific_name);
        const wrongChoices = getRandomItems(otherBirds, 3).map(b => b.scientific_name);
        
        questions.push({
          id: questionId++,
          bird_id: bird.id,
          question_text: `「${bird.japanese_name}」の学名は何ですか？`,
          question_type: 'multiple_choice',
          correct_answer: bird.scientific_name,
          choices: shuffleArray([bird.scientific_name, ...wrongChoices]),
          difficulty: 'medium',
          explanation: `${bird.japanese_name}の学名は${bird.scientific_name}です。${bird.description}`
        });
      }
      
      // 2. 学名から和名を答える問題
      if (bird.scientific_name) {
        const otherBirds = birdsData.filter(b => b.id !== bird.id && b.japanese_name);
        const wrongChoices = getRandomItems(otherBirds, 3).map(b => b.japanese_name);
        
        questions.push({
          id: questionId++,
          bird_id: bird.id,
          question_text: `学名「${bird.scientific_name}」の和名は何ですか？`,
          question_type: 'multiple_choice',
          correct_answer: bird.japanese_name,
          choices: shuffleArray([bird.japanese_name, ...wrongChoices]),
          difficulty: 'hard',
          explanation: `学名${bird.scientific_name}の和名は${bird.japanese_name}です。${bird.description}`
        });
      }
      
      // 3. True/False問題（ランダムに正誤を決定）
      if (bird.scientific_name) {
        const isCorrect = Math.random() > 0.5;
        let questionText: string;
        let correctAnswer: string;
        
        if (isCorrect) {
          questionText = `「${bird.japanese_name}」の学名は「${bird.scientific_name}」である。`;
          correctAnswer = 'true';
        } else {
          const wrongBird = getRandomItems(birdsData.filter(b => b.id !== bird.id && b.scientific_name), 1)[0];
          questionText = `「${bird.japanese_name}」の学名は「${wrongBird.scientific_name}」である。`;
          correctAnswer = 'false';
        }
        
        questions.push({
          id: questionId++,
          bird_id: bird.id,
          question_text: questionText,
          question_type: 'true_false',
          correct_answer: correctAnswer,
          choices: ['true', 'false'],
          difficulty: 'easy',
          explanation: `${bird.japanese_name}の正しい学名は${bird.scientific_name}です。`
        });
      }
    }
    
    console.log(`生成したクイズ問題数: ${questions.length}`);
    
    // dataディレクトリを確認
    const dataDir = path.join(process.cwd(), 'data');
    try {
      await fs.promises.access(dataDir);
    } catch {
      await fs.promises.mkdir(dataDir, { recursive: true });
    }
    
    // JSONファイルとして保存
    const questionsPath = path.join(dataDir, 'questions.json');
    await fs.promises.writeFile(questionsPath, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`クイズ問題JSONファイルを保存しました: ${questionsPath}`);
    
    // SQLファイルとして保存
    const sqlPath = path.join(dataDir, 'questions_insert.sql');
    const sqlContent = generateQuestionsInsertSQL(questions);
    await fs.promises.writeFile(sqlPath, sqlContent, 'utf8');
    console.log(`クイズ問題SQLファイルを保存しました: ${sqlPath}`);
    
    console.log('\nクイズデータの作成が完了しました！');
    
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

/**
 * 配列からランダムにN個の要素を取得
 */
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * 配列をシャッフル
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * クイズ問題のINSERT SQL文を生成
 */
function generateQuestionsInsertSQL(questions: QuestionData[]): string {
  let sql = '-- クイズ問題データのINSERT文\n';
  sql += '-- 生成日時: ' + new Date().toISOString() + '\n\n';
  
  sql += 'INSERT INTO questions (id, bird_id, question_text, question_type, correct_answer, choices, difficulty, explanation) VALUES\n';
  
  const values = questions.map(q => {
    const choicesJson = JSON.stringify(q.choices).replace(/'/g, "''");
    const questionText = q.question_text.replace(/'/g, "''");
    const explanation = q.explanation.replace(/'/g, "''");
    
    return `(${q.id}, ${q.bird_id}, '${questionText}', '${q.question_type}', '${q.correct_answer}', '${choicesJson}', '${q.difficulty}', '${explanation}')`;
  });
  
  sql += values.join(',\n');
  sql += ';\n';
  
  return sql;
}

// スクリプトを実行
(async () => {
  await createQuizData();
})();