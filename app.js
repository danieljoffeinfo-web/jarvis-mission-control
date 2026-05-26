const STORAGE_KEY = 'jarvis-mission-control-state-v1';

const seedState = {
  agents: [
    {
      id: 'a1',
      name: 'Atlas',
      role: 'Operations orchestrator',
      lane: 'Operations',
      status: 'busy',
      progress: 74,
      task: 'Reconciling active operations board and mapping blockers into the next action queue.'
    },
    {
      id: 'a2',
      name: 'Nova',
      role: 'Research analyst',
      lane: 'Research',
      status: 'busy',
      progress: 52,
      task: 'Summarising client-side opportunities and surfacing decision-grade notes.'
    },
    {
      id: 'a3',
      name: 'Helix',
      role: 'Delivery operator',
      lane: 'Delivery',
      status: 'queued',
      progress: 26,
      task: 'Preparing deployment readiness checks and release notes for the next ship window.'
    },
    {
      id: 'a4',
      name: 'Pulse',
      role: 'Optimization monitor',
      lane: 'Optimization',
      status: 'idle',
      progress: 0,
      task: 'Awaiting new directive.'
    }
  ],
  directives: [
    {
      id: crypto.randomUUID(),
      text: 'Audit the travel bookings workflow and isolate current blockers.',
      lane: 'Operations',
      priority: 'High',
      assignee: 'Atlas'
    },
    {
      id: crypto.randomUUID(),
      text: 'Prepare a concise research brief for the next optimization sprint.',
      lane: 'Research',
      priority: 'Medium',
      assignee: 'Nova'
    }
  ],
  goals: [
    {
      id: crypto.randomUUID(),
      title: 'Consolidate operator oversight into one command surface',
      owner: 'Jarvis',
      deadline: '2026-06-02',
      complete: false
    },
    {
      id: crypto.randomUUID(),
      title: 'Reduce context switching across missions and status checks',
      owner: 'Operations',
      deadline: '2026-06-09',
      complete: true
    }
  ],
  milestones: [
    {
      id: crypto.randomUUID(),
      name: 'Operator roster mapped',
      description: 'Every active agent exposes a live workload card with lane, directive, and progress.',
      complete: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Directive dispatch online',
      description: 'New prompts create execution events and automatically load the most suitable operator.',
      complete: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Goal board online',
      description: 'Mission goals are stored, reviewable, and can be closed directly from the board.',
      complete: false
    },
    {
      id: crypto.randomUUID(),
      name: 'Progress telemetry stable',
      description: 'Mission control summarises completion ratios, fleet load, and objective momentum.',
      complete: false
    }
  ],
  activities: [
    {
      id: crypto.randomUUID(),
      time: timestamp(),
      title: 'Mission control initialized',
      detail: 'Booted default operator roster, milestones, and command surface.'
    },
    {
      id: crypto.randomUUID(),
      time: timestamp(),
      title: 'Atlas assigned operations review',
      detail: 'Operations lane locked on current blocker review and queue normalisation.'
    }
  ]
};

let state = loadState();

const statsGrid = document.getElementById('stats-grid');
const directivesList = document.getElementById('directive-list');
const agentsList = document.getElementById('agents-list');
const goalsList = document.getElementById('goals-list');
const milestonesList = document.getElementById('milestones-list');
const activityFeed = document.getElementById('activity-feed');
const promptForm = document.getElementById('prompt-form');
const goalForm = document.getElementById('goal-form');
const resetButton = document.getElementById('reset-demo');

promptForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const directive = document.getElementById('prompt-input').value.trim();
  const priority = document.getElementById('prompt-priority').value;
  const lane = document.getElementById('prompt-lane').value;

  if (!directive) return;

  const agent = pickAgent(lane);
  agent.status = 'busy';
  agent.progress = Math.min(18, agent.progress || 0);
  agent.task = directive;

  state.directives.unshift({
    id: crypto.randomUUID(),
    text: directive,
    lane,
    priority,
    assignee: agent.name
  });
  state.directives = state.directives.slice(0, 6);

  pushActivity(`Directive dispatched to ${agent.name}`, `${priority} priority • ${lane} lane • ${directive}`);

  document.getElementById('prompt-input').value = '';
  render();
});

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('goal-title').value.trim();
  const owner = document.getElementById('goal-owner').value.trim() || 'Jarvis';
  const deadline = document.getElementById('goal-deadline').value || 'No date';

  if (!title) return;

  state.goals.unshift({
    id: crypto.randomUUID(),
    title,
    owner,
    deadline,
    complete: false
  });

  pushActivity('Goal registered', `${title} • owner: ${owner} • deadline: ${deadline}`);
  goalForm.reset();
  render();
});

resetButton.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(seedState);
  render();
});

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return structuredClone(seedState);
  try {
    return JSON.parse(stored);
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function pushActivity(title, detail) {
  state.activities.unshift({
    id: crypto.randomUUID(),
    time: timestamp(),
    title,
    detail
  });
  state.activities = state.activities.slice(0, 10);
  saveState();
}

function pickAgent(lane) {
  const ranked = [...state.agents].sort((a, b) => {
    const laneBias = (a.lane === lane ? -1 : 0) - (b.lane === lane ? -1 : 0);
    if (laneBias !== 0) return laneBias;
    const statusWeight = statusRank(a.status) - statusRank(b.status);
    if (statusWeight !== 0) return statusWeight;
    return (a.progress || 0) - (b.progress || 0);
  });
  return ranked[0];
}

function statusRank(status) {
  return { idle: 0, queued: 1, busy: 2, complete: 3 }[status] ?? 5;
}

function cycleAgent(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) return;

  if (agent.status === 'idle') {
    agent.status = 'queued';
    agent.progress = 12;
    agent.task = 'Queued for the next incoming directive.';
  } else if (agent.status === 'queued') {
    agent.status = 'busy';
    agent.progress = Math.max(agent.progress, 35);
  } else if (agent.status === 'busy') {
    agent.status = 'complete';
    agent.progress = 100;
  } else {
    agent.status = 'idle';
    agent.progress = 0;
    agent.task = 'Awaiting new directive.';
  }

  pushActivity(`${agent.name} status updated`, `${agent.status.toUpperCase()} • ${agent.task}`);
  render();
}

function toggleGoal(goalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;
  goal.complete = !goal.complete;
  pushActivity(goal.complete ? 'Goal closed' : 'Goal reopened', goal.title);
  render();
}

function toggleMilestone(milestoneId) {
  const milestone = state.milestones.find((item) => item.id === milestoneId);
  if (!milestone) return;
  milestone.complete = !milestone.complete;
  pushActivity(milestone.complete ? 'Milestone secured' : 'Milestone reopened', milestone.name);
  render();
}

function computeStats() {
  const busyAgents = state.agents.filter((agent) => agent.status === 'busy').length;
  const completedGoals = state.goals.filter((goal) => goal.complete).length;
  const completedMilestones = state.milestones.filter((milestone) => milestone.complete).length;
  const missionCoverage = Math.round((completedMilestones / Math.max(state.milestones.length, 1)) * 100);

  return [
    {
      label: 'Active agents',
      value: state.agents.length,
      subtext: `${busyAgents} busy • ${state.agents.filter((a) => a.status === 'idle').length} idle`
    },
    {
      label: 'Mission coverage',
      value: `${missionCoverage}%`,
      subtext: `${completedMilestones}/${state.milestones.length} milestones locked`
    },
    {
      label: 'Goals in flight',
      value: state.goals.length,
      subtext: `${completedGoals} completed • ${state.goals.length - completedGoals} open`
    },
    {
      label: 'Recent directives',
      value: state.directives.length,
      subtext: `${state.activities.length} mission events retained in the activity stream`
    }
  ];
}

