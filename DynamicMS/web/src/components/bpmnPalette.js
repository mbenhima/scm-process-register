// Extra entries for the bpmn-js palette: the BPMN shapes modelers use most, next to the
// default ones (hand, lasso, space, connect, start / intermediate / end event, gateway,
// task, expanded sub-process, data object, data store, pool and group).
const ENTRIES = [
  ['event', 'start-timer', 'bpmn:StartEvent', 'bpmn-icon-start-event-timer', 'Timer start event', { eventDefinitionType: 'bpmn:TimerEventDefinition' }],
  ['event', 'start-message', 'bpmn:StartEvent', 'bpmn-icon-start-event-message', 'Message start event', { eventDefinitionType: 'bpmn:MessageEventDefinition' }],
  ['event', 'catch-timer', 'bpmn:IntermediateCatchEvent', 'bpmn-icon-intermediate-event-catch-timer', 'Intermediate timer event', { eventDefinitionType: 'bpmn:TimerEventDefinition' }],
  ['event', 'catch-message', 'bpmn:IntermediateCatchEvent', 'bpmn-icon-intermediate-event-catch-message', 'Intermediate message event', { eventDefinitionType: 'bpmn:MessageEventDefinition' }],
  ['event', 'end-message', 'bpmn:EndEvent', 'bpmn-icon-end-event-message', 'Message end event', { eventDefinitionType: 'bpmn:MessageEventDefinition' }],
  ['event', 'end-error', 'bpmn:EndEvent', 'bpmn-icon-end-event-error', 'Error end event', { eventDefinitionType: 'bpmn:ErrorEventDefinition' }],
  ['event', 'end-terminate', 'bpmn:EndEvent', 'bpmn-icon-end-event-terminate', 'Terminate end event', { eventDefinitionType: 'bpmn:TerminateEventDefinition' }],
  ['gateway', 'parallel', 'bpmn:ParallelGateway', 'bpmn-icon-gateway-parallel', 'Parallel gateway'],
  ['gateway', 'inclusive', 'bpmn:InclusiveGateway', 'bpmn-icon-gateway-or', 'Inclusive gateway'],
  ['gateway', 'event-based', 'bpmn:EventBasedGateway', 'bpmn-icon-gateway-eventbased', 'Event-based gateway'],
  ['activity', 'user-task', 'bpmn:UserTask', 'bpmn-icon-user-task', 'User task'],
  ['activity', 'service-task', 'bpmn:ServiceTask', 'bpmn-icon-service-task', 'Service task'],
  ['activity', 'manual-task', 'bpmn:ManualTask', 'bpmn-icon-manual-task', 'Manual task'],
  ['activity', 'send-task', 'bpmn:SendTask', 'bpmn-icon-send-task', 'Send task'],
  ['activity', 'receive-task', 'bpmn:ReceiveTask', 'bpmn-icon-receive-task', 'Receive task'],
  ['activity', 'business-rule-task', 'bpmn:BusinessRuleTask', 'bpmn-icon-business-rule-task', 'Business rule task'],
  ['activity', 'script-task', 'bpmn:ScriptTask', 'bpmn-icon-script-task', 'Script task'],
  ['activity', 'subprocess-collapsed', 'bpmn:SubProcess', 'bpmn-icon-subprocess-collapsed', 'Collapsed sub-process', { isExpanded: false }],
  ['activity', 'call-activity', 'bpmn:CallActivity', 'bpmn-icon-call-activity', 'Call activity'],
  ['artifact', 'text-annotation', 'bpmn:TextAnnotation', 'bpmn-icon-text-annotation', 'Text annotation'],
];

function ExtraPaletteProvider(palette, create, elementFactory, translate) {
  this.getPaletteEntries = () => (entries) => {
    const out = { ...entries };
    for (const [group, id, type, className, title, options] of ENTRIES) {
      const start = (event) => create.start(event, elementFactory.createShape({ type, ...(options || {}) }));
      out[`create.${id}`] = { group, className, title: translate(title), action: { dragstart: start, click: start } };
    }
    // Keep the groups in the usual modeling order: tools, events, gateways, activities, data, pools, artifacts.
    const order = ['tools', 'event', 'gateway', 'activity', 'data-object', 'data-store', 'collaboration', 'artifact'];
    return Object.fromEntries(Object.entries(out).sort(([, a], [, b]) => order.indexOf(a.group) - order.indexOf(b.group)));
  };
  palette.registerProvider(400, this);
}
ExtraPaletteProvider.$inject = ['palette', 'create', 'elementFactory', 'translate'];

export default { __init__: ['extraPaletteProvider'], extraPaletteProvider: ['type', ExtraPaletteProvider] };
