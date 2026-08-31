# SATTVA frontend foundation

## Phase 1 scope

This project currently contains the mock-data-only React frontend foundation
for the SATTVA Attendance MVP. The Warden shell, dashboard, attendance register,
student directory, and prepared attendance view model are implemented without
Supabase, authentication, or backend services.

## Running the app

Use `npm run dev` to start the Vite development server on port 5000. Use
`npm run typecheck` for TypeScript validation and `npm run build` for a
production build.

## Architecture notes

The frontend follows the logical boundaries from the SATTVA HLD/LLD:

- `src/pages` owns route-level screens.
- `src/features/attendance` owns attendance presentation.
- `src/services/attendance` owns the prepared dashboard view model and mock
  domain data boundary.
- `src/components/layout` owns the reusable Warden shell and navigation.
- `src/types` contains domain-facing types that can later map to API responses.

The attendance service deterministically derives active, submitted, and
missing students from the mock records. Replace that service boundary with the
future API/service integration rather than moving attendance rules into React
components.