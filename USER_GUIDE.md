# User Guide — mySCM Macro Process Register
## Version 1.0 | For End Users

---

## Table of Contents

1. Introduction
2. Logging In and Creating Your Account
3. Navigating the Application
4. Setting Up Your Company
5. Creating a Scenario
6. Understanding the Process Register
7. Editing a Process — All 63 Fields Explained
8. Understanding the Calculated Scores
9. The Dashboard
10. Exporting Data
11. The Recycle Bin
12. The Framework Reference Page
13. Changing Language
14. Frequently Asked Questions

---

## 1. Introduction

The mySCM Macro Process Register is a web application for documenting, scoring, and prioritising the 49 macro processes of a supply chain. It helps you:

- **Assess BPMN Readiness** — Is each process fully documented and ready for modelling?
- **Determine the right automation approach** — Should a process use AI, RPA, Workflow automation, or remain Human-managed?
- **Prioritise automation investment** — Which processes should be automated first, based on ROI, strategic value, and cost?
- **Plan delivery waves** — Which processes belong in Wave 1 (immediate), Wave 2 (medium-term), or Wave 3 (backlog)?

---

## 2. Logging In and Creating Your Account

### Creating an Account

1. Open the app URL in your browser
2. Click **"Create account"**
3. Enter your full name, email address, and a password (minimum 6 characters)
4. Click **"Create Account"**
5. You will be taken directly to the dashboard

### Logging In

1. Go to the app URL
2. Enter your email and password
3. Click **"Sign In"**

### Logging Out

Click **"Logout →"** at the bottom of the left sidebar.

---

## 3. Navigating the Application

The application has a **sidebar on the left** with the following sections:

| Menu Item | What It Does |
|---|---|
| **Dashboard** | Summary of your current scenario — stats, charts, and top-ranked processes |
| **Companies** | Manage your companies (one user can have multiple companies) |
| **Scenarios** | Manage scenarios for the selected company |
| **Process Register** | View and edit all 49 macro processes for the current scenario |
| **Recycle Bin** | Recover deleted processes |
| **Framework** | Read-only reference for all 13 scoring formulas |
| **Admin** | (Admins only) User management and global insights |
| **Logout** | Sign out of the app |

**The Top Bar** shows two dropdown menus:
- **Select Company** — choose which company you are working with
- **Select Scenario** — choose which scenario you are working with

Most pages require you to select a company and scenario first.

---

## 4. Setting Up Your Company

Before doing anything else, set up at least one company.

1. Click **"Companies"** in the sidebar
2. Click **"+ Add Company"**
3. Fill in:
   - **Company Name** (required) — e.g. "Acme Manufacturing Ltd"
   - **Sector** — select from the dropdown (Manufacturing, Logistics, Retail, etc.)
   - **Industry** — free text (e.g. "Automotive")
4. Click **"Save"**
5. Click on the company card to **select** it as your active company
   - A blue tick ✓ will appear on the selected company

---

## 5. Creating a Scenario

A scenario represents one set of assessments for a company. You might create separate scenarios for "Current State", "Future State", or different business units.

1. Make sure a company is selected in the top bar
2. Click **"Scenarios"** in the sidebar
3. Click **"+ Add Scenario"**
4. Fill in:
   - **Scenario Name** (required) — e.g. "Baseline 2025"
   - **Description** — optional notes
5. Click **"Create"**

The application will automatically create all **49 macro processes** for this scenario, with all scores set to zero. This takes a few seconds.

6. Click on the scenario card to **select** it as your active scenario

---

## 6. Understanding the Process Register

The Process Register is the main working table. To access it:

1. Select your company and scenario in the top bar
2. Click **"Process Register"** in the sidebar

You will see a table with all 49 processes. The columns are:

| Column | Description |
|---|---|
| **Rank** | Automation priority rank (1 = highest priority) |
| **Macro ID** | Unique identifier (e.g. Deliver_06) |
| **Process Name** | Full name of the macro process |
| **Parent Cycle** | SCOR cycle: Plan, Source, Make, Deliver, Return, or Enable |
| **Cluster** | Capability grouping (e.g. Order Management) |
| **Criticality** | Process importance: Critical, High, Medium, Low |
| **SLA** | Target turnaround time |
| **In Scope** | Green dot = in scope; grey = excluded |
| **BPMN Readiness** | Score bar (0–100). Green = ≥80 (ready) |
| **Execution Mode** | Recommended automation approach |
| **ROI %** | Return on investment percentage |
| **Wave** | Delivery wave: Wave 1, 2, or 3 |
| **Actions** | Edit button to open the process editor |

### Filtering Processes

Use the **search box** to filter by Macro ID, process name, or cluster.

Use the **scope filter buttons** to show:
- **All Processes** — all 49
- **In Scope Only** — processes marked as in scope
- **Out of Scope** — processes excluded from this scenario

---

## 7. Editing a Process — All 63 Fields Explained

Click the **"Edit"** button on any process row to open the editor.

