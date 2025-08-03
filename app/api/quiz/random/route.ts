import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Question, QuizSettings } from '@/types/quiz';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get('count') || '10');
    const category = searchParams.get('category') || undefined;

    const supabase = await createClient();
    
    // birdsテーブルからランダムに鳥を選択
    let birdsQuery = supabase
      .from('birds')
      .select('id, japanese_name, scientific_name, family');

    // カテゴリフィルタ（family で代用）
    if (category) {
      birdsQuery = birdsQuery.eq('family', category);
    }

    const { data: birds, error: birdsError } = await birdsQuery;

    if (birdsError) {
      return NextResponse.json(
        { error: birdsError.message },
        { status: 500 }
      );
    }

    if (!birds || birds.length === 0) {
      return NextResponse.json(
        { error: '鳥のデータが見つかりませんでした' },
        { status: 404 }
      );
    }

    // ランダムに鳥を選択
    const shuffledBirds = birds.sort(() => Math.random() - 0.5);
    const selectedBirds = shuffledBirds.slice(0, count);

    // 各鳥に対して画像を取得し、問題を生成
    const questions: Question[] = [];
    
    for (const bird of selectedBirds) {
      // その鳥の画像をランダムに1つ選択
      const { data: images, error: imagesError } = await supabase
        .from('bird_images')
        .select('id, image_url')
        .eq('bird_id', bird.id);

      if (imagesError || !images || images.length === 0) {
        continue; // この鳥はスキップ
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

      const question: Question = {
        id: `${bird.id}-${randomImage.id}`,
        question_text: 'この野鳥の名前は何ですか？',
        image_url: randomImage.image_url,
        correct_answer: bird.japanese_name,
        options,
        difficulty: 'medium',
        category: bird.family || '野鳥',
        bird_id: bird.id.toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      questions.push(question);
    }

    return NextResponse.json({
      questions,
      count: questions.length,
    });
  } catch (error) {
    console.error('Quiz API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}