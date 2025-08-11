import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // birdsテーブルからfamilyの重複を排除して取得
    const { data, error } = await supabase
      .from('birds')
      .select('family')
      .not('family', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ユニーク化＆null/空文字除去
    const families = Array.from(
      new Set((data || []).map((b: { family: string | null }) => (b.family || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'ja'));

    return NextResponse.json({ families, count: families.length });
  } catch (e) {
    console.error('families API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}