The editor has 7 tabs. Work through them from left to right.

### Scope (Always Visible)

At the top of the editor, you will always see:
- **In Scope checkbox** — tick this to include the process in your scenario
- **Justification** — explain why it is in or out of scope

### Tab 1: BPMN Readiness

These five fields assess how well-documented the process is. Each is scored 0–100.

| Field | What it measures |
|---|---|
| **Process Clarity** | How well the process is documented. 0 = no documentation; 100 = full BPMN-ready |
| **Exception Logic** | Are exception paths documented? 0 = none; 100 = all paths with timeout/retry |
| **Data & Rule Availability** | Are the data sources and business rules available? 0 = none; 100 = all validated |
| **Automation Suitability** | How automatable is the process? 0 = fully manual; 100 = perfectly automatable |
| **Compliance / HITL Readiness** | Are compliance controls and human-in-the-loop requirements mapped? |

### Tab 2: Human

These four fields measure how much irreplaceable human involvement is needed. Each is scored 0–4.

| Field | What it measures |
|---|---|
| **Human Judgment** | Does the process require complex human decision-making? |
| **Human Ethics** | Are there ethical decisions that must be made by a person? |
| **Human Accountability** | Is there legal or regulatory accountability that requires a human? |
| **Regulatory Sign-off** | Does a regulated authority require human sign-off? |

> **Important:** If the overall Human Score reaches 80 or above, the process is automatically assigned "Human Mandatory" execution mode — it cannot be automated.

### Tab 3: Workflow

These five fields assess suitability for Workflow automation (BPM tools). Each is scored 0–4.

| Field | What it measures |
|---|---|
| **Approval Chain** | Number of approval levels required |
| **SLA Strictness** | How strict and monitored the SLA is |
| **Exception Paths** | Complexity of exception handling |
| **Handoff Complexity** | How many systems/teams the process hands off to |
| **Audit Checkpoint** | Whether mandatory audit trails are needed |

### Tab 4: RPA

These four fields assess suitability for Robotic Process Automation. Each is scored 0–4.

| Field | What it measures |
|---|---|
| **Rule-Based** | How deterministic and rule-driven the process is |
| **Structured Data** | How structured and clean the data inputs are |
| **Zero Judgment** | Does the process require zero human judgment? |
| **Process Stability** | How stable/unchanged the process is over time |

### Tab 5: AI

These five fields assess suitability for AI/Machine Learning automation. Each is scored 0–4.

| Field | What it measures |
|---|---|
| **AI Judgment** | Requires advanced cognitive AI (NLP, vision, reasoning) |
| **Unstructured Data** | Deals with unstructured inputs (text, audio, images) |
| **Process Variability** | The process is highly variable and non-deterministic |
| **Training Overhead** | Requires continuous model training/retraining |
| **Risk Inverse (Penalty ⚠)** | High failure risk — penalises the AI score. High = risky to automate with AI |

### Tab 6: Financial

These fields capture the financial and strategic case for automation.

| Field | Description |
|---|---|
| **Benefit Annualized (USD)** | Conservative annual savings (headcount, errors, speed) net of run costs |
| **Cost One-Time (USD)** | Build cost: licences, development, testing, training |
| **Automation Cost Estimate (USD)** | Total first-year cost (build + run) |
| **Strategic Alignment Score** | How aligned this process is with top strategic priorities (0–100) |
| **VOI Risk Reduction** | Value of eliminating operational/compliance risk (0–100) |
| **VOI Agility** | Value of improved responsiveness/speed (0–100) |
| **VOI Brand Reputation** | Value of customer trust and reputation improvement (0–100) |
| **VOI Employee Satisfaction** | Value of removing tedious manual work (0–100) |
| **ROI Method** | Primary financial value driver (dropdown) |
| **VOI Method** | Primary intangible value driver (dropdown) |

### Tab 7: Other

| Field | Description |
|---|---|
| **Process Type** | Operational - Fulfilment / Assurance / Management / Strategic |
| **Parent Cycle** | Plan / Source / Make / Deliver / Return / Enable |
| **Start/End Event Type** | BPMN event types |
| **Frequency** | How often the process runs |
| **Process Criticality** | Critical / High / Medium / Low |
| **Audit Criticality** | Audit risk level |
| **SLA** | Turnaround target (e.g. "5min", "24h") |
| **Reusable** | Yes = reusable across sectors |
| **Standard Mapping** | Industry standard reference (e.g. SCOR D1.1) |
| **Automation KPI IDs** | KPI references (e.g. KPI_OTIF) |
| **Workflow Template** | Template name for workflow tooling |

### Live Score Preview

On the right side of the editor (on large screens), you will see the **Live Score Preview** panel. It updates in real time as you adjust any slider or field, showing:

- Recommended Execution Mode
- BPMN Readiness score and Ready flag
- All four automation scores (Human, Workflow, RPA, AI)
- ROI %, VOI Score, Priority Score, and Heatmap Quadrant