function renderStats() {
  statsGrid.innerHTML = '';
  for (const stat of computeStats()) {
    const card = document.createElement('article');
    card.className = 'stat-card';
    card.innerHTML = `
      <p class="label">${stat.label}</p>
      <p class="value">${stat.value}</p>
      <p class="subtext">${stat.subtext}</p>
    `;
    statsGrid.appendChild(card);
  }
}

function renderAgents() {
  agentsList.innerHTML = '';
  const template = document.getElementById('agent-template');

  for (const agent of state.agents) {
    const node = template.content.cloneNode(true);
    node.querySelector('.agent-name').textContent = agent.name;
    node.querySelector('.agent-role').textContent = agent.role;
    node.querySelector('.agent-task').textContent = agent.task;
    node.querySelector('.agent-progress-label').textContent = `${agent.progress}% complete`;
    node.querySelector('.agent-lane').textContent = agent.lane;

    const status = node.querySelector('.agent-status');
    status.textContent = readableStatus(agent.status);
    status.classList.add(agent.status);

    const progress = node.querySelector('.progress-bar span');
    progress.style.width = `${agent.progress}%`;

    node.querySelector('.agent-cycle').addEventListener('click', () => cycleAgent(agent.id));
    agentsList.appendChild(node);
  }
}

function renderGoals() {
  goalsList.innerHTML = '';
  const template = document.getElementById('goal-template');

  for (const goal of state.goals) {
    const node = template.content.cloneNode(true);
    node.querySelector('.goal-title').textContent = goal.title;
    node.querySelector('.goal-meta').textContent = `Owner: ${goal.owner} • Deadline: ${goal.deadline}`;

    const status = node.querySelector('.goal-status');
    status.textContent = goal.complete ? 'Complete' : 'In progress';
    status.classList.add(goal.complete ? 'complete' : 'in-progress');

    const button = node.querySelector('.goal-toggle');
    button.textContent = goal.complete ? 'Reopen' : 'Mark complete';
    button.addEventListener('click', () => toggleGoal(goal.id));

    goalsList.appendChild(node);
  }
}

function renderMilestones() {
  milestonesList.innerHTML = '';
  const template = document.getElementById('milestone-template');

  for (const milestone of state.milestones) {
    const node = template.content.cloneNode(true);
    node.querySelector('.milestone-name').textContent = milestone.name;
    node.querySelector('.milestone-description').textContent = milestone.description;

    const status = node.querySelector('.milestone-status');
    status.textContent = milestone.complete ? 'Online' : 'Pending';
    status.classList.add(milestone.complete ? 'complete' : 'queued');

    const button = node.querySelector('.milestone-toggle');
    button.textContent = milestone.complete ? 'Reopen' : 'Confirm';
    button.addEventListener('click', () => toggleMilestone(milestone.id));

    milestonesList.appendChild(node);
  }
}

function renderDirectives() {
  directivesList.innerHTML = '';
  const template = document.getElementById('directive-template');

  for (const directive of state.directives) {
    const node = template.content.cloneNode(true);
    node.querySelector('.directive-title').textContent = directive.text;
    node.querySelector('.directive-meta').textContent = `${directive.priority} priority • ${directive.lane} lane • assigned to ${directive.assignee}`;

    const badge = node.querySelector('.directive-priority');
    badge.textContent = directive.priority;
    badge.classList.add(`${directive.priority.toLowerCase()}-priority`);

    directivesList.appendChild(node);
  }
}

function renderActivity() {
  activityFeed.innerHTML = '';
  const template = document.getElementById('activity-template');

  for (const item of state.activities) {
    const node = template.content.cloneNode(true);
    node.querySelector('.activity-time').textContent = item.time;
    node.querySelector('.activity-title').textContent = item.title;
    node.querySelector('.activity-detail').textContent = item.detail;
    activityFeed.appendChild(node);
  }
}

function readableStatus(status) {
  return {
    idle: 'Idle',
    queued: 'Queued',
    busy: 'Busy',
    complete: 'Complete'
  }[status] || status;
}

function render() {
  saveState();
  renderStats();
  renderDirectives();
  renderAgents();
  renderGoals();
  renderMilestones();
  renderActivity();
}

render();
