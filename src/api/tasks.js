/**
 * api/tasks.js — tasks（親タスク）コレクション
 *
 * 日付（start_date / due_date）は projects と同様 ISO8601 で保存し、
 * UI には 'YYYY-MM-DD' で渡す。
 */

import { Query, ID } from 'appwrite';
import { databases, DATABASE_ID } from '../appwrite';
import { COLLECTIONS } from './collections';

const COL = COLLECTIONS.TASKS;

const toIso  = (s) => !s ? null : (typeof s === 'string' && s.includes('T') ? s : new Date(`${s}T00:00:00Z`).toISOString());
const toDate = (s) => !s ? null : s.slice(0, 10);

const normalize = (doc) => {
  if (!doc) return null;
  return {
    ...doc,
    id: doc.$id,
    start_date: toDate(doc.start_date),
    due_date:   toDate(doc.due_date),
  };
};

export async function listTasks({ limit = 500 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.limit(limit),
    Query.orderAsc('order_index'),
  ]);
  return res.documents.map(normalize);
}

export async function listTasksByProject(projectId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('project_id', projectId),
    Query.orderAsc('order_index'),
    Query.limit(500),
  ]);
  return res.documents.map(normalize);
}

export async function listTasksByAssignee(userId) {
  const res = await databases.listDocuments(DATABASE_ID, COL, [
    Query.equal('assignee_id', userId),
    Query.limit(500),
  ]);
  return res.documents.map(normalize);
}

export async function getTask(id) {
  if (!id) return null;
  try {
    const doc = await databases.getDocument(DATABASE_ID, COL, id);
    return normalize(doc);
  } catch (err) {
    if (err?.code === 404) return null;
    throw err;
  }
}

export async function createTask({
  id, project_id, name, description = null,
  status = '未着手', priority = '中',
  assignee_id = null,
  start_date = null, due_date = null,
  progress_mode = 'manual', progress_rate = 0,
  order_index = 0, created_by = null,
}) {
  const doc = await databases.createDocument(
    DATABASE_ID, COL, id || ID.unique(),
    {
      project_id,
      name,
      description: description || null,
      status,
      priority,
      assignee_id: assignee_id || null,
      start_date: toIso(start_date),
      due_date:   toIso(due_date),
      progress_mode,
      progress_rate: progress_rate ?? 0,
      order_index: order_index ?? 0,
      created_by: created_by || null,
    }
  );
  return normalize(doc);
}

export async function updateTask(id, patch) {
  const cleaned = { ...patch };
  if ('start_date' in cleaned) cleaned.start_date = toIso(cleaned.start_date);
  if ('due_date'   in cleaned) cleaned.due_date   = toIso(cleaned.due_date);
  delete cleaned.id;
  delete cleaned.$id;
  const doc = await databases.updateDocument(DATABASE_ID, COL, id, cleaned);
  return normalize(doc);
}

export async function deleteTask(id) {
  return databases.deleteDocument(DATABASE_ID, COL, id);
}
