// AI Use Cases of the places that are not a single AI-assisted step (FR-DA-AI-23): every AI
// suggestion of the application is produced through one of them, so a place with no active
// use case offers no AI action. They are seeded with the library like the other entries.
const L = (en, fr, ar) => ({ en, fr, ar });

export const PLACES = {
  'project.draft': L('Project creation — draft from a description', 'Création de projet — brouillon à partir d\'une description', 'إنشاء المشروع — مسودة من وصف'),
  assistant: L('AI Assistant', 'Assistant IA', 'المساعد الذكي'),
};

export const PLACE_USECASES = [
  {
    id: 'AIUC-P01', place: 'step', step: 'MP-001.5', mp: 'MP-001',
    name: L('Propose the needs and expectations of interested parties', 'Proposer les besoins et attentes des parties intéressées', 'اقتراح احتياجات وتوقعات الأطراف المعنية'),
    taskType: L('Recommendation', 'Recommandation', 'التوصية'), risk: 'Low', riskName: L('Low', 'Faible', 'منخفض'),
    checkpoint: L('The IMS Manager accepts, edits or rejects each proposed need before completing the step.', 'Le responsable SMI accepte, modifie ou rejette chaque besoin proposé avant de terminer l\'étape.', 'يقبل مدير نظام الإدارة المتكامل كل حاجة مقترحة أو يعدّلها أو يرفضها قبل إكمال الخطوة.'),
    trigger: L('The user selects Propose with AI in the needs table', 'L\'utilisateur choisit Proposer avec l\'IA dans le tableau des besoins', 'يختار المستخدم «اقترح بالذكاء الاصطناعي» في جدول الاحتياجات'),
    output: L('Rows of the needs table: party, need or expectation, how it is addressed, priority', 'Lignes du tableau des besoins : partie, besoin ou attente, réponse apportée, priorité', 'صفوف جدول الاحتياجات: الطرف، الحاجة أو التوقع، كيفية تلبيتها، الأولوية'),
    scope: 'Tenant', custom: false, approval: 'Approved', tier: 'Assistive', module: 'execution',
    inputs: ['parties'], outputs: ['needs'],
  },
  {
    id: 'AIUC-P02', place: 'module', module: 'project.draft', step: null, mp: null,
    name: L('Draft a project from a short description', 'Rédiger un projet à partir d\'une courte description', 'صياغة مشروع من وصف قصير'),
    taskType: L('Recommendation', 'Recommandation', 'التوصية'), risk: 'Low', riskName: L('Low', 'Faible', 'منخفض'),
    checkpoint: L('The project creator accepts, edits or rejects each proposed field before the project is saved.', 'Le créateur du projet accepte, modifie ou rejette chaque champ proposé avant l\'enregistrement du projet.', 'يقبل منشئ المشروع كل حقل مقترح أو يعدّله أو يرفضه قبل حفظ المشروع.'),
    trigger: L('The user selects Draft the project on the new project page', 'L\'utilisateur choisit Rédiger le projet sur la page de nouveau projet', 'يختار المستخدم «صياغة المشروع» في صفحة المشروع الجديد'),
    output: L('Project fields, complexity scores, recommended mode and track, closest template', 'Champs du projet, notes de complexité, mode et parcours recommandés, modèle le plus proche', 'حقول المشروع ودرجات التعقيد والنمط والمسار الموصى بهما وأقرب نموذج'),
    scope: 'Tenant', custom: false, approval: 'Approved', tier: 'Assistive',
    inputs: ['description'], outputs: ['name', 'standards', 'levels', 'mode', 'track', 'template'],
  },
  {
    id: 'AIUC-P03', place: 'module', module: 'assistant', step: null, mp: null,
    name: L('Answer questions on the application, the standards and the project data', 'Répondre aux questions sur l\'application, les normes et les données du projet', 'الإجابة عن الأسئلة حول التطبيق والمعايير وبيانات المشروع'),
    taskType: L('Text Generation', 'Génération de texte', 'توليد النصوص'), risk: 'Low', riskName: L('Low', 'Faible', 'منخفض'),
    checkpoint: L('The user reads the answer with its references before acting on it.', 'L\'utilisateur lit la réponse et ses références avant d\'agir.', 'يقرأ المستخدم الإجابة ومراجعها قبل التصرف بناءً عليها.'),
    trigger: L('The user asks a question in the AI Assistant', 'L\'utilisateur pose une question dans l\'Assistant IA', 'يطرح المستخدم سؤالًا في المساعد الذكي'),
    output: L('An answer grounded in the references shown with it', 'Une réponse fondée sur les références affichées avec elle', 'إجابة مستندة إلى المراجع المعروضة معها'),
    scope: 'Tenant', custom: false, approval: 'Approved', tier: 'Assistive',
    inputs: ['question', 'mode'], outputs: ['answer'],
  },
];

/** Adds the place use cases to a catalog bundle that does not hold them yet. */
export function withPlaces(c) {
  if (!Array.isArray(c.aiUseCases)) return c;
  for (const p of PLACE_USECASES) if (!c.aiUseCases.some(a => a.id === p.id)) c.aiUseCases.push(p);
  return c;
}
