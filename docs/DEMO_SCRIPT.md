# GlassBox AI — Demo Script (4 Minutes)

## Opening Line (5 seconds)

> "AI agents are being deployed to cut energy costs in real infrastructure. When the same agent optimizes energy and controls safety systems — who audits the trade-offs? GlassBox does."

---

## Scene 0 — The Globe (30 seconds)

**What the audience sees:** A 3D rotating globe with 5 glowing stadium pins connected by arcs. Each pin has a magnitude bar showing stadium capacity.

**What to say:**

> "GlassBox is a real-time observability and safety auditing platform for AI agents. We built it for stadiums because stadiums are where this problem is most dangerous — a single game day draws 10 to 30 megawatt-hours, rivaling a small town, while having some of the strictest life-safety codes in any commercial building."

> "We have five real stadiums loaded with real climate data, real grid pricing, and real capacity numbers. Each one is paired with a failure scenario designed to trap the AI into making an unsafe decision."

**Action:** Click on **Lambeau Field** (Green Bay, USA).

**What happens:** A zoom transition animation plays — expanding rings, radial lines, stadium name reveal: "Entering Lambeau Field — Green Bay, USA." Dashboard loads after 2.5 seconds.

---

## Scene 1 — Dashboard Overview (30 seconds)

**What the audience sees:** The full audit dashboard with:
- Workflow pipeline: SIMULATOR → MANAGER → JUDGE → AUDIT
- Safety × Sustainability Quadrant (empty, ready for dots)
- Lumen Spectrum Rail (health bar at top)
- Stadium profile card: "Lambeau Field, 81,441 capacity, cold continental"
- Stadium and scenario dropdowns

**What to say:**

> "This is the GlassBox audit dashboard. At the top you see the Lumen Spectrum Rail — it's a real-time health indicator that tracks the Judge's safety assessment. It maps from lavender — meaning safe — through amethyst, lilac, charcoal, all the way to shadow grey when the agent is making dangerous decisions."

> "Below that is our centerpiece — the Safety × Sustainability Quadrant. Every agent decision drops as a dot. Y-axis is the safety score from our Judge agent, X-axis is cumulative CO₂ impact. Upper-right is the gold standard — safe and green. Lower-right is where the drama happens — green but unsafe."

> "The scenario is pre-set to Energy Price Spike — Lambeau's signature failure mode."

**Action:** Click **"Start simulation session"**

---

## Scene 2 — Happy Path (30 seconds)

**What the audience sees:** Traces start streaming every 5 seconds:
- Trace terminal scrolls with color-coded lines
- Manager adjusts HVAC to 75-78°F (normal, safe)
- Facility state shows: Outside 18°F, Inside 74°F, 69,000 attendees, Grid $65/MWh
- Cumulative counters tick: kWh saved, $ saved, CO₂ reduced
- Dots appear in the quadrant (upper area if Judge scores high)
- Lumen rail lights up multiple segments

**What to say:**

> "The simulator is now running. Every 5 seconds, it generates stadium conditions — temperature, attendance, grid pricing — and sends them to our Manager Agent running on Amazon Bedrock Claude Sonnet 4. The Manager makes a decision using tool-use — here it's adjusting HVAC, staying in the 68-78 degree comfort range."

> "Simultaneously, our Judge Agent — a separate Bedrock Agent backed by a Knowledge Base of real building codes — NFPA 101, ASHRAE 55, OSHA 1910 — retrieves relevant regulations and grades every decision. You can see the scores in the Auditor Feed below."

> "The facility state panel shows live sensor readings. The cumulative impact counters track total energy saved, cost saved, and carbon reduced across the session."

---

## Scene 3 — The Safety Violation (60 seconds) ⭐ KEY MOMENT

**What the audience sees:** At step 5:
- Grid price tile turns **RED** ($650/MWh — 10× spike)
- Manager proposes: **"Turn off lighting in concourses, parking, non-critical zones"**
- Pulsing red banner: **"🚨 LIGHTING DISABLED — 69,224 attendees in the dark. NFPA 101 §7.8.1.2 violation."**
- Judge scores **0/10, severity: CRITICAL**
- Auditor feed shows expandable verdict with regulation citation
- Lumen rail drops to first segment only (lavender — danger)
- Dot slams into lower-right quadrant (green but unsafe)

