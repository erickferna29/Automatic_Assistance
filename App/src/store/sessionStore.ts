import { create } from 'zustand';
import { obtenerAlumnosMateria, obtenerAlumnosActivos, iniciarSesion, cerrarSesion } from '../services/teacherApi';
import type { SessionStore, Student, SignalStatus } from '../types';

// Intervalo de polling en ms (5 segundos)
const POLLING_INTERVAL = 5000;

interface SessionState extends SessionStore {
  noEmpleado: string | null;
  codigoMateria: string | null;
  _pollingTimer: ReturnType<typeof setInterval> | null;
  _startPolling: () => void;
  _stopPolling: () => void;
  refreshActiveStudents: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isSessionActive: false,
  isLoading: false,
  error: null,
  id_sesion: null,
  noEmpleado: null,
  codigoMateria: null,
  studentIds: [],
  students: {},
  _pollingTimer: null,

  // ─── Polling ────────────────────────────────────────────────────────────────

  _startPolling: () => {
    // Limpiar timer previo si existe
    const prevTimer = get()._pollingTimer;
    if (prevTimer) clearInterval(prevTimer);

    const timer = setInterval(() => {
      get().refreshActiveStudents();
    }, POLLING_INTERVAL);

    set({ _pollingTimer: timer });
  },

  _stopPolling: () => {
    const timer = get()._pollingTimer;
    if (timer) {
      clearInterval(timer);
      set({ _pollingTimer: null });
    }
  },

  /**
   * Refresca la lista de alumnos detectados desde el backend.
   * Actualiza el estado de cada alumno (online/idle/offline) basado en
   * la última detección BLE reportada por el servidor.
   */
  refreshActiveStudents: async () => {
    const { id_sesion, students, studentIds } = get();
    if (!id_sesion) return;

    try {
      const data = await obtenerAlumnosActivos(id_sesion);
      if (!data.success) return;

      const activosMap: Record<string, any> = {};
      for (const al of data.alumnos_activos) {
        activosMap[al.no_cuenta] = al;
      }

      // Actualizar estado de cada alumno conocido
      const updatedStudents: Record<string, Student> = {};
      for (const id of studentIds) {
        const existing = students[id];
        const activo = activosMap[id];

        if (activo) {
          updatedStudents[id] = {
            ...existing,
            status: activo.estado_rt as SignalStatus,
            lastSignalAt: activo.ultima_deteccion
              ? new Date(activo.ultima_deteccion).getTime()
              : existing?.lastSignalAt ?? null,
          };
        } else {
          // No detectado en esta sesión → sin señal
          updatedStudents[id] = {
            ...existing,
            status: 'offline' as SignalStatus,
          };
        }
      }

      set({ students: updatedStudents });
    } catch (err) {
      // Errores de polling son silenciosos para no interrumpir la UX
      console.warn('[Polling] Error al refrescar alumnos activos:', err);
    }
  },

  // ─── Acciones ───────────────────────────────────────────────────────────────

  startSession: async (noEmpleado: number, codigoMateria: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Crear sesión en el backend
      const res = await iniciarSesion(noEmpleado, codigoMateria);
      if (res.status !== 'success') throw new Error(res.message || 'Error al iniciar sesión.');

      // 2. Cargar lista completa de alumnos inscritos en la materia
      const alumnosData = await obtenerAlumnosMateria(codigoMateria);
      let initialStudents: Record<string, Student> = {};
      let ids: string[] = [];

      const lista = alumnosData?.alumnos ?? (Array.isArray(alumnosData) ? alumnosData : []);
      lista.forEach((student: any) => {
        const id = (student.no_cuenta || student.id).toString();
        ids.push(id);
        initialStudents[id] = {
          id,
          name: student.nombre || student.name || id,
          lastSignalAt: null,
          status: 'offline',
          grupo: student.grupo ?? '',
          grado: student.grado ?? 0,
          carrera: student.carrera ?? '',
        };
      });

      set({
        isSessionActive: true,
        id_sesion: res.id_sesion,
        noEmpleado: String(noEmpleado),
        codigoMateria,
        students: initialStudents,
        studentIds: ids,
        isLoading: false,
        error: null,
      });

      // 3. Iniciar polling para actualizar estados en tiempo real
      get()._startPolling();

    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  endSession: async () => {
    const { noEmpleado } = get();

    // Detener polling antes de cerrar
    get()._stopPolling();

    if (noEmpleado) {
      try {
        await cerrarSesion(noEmpleado);
      } catch (err: any) {
        console.warn('[endSession] Error al cerrar sesión en backend:', err.message);
      }
    }

    set({
      isSessionActive: false,
      id_sesion: null,
      noEmpleado: null,
      codigoMateria: null,
      studentIds: [],
      students: {},
      error: null,
    });
  },
}));