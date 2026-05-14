// ─────────────────────────────────────────────────────────────────────────────
// Domain Types
// ─────────────────────────────────────────────────────────────────────────────

export type SignalStatus = 'online' | 'idle' | 'offline';

export interface Student {
  id: string;
  name: string;
  /** Unix timestamp (ms) of the last received signal. null = never received. */
  lastSignalAt: number | null;
  status: SignalStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Contract
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionStore {
  /** Whether the monitoring session is currently running. */
  isSessionActive: boolean;

  /**
   * Flat array of student IDs. This is the ONLY thing FlatList receives.
   * It never changes during a session, so FlatList itself never re-renders.
   */
  studentIds: string[];

  /**
   * Hash map of student data, keyed by ID.
   * Enables O(1) reads and surgical updates that only re-render the
   * one StudentRow whose student object reference changed.
   */
  students: Record<string, Student>;

  /** Starts signal simulation and activates the session. Idempotent. */
  startSession: () => void;

  /** Clears all intervals, resets all students to offline, deactivates session. */
  endSession: () => void;
}
