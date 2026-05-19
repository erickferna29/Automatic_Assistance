// ─────────────────────────────────────────────────────────────────────────────
// Domain Types
// ─────────────────────────────────────────────────────────────────────────────

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

export interface Materia {
  codigo_materia: string;
  nombre_materia: string;
}

export interface Profesor {
  no_empleado:     number;
  nombre_profesor: string;
  correo:          string;
  materias:        Materia[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Store Contract
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionStore {
  isSessionActive: boolean;
  isLoading:       boolean;
  error:           string | null;
  /** ID de la sesión activa en Sesiones_Clase. null si no hay sesión. */
  id_sesion:       number | null;
  studentIds:      string[];
  students:        Record<string, Student>;
  /**
   * Crea registro en Sesiones_Clase, carga alumnos inscritos e inicia polling.
   * @param noEmpleado    PK del profesor en tabla Profesores
   * @param codigoMateria PK de la materia en tabla Materias
   */
  startSession:           (noEmpleado: number, codigoMateria: string) => Promise<void>;
  /** Cierra sesión en BD, detiene polling y resetea estado. */
  endSession:             () => Promise<void>;
  /** Consulta alumnos_activos y actualiza estados online/idle/offline. */
  refreshActiveStudents:  () => Promise<void>;
}