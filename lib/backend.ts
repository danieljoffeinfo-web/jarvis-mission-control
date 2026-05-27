import { AGENTS, Agent } from '@/lib/agents';
import { getAdminClient } from '@/lib/supabase';
import type { HealthSnapshot, LiveMessage, Mission, MissionEvent, Recommendation, Reminder } from '@/lib/store';

const OPERATOR_EMAIL = 'dan@chom.local';
const OPERATOR_NAME = 'Dan';

type DbAgent = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  accent_color: string;
  system_prompt: string;
  tools: string[];
};

type DbMessage = {
  id: string;
  role: 'operator' | 'jarvis';
  text: string;
  agents: string[];
  created_at: string;
};

type DbMission = {
  id: string;
  title: string;
  original_brief: string;
  cleaned_brief: string;
  due_at: string | null;
  priority: 'Low' | 'Medium' | 'High';
  assigned_by: string;
  delegation_plan: { agentId: string; why: string }[];
  status: Mission['status'];
  result: string;
  source: 'manual' | 'reminder';
};

type DbEvent = {
  id: string;
  mission_id: string | null;
  live_message_id: string | null;
  agent_id: string;
  stage: string;
  created_at: string;
  input_summary: string;
  output_summary: string;
  token_usage: number;
};

function now() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function ensureOperator() {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('operators')
    .upsert({ email: OPERATOR_EMAIL, name: OPERATOR_NAME }, { onConflict: 'email' })
    .select('id,email,name')
    .single();

  if (error) throw error;
  return data;
}

export async function syncAgents() {
  const supabase = getAdminClient();
  const payload = AGENTS.map((agent) => ({
    id: agent.id,
    name: agent.name,
    title: agent.title,
    avatar: agent.avatar,
    accent_color: agent.accentColor,
    system_prompt: agent.systemPrompt,
    tools: agent.tools
  }));

  const { error } = await supabase.from('agents').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function listAgents(): Promise<Agent[]> {
  await syncAgents();
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('agents').select('*').order('name');
  if (error) throw error;

  return (data as DbAgent[]).map((row) => {
    const fallback = AGENTS.find((agent) => agent.id === row.id);
    return {
      id: row.id,
      name: row.name,
      title: row.title,
      avatar: row.avatar,
      accentColor: row.accent_color,
      systemPrompt: row.system_prompt,
      tools: row.tools,
      currentStatus: fallback?.currentStatus || 'idle',
      currentTask: fallback?.currentTask || 'Standing by.'
    };
  });
}

export async function listMessages(): Promise<LiveMessage[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('live_messages')
    .select('id, role, text, agents, created_at')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) throw error;

  return (data as DbMessage[]).map((row) => ({
    id: row.id,
    role: row.role,
    text: row.text,
    agents: row.agents || [],
    createdAt: row.created_at
  }));
}

export async function insertMessage(message: LiveMessage) {
  const supabase = getAdminClient();
  const operator = await ensureOperator();
  const { error } = await supabase.from('live_messages').insert({
    id: message.id,
    operator_id: operator.id,
    role: message.role,
    text: message.text,
    agents: message.agents,
    created_at: message.createdAt
  });
  if (error) throw error;
}

export async function listEvents(limit = 100): Promise<MissionEvent[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('mission_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data as DbEvent[]).map((row) => ({
    id: row.id,
    missionId: row.mission_id || undefined,
    liveMessageId: row.live_message_id || undefined,
    agentId: row.agent_id,
    stage: row.stage,
    timestamp: row.created_at,
    inputSummary: row.input_summary,
    outputSummary: row.output_summary,
    tokenUsage: row.token_usage
  }));
}

export async function insertEvents(events: MissionEvent[]) {
  if (!events.length) return;
  const supabase = getAdminClient();
  const payload = events.map((event) => ({
    id: event.id,
    mission_id: event.missionId || null,
    live_message_id: event.liveMessageId || null,
    agent_id: event.agentId,
    stage: event.stage,
    created_at: event.timestamp,
    input_summary: event.inputSummary,
    output_summary: event.outputSummary,
    token_usage: event.tokenUsage
  }));
  const { error } = await supabase.from('mission_events').insert(payload);
  if (error) throw error;
}

export async function listMissions(): Promise<Mission[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('missions').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) throw error;

  return (data as DbMission[]).map((row) => ({
    id: row.id,
    title: row.title,
    originalBrief: row.original_brief,
    cleanedBrief: row.cleaned_brief,
    dueAt: row.due_at,
    priority: row.priority,
    assignedBy: row.assigned_by,
    delegationPlan: row.delegation_plan,
    status: row.status,
    result: row.result,
    source: row.source
  }));
}

export async function insertMission(mission: Mission) {
  const supabase = getAdminClient();
  const operator = await ensureOperator();
  const { error } = await supabase.from('missions').insert({
    id: mission.id,
    operator_id: operator.id,
    title: mission.title,
    original_brief: mission.originalBrief,
    cleaned_brief: mission.cleanedBrief,
    due_at: mission.dueAt,
    priority: mission.priority,
    assigned_by: mission.assignedBy,
    delegation_plan: mission.delegationPlan,
    status: mission.status,
    result: mission.result,
    source: mission.source,
    created_at: now(),
    updated_at: now()
  });
  if (error) throw error;
}

export async function listRecommendations(): Promise<{ reminders: Reminder[]; recommendations: Recommendation[] }> {
  const supabase = getAdminClient();
  const [remindersRes, recRes] = await Promise.all([
    supabase.from('reminders').select('*').order('created_at', { ascending: false }).limit(100),
    supabase.from('recommendations').select('*').order('created_at', { ascending: false }).limit(100)
  ]);

  if (remindersRes.error) throw remindersRes.error;
  if (recRes.error) throw recRes.error;

  const reminders = (remindersRes.data || []).map((row: any) => ({
    id: row.id,
    title: row.title,
    dueAt: row.due_at,
    source: row.source,
    status: row.status
  }));

  const recommendations = (recRes.data || []).map((row: any) => ({
    id: row.id,
    category: row.category,
    title: row.title,
    observation: row.observation,
    suggestedAction: row.suggested_action,
    status: row.status,
    createdAt: row.created_at
  }));

  return { reminders, recommendations };
}

export async function buildHealth(): Promise<HealthSnapshot> {
  const [agents, events] = await Promise.all([listAgents(), listEvents(200)]);
  const latestEvent = events[0];

  return {
    activeModel: process.env.ACTIVE_MODEL || 'backend-not-configured',
    subAgents: agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      status: 'idle',
      currentTask: latestEvent?.agentId === agent.id ? latestEvent.outputSummary : agent.currentTask
    })),
    memoryStatus: {
      reachable: true,
      lastWriteAt: latestEvent?.timestamp || null,
      itemCount: events.length
    },
    connectors: [
      { id: 'supabase', name: 'Supabase', status: 'green' }
    ],
    lastDeploy: {
      sha: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
      at: process.env.VERCEL_GIT_COMMIT_MESSAGE || now()
    },
    latencyMs: 180,
    tokenBudgetToday: events.reduce((sum, item) => sum + item.tokenUsage, 0)
  };
}
