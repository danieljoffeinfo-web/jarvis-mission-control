"use client";

import { useEffect, useMemo, useState } from 'react';
import type { Agent } from '@/lib/agents';
import type { HealthSnapshot, LiveMessage, Mission, MissionEvent, Priority, Recommendation, Reminder } from '@/lib/store';

type AgentResponse = { agents: Agent[]; events: MissionEvent[] };
type MissionResponse = { missions: Mission[]; missionEvents: MissionEvent[] };
type RecommendationResponse = { reminders: Reminder[]; recommendations: Recommendation[]; archive: { reminders: Reminder[]; recommendations: Recommendation[] } };

const emptyHealth: HealthSnapshot = {
  activeModel: 'claude-opus-4-7',
  subAgents: [],
  memoryStatus: { reachable: false, lastWriteAt: null, itemCount: 0 },
  connectors: [],
  lastDeploy: { sha: 'local', at: 'Not available' },
  latencyMs: 0,
  tokenBudgetToday: 0
};

export default function MissionControl() {
  const [tab, setTab] = useState<'home' | 'recommendations'>('home');
  const [healthOpen, setHealthOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState<Agent | null>(null);
  const [health, setHealth] = useState<HealthSnapshot>(emptyHealth);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [events, setEvents] = useState<MissionEvent[]>([]);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [missionBrief, setMissionBrief] = useState('');
  const [missionDueAt, setMissionDueAt] = useState('');
  const [missionPriority, setMissionPriority] = useState<Priority>('Medium');
  const [directMessage, setDirectMessage] = useState('');
  const [streamLabel, setStreamLabel] = useState('');

  async function load() {
    const [healthRes, agentRes, missionRes, recommendationRes] = await Promise.all([
      fetch('/api/health').then((res) => res.json()),
      fetch('/api/agents').then((res) => res.json()) as Promise<AgentResponse>,
      fetch('/api/missions').then((res) => res.json()) as Promise<MissionResponse>,
      fetch('/api/recommendations').then((res) => res.json()) as Promise<RecommendationResponse>
    ]);

    setHealth(healthRes);
    setAgents(agentRes.agents);
    setEvents(agentRes.events);
    setMissions(missionRes.missions);
    setReminders(recommendationRes.reminders);
    setRecommendations(recommendationRes.recommendations);
  }

  useEffect(() => {
    load();
  }, []);

  const recommendationBuckets = useMemo(() => ({
    amy: recommendations.filter((item) => item.category === 'amy' && item.status === 'open'),
    rory: recommendations.filter((item) => item.category === 'rory' && item.status === 'open')
  }), [recommendations]);

  async function sendLiveMessage() {
    if (!chatInput.trim()) return;
    setStreamLabel('> Maya is cleaning the brief… > Ron is assigning work…');
    const operator: LiveMessage = {
      id: crypto.randomUUID(),
      role: 'operator',
      text: chatInput,
      createdAt: new Date().toISOString(),
      agents: ['maya', 'ron']
    };
    setMessages((current) => [...current, operator]);
    const input = chatInput;
    setChatInput('');
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    }).then((res) => res.json());
    setMessages((current) => [...current, response.message]);
    setStreamLabel('');
    await load();
  }

  async function createMission() {
    if (!missionBrief.trim()) return;
    await fetch('/api/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief: missionBrief,
        dueAt: missionDueAt || null,
        priority: missionPriority,
        source: 'manual'
      })
    });
    setMissionBrief('');
    setMissionDueAt('');
    setMissionPriority('Medium');
    await load();
  }

  async function sendDirectMessage() {
    if (!agentOpen || !directMessage.trim()) return;
    await fetch(`/api/agents/${agentOpen.id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: directMessage })
    });
    setDirectMessage('');
    await load();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Chom</p>
          <h1>Jarvis Mission Control</h1>
          <p className="subtle">Operator command center for live work, scheduled missions, agent oversight, and recommendations.</p>
        </div>
        <div className="topbar-actions">
          <div className="live-pill"><span className="dot" />Live</div>
          <button className="button secondary" onClick={() => setHealthOpen(true)}>Health check</button>
        </div>
      </header>

      <nav className="tabbar">
        <button className={tab === 'home' ? 'tab active' : 'tab'} onClick={() => setTab('home')}>Mission control</button>
        <button className={tab === 'recommendations' ? 'tab active' : 'tab'} onClick={() => setTab('recommendations')}>Recommendations</button>
      </nav>

      {tab === 'home' ? (
        <main className="home-grid">
          <section className="panel split-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">TUI</p>
                <h2>Live session</h2>
              </div>
              <div className="command-row">
                <span className="chip">/health</span>
                <span className="chip">/agents</span>
                <span className="chip">/clear</span>
                <span className="chip">/mission</span>
              </div>
            </div>
            <div className="terminal">
              {messages.length === 0 ? <p className="empty">No live thread yet. The first message will enter the Maya → Ron → workers → Ron → David → Jarvis pipeline.</p> : null}
              {messages.map((message) => (
                <article key={message.id} className={`terminal-message ${message.role}`}>
                  <div className="terminal-meta">
                    <span>{message.role === 'operator' ? 'Operator' : 'Jarvis'}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <pre>{message.text}</pre>
                  {message.agents.length ? <div className="agent-badges">{message.agents.map((agent) => <span key={agent} className="chip">{agent}</span>)}</div> : null}
                  {message.pipeline?.length ? <div className="pipeline-list">{message.pipeline.map((item) => <p key={item.id}>{`> ${item.agentId} • ${item.stage} • ${item.outputSummary}`}</p>)}</div> : null}
                </article>
              ))}
              {streamLabel ? <p className="stream-label">{streamLabel}</p> : null}
            </div>
            <div className="composer">
              <textarea value={chatInput} onChange={(event) => setChatInput(event.target.value)} placeholder="Talk to Jarvis live. Every message goes through Maya, Ron, the workers, David, then back to Jarvis." />
              <div className="composer-actions">
                <button className="button secondary" onClick={() => setChatInput(`/mission ${chatInput}`)}>Promote to mission</button>
                <button className="button" onClick={sendLiveMessage}>Send live message</button>
              </div>
            </div>
          </section>

          <section className="panel split-panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Missions</p>
                <h2>Scheduled / background work</h2>
              </div>
            </div>
            <div className="mission-composer">
              <textarea value={missionBrief} onChange={(event) => setMissionBrief(event.target.value)} placeholder="Describe the mission. Maya will clean it, Ron will assign it, and the scheduler will run it at the right time." />
              <div className="mission-controls">
                <input type="datetime-local" value={missionDueAt} onChange={(event) => setMissionDueAt(event.target.value)} />
                <select value={missionPriority} onChange={(event) => setMissionPriority(event.target.value as Priority)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
                <button className="button" onClick={createMission}>New mission</button>
              </div>
            </div>
            <div className="mission-list">
              {missions.length === 0 ? <p className="empty">No missions yet. Scheduled work created here will appear with due date, delegation plan, and an agent trail.</p> : null}
              {missions.map((mission) => (
                <article key={mission.id} className="mission-card">
                  <div className="mission-top">
                    <div>
                      <h3>{mission.title}</h3>
                      <p>{mission.cleanedBrief}</p>
                    </div>
                    <span className={`status ${mission.status.toLowerCase().replace(/\s+/g, '-')}`}>{mission.status}</span>
                  </div>
                  <div className="mission-meta">
                    <span>{mission.priority}</span>
                    <span>{mission.dueAt ? new Date(mission.dueAt).toLocaleString() : 'Runs ASAP'}</span>
                    <span>Assigned by {mission.assignedBy}</span>
                  </div>
                  <div className="agent-badges">
                    {mission.delegationPlan.map((item) => <span key={`${mission.id}-${item.agentId}`} className="chip">{item.agentId}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="panel full-span">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Agent room</p>
                <h2>Fixed roster</h2>
              </div>
            </div>
            <div className="agent-grid">
              {agents.map((agent) => (
                <button key={agent.id} className="agent-card" onClick={() => setAgentOpen(agent)}>
                  <div className="agent-avatar" style={{ borderColor: agent.accentColor, color: agent.accentColor }}>{agent.avatar}</div>
                  <div className="agent-copy">
                    <strong>{agent.name}</strong>
                    <span>{agent.title}</span>
                    <div className="agent-status"><span className={`dot ${agent.currentStatus}`} />currently: {agent.currentTask}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <main className="recommendations-grid">
          <section className="panel">
            <div className="panel-head"><div><p className="eyebrow">Reminders</p><h2>Synced inbox</h2></div></div>
            {reminders.length === 0 ? <p className="empty">No reminder source is connected yet. This tab is ready for Apple Reminders or another source once the backend connector is wired.</p> : reminders.map((reminder) => <article key={reminder.id} className="recommendation-card"><h3>{reminder.title}</h3></article>)}
          </section>
          <section className="panel">
            <div className="panel-head"><div><p className="eyebrow">Amy’s recommendations</p><h2>Admin and operations</h2></div></div>
            {recommendationBuckets.amy.length === 0 ? <p className="empty">Amy has not published any recommendations yet.</p> : recommendationBuckets.amy.map((item) => <article key={item.id} className="recommendation-card"><h3>{item.title}</h3><p>{item.observation}</p></article>)}
          </section>
          <section className="panel">
            <div className="panel-head"><div><p className="eyebrow">Rory’s maverick ideas</p><h2>Growth wildcards</h2></div></div>
            {recommendationBuckets.rory.length === 0 ? <p className="empty">Rory has no open [MAVERICK] ideas yet.</p> : recommendationBuckets.rory.map((item) => <article key={item.id} className="recommendation-card"><h3>[MAVERICK] {item.title}</h3><p>{item.observation}</p></article>)}
          </section>
        </main>
      )}

      {healthOpen ? (
        <aside className="drawer">
          <div className="drawer-head">
            <div>
              <p className="eyebrow">Health check</p>
              <h2>Operational state</h2>
            </div>
            <button className="text-button" onClick={() => setHealthOpen(false)}>Close</button>
          </div>
          <dl className="health-list">
            <div><dt>Active model</dt><dd>{health.activeModel}</dd></div>
            <div><dt>Memory reachable</dt><dd>{health.memoryStatus.reachable ? 'Yes' : 'No'}</dd></div>
            <div><dt>Last memory write</dt><dd>{health.memoryStatus.lastWriteAt || 'No writes yet'}</dd></div>
            <div><dt>Memory items</dt><dd>{health.memoryStatus.itemCount}</dd></div>
            <div><dt>Last deploy</dt><dd>{health.lastDeploy.sha}</dd></div>
            <div><dt>Latency</dt><dd>{health.latencyMs} ms</dd></div>
            <div><dt>Token budget today</dt><dd>{health.tokenBudgetToday}</dd></div>
          </dl>
          <div className="subsection">
            <h3>Sub-agents online</h3>
            {health.subAgents.map((agent) => <p key={agent.id}><span className={`dot ${agent.status}`} /> {agent.name} — {agent.currentTask}</p>)}
          </div>
          <div className="subsection">
            <h3>Connectors</h3>
            {health.connectors.length === 0 ? <p className="empty tight">No connectors are configured yet.</p> : health.connectors.map((connector) => <p key={connector.id}>{connector.name}</p>)}
          </div>
        </aside>
      ) : null}

      {agentOpen ? (
        <aside className="drawer">
          <div className="drawer-head">
            <div>
              <p className="eyebrow">{agentOpen.name}</p>
              <h2>{agentOpen.title}</h2>
            </div>
            <button className="text-button" onClick={() => setAgentOpen(null)}>Close</button>
          </div>
          <div className="agent-panel-section">
            <h3>Now</h3>
            <p>{agentOpen.currentTask}</p>
          </div>
          <div className="agent-panel-section">
            <h3>Recent activity</h3>
            {events.filter((event) => event.agentId === agentOpen.id).slice(0, 50).map((event) => (
              <article key={event.id} className="event-card">
                <strong>{event.stage}</strong>
                <p>{event.outputSummary}</p>
                <span>{new Date(event.timestamp).toLocaleString()}</span>
              </article>
            ))}
          </div>
          <div className="agent-panel-section">
            <h3>System prompt</h3>
            <details>
              <summary>Show prompt</summary>
              <pre className="prompt-view">{agentOpen.systemPrompt}</pre>
            </details>
          </div>
          <div className="agent-panel-section">
            <h3>Direct message</h3>
            <textarea value={directMessage} onChange={(event) => setDirectMessage(event.target.value)} placeholder={`Message ${agentOpen.name} directly.`} />
            <button className="button" onClick={sendDirectMessage}>Send direct message</button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
