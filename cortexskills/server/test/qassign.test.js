// Who answers what (release 1.15): the form each respondent receives from the assignment of sections, sub-sections
// and questions — the most specific assignment wins and an element without one goes to every respondent of the form.
import { test } from 'node:test';
import assert from 'node:assert/strict';
const Q = await import('../src/services/questionnaires.js');

const form = { code: 'F', sections: [
  { id: 'intro', type: 'note' },
  { id: 'who', type: 'identity', fields: [{ key: 'name' }] },
  { id: 'ai', type: 'questions', items: [{ key: 'q1', label: { fr: 'Triage' } }, { key: 'q2', label: { fr: 'Imagerie' } }, { key: 'q3', label: { fr: 'Apprendre' } }] },
  { id: 'grid', type: 'grid', rows: [{ key: 'r1', group: { en: 'Client', fr: 'Client' } }, { key: 'r2', group: { en: 'Client', fr: 'Client' } }, { key: 'r3', group: { en: 'Machines', fr: 'Machines' } }] }] };
const q = { forms: [form] };
const keys = f => f.sections.flatMap(s => [s.id, ...(s.items || s.rows || []).map(x => `${s.id}.${x.key}`)]);

test('elements: sections, sub-sections and questions in reading order', () => {
  const e = Q.elementsOf(form);
  assert.deepEqual(e.filter(x => x.level === 'subsection').map(x => x.ref), ['F|grid|g:client', 'F|grid|g:machines']);
  assert.equal(e.find(x => x.ref === 'F|grid|r1').parent, 'F|grid|g:client');
  assert.ok(!e.some(x => x.section === 'intro'), 'a note is not assignable');
});
test('no assignment: everyone receives the whole form', () => {
  assert.equal(Q.formForStakeholder(q, form, 'a'), form);
});
test('the most specific assignment wins; empty sections are left out', () => {
  const qa = { ...q, assignments: { 'F|ai': ['a', 'b'], 'F|ai|q2': ['c'], 'F|grid|g:machines': ['c'], 'F|who': ['a'] } };
  assert.deepEqual(keys(Q.formForStakeholder(qa, form, 'a')), ['intro', 'who', 'ai', 'ai.q1', 'ai.q3', 'grid', 'grid.r1', 'grid.r2']);
  assert.deepEqual(keys(Q.formForStakeholder(qa, form, 'c')), ['intro', 'ai', 'ai.q2', 'grid', 'grid.r1', 'grid.r2', 'grid.r3']);
  assert.deepEqual(keys(Q.formForStakeholder(qa, form, 'z')), ['intro', 'grid', 'grid.r1', 'grid.r2']);
  assert.equal(Q.questionCount(Q.formForStakeholder(qa, form, 'z')), 2);
});
test('assignments are checked against the forms and the respondents', () => {
  assert.throws(() => Q.cleanAssignments(q, { 'F|nope': ['a'] }, new Set(['a'])), /422|assign/i);
  assert.throws(() => Q.cleanAssignments(q, { 'F|ai': ['x'] }, new Set(['a'])));
  assert.deepEqual(Q.cleanAssignments(q, { 'F|ai': ['a', 'a'], 'F|ai|q1': [] }, new Set(['a'])), { 'F|ai': ['a'] });
});
