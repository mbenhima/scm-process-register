import { addDoc, collection, deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function addAuditLog(orgId, uid, entry) {
  return addDoc(collection(db, 'organizations', orgId, 'auditLog'), {
    actor: uid,
    at: serverTimestamp(),
    ...entry,
  })
}

export async function createDoc(pathSegments, data) {
  return addDoc(collection(db, ...pathSegments), { ...data, createdAt: serverTimestamp() })
}

export async function setDocAt(pathSegments, data, merge = true) {
  return setDoc(doc(db, ...pathSegments), data, { merge })
}

export async function updateDocAt(pathSegments, data) {
  return updateDoc(doc(db, ...pathSegments), data)
}

export async function deleteDocAt(pathSegments) {
  return deleteDoc(doc(db, ...pathSegments))
}

export function newId() {
  return doc(collection(db, '_')).id
}