This lets you see the impact of your inputs before saving.

---

## 8. Understanding the Calculated Scores

The application automatically calculates 13 scores for each process. You cannot edit these — they are derived from your inputs.

### BPMN Readiness Score (0–100)
Weighted average of the 5 BPMN readiness inputs. A score of **80 or above** means the process is "BPMN Ready" — cleared for modelling.

### Execution Mode
The recommended automation approach, determined in this order:
1. If Human Score ≥ 80 → **Human Mandatory**
2. Otherwise, whichever of AI, RPA, or Workflow scores highest:
   - AI ≥ 90 → **AI Autonomous**
   - AI ≥ 70 → **AI Augmented**
   - RPA highest → **RPA**
   - Otherwise → **Workflow**

### ROI %
`((Annual Benefit - One-Time Cost) / One-Time Cost) × 100`

### VOI Score (0–100)
Weighted combination of the four intangible value scores: Risk Reduction (40%), Agility (30%), Brand Reputation (20%), Employee Satisfaction (10%).

### Automation Priority Score
The master ranking score combining ROI, VOI, cost efficiency, and strategic alignment.

### Rank
Processes are ranked 1–49 by Priority Score (highest = Rank 1).

### Automation Wave
- **Wave 1**: Rank 1–10 — automate immediately
- **Wave 2**: Rank 11–30 — medium-term pipeline
- **Wave 3**: Rank 31–49 — strategic backlog

### Heatmap Quadrant
- **Quick Win**: ROI ≥ 20% AND VOI ≥ 80
- **High ROI**: ROI ≥ 20% AND VOI < 80
- **High VOI**: ROI < 20% AND VOI ≥ 80
- **Strategic**: Both below threshold

---

## 9. The Dashboard

The Dashboard gives you a summary of your current scenario's assessment.

**Summary Cards** (top row):
- Total processes, In-scope count, BPMN-ready count, Wave 1 count

**Automation Heatmap**: Shows how many in-scope processes fall into each of the 4 quadrants.

**Execution Mode Distribution**: Bar chart showing how many processes are recommended for each automation mode.

**Wave 1 Pipeline**: The top 10 highest-priority processes — your immediate automation backlog.

**Scenario Information**: Creation date, author, and description.

---

## 10. Exporting Data

To export all process data for a scenario:

1. Go to the **Process Register** page
2. Click the **"⬇ Export JSON"** button in the top right
3. A JSON file will download to your computer

The file contains all 49 processes with every input field and all 13 calculated scores. You can open this in Excel or import it into other tools.

---

## 11. The Recycle Bin

When a scenario is deleted, all its processes are moved to the Recycle Bin rather than permanently deleted.

**To restore a process:**
1. Go to **"Recycle Bin"** in the sidebar
2. Find the process you want to restore
3. Click **"Restore"**
4. If the original scenario still exists, the process is restored there automatically
5. If the original scenario has been deleted, you will be asked to choose a new scenario

**To permanently delete a process:**
1. Click **"Permanently Delete"**
2. Confirm the deletion

> Warning: Permanently deleted processes cannot be recovered.

---

## 12. The Framework Reference Page

The **Framework** page is a read-only reference that explains all 13 formulas used in the scoring engine.

- Click on any row to expand it and see the full description
- Use this page to understand how scores are calculated and to explain them to stakeholders
- Each formula includes its ID, name, mathematical expression, and plain-English description

---

## 13. Changing Language

The application supports three languages:

- **English** (default)
- **Français** (French)
- **العربية** (Arabic — automatically switches to right-to-left layout)

To change language:
1. Scroll to the bottom of the left sidebar
2. Use the **Language** dropdown to select your preferred language
3. The entire interface updates instantly

---

## 14. Frequently Asked Questions

**Can I have multiple scenarios for the same company?**
Yes. You can create as many scenarios as you need — for example, "Current State 2025", "Future State 2026", or separate scenarios for different business units.

**Why is my process showing Rank 49 and Wave 3?**
All financial and score fields are set to zero by default. Enter data in the Financial tab (especially Benefit, Cost, and Strategic Alignment) to generate a meaningful rank.

**Why can't I edit the Macro ID, Process Name, or RACI fields?**
These are master data fields defined by the D01 specification and cannot be changed per scenario. They are read-only to ensure consistency.

**My BPMN Ready flag shows "No" — what should I do?**
Your BPMN Readiness Score is below 80. Go to the BPMN Readiness tab and increase the scores, particularly Process Clarity and Exception Logic, which have the highest weights.

**What does "Human Mandatory" mean?**
It means the human scores are so high (≥ 80 on the combined scale) that the process should not be automated. A human must remain in control. Review whether the Human tab scores are accurate.

**Can I delete a process from a scenario?**
Individual processes cannot be deleted — only entire scenarios can be deleted (which moves all processes to the Recycle Bin). This protects data integrity across the 49-process register.

---

*End of User Guide*