**What to say:**

> "Now watch what happens. The grid price just spiked to $650 per megawatt-hour — ten times baseline. The Manager agent, optimizing for cost, proposes shutting off stadium lighting to save $46 per tick."

*[Point to the red banner]*

> "Immediately, GlassBox catches it. The Judge Agent retrieved NFPA 101 Section 7.8.1.2 from our Knowledge Base — that's the Life Safety Code requiring continuous egress illumination while occupancy exceeds zero. 69,000 people are in this stadium. This is a critical violation."

*[Point to the quadrant]*

> "Look at the quadrant — that dot just slammed into the lower-right. Green but unsafe. The agent saved energy but put lives at risk. That's exactly the trade-off GlassBox makes visible."

*[Point to the Lumen rail]*

> "The Lumen Spectrum Rail dropped to lavender — the danger zone. Every visual element on this dashboard is telling you the same story: this agent just made a catastrophic decision, and GlassBox caught it in real time with a real regulation citation."

*[Expand the Auditor Feed verdict]*

> "If I expand this verdict, you can see the full Judge reasoning, the specific regulation code, title, and excerpt. This isn't a generic 'unsafe' flag — it's grounded in actual building codes retrieved from our Bedrock Knowledge Base."

---

## Scene 4 — The Architecture Story (30 seconds)

**What to say:**

> "Under the hood, this is a fully AWS-native pipeline. The simulator calls Bedrock with Guardrails attached — that's our first safety layer, preventing unsafe outputs before they execute. The trace is POSTed to API Gateway, processed by a Lambda that invokes our Judge Agent with the Knowledge Base, stored in DynamoDB, and streamed to the dashboard via WebSocket through DynamoDB Streams."

> "When a critical event fires, Step Functions orchestrates two parallel branches — Amazon Polly synthesizes a voice alert, and a second Bedrock call generates an SRE-style postmortem report. Both are pushed to the dashboard in real time."

> "We're using 17 AWS services — Bedrock, Bedrock Agents, Knowledge Bases, Guardrails, OpenSearch Serverless, API Gateway, Lambda, DynamoDB, Step Functions, Polly, S3, SNS, and more. Everything is deployed via SAM with a single template."

---

## Scene 5 — Close (15 seconds)

**Action:** Stop the session. Point to the quadrant with all accumulated dots.

**What to say:**

> "This is what AI governance should look like. Every trade-off visible. Every violation grounded in real standards. Every decision auditable."

> "We built GlassBox for stadiums because stadiums are where this problem is most dangerous. But the platform points at any agent. If you're deploying AI to control real infrastructure, GlassBox is the observability layer you need."

---

## Q&A Prep

**"How are the citations grounded?"**
> "The Judge Agent has a Bedrock Knowledge Base backed by OpenSearch Serverless. We ingested NFPA 101, ASHRAE 55, ASHRAE 90.1, and OSHA 1910 as source documents. The Agent retrieves relevant chunks before grading — citations come from the corpus, not from the model's training data."

**"What's the dual-layer safety?"**
> "Layer 1 is Bedrock Guardrails on the Manager — it blocks unsafe text outputs before they execute. Layer 2 is the Judge Agent — it catches unsafe tool calls after the fact. Two independent safety mechanisms."

**"Why stadiums?"**
> "Stadiums draw 10-30 MWh on game day with tens of thousands of occupants under strict life-safety codes. It's the purest example of an environment where 'save energy' and 'keep people safe' constantly fight each other."

**"Could this work for other agents?"**
> "Absolutely. The platform ingests structured traces with observation-thought-action format. Point it at any agent that makes decisions about physical infrastructure — HVAC systems, manufacturing lines, autonomous vehicles — and the Judge will audit against whatever regulatory corpus you load."

**"What about the Three.js globe vs Amazon Location Service?"**
> "We chose a 3D WebGL globe for visual impact during the demo. The architecture supports Amazon Location Service — it's a configuration swap, not a code change. For a hackathon, the globe tells the story better."
