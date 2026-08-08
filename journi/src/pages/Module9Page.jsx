import React, { useState } from 'react'
import { useI18n } from '../i18n/index.jsx'
import { useAppState } from '../state/AppStateContext.jsx'
import { useOrgProjects } from '../utils/useScoped.js'
import RequireProject from '../components/RequireProject.jsx'
import PageHeader from '../components/PageHeader.jsx'
import Badge from '../components/Badge.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import AiSuggestionBox from '../components/AiSuggestionBox.jsx'
import { ADKAR_BLOCKS } from '../data/constants.js'
import { canWrite } from '../utils/rbac.js'

const STATUS_TONE = { sent: 'green', scheduled: 'amber', draft: 'gray' }

function Content({ project }) {
  const { t } = useI18n()
  const { data, addSubItem, removeSubItem, currentUser } = useAppState()
  const canEdit = canWrite(currentUser?.role, data.rolePermissions)
  const orgProjects = useOrgProjects(project.orgId)
  const otherProjects = orgProjects.filter((p) => p.id !== project.id)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ message: '', audience: '', channel: '', sender: '', timing: '', adkarBlock: 'awareness', status: 'draft' })

  function submit() {
    if (!form.message.trim()) return
    addSubItem(project.id, 'communications', form)
    setModal(false)
    setForm({ message: '', audience: '', channel: '', sender: '', timing: '', adkarBlock: 'awareness', status: 'draft' })
  }

  const saturationRisk = otherProjects.length > 0

  return (
    <div className="space-y-4">
      {saturationRisk && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <Badge tone="amber">{t('saturationWarning')}</Badge>
          <p className="mt-1">
            {otherProjects.length} other active initiative(s) in this organization may be targeting an overlapping population:{' '}
            {otherProjects.map((p) => p.name).join(', ')}.
          </p>
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={() => setModal(true)}>
            + {t('message')}
          </button>
        </div>
      )}

      <div className="card overflow-x-auto">
        {project.communications.length === 0 ? (
          <div className="p-4">
            <EmptyState />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-50/70 text-brand-800 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-start px-4 py-2.5">{t('message')}</th>
                <th className="text-start px-4 py-2.5">{t('audience')}</th>
                <th className="text-start px-4 py-2.5">{t('channel')}</th>
                <th className="text-start px-4 py-2.5">{t('timing')}</th>
                <th className="text-start px-4 py-2.5">{t('linkedAdkarBlock')}</th>
                <th className="text-start px-4 py-2.5">{t('status')}</th>
                {canEdit && <th className="px-2 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {project.communications.map((c) => (
                <tr key={c.id} className="border-t border-brand-50">
                  <td className="px-4 py-2.5 max-w-xs text-brand-950">{c.message}</td>
                  <td className="px-4 py-2.5 text-ink/60">{c.audience}</td>
                  <td className="px-4 py-2.5 text-ink/60">{c.channel}</td>
                  <td className="px-4 py-2.5 text-ink/60">{c.timing}</td>
                  <td className="px-4 py-2.5">
                    <Badge tone="sand">{t(c.adkarBlock)}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge>
                  </td>
                  {canEdit && (
                    <td className="px-2 py-2.5">
                      <button className="btn-danger text-xs" onClick={() => removeSubItem(project.id, 'communications', c.id)}>
                        {t('delete')}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-2 text-sm">Communication Draft Generator</h3>
          <AiSuggestionBox
            useCaseId="uc-comm-draft"
            orgId={project.orgId}
            projectId={project.id}
            ucName="Communication Draft Generator"
            tier="augmented"
            buildSuggestion={() =>
              `Draft: "As ${project.name} moves forward, here's what's changing for you and why it matters — join us at the next briefing to ask questions directly."`
            }
            onAccept={(text) =>
              addSubItem(project.id, 'communications', {
                message: text,
                audience: 'All target population',
                channel: 'Email',
                sender: project.changeManager,
                timing: 'Next cycle',
                adkarBlock: 'awareness',
                status: 'draft',
              })
            }
          />
        </div>
        <div className="card p-4">
          <h3 className="font-semibold text-brand-950 mb-2 text-sm">Change Saturation Advisor</h3>
          <AiSuggestionBox
            useCaseId="uc-saturation-advisor"
            orgId={project.orgId}
            projectId={project.id}
            ucName="Change Saturation Advisor"
            tier="assistive"
            buildSuggestion={() =>
              saturationRisk
                ? `Scheduling conflict detected: this population overlaps with ${otherProjects[0].name}. Suggest staggering next communications by 2 weeks to avoid change fatigue.`
                : `No scheduling conflicts detected across concurrent initiatives for this population.`
            }
          />
        </div>
      </div>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={`+ ${t('message')}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>
              {t('cancel')}
            </button>
            <button className="btn-primary" onClick={submit}>
              {t('save')}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <textarea className="input" rows={2} placeholder={t('message')} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <input className="input" placeholder={t('audience')} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
          <input className="input" placeholder={t('channel')} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} />
          <input className="input" placeholder={t('sender')} value={form.sender} onChange={(e) => setForm({ ...form, sender: e.target.value })} />
          <input className="input" placeholder={t('timing')} value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} />
          <select className="input" value={form.adkarBlock} onChange={(e) => setForm({ ...form, adkarBlock: e.target.value })}>
            {ADKAR_BLOCKS.map((b) => (
              <option key={b} value={b}>
                {t(b)}
              </option>
            ))}
          </select>
          <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">draft</option>
            <option value="scheduled">scheduled</option>
            <option value="sent">sent</option>
          </select>
        </div>
      </Modal>
    </div>
  )
}

export default function Module9Page() {
  const { t } = useI18n()
  return (
    <div>
      <PageHeader title={t('m9_title')} description={t('m9_desc')} />
      <RequireProject>{(project) => <Content project={project} />}</RequireProject>
    </div>
  )
}
