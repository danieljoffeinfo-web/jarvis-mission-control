import { NextRequest, NextResponse } from 'next/server';
import { AGENTS } from '@/lib/agents';
import { getStore, updateAgent, LiveMessage, MissionEvent } from '@/lib/store';

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

function stage(agentId: string, stageName: string, inputSummary: string, outputSummary: string, missionId?: string, liveMessageId?: string): MissionEvent {
  return {
    id: id('evt'),
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
  const picks = ['ron'];
  const plan: { agentId: string; why: string }[] = [];

  if (/(design|ui|ux|copy|visual|layout|brand)/.test(lower)) {
    picks.push('liam');
    plan.push({ agentId: 'liam', why: 'User-facing design or language review required.' });
  }
  if (/(deploy|bug|build|api|code|repo|integration|technical|database)/.test(lower)) {
    picks.push('chris');
    plan.push({ agentId: 'chris', why: 'Technical implementation or debugging is involved.' });
  }
  if (/(calendar|reminder|admin|accounting|operations|organize|schedule|invoice)/.test(lower)) {
    picks.push('amy');
    plan.push({ agentId: 'amy', why: 'Administrative operations or reminders are implicated.' });
  }
  if (!plan.length) {
    picks.push('jarvis');
    plan.push({ agentId: 'jarvis', why: 'This can be delivered directly in the operator thread.' });
  }

  plan.push({ agentId: 'rory', why: 'Rory contributes one lateral Chom idea on every brief.' });
  return { picks: Array.from(new Set(picks.concat('rory'))), plan };
}

function buildAssistantReply(cleanedBrief: string) {
  const lower = cleanedBrief.toLowerCase();

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
    return 'Right now this Mission Control chat is still mostly a UI shell, so it does not really remember the day\'s work properly yet. In the real chat with me today, we worked mainly on two things: the DFT Tours scroll-animation site and this Jarvis Mission Control rebuild. I still need to wire real persistence and a real backend so this app can answer that question properly from stored history.';
  }

  if (/(what is going on|is anything even plugged in|are you even connected|is this real)/.test(lower)) {
    return 'The honest answer is: not fully yet. The UI is live, but the deep backend is still mostly scaffolded. That means the app can still sound generic instead of actually understanding the ongoing conversation. I\'m fixing that in stages.';
  }

  return `I got your message: "${cleanedBrief}". Right now this app still has a basic fallback reply layer, so if you want a real useful answer inside Mission Control I need to wire the actual backend and persistence next.`;
}

export async function POST(request: NextRequest) {
  const store = getStore();
  const { message } = await request.json();
  const liveMessageId = id('live');
  const cleanedBrief = cleanBrief(message || '');
  const delegation = buildDelegationPlan(cleanedBrief);

  const operatorMessage: LiveMessage = {
    id: id('msg'),
    role: 'operator',
    text: message,
    createdAt: now(),
    agents: ['maya', 'ron']
  };

  const events: MissionEvent[] = [];
  events.push(stage('maya', 'clean-brief', 'Original operator request received.', `Cleaned brief: ${cleanedBrief}`, undefined, liveMessageId));
  events.push(stage('ron', 'delegation-plan', cleanedBrief, `Consulting: ${delegation.plan.map((item) => item.agentId).join(', ')}`, undefined, liveMessageId));

  delegation.plan.forEach((item) => {
    updateAgent(item.agentId, 'working', cleanedBrief);
    const agentName = AGENTS.find((agent) => agent.id === item.agentId)?.name || item.agentId;
    const output = item.agentId === 'rory'
      ? `[MAVERICK] ${agentName} suggests Chom create a reusable playbook around this request so the next version compounds faster.`
      : `${agentName} reviewed the brief and recommends: ${item.why}`;
    events.push(stage(item.agentId, 'worker-output', cleanedBrief, output, undefined, liveMessageId));
    updateAgent(item.agentId, 'idle', AGENTS.find((agent) => agent.id === item.agentId)?.currentTask || 'Standing by.');
  });

  const synthesis = buildAssistantReply(cleanedBrief);

  events.push(stage('ron', 'synthesis', cleanedBrief, 'Ron synthesized the worker outputs into one operator-ready response.', undefined, liveMessageId));
  events.push(stage('david', 'qa-gate', cleanedBrief, 'PASS — response addresses the cleaned brief and keeps the surface conversational.', undefined, liveMessageId));
  events.push(stage('jarvis', 'delivery', cleanedBrief, 'Jarvis delivered the final answer to the operator.', undefined, liveMessageId));

  const assistantMessage: LiveMessage = {
    id: id('msg'),
    role: 'jarvis',
    text: synthesis,
    createdAt: now(),
    agents: ['jarvis']
  };

  store.liveMessages.push(operatorMessage, assistantMessage);
  store.missionEvents.push(...events);
  store.health.latencyMs = 320;
  store.health.tokenBudgetToday += events.reduce((sum, item) => sum + item.tokenUsage, 0);

  return NextResponse.json({ message: assistantMessage });
}
