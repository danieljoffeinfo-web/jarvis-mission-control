import { AGENTS, Agent, AgentStatus } from '@/lib/agents';

export type Role = 'operator' | 'jarvis';
export type MissionStatus = 'Scheduled' | 'In Progress' | 'In QA' | 'Blocked' | 'Complete' | 'Failed';
export type Priority = 'Low' | 'Medium' | 'High';

export type MissionEvent = {
  id: string;
  missionId?: string;
  liveMessageId?: string;
  agentId: string;
  stage: string;
  timestamp: string;
  inputSummary: string;
  outputSummary: string;
  tokenUsage: number;
};

export type LiveMessage = {
  id: string;
  role: Role;
  text: string;
  createdAt: string;
  agents: string[];
  pipeline?: MissionEvent[];
};

export type Mission = {
  id: string;
  title: string;
  originalBrief: string;
  cleanedBrief: string;
  dueAt: string | null;
  priority: Priority;
  assignedBy: string;
  delegationPlan: { agentId: string; why: string }[];
  status: MissionStatus;
  result: string;
  source: 'manual' | 'reminder';
};

export type Recommendation = {
  id: string;
  category: 'amy' | 'rory';
  title: string;
  observation: string;
  suggestedAction: string;
  status: 'open' | 'dismissed' | 'accepted';
  createdAt: string;
};

export type Reminder = {
  id: string;
  title: string;
  dueAt: string | null;
  source: string;
  status: 'open' | 'done' | 'dismissed';
};

export type HealthSnapshot = {
  activeModel: string;
  subAgents: Array<{ id: string; name: string; status: AgentStatus; currentTask: string }>;
  memoryStatus: { reachable: boolean; lastWriteAt: string | null; itemCount: number };
  connectors: Array<{ id: string; name: string; status: 'green' | 'amber' | 'red' }>;
  lastDeploy: { sha: string; at: string };
  latencyMs: number;
  tokenBudgetToday: number;
};

export type AppState = {
  agents: Agent[];
  liveMessages: LiveMessage[];
  missions: Mission[];
  missionEvents: MissionEvent[];
  reminders: Reminder[];
  recommendations: Recommendation[];
  health: HealthSnapshot;
};

const globalForStore = globalThis as unknown as { missionControlStore?: AppState };

function now() {
  return new Date().toISOString();
}

function createInitialState(): AppState {
  return {
    agents: AGENTS,
    liveMessages: [],
    missions: [],
    missionEvents: [],
    reminders: [],
    recommendations: [],
    health: {
      activeModel: process.env.ACTIVE_MODEL || 'claude-opus-4-7',
      subAgents: AGENTS.map((agent) => ({
        id: agent.id,
        name: agent.name,
        status: agent.currentStatus,
        currentTask: agent.currentTask
      })),
      memoryStatus: { reachable: false, lastWriteAt: null, itemCount: 0 },
      connectors: [],
      lastDeploy: {
        sha: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        at: process.env.VERCEL_GIT_COMMIT_MESSAGE || now()
      },
      latencyMs: 0,
      tokenBudgetToday: 0
    }
  };
}

export function getStore() {
  if (!globalForStore.missionControlStore) {
    globalForStore.missionControlStore = createInitialState();
  }
  return globalForStore.missionControlStore;
}

export function updateAgent(agentId: string, status: AgentStatus, currentTask: string) {
  const store = getStore();
  store.agents = store.agents.map((agent) =>
    agent.id === agentId ? { ...agent, currentStatus: status, currentTask } : agent
  );
  store.health.subAgents = store.agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    status: agent.currentStatus,
    currentTask: agent.currentTask
  }));
}
