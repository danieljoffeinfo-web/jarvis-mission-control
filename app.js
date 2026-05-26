const STORAGE_KEY = 'jarvis-mission-control-state-v2';

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const seedState = {
  agents: [
    {
      id: 'a1',
      name: 'Atlas',
      role: 'Operations lead',
      lane: 'Operations',
      status: 'busy',
      progress: 78,
      task: 'Checking current travel operations and clearing blockers before tomorrow morning.'
    },
    {
      id: 'a2',
      name: 'Nova',
      role: 'Research support',
      lane: 'Research',
      status: 'busy',
      progress: 46,
      task: 'Summarising opportunities, priorities, and key notes for the next mission.'
    },
    {
      id: 'a3',
      name: 'Helix',
      role: 'Delivery support',
      lane: 'Delivery',
      status: 'queued',
      progress: 22,
      task: 'Waiting to package the next release or handoff.'
    },
    {
      id: 'a4',
      name: 'Pulse',
      role: 'Optimization monitor',
      lane: 'Optimization',
      status: 'idle',
      progress: 0,
      task: 'Standing by for a new brief.'
    }
  ],
  directives: [
    {
      id: crypto.randomUUID(),
      text: 'Review today\'s travel bookings and isolate the top blockers.',
      lane: 'Operations',
      priority: 'High',
      assignee: 'Atlas'
    },
    {
      id: crypto.randomUUID(),
      text: 'Prepare a short research note for tomorrow\'s planning call.',
      lane: 'Research',
      priority: 'Medium',
      assignee: 'Nova'
    }
  ],
  goals: [
    {
      id: crypto.randomUUID(),
      title: 'Keep tomorrow organised before the day starts',
      owner: 'Jarvis',
      deadline: '2026-05-27',
      complete: false
    },
    {
      id: crypto.randomUUID(),
      title: 'Reduce context switching across missions',
      owner: 'Operations',
      deadline: '2026-06-09',
      complete: true
    }
  ],
  jobs: [
    {
      id: crypto.randomUUID(),
      title: 'Morning travel operations review',
      schedule: 'Every weekday at 08:30',
      brief: 'Check urgent work, summarise blockers, and give me the top priorities first.',
      active: true
    },
    {
      id: crypto.randomUUID(),
      title: 'Friday deployment readiness check',
      schedule: 'Every Friday at 14:00',
      brief: 'Review what is ready to ship and what still needs attention before deployment.',
      active: false
    }
  ],
  workflows: [
    {
      id: 'wf-redeploy',
      title: 'Redeploy this dashboard',
      summary: 'The repeatable flow I will use whenever you ask me to update and redeploy Jarvis Mission Control.',
      steps: [
        'Update the files in the repo.',
        'Preview and verify the interface locally.',
        'Commit the changes and push to GitHub.',
        'Deploy to Vercel and verify the live site.'
      ]
    },
    {
      id: 'wf-jobs',
      title: 'Create a recurring Hermes job',
      summary: 'The repeatable flow I will use when you ask for a scheduled job or recurring automation.',
      steps: [
        'Capture the result you want in plain English.',
        'Turn that into a self-contained job prompt.',
        'Choose the schedule and destination.',
        'Save the job and verify it is listed correctly.'
      ]
    }
  ],
  manual: [
    {
      step: '01',
      title: 'Start with the mission briefing box',
      body: 'Type what you want in normal language. You do not need special prompts or technical wording.'
    },
    {
      step: '02',
      title: 'Use goals for outcomes',
      body: 'A goal is the result you care about. Add it once, then mark it complete when it has happened.'
    },
    {
      step: '03',
      title: 'Use jobs for repeat work',
      body: 'A job is for something you want repeated on a schedule, like a morning summary or a Friday check-in.'
    },
    {
      step: '04',
      title: 'Read the activity stream when unsure',
      body: 'The activity feed is the simple history of what changed most recently inside this control room.'
    }
  ],
  milestones: [
    {
      id: crypto.randomUUID(),
      name: 'Dark Hermes-style redesign complete',
      description: 'The interface now uses a black control-room layout with clearer structure and calmer labels.',
      complete: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Plain-English manual included',
      description: 'A built-in manual explains what to do in ordinary language instead of developer terminology.',
      complete: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Jobs area working',
      description: 'You can save recurring jobs directly in the dashboard and toggle them on or off.',
      complete: true
    },
    {
      id: crypto.randomUUID(),
      name: 'Backend wiring still optional',
      description: 'The current version is a strong working frontend. Live Hermes back-end integration can be added next if you want it.',
      complete: false
    }
  ],
  activities: [
    {
      id: crypto.randomUUID(),
      time: timestamp(),
      title: 'Mission room redesigned',
      detail: 'Switched to the black Hermes-inspired layout and added a simpler operating guide.'
    },
    {
      id: crypto.randomUUID(),
      time: timestamp(),
      title: 'Saved workflows added',
      detail: 'Redeploy and recurring-job playbooks are now visible inside the dashboard.'
    }
  ]
};

let state = loadState();

