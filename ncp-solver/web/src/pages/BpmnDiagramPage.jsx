import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnViewer from 'bpmn-js/lib/NavigatedViewer';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import { api } from '../lib/api.js';
import { useI18n } from '../context/I18nContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState } from '../components/ui.jsx';

export default function BpmnDiagramPage() {
  const { id } = useParams();
  const { t } = useI18n();
  const { hasPermission, user } = useAuth();
  const navigate = useNavigate();
  const canEdit = hasPermission('bpmn.edit');

  const [diagram, setDiagram] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const containerRef = useRef(null);
  const modelerRef = useRef(null);

  const load = useCallback(() => {
    api.get(`/bpmn/${id}`).then(setDiagram).catch(() => {});
  }, [id]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!diagram || !containerRef.current) return undefined;
    const Ctor = canEdit ? BpmnModeler : BpmnViewer;
    const instance = new Ctor({ container: containerRef.current });
    modelerRef.current = instance;
    instance.importXML(diagram.xml).then(() => {
      instance.get('canvas').zoom('fit-viewport');
    }).catch((e) => setError(e.message));
    return () => instance.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diagram?.id, canEdit]);

  async function saveDiagram() {
    if (!modelerRef.current) return;
    setSaving(true);
    setError('');
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      const updated = await api.put(`/bpmn/${id}`, { xml, updated_by: user.id });
      setDiagram(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  if (!diagram) return <EmptyState message={t('common.loading')} />;

  return (
    <div className="space-y-4">
      <button onClick={() => navigate('/bpmn')} className="text-sm text-grey-ink hover:text-orange-deep">&larr; {t('common.back')}</button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="eyebrow">{diagram.code}</div>
          <h1 className="font-title font-bold text-2xl text-grey-dark">{diagram.title}</h1>
          {diagram.description && <p className="text-sm text-grey-ink mt-1 max-w-2xl">{diagram.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className="badge bg-grey-light text-grey-ink">
            {canEdit ? t('bpmn.editMode') : t('bpmn.viewMode')}
          </span>
          {canEdit && (
            <button onClick={saveDiagram} disabled={saving} className="btn-primary">
              {saving ? t('common.loading') : t('bpmn.saveDiagram')}
            </button>
          )}
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div ref={containerRef} className="bpmn-canvas rounded-card border border-grey-line bg-white" style={{ height: '70vh' }} />

      <p className="text-xs text-grey-medium italic">{canEdit ? t('bpmn.editHint') : t('bpmn.viewHint')}</p>
    </div>
  );
}
