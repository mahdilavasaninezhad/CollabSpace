# CollabSpace

A complete React and TypeScript portfolio project for team conversations and collaborative work. Unlike a generic admin dashboard, CollabSpace is designed around real conversations, presence, people and shared files.

## What works out of the box

Run the app without any environment variables to explore the local preview workspace. It includes sample channels, a team directory, direct conversations, real message editing, deletion, emoji reactions, channel creation, file attachments, in-app search, theme switching, English and Persian, and responsive RTL/LTR layouts. Changes persist in this browser using `localStorage` and synchronize between tabs of the same browser with `BroadcastChannel`.

Preview mode is not a real multi-user server. Sample people are fictional, messages do not synchronize across devices and no cloud login is performed.

## Live mode

When Supabase is configured, live mode enables:

- Email and password authentication with optional email confirmation
- Separate team workspaces and shareable invitation codes
- Public team channels and private one-to-one conversations
- Real message sending, editing, deleting and emoji reactions
- Private file attachments up to 10 MB in a Supabase Storage bucket
- Realtime Postgres change subscriptions for messages, rooms and reactions
- Authenticated presence and typing indicators on a private Realtime channel
- Row-level security policies protecting team and private-conversation data
- Notification permission control and browser notifications for incoming background conversations

The code does not pretend that cloud sync works until you configure your own Supabase project. The supplied schema and access policies make a working backend available without writing your own server.

## Local installation

Requires Node.js 20.19+ or 22.12+.

```bash
npm install
npm run dev
```

Visit the local URL shown by Vite.

```bash
npm run build
npm run preview
npm test
```

## Configure Supabase

1. Create a new project at https://supabase.com.
2. Open its SQL Editor and execute `supabase/schema.sql` once on a new Supabase project.
3. In the project's Authentication settings, configure Site URL and redirect URLs for your local development and public domain. Email confirmation behavior is controlled from Supabase Auth settings.
4. Copy `.env.example` to `.env.local` and populate these two public client-side values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
```

5. Run `npm run dev`, open **Preferences**, and choose **Try live collaboration**.
6. Create two different accounts in separate browsers to test team invitation, private conversations, realtime messages, online presence and file uploads.

Use the public anon or publishable key, never a secret or `service_role` key in a Vite frontend.

For stricter Realtime isolation, go to Supabase Realtime settings and disable public channel access. The app's Presence and Broadcast channel is already private, and `schema.sql` provides authorization policies on `realtime.messages`.

If your Supabase instance already has policies with the same names, reconcile them before rerunning the SQL. The script is intended for first-time setup.

## Publish on GitHub Pages

The GitHub Actions workflow publishes a static build to a repository named `CollabSpace` and keeps previous portfolio repositories untouched.

1. Create a new public repository `CollabSpace` on GitHub.
2. Push this project source to its `main` branch.
3. Under **Settings → Pages**, set the source to **GitHub Actions**.
4. Allow the `Deploy CollabSpace` workflow to finish successfully.

Expected link for the current portfolio account:

https://mahdilavasaninezhad.github.io/CollabSpace/

For live Supabase mode on GitHub Pages, add these **Repository Settings → Secrets and variables → Actions → Variables**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Both are client-side public values used in the static build, not server secrets. Trigger a new workflow run or push a commit after adding them. Never commit `.env.local` or put a `service_role` or secret API key in frontend variables. The production email redirect URL defaults to the deployed `/CollabSpace/` path when no explicit override is provided. The SPA uses a single route and needs no rewrite rules.

If you deploy to a different repo name, change the `base` value in `vite.config.ts` accordingly. For local development, the base is `/`.

## Source structure

```text
CollabSpace/
  .github/workflows/deploy.yml
  public/icon.svg
  src/core/demo.ts
  src/core/useCloud.ts
  src/lib/format.ts
  src/lib/format.test.ts
  src/lib/supabase.ts
  src/lib/types.ts
  src/App.tsx
  src/main.tsx
  src/styles.css
  supabase/schema.sql
  index.html
  package.json
  tsconfig.json
  vite.config.ts
  .env.example
```

## Security and architectural boundaries

Supabase owns identity and database authorization through RLS. Private conversations can be queried only by their participants. File downloads use short-lived signed URLs, and uploads are limited by the Storage bucket policy. The client-side interface is not a security boundary.

For a full production system, additional work is recommended: pagination beyond 500 loaded messages, integration and end-to-end tests against an actual Supabase instance, audit logging, retention rules, message moderation, strict file-type validation and malware scanning, rate limiting, robust invitation lifecycle, and controlled organization administration. Browser notifications are optional and depend on user permission.

No source, stylesheet, SQL, workflow or configuration file includes code comments.

## Responsive layout update

The interface uses the following viewport behavior:

- Large screens: navigation rail, channels list, conversation and optional details panel.
- Small laptops and tablets: a three-column layout with the details panel opening as a dismissible drawer.
- Mobile: a dedicated full-screen conversation list and a full-screen chat view, with a back action to switch conversations. Team settings and members remain available from the mobile workspace header.
- Narrow phones: mobile-sized message controls, touch-friendly inputs, compact composer, RTL/LTR support and safe-area padding.
- Dialogs adapt to a bottom-sheet presentation on mobile. The authentication and workspace setup screens adapt to one column.

Check the layout at 320, 375, 390, 768, 1024 and 1440 CSS pixels, including Persian RTL, both themes, long messages, keyboard display, modal scrolling and attachments. On phones, selecting a conversation does not automatically focus the composer or open the keyboard.

## Supabase setup checklist

1. Create a separate Supabase project for CollabSpace. Do not run `supabase/schema.sql` in a database with unrelated application tables or shared authentication triggers.
2. In SQL Editor, run `supabase/schema.sql` in a fresh project. The file enables RLS, adds secure workspace functions and creates the private `collabspace-attachments` Storage bucket.
3. Enable Email sign-in in Authentication. Keep email confirmation enabled for public deployments and configure a mail provider if you need reliable production email delivery.
4. In Authentication URL Configuration, set the site URL to your final public address and allow both your localhost URL and your public address as redirect URLs.
5. Open your project API settings. Copy the Project URL and a publishable key (or legacy anon key); never use a secret key or service-role key in the client.
6. Copy `.env.example` to `.env.local`, fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then restart Vite.
7. Open Preferences in CollabSpace and select Try live collaboration. Create two accounts with separate email addresses and join the same workspace using the invitation code.
8. Verify channel creation, private direct messages, message edits, reactions, file attachments, and realtime updates between two browsers.
9. In Supabase Realtime settings, disable public channel access if you want all Broadcast and Presence channels to require authorization; the supplied presence channel is private.
10. To activate live mode on GitHub Pages, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under GitHub repository Settings → Secrets and variables → Actions → Variables, then rerun the deploy workflow.

Expected GitHub Pages URL when the repository is named `CollabSpace`: `https://mahdilavasaninezhad.github.io/CollabSpace/`.

Do not publish `.env.local` to a repository. Project URL and publishable keys are designed for the browser; real authorization must still be enforced by database RLS policies.
