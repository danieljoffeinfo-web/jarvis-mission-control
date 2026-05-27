import { NextRequest, NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents';
import { getStore, updateAgent } from '@/lib/store';

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: agentId } = await context.params;
  const store = getStore();
  const body = await request.json();
  const agent = AGENTS.find((item) => item.id === agentId);

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  updateAgent(agentId, 'working', body.message || 'Direct message received.');
  const event = {
    id: id('evt'),
    agentId,
    stage: 'direct-message',
    timestamp: now(),
    inputSummary: body.message || '',
    outputSummary: `${agent.name} acknowledged the direct message and added it to their queue.`,
    tokenUsage: Math.max(8, Math.round(String(body.message || '').length / 5))
  };

  store.missionEvents.unshift(event);
  updateAgent(agentId, 'idle', agent.currentTask);
  return NextResponse.json({ ok: true, event });
}
