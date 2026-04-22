import { NextResponse } from 'next/server';
import { adapter } from '@/lib/mock/adapter';

export const dynamic = 'force-static';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return NextResponse.json(await adapter.listBaselineDiffs(params.id));
}
