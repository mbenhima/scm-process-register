"""Builds "DynamicMS — Response to the feedback, round 3": the general requests on the user
experience (DynamicMS_General) and the notes on Scenario 1 of User Guide 2 (pages 1 to 13:
UMS016 context analysis and UMS022 AI-assisted policy draft), with what changed and where."""
import os
from brand import (new_document, cover, toc, para, bullets, numbered, table, callout, image)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BUILD = os.path.join(ROOT, 'deliverables', 'build')
OUT = os.path.join(ROOT, 'deliverables')
SHOT = os.path.join(BUILD, 'deck-en')

GENERAL = [
    ('1', 'Where is the function CRUD (creation, …)?',
     'Functions have their own menu entry: Design › Functions. It opens the process design editor on the Functions tab: New element, edit, retire or delete, restore, and a version history with compare and restore. The Organization › Roles screen links roles to these functions.',
     'Design › Functions'),
    ('2', 'Windows opened from the menu cannot be scrolled; add a scroll bar.',
     'Every dialog now keeps its title and buttons in view and scrolls its content with a visible scroll bar (the prompt specification, row editor, library, history and all other windows). Read-only text areas show their whole text, so the mouse wheel is no longer captured by a small box.',
     'All dialogs'),
    ('3', 'Show every identifier with its name between brackets (e.g. E2E-01).',
     'Identifiers are shown as "ID (name)": phases with a gate in New project ("E2E-01 (Context To Strategy)"), RACSI rows, the macro process header, the Function column of the process design editor, the linked step of AI use cases and of the AI model settings, and the macro process lists of the step forms ("UMS006 (Competence and Training Orchestration)").',
     'New project, RACSI, Process design, AI use cases, step forms'),
    ('4', 'Where to customize documents?',
     'Records › Documents has two buttons, Customize the templates and Layout: logo and colours, and a short explanation: Templates changes the sections, their order, text and data source (copy a standard template, then edit it); Layout sets the logo, colours, header and footer of every Word, PDF and Excel file; on a draft document, Edit the structure changes that document only. A menu entry Records › Document templates and layout opens the templates directly.',
     'Records › Documents; Records › Document templates and layout'),
    ('5', 'Typing areas are too small; qualify generic titles ("Item" → "External issues"); category as a list with Custom.',
     'Each row of a record table opens in a large window (button next to the row, and automatically for a new row): one large field per column, scrolling, Previous row / Next row and Back to the table. Text columns are wider in the table. Column titles are qualified per step: External issue, Internal issue, Interested party, Macro process 1 and 2, and on other list steps the object of the step instead of "Item". Category is a list with a Custom… entry (PESTLE categories for external issues; process, resources, competence, knowledge… for internal issues; internal / external party; interaction types).',
     'Every step with a record table'),
    ('6', 'Whenever there is a choice (e.g. Interested party), use a list with Custom.',
     'Choices are lists with a Custom… entry that opens a free text field: interested party (customers, employees, owner, suppliers, authorities, certification body, banks, community, partners…), categories, interaction type, type of requirement, macro processes. Values typed before in the same table are offered again in the list.',
     'Step forms'),
    ('7', 'A search bar is needed in the other sections, not only in the left menu.',
     'The header of every screen has a search bar "Search everything… (Ctrl+K)". Typing opens the global search with results grouped by type (steps, macro processes, records, documents, people, help) within the user\'s rights.',
     'Header of every screen'),
]

SCENARIO = [
    ('MP-001.2 Identify external issues', 'Make it usable: typing areas too small (item, impact description, source / evidence); a window with scrolling and a way back; category as a list with Custom; "Item" → "External issues".',
     'Table "External issues identified" with columns External issue, Category (PESTLE) as a list with Custom, Description and impact on the organization, Relevance, Source / evidence. Each row opens in the large row editor. On completion each issue becomes an entry of the context register (CI-E…).'),
    ('MP-001.3 Identify internal issues', 'Same feedback; "Item" → "Internal issues".',
     'Table "Internal issues identified" with Internal issue and a category list (process, commercial, resources, competence, organizational knowledge, infrastructure, information systems, culture, governance, performance, finance) with Custom; row editor; context register entries (CI-I…).'),
    ('MP-001.4 Identify interested parties', 'Same comment; qualify the item as "Interested party".',
     'Column Interested party is a list of typical parties with Custom; Internal / external; main needs; Influence (1–5) and Interest (1–5), which place the party in the influence and interest grid. On completion each party becomes an entry of the interested parties register (IP-…).'),
    ('MP-001.5 Determine needs and expectations', 'Many records per interested party; three ways to enter a need: manual, library (typed before and seeded, not linked to a party), AI; a need can be mapped to one or more interested parties. "Why this section?" (weighted score and conclusion).',
     'New form "Needs and expectations": one row per need with Need or expectation, Interested parties concerned (several parties from the previous step, or typed), Type of requirement (list with Custom), Adopted as a compliance obligation, How the organization addresses it, Relevance, Entered from (Manual, Library, AI) and Source / evidence. Buttons: Type a need, Add from the library (needs recorded in the organization and a reference list of 18 needs), Suggest with AI (organization language model when enabled, built-in engine otherwise; each suggestion linked to its party). The decision matrix is now optional; the weighted score and the conclusion carry an explanation under the field.'),
    ('MP-001.5 Generate document', 'Sections 7 and 8 of the generated context analysis were empty.',
     'The document now reads the interested parties typed in the step when the register is still empty, completing the steps fills the registers, and a new section "Needs and expectations mapped to the interested parties" lists each need with its parties, type, obligation and response. The influence and interest grid uses the scores of the parties.'),
    ('MP-001.7 Identify interactions between processes', 'Macro process 1 and Macro process 2 as lists with Custom; Category → Interaction type.',
     'Columns Macro process 1 (provides) and Macro process 2 (receives): list of the project\'s macro processes shown as "code (name)" with Custom for business processes (sales, delivery, invoicing…); Interaction type (output → input, information flow, resources provided, control and feedback, support service, shared record or tool) with Custom; What flows between them. The interaction label "A → B" is built automatically.'),
    ('MP-002.11 Generate the quality policy draft (AI)', '"I am not getting this… Maybe the LLM does not work?"',
     'The suggestion shown came from the built-in engine (Engine: rules+retrieval), because the language model call had failed: the Claude model rejected the temperature parameter (fixed earlier) or no model was enabled. Now: (1) the AI panel says clearly why the built-in engine answered (no model enabled, or the error returned by the model) with a link to Administration › AI models; (2) the built-in engine writes a real policy draft from the commitments recorded in the consultation step; (3) only the context typed by the user is sent (the "Edited" choice was being appended to the prompt); (4) Accept or Insert and edit puts the text into "Final validated text", not into the context.'),
]


