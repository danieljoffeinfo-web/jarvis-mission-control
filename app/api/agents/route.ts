import { NextResponse } from 'next/server';
import { listAgents, listEvents } from '@/lib/backend';

export async function GET() {
  const [agents, events] = await Promise.all([listAgents(), listEvents(50)]);
  return NextResponse.json({ agents, events });
}
