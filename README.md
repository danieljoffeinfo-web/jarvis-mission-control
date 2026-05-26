# Jarvis Mission Control

Jarvis Mission Control is a black-background, Hermes-inspired dashboard for running missions in plain English.

Live features:
- Send a mission brief
- View agent workload
- Track goals
- Save recurring jobs
- Keep reusable workflows visible
- Read a built-in manual
- Persist dashboard state in the browser with localStorage

Files:
- `index.html` — main interface
- `styles.css` — dark Hermes-inspired design system
- `app.js` — interaction logic and saved local state
- `MANUAL.md` — plain-language usage guide
- `vercel.json` — static deployment config

Deployment:
- Hosted on Vercel
- Source controlled in GitHub

Current scope:
- This is a polished working frontend control room.
- It is not yet wired to a live Hermes backend or shared database.

Next possible upgrade:
- Connect to Supabase for shared persistence
- Connect to live Hermes jobs/agents
- Add authentication for a private command center
