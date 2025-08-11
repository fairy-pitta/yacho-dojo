import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // birdsテーブルからorderの重複を排除して取得
    const { data, error } = await supabase
      .from('birds')
      .select('"order"')
      .not('"order"', 'is', null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ユニーク化＆null/空文字除去
    const orders = Array.from(
      new Set((data || []).map((b: { order: string | null }) => (b.order || '').trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, 'ja'));

    return NextResponse.json({ orders, count: orders.length });
  } catch (e) {
    console.error('orders API error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}