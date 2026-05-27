import { NextResponse } from 'next/server';
import { getStore } from '@/lib/store';

export async function GET() {
  const store = getStore();
  return NextResponse.json({ agents: store.agents, events: store.missionEvents.slice(0, 50) });
}
