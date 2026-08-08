# Tutorial — Your First Scenario in mySCM Macro Process Register
## Version 1.0 | Hands-On Walkthrough (≈20 minutes)

---

This tutorial is different from the [User Guide](./USER_GUIDE.md): instead of describing every screen, it walks you through **one concrete worked example** — from creating an account to exporting a prioritised automation backlog — using real sample numbers you can follow along with. By the end you will have:

- A company ("Acme Manufacturing Ltd")
- A scenario ("Baseline 2025") with all 55 macro processes auto-created
- One process ("Deliver_01 — Customer order capture") fully scored end-to-end
- A Dashboard showing your first Wave 1 pipeline
- An exported JSON snapshot of your data

If you haven't deployed the app yet, complete the [Setup Guide](./SETUP_GUIDE.md) first.

---

## Table of Contents

1. Step 0 — Open the App
2. Step 1 — Create Your Account
3. Step 2 — Create Your First Company
4. Step 3 — Create Your First Scenario
5. Step 4 — Explore the Process Register
6. Step 5 — Score Your First Process
7. Step 6 — Read the Live Score Preview
8. Step 7 — Save and See It Ranked
9. Step 8 — Check the Dashboard
10. Step 9 — Export Your Data
11. Step 10 — Try the Recycle Bin
12. Step 11 — Browse the Framework Reference
13. Step 12 — Switch Language
14. What's Next

---

## 1. Step 0 — Open the App

Open your deployed app URL in a browser (e.g. `https://your-site.netlify.app`). You'll land on the **Login** page.

---

## 2. Step 1 — Create Your Account

1. Click **"Create account"** below the login form.
2. Enter:
   - **Full name**: `Jane Smith`
   - **Email**: your email address
   - **Password**: at least 6 characters
3. Click **"Create Account"**.

You're immediately signed in and redirected to the **Dashboard**, which will be empty for now — that's expected, you have no company or scenario yet.

> If the email you used matches the `VITE_ADMIN_EMAIL` configured at deployment, you'll also get the Admin role and see an **Admin** entry in the sidebar. Regular users won't see it.

---

## 3. Step 2 — Create Your First Company

1. Click **"Companies"** in the left sidebar.
2. Click **"+ Add Company"**.
3. Fill in the form:
   - **Company Name**: `Acme Manufacturing Ltd`
   - **Sector**: `Manufacturing`
   - **Industry**: `Automotive`
4. Click **"Save"**.
5. Click the company card itself to select it — a blue tick (✓) appears in the corner and the card gets a highlighted border.

The **Select Company** dropdown in the top bar now shows "Acme Manufacturing Ltd".

---

## 4. Step 3 — Create Your First Scenario

1. Click **"Scenarios"** in the sidebar.
2. Click **"+ Add Scenario"**.
3. Fill in:
   - **Scenario Name**: `Baseline 2025`
   - **Description**: `Initial as-is assessment before automation programme`
4. Click **"Create"**.

Behind the scenes, the app writes one Firestore document per macro process — **all 55 at once**, in a single batch — with every score field defaulted to 0 and `inScope` set to `false`. This normally completes in 1–2 seconds.

5. Click the new scenario card to select it. The top bar now shows both "Acme Manufacturing Ltd" and "Baseline 2025".

---

## 5. Step 4 — Explore the Process Register

Click **"Process Register"** in the sidebar. You'll see a table of all 55 macro processes across the six SCOR-style cycles: **Plan, Source, Make, Deliver, Return, Enable**.

Right now every row shows:
- **Rank 55** and **Wave 3** — because with all scores at zero, every process ties, and ties resolve in document order
- A grey dot in the **In Scope** column — nothing has been marked in scope yet
- **Execution Mode: Workflow** — the default fallback when Human/AI/RPA/Workflow scores are all zero

Try the search box: type `order` and note it filters by Macro ID, process name, and cluster (e.g. `Deliver_01 Customer order capture`, `Deliver_05 Order orchestration plan`).

---

## 6. Step 5 — Score Your First Process

Find **`Deliver_01` — Customer order capture** (Cluster: Order Management) and click **Edit**.

The editor opens with 7 tabs. Work through them left to right, entering the sample values below.

### Scope bar (always visible, top of editor)
- Tick **In Scope**
- Justification: `Core order-to-cash entry point — always in scope`

### Tab 1 — BPMN Readiness (sliders, 0–100)
| Field | Value |
|---|---|
| Process Clarity | 90 |
| Exception Logic | 80 |
| Data & Rule Availability | 85 |
| Automation Suitability | 75 |
| Compliance / HITL Readiness | 70 |

### Tab 2 — Human (sliders, 0–4)
| Field | Value |
|---|---|
| Human Judgment | 1 |
| Human Ethics | 0 |
| Human Accountability | 1 |
| Regulatory Sign-off | 0 |

### Tab 3 — Workflow (sliders, 0–4)
| Field | Value |
|---|---|
| Approval Chain | 1 |
| SLA Strictness | 2 |
| Exception Paths | 2 |
| Handoff Complexity | 2 |
| Audit Checkpoint | 1 |

### Tab 4 — RPA (sliders, 0–4)
| Field | Value |
|---|---|
| Rule-Based | 3 |
| Structured Data | 3 |
| Zero Judgment | 2 |
| Process Stability | 3 |

### Tab 5 — AI (sliders, 0–4)
| Field | Value |
|---|---|
| AI Judgment | 1 |
| Unstructured Data | 1 |
| Process Variability | 1 |
| Training Overhead | 0 |
| Risk Inverse (Penalty) | 1 |

