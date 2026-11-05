# Digital Curated Library

A personal, searchable library of curated resources: websites, tools, courses, repositories, articles and more. Browse and bookmark resources as a visitor, and manage everything from a built-in admin dashboard.

## Features

**Browsing**
- Home page and a full **All Resources** view
- Search across names, descriptions, types and tags
- Filter by category, with a live count per category
- **Bookmarks** and a **History** view
- Resource detail view with multiple links per resource

**Admin dashboard**
- Add, edit and delete resources (name, description, category, one or more types, tags and multiple links)
- Add and delete **categories** and **types** (only unused ones can be removed)
- Searchable resources table for finding what to edit or delete quickly
- Database storage usage card for the Supabase free plan (500 MB limit)
- Admin area protected by an admin gate

## Getting started

### Prerequisites

- Node.js
- pnpm
- A Supabase project (see [Database setup](#database-setup-supabase) below)

### Installation

```bash
git clone https://github.com/lazy-arcanist/Digital-Curated-Library.git
cd Digital-Curated-Library
pnpm install
```

Then follow the database setup below before starting the app.

## Database setup (Supabase)

The app reads and writes everything (resources, categories, types) in Supabase, so it needs a database before anything shows up.

1. Create a free project at [supabase.com](https://supabase.com/).
2. Open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the tables, access policies, the optional database-size function and starter categories/types.
3. Open **Project Settings → API** and copy the **Project URL** and the **publishable (anon) key**.
4. In [`lib/supabase/client.ts`](lib/supabase/client.ts), replace the value of `SUPABASE_URL` with your Project URL.
5. Create a `.env.local` file in the project root (it is git-ignored, so your key is never committed):

   ```bash
   NEXT_PUBLIC_LIBRARY_SUPABASE_KEY=your-publishable-anon-key
   ```

6. Start the app (restart it if it was already running):

   ```bash
   pnpm dev
   ```

   Then open [http://localhost:3000](http://localhost:3000).

If you deploy (for example to Vercel), add `NEXT_PUBLIC_LIBRARY_SUPABASE_KEY` in the hosting dashboard too, because `.env.local` is not uploaded.

### Security notes

- The admin page is protected by a password defined in `lib/admin-access.ts`. This check runs in the browser, so it only deters casual edits. Change the default before using the app.
- `supabase/schema.sql` allows anyone with the public key to read and write the tables, because the app has no real login. For a public deployment, replace those policies with ones that restrict writes (for example by adding Supabase Auth).

## Project structure

```
app/          Next.js app router (layout, page, global styles)
components/   UI components (library views, admin view, forms, managers)
lib/          Data store, types, formatting helpers, Supabase client
supabase/     Database schema (schema.sql)
```

## Scripts

| Command      | Description                    |
| ------------ | ------------------------------ |
| `pnpm dev`   | Start the development server   |
| `pnpm build` | Create a production build      |
| `pnpm start` | Run the production build       |