const statsGrid = document.getElementById('stats-grid');
const directivesList = document.getElementById('directive-list');
const agentsList = document.getElementById('agents-list');
const goalsList = document.getElementById('goals-list');
const jobsList = document.getElementById('jobs-list');
const workflowList = document.getElementById('workflow-list');
const manualList = document.getElementById('manual-list');
const milestonesList = document.getElementById('milestones-list');
const activityFeed = document.getElementById('activity-feed');

const promptForm = document.getElementById('prompt-form');
const goalForm = document.getElementById('goal-form');
const jobForm = document.getElementById('job-form');
const resetButton = document.getElementById('reset-demo');
const jumpButtons = document.querySelectorAll('[data-scroll-target]');

promptForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const directive = document.getElementById('prompt-input').value.trim();
  const priority = document.getElementById('prompt-priority').value;
  const lane = document.getElementById('prompt-lane').value;
  if (!directive) return;

  const agent = pickAgent(lane);
  agent.status = 'busy';
  agent.progress = Math.min(25, Math.max(agent.progress, 12));
  agent.task = directive;

  state.directives.unshift({
    id: crypto.randomUUID(),
    text: directive,
    lane,
    priority,
    assignee: agent.name
  });
  state.directives = state.directives.slice(0, 8);

  pushActivity('Mission brief sent', `${priority} importance • ${lane} lane • assigned to ${agent.name}`);
  document.getElementById('prompt-input').value = '';
  render();
});

goalForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('goal-title').value.trim();
  const owner = document.getElementById('goal-owner').value.trim() || 'Jarvis';
  const deadline = document.getElementById('goal-deadline').value || 'No date yet';
  if (!title) return;

  state.goals.unshift({
    id: crypto.randomUUID(),
    title,
    owner,
    deadline,
    complete: false
  });

  goalForm.reset();
  pushActivity('Goal added', `${title} • owner: ${owner}`);
  render();
});

jobForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = document.getElementById('job-title').value.trim();
  const schedule = document.getElementById('job-schedule').value.trim();
  const brief = document.getElementById('job-brief').value.trim();
  if (!title || !schedule || !brief) return;

  state.jobs.unshift({
    id: crypto.randomUUID(),
    title,
    schedule,
    brief,
    active: true
  });

  jobForm.reset();
  pushActivity('Job saved', `${title} • ${schedule}`);
  render();
});

resetButton.addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(seedState);
  render();
});

jumpButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.scrollTarget);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedState);
  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function pushActivity(title, detail) {
  state.activities.unshift({
    id: crypto.randomUUID(),
    time: timestamp(),
    title,
    detail
  });
  state.activities = state.activities.slice(0, 12);
  saveState();
}

function pickAgent(lane) {
  return [...state.agents].sort((a, b) => {
    const laneBias = Number(b.lane === lane) - Number(a.lane === lane);
    if (laneBias !== 0) return laneBias;
    return statusScore(a.status) - statusScore(b.status) || a.progress - b.progress;
  })[0];
}

function statusScore(status) {
  return { idle: 0, queued: 1, busy: 2, complete: 3 }[status] ?? 9;
}

function cycleAgent(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) return;

  if (agent.status === 'idle') {
    agent.status = 'queued';
    agent.progress = 12;
    agent.task = 'Queued for the next mission brief.';
  } else if (agent.status === 'queued') {
    agent.status = 'busy';
    agent.progress = 38;
  } else if (agent.status === 'busy') {
    agent.status = 'complete';
    agent.progress = 100;
  } else {
    agent.status = 'idle';
    agent.progress = 0;
    agent.task = 'Standing by for a new brief.';
  }

  pushActivity('Agent status changed', `${agent.name} is now ${readableStatus(agent.status).toLowerCase()}.`);
  render();
}

function toggleGoal(goalId) {
  const goal = state.goals.find((item) => item.id === goalId);
  if (!goal) return;
  goal.complete = !goal.complete;
  pushActivity(goal.complete ? 'Goal completed' : 'Goal reopened', goal.title);
  render();
}

function toggleJob(jobId) {
  const job = state.jobs.find((item) => item.id === jobId);
  if (!job) return;
  job.active = !job.active;
  pushActivity(job.active ? 'Job activated' : 'Job paused', job.title);
  render();
}

function toggleMilestone(milestoneId) {
  const milestone = state.milestones.find((item) => item.id === milestoneId);
  if (!milestone) return;
  milestone.complete = !milestone.complete;
  pushActivity(milestone.complete ? 'Readiness item marked complete' : 'Readiness item reopened', milestone.name);
  render();
}

function readableStatus(status) {
  return {
    idle: 'Idle',
    queued: 'Queued',
    busy: 'Busy',
    complete: 'Complete'
  }[status] || status;
}

