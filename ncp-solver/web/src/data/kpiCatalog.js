// Display names for the 9 threshold-bearing system KPIs (of the 10 built-in
// KPIs — KPI9 "NC Count Total" is a raw count with no target threshold, so it
// has no entry in kpi_thresholds_json / Governance Settings) and for Alert
// types A-J. Keys must match governance_settings.kpi_thresholds_json (see
// server/src/seed/seed.js) and notification_alerts.alert_type respectively.
// Translated inline (EN/FR/AR) rather than through the i18n catalog since
// these are small, stable, code-like keys best kept next to each other here.
export const KPI_NAMES = {
  kpi1_completion_immediate: { en: 'Immediate Action Completion Rate', fr: "Taux d'achèvement des actions immédiates", ar: 'معدل إنجاز الإجراءات الفورية' },
  kpi2_effectiveness_immediate: { en: 'Immediate Action Effectiveness Rate', fr: "Taux d'efficacité des actions immédiates", ar: 'معدل فعالية الإجراءات الفورية' },
  kpi3_on_time: { en: 'On-Time Completion Rate', fr: "Taux d'achèvement dans les délais", ar: 'معدل الإنجاز في الوقت المحدد' },
  kpi4_completion_corrective: { en: 'Corrective Action Completion Rate', fr: "Taux d'achèvement des actions correctives", ar: 'معدل إنجاز الإجراءات التصحيحية' },
  kpi5_effectiveness_corrective: { en: 'Corrective Action Effectiveness Rate', fr: "Taux d'efficacité des actions correctives", ar: 'معدل فعالية الإجراءات التصحيحية' },
  kpi6_evaluations: { en: 'Evaluation Completion Rate', fr: 'Taux de réalisation des évaluations', ar: 'معدل إنجاز التقييمات' },
  kpi7_standardization: { en: 'Standardization Rate', fr: 'Taux de standardisation', ar: 'معدل التوحيد القياسي' },
  kpi8_generalization: { en: 'Generalization Rate', fr: 'Taux de généralisation', ar: 'معدل التعميم' },
  kpi10_closure: { en: 'Closure Rate', fr: 'Taux de clôture', ar: 'معدل الإغلاق' },
};

export const ALERT_NAMES = {
  A: { en: 'New Sheet Triage', fr: 'Tri des nouvelles fiches', ar: 'فرز البطاقات الجديدة' },
  B: { en: 'Action Overdue', fr: 'Action en retard', ar: 'إجراء متأخر' },
  C: { en: 'Evaluation Pending', fr: 'Évaluation en attente', ar: 'تقييم معلق' },
  D: { en: 'Root Cause Analysis Not Started', fr: 'Analyse des causes racines non démarrée', ar: 'لم يبدأ تحليل السبب الجذري' },
  E: { en: 'Containment Evidence Pending', fr: 'Preuve de confinement en attente', ar: 'دليل الاحتواء معلق' },
  F: { en: 'KPI Threshold Breach', fr: "Dépassement de seuil d'indicateur", ar: 'تجاوز عتبة مؤشر الأداء' },
  G: { en: 'Immediate Action Due Tomorrow', fr: 'Action immédiate due demain', ar: 'إجراء فوري مستحق غدًا' },
  H: { en: 'Corrective Action Due Soon', fr: 'Action corrective bientôt due', ar: 'إجراء تصحيحي مستحق قريبًا' },
  I: { en: 'Evaluation Due Soon', fr: 'Évaluation bientôt due', ar: 'تقييم مستحق قريبًا' },
  J: { en: 'Priority-1 Sheet Inactive', fr: 'Fiche Priorité 1 inactive', ar: 'بطاقة ذات أولوية 1 غير نشطة' },
};
