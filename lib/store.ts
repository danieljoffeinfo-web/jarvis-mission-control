import type { AgentStatus } from '@/lib/agents';

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
