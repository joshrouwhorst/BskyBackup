# Bluesky Backup Viewer

A Next.js application for viewing and managing your Bluesky social media backup data locally.

## Project Overview

This app reads your Bluesky backup files and displays them in a clean, browsable interface. It serves local images through an API route and provides tools for managing your posts.

## Quick Start

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view your Bluesky backup.

## Important File Locations

### Configuration

- **Config**: `/src/config.ts` - Backup paths and API credentials
- **Types**: `/src/types.ts` - TypeScript interfaces for Bluesky data

### Core Components

- **Main Page**: `/src/app/page.tsx` - Entry point, renders PostList
- **PostList**: `/src/components/PostList.tsx` - Main feed component with compound ToolBar
- **Post**: `/src/components/Post.tsx` - Individual post display
- **EmbedCarousel**: `/src/components/EmbedCarousel.tsx` - Image gallery component

### Data Layer

- **Backup Service**: `/src/app/api/services/BackupService.ts` - File operations and data processing
- **Bluesky Helper**: `/src/app/api/helpers/bluesky.ts` - API interactions and post management
- **Transform Helper**: `/src/helpers/transformFeedViewPostToPostData.tsx` - Data transformation utilities

### API Routes

- **Image Server**: `/src/app/api/images/[...path]/route.ts` - Serves local backup images
- **Backup API**: `/src/app/api/backup/route.ts` - Backup operations
- **Prune API**: `/src/app/api/prune/route.ts` - Delete old posts

## Key Features

### 📁 Local File Access

- Reads backup from: `~/Library/Mobile Documents/com~apple~CloudDocs/Bluesky Backup/backup/`
- Serves images through `/api/images/` endpoint
- Handles both local and remote image fallbacks

### 🔧 Post Management

- View all posts with metadata
- Filter by replies, media, date ranges
- Prune old posts directly from the interface
- Backup current posts

### 🎨 UI Components

- Lazy loading images with fallbacks
- Responsive design with Tailwind CSS

## Usage Patterns

### Viewing Posts

```tsx
// Main page renders both components
<ToolBar />
<PostList />
```

### Adding Filters

```tsx
// In your components, use the context
const { posts, isLoading, filters } = useBskyBackupContext()
```

### Serving Images

```tsx
// Images are automatically served through the API
<img src={`/api/images/${localImagePath}`} />
```

## Development Notes

### File Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   ├── page.tsx            # Main page
│   └── layout.tsx          # Root layout
├── components/             # React components
├── helpers/               # Data transformation
├── types.ts              # TypeScript definitions
└── config.ts             # Configuration
```

### Important Patterns

- **Server Components**: Main page fetches data at build time
- **Client Components**: Interactive UI marked with `'use client'`
- **Compound Components**: `PostList.ToolBar` pattern for related components
- **Type Safety**: Full TypeScript coverage for Bluesky data structures

### Local Development

Make sure your `.env` file in the root of the project has these variables:

```
BSKY_IDENTIFIER=
BSKY_PASSWORD=
BSKY_BACKUP_LOCATION=
DEFAULT_PRUNE_MONTHS=
```

BSKY_IDENTIFIER is your Bluesky username.
BSKY_PASSWORD is your Bluesky app password for this app.
BSKY_BACKUP_LOCATION is the local file path to the directory you want the backup files stored.
DEFAULT_PRUNE_MONTHS is the number of months you leave up on Bluesky after pruning.

Run `bun dev` to start development server

### Troubleshooting

- **Image 404s**: Check backup path in config and API route logs
- **Type Errors**: Ensure proper imports from `/types.ts`
- **Auth Errors**: Verify Bluesky credentials in config

## Tech Stack

- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **@atproto/api** - Bluesky API client

## Future Enhancements

- [ ] Advanced filtering UI
- [ ] Post search functionality
- [ ] Export options
- [ ] Statistics dashboard
- [ ] Automated backup scheduling
