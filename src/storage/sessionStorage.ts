/**
 * IndexedDB storage service for session history.
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import type { Session, SessionSummary } from '../types';

interface SymmetryDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
    indexes: {
      'by-date': number;
      'by-test-type': string;
    };
  };
}

const DB_NAME = 'symmetry-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SymmetryDB>> | null = null;

/**
 * Get or create the database instance.
 */
function getDB(): Promise<IDBPDatabase<SymmetryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SymmetryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const store = db.createObjectStore('sessions', { keyPath: 'id' });
          store.createIndex('by-date', 'date');
          store.createIndex('by-test-type', 'testType');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save a session to IndexedDB.
 */
export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

/**
 * Load a session by ID.
 */
export async function loadSession(id: string): Promise<Session | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

/**
 * Load all sessions, ordered by date (newest first).
 */
export async function loadAllSessions(): Promise<SessionSummary[]> {
  const db = await getDB();
  const sessions = await db.getAllFromIndex('sessions', 'by-date');

  // Map to summaries and reverse for newest first
  return sessions
    .map((s) => ({
      id: s.id,
      date: s.date,
      testType: s.testType,
      testLabel: s.testLabel,
      overallScore: s.overallScore,
      symmetryScore: s.symmetryScore,
      findingsCount: s.assessment.findings.length,
    }))
    .reverse();
}

/**
 * Delete a session by ID.
 */
export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

/**
 * Delete all sessions.
 */
export async function clearAllSessions(): Promise<void> {
  const db = await getDB();
  await db.clear('sessions');
}

/**
 * Get session count.
 */
export async function getSessionCount(): Promise<number> {
  const db = await getDB();
  return db.count('sessions');
}
