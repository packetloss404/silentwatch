import { NextResponse } from 'next/server';
import { adapter } from '@/lib/mock/adapter';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json(await adapter.listSignals());
}
