// BPMN 2.0 XML seed content for the "BPMN" module. NCP_PROCESS_BPMN_XML models the
// NCP Solver process itself (S1-S7) as a real, editable BPMN diagram; EMPTY_BPMN_XML is
// the minimal skeleton used when a user creates a brand-new diagram from scratch.

export const NCP_PROCESS_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_NCP" targetNamespace="http://ncpsolver.demo/bpmn">
  <bpmn:process id="Process_NCP" name="NCP Solver Process (S1-S7)" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" name="Non-Conformity Detected">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_S1" name="S1 - Detection &amp; Alert">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S2" name="S2 - Problem Understanding (5W2H)">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S3" name="S3 - Immediate / Containment Actions">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S4" name="S4 - Root Cause Analysis">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S5" name="S5 - Corrective Action Plan">
      <bpmn:incoming>Flow_5</bpmn:incoming>
      <bpmn:incoming>Flow_Loop</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_S6" name="S6 - Execution &amp; Effectiveness Evaluation">
      <bpmn:incoming>Flow_6</bpmn:incoming>
      <bpmn:outgoing>Flow_7</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Effective" name="Effective?">
      <bpmn:incoming>Flow_7</bpmn:incoming>
      <bpmn:outgoing>Flow_Loop</bpmn:outgoing>
      <bpmn:outgoing>Flow_8</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_S7" name="S7 - Capitalization (REX)">
      <bpmn:incoming>Flow_8</bpmn:incoming>
      <bpmn:outgoing>Flow_9</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="Sheet Closed">
      <bpmn:incoming>Flow_9</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_S1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_S1" targetRef="Task_S2" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_S2" targetRef="Task_S3" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Task_S3" targetRef="Task_S4" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Task_S4" targetRef="Task_S5" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_S5" targetRef="Task_S6" />
    <bpmn:sequenceFlow id="Flow_7" sourceRef="Task_S6" targetRef="Gateway_Effective" />
    <bpmn:sequenceFlow id="Flow_Loop" name="No - revise" sourceRef="Gateway_Effective" targetRef="Task_S5" />
    <bpmn:sequenceFlow id="Flow_8" name="Yes" sourceRef="Gateway_Effective" targetRef="Task_S7" />
    <bpmn:sequenceFlow id="Flow_9" sourceRef="Task_S7" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_NCP">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <omgdc:Bounds x="60" y="140" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S1_di" bpmnElement="Task_S1">
        <omgdc:Bounds x="150" y="118" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S2_di" bpmnElement="Task_S2">
        <omgdc:Bounds x="300" y="118" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S3_di" bpmnElement="Task_S3">
        <omgdc:Bounds x="450" y="118" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S4_di" bpmnElement="Task_S4">
        <omgdc:Bounds x="600" y="118" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S5_di" bpmnElement="Task_S5">
        <omgdc:Bounds x="750" y="118" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S6_di" bpmnElement="Task_S6">
        <omgdc:Bounds x="900" y="118" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Effective_di" bpmnElement="Gateway_Effective" isMarkerVisible="true">
        <omgdc:Bounds x="1055" y="133" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_S7_di" bpmnElement="Task_S7">
        <omgdc:Bounds x="1155" y="118" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <omgdc:Bounds x="1310" y="140" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <omgdi:waypoint x="96" y="158" />
        <omgdi:waypoint x="150" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <omgdi:waypoint x="250" y="158" />
        <omgdi:waypoint x="300" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <omgdi:waypoint x="400" y="158" />
        <omgdi:waypoint x="450" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <omgdi:waypoint x="550" y="158" />
        <omgdi:waypoint x="600" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_5_di" bpmnElement="Flow_5">
        <omgdi:waypoint x="700" y="158" />
        <omgdi:waypoint x="750" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_6_di" bpmnElement="Flow_6">
        <omgdi:waypoint x="850" y="158" />
        <omgdi:waypoint x="900" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_7_di" bpmnElement="Flow_7">
        <omgdi:waypoint x="1000" y="158" />
        <omgdi:waypoint x="1055" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Loop_di" bpmnElement="Flow_Loop">
        <omgdi:waypoint x="1080" y="133" />
        <omgdi:waypoint x="1080" y="60" />
        <omgdi:waypoint x="800" y="60" />
        <omgdi:waypoint x="800" y="118" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_8_di" bpmnElement="Flow_8">
        <omgdi:waypoint x="1105" y="158" />
        <omgdi:waypoint x="1155" y="158" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_9_di" bpmnElement="Flow_9">
        <omgdi:waypoint x="1255" y="158" />
        <omgdi:waypoint x="1310" y="158" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;

export const EMPTY_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:omgdc="http://www.omg.org/spec/DD/20100524/DC" xmlns:omgdi="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://ncpsolver.demo/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <omgdc:Bounds x="150" y="150" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>
`;
