import { NextResponse } from 'next/server';
import { buildHealth } from '@/lib/backend';

export async function GET() {
  const health = await buildHealth();
  return NextResponse.json(health);
}
