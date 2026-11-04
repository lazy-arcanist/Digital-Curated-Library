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
- A Supabase project

### Installation

```bash
git clone https://github.com/lazy-arcanist/Digital-Curated-Library.git
cd Digital-Curated-Library
pnpm install
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```
bash
git add README.md
git commit -m "Add project README"
git push

You can find both values in your Supabase dashboard under **Project Settings → API**. `.env.local` is git-ignored, so your keys are never committed.

### Run the app

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Optional: exact database size

By default the storage card shows an estimate based on the rows in your tables. To show the exact size reported by Postgres, run this once in the Supabase SQL editor:

```sql
create or replace function public.get_database_size()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$ select pg_catalog.pg_database_size(pg_catalog.current_database()); $$;

grant execute on function public.get_database_size() to anon, authenticated;
```

## Project structure

```
app/          Next.js app router (layout, page, global styles)
components/   UI components (library views, admin view, forms, managers)
lib/          Data store, types, formatting helpers, Supabase client
public/       Static assets
```

## Scripts

| Command      | Description                    |
| ------------ | ------------------------------ |
| `pnpm dev`   | Start the development server   |
| `pnpm build` | Create a production build      |
| `pnpm start` | Run the production build       |
