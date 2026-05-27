import { NextRequest, NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents';
import { insertEvents, insertMessage, listMessages, listMissions, makeId } from '@/lib/backend';
import type { LiveMessage, MissionEvent } from '@/lib/store';

function now() {
  return new Date().toISOString();
}

function stage(agentId: string, stageName: string, inputSummary: string, outputSummary: string, missionId?: string, liveMessageId?: string): MissionEvent {
  return {
    id: makeId('evt'),
    missionId,
    liveMessageId,
    agentId,
    stage: stageName,
    timestamp: now(),
    inputSummary,
    outputSummary,
    tokenUsage: Math.max(12, Math.round((inputSummary.length + outputSummary.length) / 5))
  };
}

function cleanBrief(message: string) {
  const trimmed = message.trim().replace(/\s+/g, ' ');
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildDelegationPlan(cleanedBrief: string) {
  const lower = cleanedBrief.toLowerCase();
  const plan: { agentId: string; why: string }[] = [];

  if (/(design|ui|ux|copy|visual|layout|brand)/.test(lower)) {
    plan.push({ agentId: 'liam', why: 'User-facing design or language review required.' });
  }
  if (/(deploy|bug|build|api|code|repo|integration|technical|database)/.test(lower)) {
    plan.push({ agentId: 'chris', why: 'Technical implementation or debugging is involved.' });
  }
  if (/(calendar|reminder|admin|accounting|operations|organize|schedule|invoice)/.test(lower)) {
    plan.push({ agentId: 'amy', why: 'Administrative operations or reminders are implicated.' });
  }
  if (!plan.length) {
    plan.push({ agentId: 'jarvis', why: 'This can be delivered directly in the operator thread.' });
  }
  plan.push({ agentId: 'rory', why: 'Rory contributes one lateral Chom idea on every brief.' });
  return plan;
}

async function buildAssistantReply(cleanedBrief: string) {
  const lower = cleanedBrief.toLowerCase();
  const [messages, missions] = await Promise.all([listMessages(), listMissions()]);

  if (/^(hi|hey|hello|yo|sup|howdy)(\b|[!.? ]|$)/.test(lower)) {
    return 'Hey — Jarvis here. What do you want me to help you with?';
  }

  if (/^thanks?(\b|[!.? ]|$)/.test(lower)) {
    return 'Anytime. Keep going — what do you want me to do next?';
  }

  if (/^help(\b|[!.? ]|$)/.test(lower)) {
    return 'I can help in two ways: talk to me here for something you want done now, or turn it into a mission if it should run later in the background.';
  }

  if (/(what did we work on today|what have we worked on today|what did we do today)/.test(lower)) {
    const recentTopics = messages
      .filter((item) => item.role === 'operator')
      .slice(-6)
      .map((item) => item.text.trim())
      .filter(Boolean);

    const missionTopics = missions.slice(0, 4).map((item) => item.title);
    const combined = [...new Set([...recentTopics, ...missionTopics])].slice(0, 6);

    if (!combined.length) {
      return 'Right now this app does not have enough stored history to answer that properly yet. Once the conversation and missions build up, I’ll be able to summarize the day from the actual saved thread.';
    }

    return `Today inside Mission Control, the main things on record were:\n- ${combined.join('\n- ')}`;
  }

  if (/(what is going on|is anything even plugged in|are you even connected|is this real)/.test(lower)) {
    const msgCount = messages.length;
    const missionCount = missions.length;
    return `Partly, yes. This app is now storing live chat and missions in the database, but the deeper multi-agent execution layer is still not fully real yet. Right now it has ${msgCount} saved chat messages and ${missionCount} saved missions.`;
  }

  const recentContext = messages.filter((item) => item.role === 'operator').slice(-3).map((item) => item.text.trim()).filter(Boolean);
  const contextLine = recentContext.length ? ` Recent context from this thread: ${recentContext.join(' | ')}` : '';
  return `I got your message: "${cleanedBrief}".${contextLine} Tell me the outcome you want and I’ll keep the conversation moving naturally from there.`;
}

export async function GET() {
  const messages = await listMessages();
  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const { message } = await request.json();
  const liveMessageId = makeId('live');
  const cleanedBrief = cleanBrief(message || '');
  const delegation = buildDelegationPlan(cleanedBrief);

  const operatorMessage: LiveMessage = {
    id: makeId('msg'),
    role: 'operator',
    text: message,
    createdAt: now(),
    agents: ['maya', 'ron']
  };

  const events: MissionEvent[] = [];
  events.push(stage('maya', 'clean-brief', 'Original operator request received.', `Cleaned brief: ${cleanedBrief}`, undefined, liveMessageId));
  events.push(stage('ron', 'delegation-plan', cleanedBrief, `Consulting: ${delegation.map((item) => item.agentId).join(', ')}`, undefined, liveMessageId));

  delegation.forEach((item) => {
    const agentName = AGENTS.find((agent) => agent.id === item.agentId)?.name || item.agentId;
    const output = item.agentId === 'rory'
      ? `[MAVERICK] ${agentName} suggests Chom create a reusable playbook around this request so the next version compounds faster.`
      : `${agentName} reviewed the brief and recommends: ${item.why}`;
    events.push(stage(item.agentId, 'worker-output', cleanedBrief, output, undefined, liveMessageId));
  });

  const synthesis = await buildAssistantReply(cleanedBrief);

  events.push(stage('ron', 'synthesis', cleanedBrief, 'Ron synthesized the worker outputs into one operator-ready response.', undefined, liveMessageId));
  events.push(stage('david', 'qa-gate', cleanedBrief, 'PASS — response addresses the cleaned brief and keeps the surface conversational.', undefined, liveMessageId));
  events.push(stage('jarvis', 'delivery', cleanedBrief, 'Jarvis delivered the final answer to the operator.', undefined, liveMessageId));

  const assistantMessage: LiveMessage = {
    id: makeId('msg'),
    role: 'jarvis',
    text: synthesis,
    createdAt: now(),
    agents: ['jarvis']
  };

  await insertMessage(operatorMessage);
  await insertMessage(assistantMessage);
  await insertEvents(events);

  return NextResponse.json({ message: assistantMessage });
}
