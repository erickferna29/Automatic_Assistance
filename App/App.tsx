/**
 * App.tsx — Entry Point
 *
 * Wiring DashboardScreen into the root of the app.
 * In a full project this would be wrapped by a NavigationContainer.
 */
import React from 'react';
import DashboardScreen from './src/screens/DashboardScreen';

const App: React.FC = () => <DashboardScreen />;

export default App;

/*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SETUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Install dependency:
     npm install zustand

2. Required tsconfig.json flags:
     "strict": true,
     "noUncheckedIndexedAccess": true   ← catches students[id] being undefined

3. Project structure:
     src/
       types/
         index.ts            ← Domain types + store contract
       store/
         sessionStore.ts     ← Zustand store + mock signal simulation
       components/
         StudentRow.tsx      ← Memoized row, granular Zustand selector
       screens/
         DashboardScreen.tsx ← Root screen, FlatList with ID-only data

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ARCHITECTURE DECISIONS LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─────────────────────────────┬────────────────────────────────────────────────┐
│ Decision                    │ Rationale                                      │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ Record<id, Student>         │ O(1) reads + surgical updates that preserve    │
│ + studentIds: string[]      │ all other student object refs → React.memo     │
│                             │ bails out on non-updated rows.                 │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ Interval refs outside store │ Not serializable, not reactive, not app state. │
│ (module-level vars)         │ Storing them in Zustand triggers unnecessary   │
│                             │ re-renders on every startSession/endSession.   │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ Decay sweep: if(dirty)set() │ Unconditional set() pushes a new state ref     │
│                             │ every tick → every subscriber re-renders.      │
│                             │ Guard ensures renders only on real changes.    │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ renderItem/keyExtractor     │ If defined inside the component, FlatList      │
│ outside DashboardScreen     │ receives new function refs every render →      │
│                             │ invalidates all item reconciliation.           │
├─────────────────────────────┼────────────────────────────────────────────────┤
│ useCallback on Zustand      │ Avoids closure re-allocation each render.      │
│ selector in StudentRow      │ Zustand compares selector OUTPUT (Object.is),  │
│                             │ not the selector fn ref — but explicit intent  │
│                             │ costs nothing and aids readability.            │
└─────────────────────────────┴────────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 KNOWN TRADEOFFS (INTENTIONAL, NOT OVERSIGHTS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. onlineCount in DashboardScreen
   DashboardScreen re-renders whenever any student changes status because
   onlineCount re-derives from the full students map. Acceptable at ≤50
   students. At scale: extract into <StatsBar /> with its own selector,
   or maintain onlineCount as a first-class field in the store, updated
   incrementally inside the signal emitter's set() call.

2. Relative timestamp staleness
   formatRelativeTime(lastSignalAt) is computed at render time. It updates
   when a signal fires (new render) or when decay sweep changes status
   (new render). Between those events, the "hace Xs" counter is stale.
   Production fix: per-row setInterval, or coarser "hace X min" granularity,
   or store lastSignalAt as a string that's already formatted.

3. Decay sweep rebuilds entire students object
   `const next = { ...students }` copies all top-level keys every DECAY_TICK_MS.
   For 10 students: negligible. For 1000 students: profile it.
   Production fix: only spread the subset of students that actually changed.
*/
