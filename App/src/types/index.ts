export type SignalStatus = 'online' | 'idle' | 'offline';

export interface Student {
  id:           string;
  name:         string;
  lastSignalAt: number | null;
  status:       SignalStatus;
  grupo:        string;
  grado:        number;
  carrera:      string;
}

export interface SessionStore {
  isSessionActive: boolean;
  isLoading:       boolean;
  error:           string | null;
  studentIds:      string[];
  students:        Record<string, Student>;
  startSession:    () => Promise<void>;
  endSession:      () => void;
}
