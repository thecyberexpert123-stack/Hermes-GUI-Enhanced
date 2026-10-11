import { NextResponse } from 'next/server';
import { performSystemBoost } from '@/lib/hermes';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const result = await performSystemBoost();
    return NextResponse.json({
      success: true,
      ...result,
      message: `System optimized: ${result.freedMB} MB reclaimed, caches purged, SQLite journals compacted.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
