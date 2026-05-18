import { create } from 'zustand';
import { obtenerAlumnos, iniciarSesion, cerrarSesion } from '../services/teacherApi';
import type { SessionStore, Student, SignalStatus } from '../types';

// ─── Timing ──────────────────────────────────────────────────
const SIGNAL_TICK_MS   = 1_500;
const DECAY_TICK_MS    = 2_000;
const ONLINE_WINDOW_MS = 5_000;
const IDLE_WINDOW_MS   = 12_000;

// ─── Interval refs (fuera del store, no son estado reactivo) ─
let _signalInterval: ReturnType<typeof setInterval> | null = null;
let _decayInterval:  ReturnType<typeof setInterval> | null = null;

// ─── Helpers ─────────────────────────────────────────────────
function deriveStatus(lastSignalAt: number | null): SignalStatus {
  if (lastSignalAt === null) return 'offline';
  const elapsed = Date.now() - lastSignalAt;
  if (elapsed < ONLINE_WINDOW_MS) return 'online';
  if (elapsed < IDLE_WINDOW_MS)   return 'idle';
  return 'offline';
}

function clearIntervals(): void {
  if (_signalInterval !== null) { clearInterval(_signalInterval); _signalInterval = null; }
  if (_decayInterval  !== null) { clearInterval(_decayInterval);  _decayInterval  = null; }
}

// ─── Store ───────────────────────────────────────────────────
export const useSessionStore = create<SessionStore>((set, get) => ({
  isSessionActive: false,
  isLoading:       false,
  error:           null,
  studentIds:      [],
  students:        {},
  id_sesion:       null,

  startSession: async (noEmpleado: number, codigoMateria: string) => {
    if (_signalInterval !== null) return;
    set({ isLoading: true, error: null });

    try {
      // 1. Crear sesión en BD → obtener id_sesion
      const sesionData = await iniciarSesion(noEmpleado, codigoMateria);
      if (!sesionData.success) throw new Error('No se pudo crear la sesión en la BD');

      // 2. Cargar alumnos reales
      const data = await obtenerAlumnos();
      if (!data.success) throw new Error('Respuesta inválida del servidor');

      // 3. Normalizar array → Record<id, Student>
      const students: Record<string, Student> = {};
      const studentIds: string[] = [];

      for (const alumno of data.alumnos) {
        const id = String(alumno.no_cuenta);
        students[id] = {
          id,
          name:    `${alumno.nombres} ${alumno.apellido_paterno} ${alumno.apellido_materno}`.trim(),
          lastSignalAt: null,
          status:  'offline',
          grupo:   alumno.grupo,
          grado:   alumno.grado,
          carrera: alumno.carrera,
        };
        studentIds.push(id);
      }

      set({
        isSessionActive: true,
        isLoading:       false,
        students,
        studentIds,
        id_sesion:       sesionData.id_sesion,
      });

      // 4. Simulación de señales BLE
      // En producción: sustituir este setInterval por el listener de bleService.js
      _signalInterval = setInterval(() => {
        const { studentIds: ids } = get();
        if (ids.length === 0) return;
        const id  = ids[Math.floor(Math.random() * ids.length)];
        const now = Date.now();
        set(state => ({
          students: {
            ...state.students,
            [id]: { ...state.students[id], lastSignalAt: now, status: 'online' },
          },
        }));
      }, SIGNAL_TICK_MS);

      // 5. Decay sweep — solo escribe en store si algo cambió
      _decayInterval = setInterval(() => {
        const { students } = get();
        let dirty = false;
        const next = { ...students };
        for (const id in next) {
          const derived = deriveStatus(next[id].lastSignalAt);
          if (derived !== next[id].status) {
            next[id] = { ...next[id], status: derived };
            dirty = true;
          }
        }
        if (dirty) set({ students: next });
      }, DECAY_TICK_MS);

    } catch (err: any) {
      clearIntervals();
      set({ isLoading: false, isSessionActive: false, error: err.message });
    }
  },

  endSession: async () => {
    clearIntervals();
    const { id_sesion } = get();

    // Cerrar sesión en BD (fire-and-forget si falla, igual se limpia la UI)
    if (id_sesion !== null) {
      try {
        await cerrarSesion(id_sesion);
      } catch (err: any) {
        console.warn('[endSession] Error cerrando sesión en BD:', err.message);
      }
    }

    set(state => ({
      isSessionActive: false,
      error:           null,
      id_sesion:       null,
      students: Object.fromEntries(
        Object.entries(state.students).map(([id, s]) => [
          id, { ...s, lastSignalAt: null, status: 'offline' as SignalStatus },
        ])
      ),
    }));
  },
}));
