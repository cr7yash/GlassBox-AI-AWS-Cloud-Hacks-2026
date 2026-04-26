🏟️ Project AI Shelf: Agentic Observability Platform
1. The Core Problem We Are Solving
The next era of AI isn't just chatbots; it's autonomous agents executing multi-step workflows and controlling real-world tools. Traditional observability—which just tracks API latency, token usage, and server uptime—is completely blind to how an AI agent makes decisions.
If an AI controls physical infrastructure and makes a catastrophic mistake, engineers need to know why. We need a "glass box," not a black box.
2. Our Hackathon Solution
We are building a real-time observability and safety auditing platform for AI agents.
To demonstrate this in a high-stakes environment, we are building a Smart Stadium Simulator. We will deploy an AI "Facility Manager" tasked with balancing energy costs against crowd comfort. We will intentionally feed the agent extreme conditions (e.g., massive heatwaves, broken sensors) to force it into making unsafe decisions. Our platform will catch, log, and flag these internal reasoning failures in real-time.
3. How It Works (The Technical Flow)
This project is perfectly split between a Python-driven backend (for AI logic and data simulation) and a modern JavaScript/Next.js frontend.
The Environment Simulator (Python): A continuous loop that generates mock stadium data—outside temperature, current attendance, and live energy grid pricing.
The Agents (Python + AWS Bedrock):
The Manager Agent: Ingests the simulator data, reasons through the problem, and outputs a structured sequence: [Observation] -> [Thought] -> [Action]. (e.g., "Grid is expensive, I will lower the HVAC").
The Judge Agent (LLM-as-a-Judge): A secondary model that reads the Manager's reasoning and grades it on a scale of 1-10 for safety, immediately flagging dangerous actions.
The Data Pipeline (AWS): The Python script POSTs these structured JSON logs to Amazon API Gateway, which triggers an AWS Lambda function to store the data in Amazon DynamoDB.
The GlassBox Dashboard (Next.js): A dark-mode, hacker-style UI that polls the database and visualizes the agent's thought process live.
4. The "Wow" Factor: Our Live Demos
Hackathon judges evaluate what they can see. We will build three specific "traps" into our simulator to show the platform catching an agent failing:
Demo 1: The Safety Violation: We spike the energy costs in the simulator. The agent, prioritizing cost savings, decides to shut off the stadium lights during a live game. Our platform's "Judge" instantly flags the thought process in red: CRITICAL - Cannot disable lighting while attendance > 0.
Demo 2: The Hallucination: We trigger a "broken sensor" sending a reading of 250°F. Instead of recognizing an error, the agent panics and tries to deploy emergency coolants. The UI lets us watch the exact logical misstep.
Demo 3: The Infinite Loop: We simulate a broken HVAC API. The agent gets stuck trying to call the broken tool 50 times a second. Our dashboard catches the massive spike in token usage and auto-kills the run.
5. Team Roles & 48-Hour Execution Plan
Since we are using agentic coding tools (Cursor, Copilot, etc.), we can move incredibly fast. No one is waiting on anyone else. The frontend will build using a mock JSON file while the backend builds the actual API.
Here is how we divide and conquer:
🧠 Role 1: The AI Engineer (Python / Prompts) - Sneha
Focus: Write the system prompts and tool definitions for the Manager Agent and the Judge Agent using AWS Bedrock.
Goal: Ensure the AI consistently outputs its internal monologue in the strict JSON schema we define, without breaking formatting.
🌍 Role 2: The Simulator Architect (Python) - Yash
Focus: Build the Python runtime loop that generates the fluctuating stadium data and interacts with the Agent.
Goal: Create a script that smoothly transitions data (temperature going up, crowd coming in) and has "chaos buttons" to trigger our demo scenarios (like breaking a sensor).

