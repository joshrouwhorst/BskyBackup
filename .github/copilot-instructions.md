# Copilot Instructions for BskyBackup (bsky-ui)

## Project Architecture

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Data Flow:**
  - Local Bluesky backup files are read and served via API routes in `/src/app/api/`
  - UI components in `/src/components/` and `/src/app/` consume this data
  - Helpers in `/src/app/api/helpers/` and `/src/helpers/` handle data transformation and platform logic
- **Services:**
  - `/src/app/api/services/BackupService.ts`: File operations, backup logic
  - `/src/app/api/services/SchedulePostService.ts`: Post scheduling, cron jobs, and automation
  - `/src/app/api/services/DraftPostService.ts`: Draft management and posting
- **Types:**
  - All core data types are defined in `/src/types/`
  - Scheduler-specific types in `/src/types/scheduler.ts`

## Key Patterns & Conventions

- **API Routes:** Use Next.js API route conventions in `/src/app/api/` for all backend logic
- **Compound Components:** UI patterns like `PostList.ToolBar` are used for related UI controls
- **Type Safety:** All data structures are strongly typed; always import types from `/src/types/`
- **Scheduling:**
  - Scheduling logic uses `node-cron` (see `SchedulePostService.ts`)
  - Use `startAllActiveSchedules()` to initialize jobs on startup
- **Image Handling:**
  - Images are served via `/api/images/[...path]/route.ts`
  - Always use the API endpoint for local image access in the UI

## Developer Workflows

- **Preferred Package Manager:** NPM (install from https://npmjs.com/)
- **Start Dev Server:** `npm run dev`
- **Environment:** Configure `.env` with Bluesky credentials and backup location
- **Debugging:**
  - Check API route logs for file/image issues
  - Type errors: ensure all types are imported from `/src/types/`
- **Testing:** No formal test suite; manual testing via UI and API endpoints

## Integration Points

- **Bluesky API:** All network calls are via `@atproto/api` (see `bluesky.ts` helper)
- **Local Filesystem:** Reads/writes to backup directory defined in config/env
- **Scheduling:** Automated posting and backup via cron jobs in `SchedulePostService.ts`

## Examples

- To add a new scheduled post feature, extend `SchedulePostService.ts` and update types in `/src/types/scheduler.ts`
- To add a new API endpoint, create a new file in `/src/app/api/` following Next.js conventions
- For new UI features, add components to `/src/components/` and import them in `/src/app/`

## References

- See `README.md` for more details on file structure and usage patterns
- Key files: `config.ts`, `types.ts`, `BackupService.ts`, `SchedulePostService.ts`, `DraftPostService.ts`, `bluesky.ts`, `PostList.tsx`, `Post.tsx`
