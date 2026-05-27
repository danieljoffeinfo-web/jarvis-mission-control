import { NextRequest, NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents';
import { insertEvents, listAgents, makeId } from '@/lib/backend';
import type { MissionEvent } from '@/lib/store';

function now() {
  return new Date().toISOString();
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await context.params;
  const body = await request.json();
  const agents = await listAgents();
  const agent = agents.find((item) => item.id === agentId) || AGENTS.find((item) => item.id === agentId);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const event: MissionEvent = {
    id: makeId('evt'),
    agentId,
    stage: 'direct-message',
    timestamp: now(),
    inputSummary: body.message || '',
    outputSummary: `${agent.name} acknowledged the direct message and queued it for follow-up.`,
    tokenUsage: Math.max(8, Math.round(String(body.message || '').length / 5))
  };

  await insertEvents([event]);
  return NextResponse.json({ ok: true, event });
}
