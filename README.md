![Screenshot of BskyBackup](https://github.com/joshrouwhorst/BskyBackup/blob/main/public/screenshot.png?raw=true)

# BskyBackup

**Local backup, drafts & scheduling for Bluesky**

A Next.js application for viewing and managing your Bluesky social media backup data, create draft posts, and schedule them to be published, all **local** and **private**.

## Project Overview

**Backup**

- Backup your Bluesky account locally
- Prune posts older than a given deadline
- Repost previously pruned posts (coming soon)

**Scheduling**

- Create drafts of posts and group them for scheduling (data all stored on local file system)
- Create schedules to publish from the draft post groups
  - This allows you to create a group of "Mundaine Monday" posts and schedule them to post every week on a Monday.
- Sort upcoming drafts so they post in the order you want

This app reads your Bluesky backup files and displays them in a clean, browseable interface. You can create schedules and have posts automatically sent (assuming you are continuously running this application).

## Quick Start

Make sure your `.env` file in the root of the project has this variable:

```txt
APP_DATA_ENCRYPTION_KEY='your value here'
```

APP_DATA_ENCRYPTION_KEY is an encryption key for encoding settings including social media credentials for the app. For maximum security it should be 32 characters long.

You can use [Bun](https://bun.sh/) runtime, or [npm](https://www.npmjs.com/) should work as well.

Install dependencies:

```shell
bun i
```

Run the development server:

```shell
bun dev
```

Open [https://localhost:3000](https://localhost:3000) in your browser.

You should be redirected to [https://localhost:3000/settings](https://localhost:3000/settings) until you input required information for setup such as your desired backup location on your file system and your Bluesky credentials.

### Bluesky Credentials

I recommend setting up an app password specifically for this. On the Bluesky app you can go to Settings -> Privacy & Security -> App passwords to generate one. There is no need to enable direct messages access at this time.

# Unit Testing

This project does not include a formal automated test suite, but you can run unit tests manually using Jest. To run the tests:

Make sure you have all dependencies installed:

```sh
bun install
```

Run the tests with:

```sh
bun test
```

Test files are located alongside source files, typically in `__tests__` directories (e.g., `src/app/api/helpers/__tests__/`).

If you add new features, consider adding or updating test files to cover your changes. For more information on Jest configuration, see `jest.config.ts`.

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

- [ ] Reposting deleted posts
  - [ ] Repost to previous datetime
  - [ ] Repost as new post. Duplicate?
- [ ] Advanced filtering for backup and drafts
- [ ] Post search functionality
- [ ] Export options
- [ ] Statistics dashboard
- [ ] Automated backup scheduling
- [ ] Multiple accounts
- [ ] Mastodon support
