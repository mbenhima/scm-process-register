import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { Card, Field } from '../components/ui.jsx';

export default function NewFichePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', criticality: 'medium', priority: 3,
    frequency: 'first_time', detection_date: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const fiche = await api.post('/fiches', form);
      navigate(`/fiches/${fiche.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="eyebrow">{t('fiche.tab.detail')}</div>
      <h1 className="font-title font-bold text-2xl text-grey-dark mb-4">{t('fiche.newFiche')}</h1>
      <Card>
        <form onSubmit={onSubmit}>
          <Field label={t('fiche.title')}>
            <input className="input" value={form.title} onChange={set('title')} required />
          </Field>
          <Field label={t('fiche.description')}>
            <textarea className="input" rows={4} value={form.description} onChange={set('description')} required />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t('fiche.criticality')}>
              <select className="input" value={form.criticality} onChange={set('criticality')}>
                <option value="high">{t('fiche.criticality.high')}</option>
                <option value="medium">{t('fiche.criticality.medium')}</option>
                <option value="low">{t('fiche.criticality.low')}</option>
              </select>
            </Field>
            <Field label={t('fiche.priority')}>
              <select className="input" value={form.priority} onChange={set('priority')}>
                <option value={1}>P1</option>
                <option value={2}>P2</option>
                <option value={3}>P3</option>
              </select>
            </Field>
            <Field label={t('fiche.frequency')}>
              <select className="input" value={form.frequency} onChange={set('frequency')}>
                <option value="first_time">{t('fiche.frequency.first_time')}</option>
                <option value="recurring">{t('fiche.frequency.recurring')}</option>
              </select>
            </Field>
          </div>
          <Field label={t('fiche.detectionDate')}>
            <input className="input" type="date" value={form.detection_date} onChange={set('detection_date')} />
          </Field>
          {error && <div className="text-sm text-red-600 mb-3">{error}</div>}
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">{t('common.cancel')}</button>
            <button type="submit" disabled={saving} className="btn-primary">{t('common.create')}</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
