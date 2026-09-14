import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { canManageTemplates } from '../utils/rbac.js'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import VersionHistoryPanel from '../components/VersionHistoryPanel.jsx'
import { uid } from '../utils/id.js'

// D-Config item 3: Template Library. Phase Templates (M8's own
// TemplateManagerModal) already had full versioned CRUD before this module
// shipped, so it's surfaced here as a fourth, read-linking tab rather than
// duplicating that CRUD UI — Charter / Communication / Training templates
// are the three genuinely new, versioned catalogs this page owns.

const BLANK = {
  charterTemplates: { name: '', charterType: 'sponsorship_leadership', description: '', sectionsText: '' },
  communicationTemplates: { name: '', channel: 'email', audience: '', description: '', bodyOutline: '' },
  trainingTemplates: { name: '', targetRole: 'practitioner', description: '', modulesText: '' },
}

function sectionsToText(sections) {
  return (sections || []).map((s) => `${s.heading}: ${s.prompt}`).join('\n')
}
function textToSections(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const idx = l.indexOf(':')
      return idx === -1 ? { heading: l, prompt: '' } : { heading: l.slice(0, idx).trim(), prompt: l.slice(idx + 1).trim() }
    })
}
function modulesToText(modules) {
  return (modules || []).map((m) => `${m.name} | ${m.durationHours}`).join('\n')
}
function textToModules(text) {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, hours] = l.split('|').map((s) => s.trim())
      return { name, durationHours: Number(hours) || 0 }
    })
}

function toForm(kind, tpl) {
  if (!tpl) return { ...BLANK[kind] }
  if (kind === 'charterTemplates') return { name: tpl.name, charterType: tpl.charterType, description: tpl.description, sectionsText: sectionsToText(tpl.sections) }
  if (kind === 'communicationTemplates') return { name: tpl.name, channel: tpl.channel, audience: tpl.audience, description: tpl.description, bodyOutline: tpl.bodyOutline }
  return { name: tpl.name, targetRole: tpl.targetRole, description: tpl.description, modulesText: modulesToText(tpl.modules) }
}
function fromForm(kind, form) {
  if (kind === 'charterTemplates') return { name: form.name, charterType: form.charterType, description: form.description, sections: textToSections(form.sectionsText) }
  if (kind === 'communicationTemplates') return { name: form.name, channel: form.channel, audience: form.audience, description: form.description, bodyOutline: form.bodyOutline }
  return { name: form.name, targetRole: form.targetRole, description: form.description, modules: textToModules(form.modulesText) }
}

function TemplateForm({ kind, form, setForm }) {
  const { t } = useI18n()
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className="space-y-3">
      <div>
        <label className="label">{t('tpl_name')}</label>
        <input className="input" value={form.name} onChange={set('name')} />
      </div>
      <div>
        <label className="label">{t('tpl_description')}</label>
        <textarea className="input" rows={2} value={form.description} onChange={set('description')} />
      </div>
      {kind === 'charterTemplates' && (
        <div>
          <label className="label">{t('tpl_sections')}</label>
          <p className="text-xs text-ink/50 mb-1">{t('tpl_sections_hint')}</p>
          <textarea className="input font-mono text-xs" rows={5} value={form.sectionsText} onChange={set('sectionsText')} />
        </div>
      )}
      {kind === 'communicationTemplates' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('tpl_channel')}</label>
              <input className="input" value={form.channel} onChange={set('channel')} />
            </div>
            <div>
              <label className="label">{t('tpl_audience')}</label>
              <input className="input" value={form.audience} onChange={set('audience')} />
            </div>
          </div>
          <div>
            <label className="label">{t('tpl_body_outline')}</label>
            <textarea className="input" rows={3} value={form.bodyOutline} onChange={set('bodyOutline')} />
          </div>
        </>
      )}
      {kind === 'trainingTemplates' && (
        <>
          <div>
            <label className="label">{t('tpl_target_role')}</label>
            <input className="input" value={form.targetRole} onChange={set('targetRole')} />
          </div>
          <div>
            <label className="label">{t('tpl_modules')}</label>
            <p className="text-xs text-ink/50 mb-1">{t('tpl_modules_hint')}</p>
            <textarea className="input font-mono text-xs" rows={5} value={form.modulesText} onChange={set('modulesText')} />
          </div>
        </>
      )}
    </div>
  )
}

