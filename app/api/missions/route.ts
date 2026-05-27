import { NextRequest, NextResponse } from 'next/server';
import { getStore, Mission, MissionEvent } from '@/lib/store';

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

export async function GET() {
  const store = getStore();
  return NextResponse.json({ missions: store.missions, missionEvents: store.missionEvents });
}

export async function POST(request: NextRequest) {
  const store = getStore();
  const body = await request.json();
  const cleanedBrief = String(body.brief || '').trim().replace(/\s+/g, ' ');
  const mission: Mission = {
    id: id('mission'),
    title: cleanedBrief.slice(0, 72) || 'Untitled mission',
    originalBrief: String(body.brief || ''),
    cleanedBrief,
    dueAt: body.dueAt || null,
    priority: body.priority || 'Medium',
    assignedBy: 'ron',
    delegationPlan: [
      { agentId: 'maya', why: 'Clean the request.' },
      { agentId: 'ron', why: 'Assign work.' },
      { agentId: 'david', why: 'Final QA gate.' }
    ],
    status: body.dueAt ? 'Scheduled' : 'In Progress',
    result: body.dueAt ? '' : 'Mission queued for background execution. Ron will synthesize output when the worker loop runs.',
    source: body.source || 'manual'
  };

  const event: MissionEvent = {
    id: id('evt'),
    missionId: mission.id,
    agentId: 'maya',
    stage: 'mission-created',
    timestamp: now(),
    inputSummary: mission.originalBrief,
    outputSummary: mission.cleanedBrief,
    tokenUsage: Math.max(10, Math.round(cleanedBrief.length / 4))
  };

  store.missions.unshift(mission);
  store.missionEvents.unshift(event);
  return NextResponse.json({ mission });
}