def build():
    doc = new_document('Response to the feedback, round 3', 'DynamicMS — Feedback response, round 3')
    cover(doc, 'Feedback response · Round 3', 'Response to the Feedback — Round 3', 'User experience (DynamicMS_General) and Scenario 1 of User Guide 2 (pages 1 to 13)', 'POWERACT Consulting · DynamicMS 1.0 · September 2026')
    toc(doc)

    doc.add_heading('Summary', level=1)
    para(doc, 'The third round of feedback had two parts: seven general requests on the user experience, and notes on the first pages of Scenario 1 of User Guide 2 (context analysis UMS016 and the AI-assisted quality policy draft of UMS022). All were implemented in DynamicMS, tested and reflected in the guides and presentations.')
    bullets(doc, [
        ('Forms. ', 'Qualified column titles, lists with Custom for every choice, a large row editor with scrolling and a way back, macro process pickers, and a new "Needs and expectations" form where a need is linked to several interested parties and entered manually, from the library or by the AI.'),
        ('Navigation. ', 'Search bar in the header of every screen; Functions and Document templates in the menu; identifiers shown with their names; scrollable dialogs.'),
        ('Documents. ', 'Completing the context steps fills the context and interested parties registers; the context analysis shows the parties, their needs and the influence and interest grid even in a new project.'),
        ('AI. ', 'The AI panel says which engine answered and why; the built-in engine drafts a real policy; the validated text goes into the right field.'),
    ])

    doc.add_heading('General requests (DynamicMS_General)', level=1)
    table(doc, ['#', 'Request', 'What changed', 'Where'], [list(x) for x in GENERAL], [0.8, 4.2, 9.6, 3.4], size=8.5)
    image(doc, os.path.join(SHOT, 'f-row-editor.png'), 16, 'A row of "External issues identified" opened in the large editor: scrolling, previous / next row and Back to the table.')

    doc.add_heading('Scenario 1 — pages 1 to 13 of User Guide 2', level=1)
    table(doc, ['Step', 'Note', 'What changed'], [list(x) for x in SCENARIO], [3.4, 5.0, 9.6], size=8.5)
    image(doc, os.path.join(SHOT, 'f-needs.png'), 16, 'MP-001.5: needs and expectations, each linked to one or more interested parties, with the library and AI buttons.')

    doc.add_heading('About the AI answer on MP-002.11', level=2)
    para(doc, 'The screenshot in the guide shows "Engine: rules+retrieval": the answer came from the built-in engine, not from the language model. When the organization\'s model is not enabled, or when it returns an error, DynamicMS keeps working with its built-in engine. The panel now states the reason in a visible message. To use Claude, open Administration › AI models, choose the provider and the model, type the API key, tick "Use this model for the AI use cases", save and select Test the connection: the answer "anthropic · claude-opus-5-5: OK" confirms the connection.')
    callout(doc, 'The temperature error reported earlier ("temperature is deprecated for this model") is fixed: DynamicMS no longer sends the temperature to the models that set it themselves (Claude Opus 5.5, Sonnet 5.5, Fable 5.1; OpenAI GPT-5).', 'Note.')

    doc.add_heading('How to check the changes', level=1)
    numbered(doc, [
        'Install and seed the application, sign in as ims@atlas-sme.example (Demo@2026). Create a project (Organization › New project): the phases with a gate show "E2E-01 (Context To Strategy)"…',
        'Open the new project › Lifecycle › E2E-01 › UMS016, step 2 "Identify external issues": type an issue, choose a PESTLE category or Custom…, open the row in the large window, go back to the table.',
        'Step 4: add interested parties from the list (or Custom…) with influence and interest, then complete the step.',
        'Step 5: select Suggest with AI and Add from the library; link a need to two parties; complete the step.',
        'Step 7: choose Macro process 1 and 2 from the list or type a business process.',
        'Records › Documents › New document › Context and interested parties analysis: sections "Interested parties and their requirements", "Needs and expectations mapped to the interested parties" and the influence and interest grid are filled.',
        'UMS022 step 4 "Generate the quality policy draft from the template": Suggest shows the engine used and, without a language model, a policy draft built from the commitments.',
        'Type in the search bar of the header on any screen; open Design › Functions; open Records › Documents › Customize the templates.',
    ])
    path = os.path.join(OUT, 'DynamicMS_Feedback_Response_Round_3.docx')
    doc.save(path)
    print('saved', path)


if __name__ == '__main__':
    build()