function computeStats() {
  const busy = state.agents.filter((agent) => agent.status === 'busy').length;
  const goalsDone = state.goals.filter((goal) => goal.complete).length;
  const jobsActive = state.jobs.filter((job) => job.active).length;
  const readiness = Math.round((state.milestones.filter((item) => item.complete).length / state.milestones.length) * 100);

  return [
    { label: 'Agents live', value: String(state.agents.length), subtext: `${busy} currently busy` },
    { label: 'Goals tracked', value: String(state.goals.length), subtext: `${goalsDone} already complete` },
    { label: 'Jobs saved', value: String(state.jobs.length), subtext: `${jobsActive} currently active` },
    { label: 'Readiness', value: `${readiness}%`, subtext: 'Clear picture of what is already working' }
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
    node.querySelector('.card-title').textContent = agent.name;
    node.querySelector('.card-meta').textContent = `${agent.role} • ${agent.lane}`;
    node.querySelector('.card-task').textContent = agent.task;
    node.querySelector('.card-lane').textContent = agent.lane;
    node.querySelector('.progress-text').textContent = `${agent.progress}% complete`;

    const status = node.querySelector('.card-status');
    status.textContent = readableStatus(agent.status);
    status.classList.add(agent.status === 'busy' ? 'busy' : agent.status === 'complete' ? 'complete' : agent.status);

    node.querySelector('.progress-bar span').style.width = `${agent.progress}%`;
    node.querySelector('.agent-cycle').addEventListener('click', () => cycleAgent(agent.id));
    agentsList.appendChild(node);
  }
}

function renderDirectives() {
  directivesList.innerHTML = '';
  const template = document.getElementById('directive-template');
  for (const directive of state.directives) {
    const node = template.content.cloneNode(true);
    node.querySelector('.card-title').textContent = directive.text;
    node.querySelector('.card-meta').textContent = `${directive.lane} lane • assigned to ${directive.assignee}`;
    const badge = node.querySelector('.directive-priority');
    badge.textContent = directive.priority;
    badge.classList.add(`${directive.priority.toLowerCase()}-priority`);
    directivesList.appendChild(node);
  }
}

function renderGoals() {
  goalsList.innerHTML = '';
  const template = document.getElementById('goal-template');
  for (const goal of state.goals) {
    const node = template.content.cloneNode(true);
    node.querySelector('.card-title').textContent = goal.title;
    node.querySelector('.card-meta').textContent = `Owner: ${goal.owner} • Date: ${goal.deadline}`;
    const status = node.querySelector('.goal-status');
    status.textContent = goal.complete ? 'Complete' : 'In progress';
    status.classList.add(goal.complete ? 'complete' : 'in-progress');
    const button = node.querySelector('.goal-toggle');
    button.textContent = goal.complete ? 'Reopen' : 'Mark complete';
    button.addEventListener('click', () => toggleGoal(goal.id));
    goalsList.appendChild(node);
  }
}

function renderJobs() {
  jobsList.innerHTML = '';
  const template = document.getElementById('job-template');
  for (const job of state.jobs) {
    const node = template.content.cloneNode(true);
    node.querySelector('.card-title').textContent = job.title;
    node.querySelector('.card-meta').textContent = job.schedule;
    node.querySelector('.job-brief').textContent = job.brief;
    const status = node.querySelector('.job-status');
    status.textContent = job.active ? 'Active' : 'Paused';
    status.classList.add(job.active ? 'active' : 'idle');
    const button = node.querySelector('.job-toggle');
    button.textContent = job.active ? 'Pause' : 'Activate';
    button.addEventListener('click', () => toggleJob(job.id));
    jobsList.appendChild(node);
  }
}

function renderWorkflows() {
  workflowList.innerHTML = '';
  const template = document.getElementById('workflow-template');
  for (const workflow of state.workflows) {
    const node = template.content.cloneNode(true);
    node.querySelector('.card-title').textContent = workflow.title;
    node.querySelector('.workflow-summary').textContent = workflow.summary;
    const list = node.querySelector('.workflow-steps');
    workflow.steps.forEach((step) => {
      const li = document.createElement('li');
      li.textContent = step;
      list.appendChild(li);
    });
    workflowList.appendChild(node);
  }
}

function renderManual() {
  manualList.innerHTML = '';
  const template = document.getElementById('manual-template');
  for (const step of state.manual) {
    const node = template.content.cloneNode(true);
    node.querySelector('.manual-step-number').textContent = step.step;
    node.querySelector('.manual-title').textContent = step.title;
    node.querySelector('.manual-body').textContent = step.body;
    manualList.appendChild(node);
  }
}

function renderMilestones() {
  milestonesList.innerHTML = '';
  const template = document.getElementById('milestone-template');
  for (const milestone of state.milestones) {
    const node = template.content.cloneNode(true);
    node.querySelector('.card-title').textContent = milestone.name;
    node.querySelector('.card-body').textContent = milestone.description;
    const status = node.querySelector('.milestone-status');
    status.textContent = milestone.complete ? 'Ready' : 'Next step';
    status.classList.add(milestone.complete ? 'complete' : 'queued');
    const button = node.querySelector('.milestone-toggle');
    button.textContent = milestone.complete ? 'Reopen' : 'Mark ready';
    button.addEventListener('click', () => toggleMilestone(milestone.id));
    milestonesList.appendChild(node);
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

function render() {
  saveState();
  renderStats();
  renderDirectives();
  renderAgents();
  renderGoals();
  renderJobs();
  renderWorkflows();
  renderManual();
  renderMilestones();
  renderActivity();
}

render();