function TemplateCard({ kind, tpl, canEdit, onEdit, onDelete }) {
  const { t } = useI18n()
  const [showHistory, setShowHistory] = useState(false)
  const { revertLibraryTemplate } = useAppState()
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xs text-ink/40">{tpl.id}</span>
          <h3 className="font-semibold text-brand-950">{tpl.name}</h3>
        </div>
        <Badge tone="gray">v{tpl.version}</Badge>
      </div>
      <p className="text-sm text-ink/60">{tpl.description}</p>
      {kind === 'charterTemplates' && (
        <ul className="text-xs text-ink/60 list-disc ps-4">
          {(tpl.sections || []).map((s, i) => (
            <li key={i}>
              <strong className="text-ink/80">{s.heading}:</strong> {s.prompt}
            </li>
          ))}
        </ul>
      )}
      {kind === 'communicationTemplates' && (
        <div className="text-xs text-ink/60">
          <Badge tone="brand">{tpl.channel}</Badge> <Badge tone="gray">{tpl.audience}</Badge>
          <p className="mt-1">{tpl.bodyOutline}</p>
        </div>
      )}
      {kind === 'trainingTemplates' && (
        <ul className="text-xs text-ink/60 list-disc ps-4">
          {(tpl.modules || []).map((m, i) => (
            <li key={i}>
              {m.name} — {m.durationHours}h
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 pt-1">
        {canEdit && (
          <button className="btn-ghost text-xs py-1 px-2" onClick={() => onEdit(tpl)}>
            {t('edit')}
          </button>
        )}
        {canEdit && (
          <button className="btn-ghost text-xs py-1 px-2 text-red-600" onClick={() => onDelete(tpl.id)}>
            {t('delete')}
          </button>
        )}
        <button className="btn-ghost text-xs py-1 px-2" onClick={() => setShowHistory((v) => !v)}>
          {t('versionHistory')}
        </button>
      </div>
      {showHistory && (
        <VersionHistoryPanel
          entity={tpl}
          canRevert={canEdit}
          onRevert={(v) => {
            if (window.confirm(t('versionRevertConfirm'))) revertLibraryTemplate(kind, tpl.id, v)
          }}
        />
      )}
    </div>
  )
}

function LibrarySection({ kind, data, canEdit }) {
  const { t } = useI18n()
  const { addLibraryTemplate, updateLibraryTemplate, deleteLibraryTemplate } = useAppState()
  const [editing, setEditing] = useState(null) // null | 'new' | tpl
  const [form, setForm] = useState(null)

  const openNew = () => {
    setEditing('new')
    setForm(toForm(kind, null))
  }
  const openEdit = (tpl) => {
    setEditing(tpl)
    setForm(toForm(kind, tpl))
  }
  const save = () => {
    const payload = fromForm(kind, form)
    if (editing === 'new') addLibraryTemplate(kind, { ...payload, id: uid(kind) })
    else updateLibraryTemplate(kind, editing.id, payload, t('tpl_edited_note'))
    setEditing(null)
    setForm(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-ink/60">{t(`tpl_${kind}_desc`)}</p>
        {canEdit && (
          <button className="btn-primary text-xs py-1.5 px-3" onClick={openNew}>
            {t('tpl_add')}
          </button>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {data.templateLibrary[kind].map((tpl) => (
          <TemplateCard key={tpl.id} kind={kind} tpl={tpl} canEdit={canEdit} onEdit={openEdit} onDelete={(id) => deleteLibraryTemplate(kind, id)} />
        ))}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? t('tpl_add') : t('edit')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>{t('cancel')}</button>
            <button className="btn-primary" onClick={save}>{t('save')}</button>
          </>
        }
      >
        {form && <TemplateForm kind={kind} form={form} setForm={setForm} />}
      </Modal>
    </div>
  )
}

function PhaseTemplatesLinkTab({ data }) {
  const { t } = useI18n()
  return (
    <div className="card p-4">
      <p className="text-sm text-ink/70">{t('tpl_phase_templates_note')}</p>
      <div className="grid sm:grid-cols-2 gap-2 mt-3">
        {data.phaseTemplateCatalog.map((tpl) => (
          <div key={tpl.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-brand-50/40 text-sm">
            <span>{tpl.name}</span>
            <Badge tone="gray">v{tpl.version} · {tpl.phases.length} {t('tpl_phases_suffix')}</Badge>
          </div>
        ))}
      </div>
      <a href="#/app/m17" className="btn-secondary text-xs py-1.5 px-3 mt-3 inline-block">
        {t('tpl_manage_phase_templates')}
      </a>
    </div>
  )
}

function Content() {
  const { t } = useI18n()
  const { data, currentUser } = useAppState()
  const canEdit = canManageTemplates(currentUser?.role, data.rolePermissions)
  const [tab, setTab] = useState('charterTemplates')
  const tabs = ['charterTemplates', 'communicationTemplates', 'trainingTemplates', 'phaseTemplates']

  return (
    <div>
      <PageHeader title={t('navTemplateLibrary')} description={t('tpl_page_desc')} />
      <div className="flex gap-2 mb-4 flex-wrap">
        {tabs.map((tb) => (
          <button key={tb} className={`tab ${tab === tb ? 'tab-active' : 'tab-inactive'}`} onClick={() => setTab(tb)}>
            {t(`tpl_tab_${tb}`)}
          </button>
        ))}
      </div>
      {tab === 'phaseTemplates' ? <PhaseTemplatesLinkTab data={data} /> : <LibrarySection kind={tab} data={data} canEdit={canEdit} />}
    </div>
  )
}

export default function TemplateLibraryPage() {
  return <Content />
}