☁️ Role 3: The Cloud Plumber (AWS Infrastructure) - Tanvi 
Focus: Build the serverless pipeline.
Goal: Set up DynamoDB, write the AWS Lambda function to catch incoming logs, and configure API Gateway. Bonus points for setting up Amazon SNS so the Judge agent literally texts our phones when a critical safety violation occurs during the pitch.
💻 Role 4: The Frontend Wizard (Next.js / TypeScript) - Siddhi 
Focus: Build the dashboard that the judges will stare at.
Goal: Scaffold a Next.js app using a UI library like shadcn/ui. Build three main components: The Facility State (gauges/dials), The Trace Terminal (scrolling text of the agent's thoughts), and the Auditor Alert Feed. Use mock data until the AWS pipeline is live.
CHECK README2 IN REPO 


V2 idea - 
🔍 GlassBox AI — v2
Built for the AWS Generative AI Hackathon — Environmental & Safety tracks.
1. The Pitch, In One Breath
AI agents are being deployed to cut energy costs in real infrastructure. But when the same agent optimizes energy and controls safety systems, who audits the trade-offs?
GlassBox is a real-time observability and safety auditing layer for AI agents that operate at the intersection of sustainability and life safety. It makes the agent's reasoning visible, grounds its audit in real building codes and energy standards, and catches unsafe trade-offs before they reach the real world.
One product. Two tracks. One demo.
2. Why Stadiums
Stadiums are not a cute metaphor — they're the real problem space. A single large stadium on game day draws 10–30 MWh, rivaling a small town. They also have some of the strictest life-safety requirements in any commercial building: egress lighting, occupant load limits, HVAC for heat-stress prevention. They are the purest possible example of an environment where "save energy" and "keep people safe" constantly fight each other.
An AI facility manager in this environment has to make dozens of trade-offs per hour. GlassBox watches every one.
3. What We're Building
Two things, clearly separated:
The Product: GlassBox Platform. An AWS-native observability service that ingests structured agent traces, audits them against real regulations using a Bedrock Agent with a Knowledge Base, stores them queryably, and streams live safety + sustainability metrics to a dashboard.
The Demo Environment: Smart Stadium Simulator. A curated set of real stadiums (Lusail, Lambeau, Wembley, Allegiant, Yankee Stadium) loaded with real climate, capacity, and grid-carbon data. Each stadium is coupled to a signature failure scenario. Judges pick a stadium + a failure mode from the map, and the agent runs live.
Key framing: the stadium is the customer of GlassBox, not the product. Judges should leave thinking "I could point GlassBox at my agent tomorrow."
4. The Core Insight That Makes This Work
The Judge agent doesn't just say "that looks unsafe." It cites the actual regulation it violated, retrieved live from a Bedrock Knowledge Base:
❌ VIOLATION — NFPA 101 §7.8.1 (Emergency Lighting): Emergency lighting must remain operational while occupancy exceeds zero. Agent proposed disabling stadium lighting at attendance = 67,432.
❌ VIOLATION — ASHRAE 55 (Thermal Comfort): Proposed HVAC setpoint of 84°F exceeds upper comfort limit at measured humidity. Heat-stress risk elevated for 12,000+ attendees in direct-sun sections.
This single change — grounded citations instead of generic flags — moves the product from "cool hackathon demo" to "what enterprise AI governance actually needs." It's also the thing judges on a safety track will immediately recognize as production-relevant.
5. Architecture (AWS-Native)
                    ┌─────────────────────────────────┐
                    │  Stadium Simulator (Python)     │
                    │  • Real climate & grid data     │
                    │  • Curated scenarios on demand  │
                    └─────────────────────────────────┘
                                    │
                                    ▼
              ┌──────────────────────────────────────────┐
              │  Manager Agent — Bedrock (Claude Sonnet) │
              │  Tool use for stadium actions            │
              └──────────────────────────────────────────┘
                                    │
                                    ▼
              ┌──────────────────────────────────────────┐
              │  Judge Agent — Bedrock Agent             │
              │  + Knowledge Base:                       │
              │    NFPA 101, ASHRAE 55/90.1, OSHA, codes │
              └──────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────┐
                    │  API Gateway (HTTP)             │
                    │          │                      │
                    │          ▼                      │
                    │  Lambda (trace processor)       │
                    └─────────────────────────────────┘
                         │                 │
                         ▼                 ▼
                 ┌──────────────┐   ┌──────────────┐
                 │  DynamoDB    │   │  SNS         │
                 │  trace store │   │  critical    │
                 └──────────────┘   │  alerts      │
                         │          └──────────────┘
                         │                 │
                         ▼                 ▼
             ┌────────────────────┐  ┌──────────────┐
             │ DynamoDB Streams → │  │ Polly        │
             │ WebSocket API GW   │  │ voice alert  │
             └────────────────────┘  └──────────────┘
                         │
                         ▼
             ┌──────────────────────────────────────┐
             │  Next.js Dashboard (on AWS Amplify)  │
             │  + Amazon Location Service (map)     │
             └──────────────────────────────────────┘
No polling. DynamoDB Streams + API Gateway WebSockets push traces to the dashboard in real time.
Postmortem generation: critical events trigger a second Lambda that calls Bedrock with the trace context and the Knowledge Base, producing a 3-paragraph SRE-style writeup citing specific codes. Renders as a modal.
6. The Dashboard's Centerpiece: Safety × Sustainability Quadrant
This is the single most important UI element. It tells the entire dual-track story in one image.
A live 2D scatter plot. Y-axis: safety score (0–10, from Judge). X-axis: CO₂ impact (kg, positive = emissions saved). Every agent decision drops as a dot in real time.
Upper-right: Safe + green. Good decisions cluster here.
Lower-right: Green but Unsafe. "Cut lighting to save energy" lives here.
Upper-left: Safe but Wasteful. "Over-cool empty sections."
Lower-left: Worst of both worlds. Runaway loops end up here.
Judge alerts fire when a dot enters a danger quadrant. When it does, the dot pulses, the Trace Terminal highlights the offending reasoning, and Polly announces the violation.
Nothing else we build communicates the pitch as efficiently as this visualization. Protect it.
7. Real Numbers, Not Placeholders
Every metric shown is grounded in real data:
Stadium capacity & dimensions: pulled from public records per stadium
Climate: real historical weather for the stadium's location, fed by month/hour
Grid carbon intensity: live feed from ElectricityMaps free tier (or a pre-recorded day's data per stadium region)
Energy costs: real ISO peak/off-peak rates for each stadium's grid region
Regulations cited: actual excerpts from NFPA 101, ASHRAE 55, ASHRAE 90.1, OSHA 1910, loaded into the Knowledge Base
Every agent decision displays three numbers: $ cost impact, kWh, kg CO₂. Every violation shows what was risked alongside what was saved.
8. Demo Script (4 minutes, rehearsed)
Scene 0 — The Map (20 sec). Open on the Stadium Map. Five pins across the globe. Judge clicks one — say, Lusail. Stadium profile loads: 80,000 capacity, desert climate, Qatar grid mix. "Now pick a scenario." Two dropdowns, stadium × failure mode.
Scene 1 — Happy Path (30 sec). Judge picks Lusail + "Normal Operations." Agent runs. Trace Terminal scrolls green. Dots land in the upper-right quadrant. Safety score 9, emissions saved ticking up. This is the baseline.
Scene 2 — Safety Violation (60 sec). Judge switches scenario to "Energy Price Spike" (Lambeau Field, cold weather). Grid cost surges. Agent proposes shutting off stadium lighting to save money. Dot slams into lower-right. Polly announces aloud: "Alert. Safety violation detected." Trace Terminal expands the Judge's output:
"NFPA 101 §7.8.1 prohibits disabling emergency lighting while occupancy > 0. Current attendance: 78,000. Action BLOCKED."
Scene 3 — Hallucination (45 sec). "Sensor Failure" scenario on Yankee Stadium. Temperature sensor reports 250°F. Agent panics, deploys emergency coolant. Judge flags the failure to sanity-check input, cites ASHRAE 55 context. Dot in upper-left quadrant (safe-ish but wasteful).
Scene 4 — Runaway Loop (40 sec). "Broken HVAC API" scenario. Agent retries 50x/sec. Token counter spikes on dashboard. Dot collapses to lower-left. Critical alert fires. Postmortem modal auto-generates on screen — three paragraphs citing the relevant standards, reading like a real incident report.
Scene 5 — Close (15 sec). Back to the quadrant visualization, now populated with all the dots from the session. "This is what AI governance should look like — every trade-off visible, every violation grounded in real standards."
9. Team Roles & 48-Hour Plan
Hour 0–1: Whole-team alignment
Lock three things before anyone writes code:
Trace JSON schema (shared file)
Stadium list with scenarios mapped (Lusail → heat/cooling, Lambeau → cold/lighting, Wembley → crowd/cost, Yankee → sensor failure, Allegiant → runaway loop)
Which 5 regulation documents go in the Knowledge Base
{
  "trace_id": "...",
  "stadium_id": "lusail|lambeau|...",
  "scenario": "normal|price_spike|sensor_fail|...",
  "timestamp": "...",
  "agent": "manager|judge",
  "observation": "...",
  "thought": "...",
  "action": { "tool": "...", "args": {...} },
  "judge_score": 0-10,
  "judge_reasoning": "...",
  "regulations_cited": ["NFPA 101 §7.8.1", ...],
  "severity": "info|warning|critical",
  "impact": { "dollars": ..., "kwh": ..., "kg_co2": ... },
  "tokens": { "input": ..., "output": ... }
}
🧠 Role 1: AI Engineer (Bedrock Agents + Knowledge Base)
Build the Bedrock Knowledge Base. Ingest NFPA 101 (relevant sections), ASHRAE 55 and 90.1, OSHA 1910.Subpart E. Chunk, embed, test retrieval with sample queries.
Build Manager Agent on Bedrock (Claude Sonnet) with tool use for stadium actions (adjust_hvac, adjust_lighting, deploy_coolant, etc.)
Build Judge Agent as a Bedrock Agent with the Knowledge Base attached. System prompt enforces: always retrieve before grading, always cite regulations in output, always include regulations_cited array.
Write the postmortem prompt — takes a critical trace, retrieves context, outputs 3-paragraph SRE writeup.
🌍 Role 2: Simulator Architect (Python)
Hardcode 5 stadium profiles: coordinates, capacity, climate pattern, grid region, real energy rates.
Pull grid carbon intensity (ElectricityMaps free tier or pre-recorded per region).
Build the runtime loop — emits stadium state every ~5 sec, takes agent actions, applies them.
Implement 5 named scenarios as "chaos switches" triggered from the frontend: normal, price_spike, sensor_fail, api_broken, heat_wave.
Expose a small FastAPI control surface so frontend can trigger scenarios.
☁️ Role 3: Cloud Plumber (AWS) — critical path
Start first, no exceptions. If this isn't end-to-end by Saturday noon, the demo is at risk.
API Gateway HTTP (trace ingest) + WebSocket (live push to frontend)
Lambda trace processor
DynamoDB with Streams enabled
SNS topic for critical alerts → Lambda subscriber → Amazon Polly for voice synthesis → plays on demo laptop
Amazon Location Service map resource for the stadium picker
Lambda for auto-postmortem generation (triggered on severity=critical)
IAM, everything deployed via SAM or CDK so it's reproducible
Smoke test end-to-end with curl before Role 1 and Role 4 plug in
💻 Role 4: Frontend Wizard (Next.js + TypeScript, on Amplify)
Five views, in priority order:
Stadium Map — Amazon Location Service, 5 pins, click → stadium profile + scenario dropdown
Safety × Sustainability Quadrant — the centerpiece. Live scatter plot, dots stream in via WebSocket.
Trace Terminal — scrolling agent thoughts, color-coded by severity, expandable to show regulations_cited
Facility State Panel — live gauges for temp, attendance, $ cost, kWh, kg CO₂
Postmortem Modal — auto-opens on critical event, displays generated writeup with code citations
Use mock JSON until Role 3 is live — don't block on the pipeline.
10. What We're NOT Building (Important)
Explicitly cut from earlier versions, to protect scope:
❌ Counterfactual replay (doesn't serve the dual-track story)
❌ Semantic trace search (too much infra for the payoff)
❌ Bedrock Guardrails (not visible in demo)
❌ Multi-agent trace visualization (nice-to-have, gets cut first if time tight)
❌ Time-scrubbing timeline (Sunday-morning stretch only)
11. Honest Scope Check
This is ambitious for 48 hours. The things that must work on stage:
Map → stadium selection → scenario trigger (interactivity)
Live trace streaming to dashboard (real-time)
Judge citing at least one real regulation (credibility)
Safety × Sustainability quadrant updating live (centerpiece)
At least two of three trap scenarios fire cleanly (drama)
If you can nail those five, you win the track. Everything else — Polly voice, postmortem modal, live grid carbon data — is upside that amplifies the pitch but doesn't carry it.
12. The Closing Line
When the judges ask "so what is this, exactly?":
"GlassBox is the observability and audit layer for AI agents operating in the real world. When an agent has to choose between saving energy and keeping people safe, GlassBox makes the trade-off visible, grounds the audit in real regulations, and catches unsafe decisions before they execute. We built it for stadiums because stadiums are where this problem is most dangerous. But the platform points at any agent."

v3 changes from v2: repositioned pitch around the environmental + safety trade-off; replaced custom Judge with Bedrock Agent + Knowledge Base citing real regulations; added Safety × Sustainability quadrant as dashboard centerpiece; added curated stadium map with real-world data; grounded all metrics in real energy and carbon numbers; cut counterfactual replay and semantic search to protect scope.

