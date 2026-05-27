import { NextRequest, NextResponse } from 'next/server';
import { insertEvents, insertMission, listEvents, listMissions, makeId } from '@/lib/backend';
import type { Mission, MissionEvent } from '@/lib/store';

function now() {
  return new Date().toISOString();
}

export async function GET() {
  const [missions, missionEvents] = await Promise.all([listMissions(), listEvents(200)]);
  return NextResponse.json({ missions, missionEvents });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const cleanedBrief = String(body.brief || '').trim().replace(/\s+/g, ' ');
  const mission: Mission = {
    id: makeId('mission'),
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
    result: body.dueAt ? '' : 'Mission stored. Scheduler wiring still needs to be completed for autonomous execution.',
    source: body.source || 'manual'
  };

  const event: MissionEvent = {
    id: makeId('evt'),
    missionId: mission.id,
    agentId: 'maya',
    stage: 'mission-created',
    timestamp: now(),
    inputSummary: mission.originalBrief,
    outputSummary: mission.cleanedBrief,
    tokenUsage: Math.max(10, Math.round(cleanedBrief.length / 4))
  };

  await insertMission(mission);
  await insertEvents([event]);

  return NextResponse.json({ mission });
}