### Tab 6 — Financial
| Field | Value |
|---|---|
| Benefit Annualized (USD) | 120000 |
| Cost One-Time (USD) | 40000 |
| Automation Cost Estimate (USD) | 45000 |
| Strategic Alignment Score | 70 |
| VOI Risk Reduction | 60 |
| VOI Agility | 75 |
| VOI Brand Reputation | 50 |
| VOI Employee Satisfaction | 65 |
| ROI Method | `Efficiency` |
| VOI Method | `Customer experience` |

### Tab 7 — Other
| Field | Value |
|---|---|
| Process Type | `Operational - Fulfilment` |
| Parent Cycle | `Deliver` |
| Frequency | `Real-time` |
| Process Criticality | `Critical` |
| Audit Criticality | `Medium` |
| SLA | `2min` |

---

## 7. Step 6 — Read the Live Score Preview

While you were entering values, the **Live Score Preview** panel on the right (visible on wide screens) updated instantly. With the numbers above, you should see approximately:

- **BPMN Readiness Score**: `81.0` → **Ready? Yes** (≥ 80 threshold)
- **Human Score**: `12.5`
- **Workflow Score**: `40`
- **RPA Score**: `68.75`
- **AI Score**: `22.5`
- **Execution Mode**: `RPA` (RPA has the highest of the three automatable scores, and Human is well below the 80 override threshold)
- **ROI %**: `((120000 − 40000) / 40000) × 100 = 200%`
- **VOI Score**: `(60×0.4) + (75×0.3) + (50×0.2) + (65×0.1) = 63`
- **Priority Score** and **Heatmap Quadrant**: with ROI ≥ 20% and VOI < 80, this lands in the **High ROI** quadrant

This preview updates on every keystroke or slider move, before you save — use it to sanity-check your inputs.

---

## 8. Step 7 — Save and See It Ranked

Click **Save**. The modal closes and you're back on the Process Register.

`Deliver_01` now shows:
- A non-zero **BPMN Score** bar (green, since it's ≥ 80)
- **Execution Mode: RPA**
- **ROI: 200%**
- A green dot in **In Scope**
- A **Rank** that has jumped from 55 toward 1 — since every other process is still at zero, `Deliver_01` is very likely now **Rank 1** and **Wave 1**

Repeat Steps 5–7 for a handful of other processes (try `Source_04 — Purchase order creation` or `Make_03 — Production execution & reporting`) to see the ranking shift as more processes compete for the top spots.

---

## 9. Step 8 — Check the Dashboard

Click **"Dashboard"** in the sidebar. You'll now see:

- **Summary cards**: Total processes (55), In Scope (however many you've marked), BPMN Ready, Wave 1 count
- **Automation Heatmap**: a 2×2 grid counting in-scope processes per quadrant (Quick Win / High ROI / High VOI / Strategic)
- **Execution Mode Distribution**: a bar per mode (Human Mandatory / Workflow / RPA / AI Augmented / AI Autonomous) showing how many in-scope processes recommend each
- **Wave 1 Pipeline**: a table of your top 10 ranked processes — this is your live automation backlog

---

## 10. Step 9 — Export Your Data

Go back to **Process Register** and click **⬇ Export**. A JSON file (e.g. `Baseline 2025_processes.json`) downloads with all 55 processes, every input field, and all calculated scores (BPMN score, execution mode, ROI, VOI, priority score, rank, wave, heatmap quadrant). Open it in a text editor or import it into Excel/Power BI for further analysis.

---

## 11. Step 10 — Try the Recycle Bin

To see how the Recycle Bin works without losing your `Baseline 2025` work, you can optionally create a throwaway scenario first (e.g. `Test Delete`), then:

1. Go to **Scenarios**, click **Delete** on the throwaway scenario, and confirm.
2. Go to **Recycle Bin** in the sidebar — you'll see all 55 of that scenario's processes listed as archived.
3. Click **Restore** on one — since the original scenario no longer exists, you'll be prompted to pick a destination scenario (e.g. `Baseline 2025`). Pick it, and the process reappears in that scenario's Process Register as a new row.
4. Click **Permanently Delete** on the rest to clean up.

---

## 12. Step 11 — Browse the Framework Reference

Click **"Framework"** in the sidebar. This read-only page lists all 13 scoring formulas used throughout the app (BPMN Readiness, Human/Workflow/RPA/AI scores, Execution Mode logic, ROI%, VOI Score, Priority Score, Rank, Wave, Heatmap Quadrant). Click any row to expand its full mathematical expression and plain-English explanation — useful when explaining scores to stakeholders or auditing the methodology.

---

## 13. Step 12 — Switch Language

Scroll to the bottom of the sidebar and use the **Language** dropdown to switch between **English**, **Français**, and **العربية**. Arabic automatically flips the entire layout to right-to-left. Try it, then switch back.

---

## 14. What's Next

- Work through the remaining 54 processes for `Baseline 2025` to get a complete, meaningful ranking (all-zero processes will otherwise crowd the bottom of the list).
- Create a second scenario (e.g. `Future State 2026`) on the same company to compare an as-is vs. to-be assessment.
- Read the [User Guide](./USER_GUIDE.md) for a complete field-by-field reference and FAQ.
- If you're the deployment owner, read the [Admin Guide](./ADMIN_GUIDE.md) to manage users and view global insights.
- For the underlying business rules and data model, see [FUNCTIONAL_SPECS.md](./FUNCTIONAL_SPECS.md).

---

*End of Tutorial*
