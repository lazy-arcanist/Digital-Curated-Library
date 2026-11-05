/**
 * Front-end only gate for the Admin view. This value ships in the client bundle, so it deters casual
 * edits but is not real security. Protect the tables with Supabase Row Level Security for that.
 */
export const ADMIN_PASSWORD = 'your-password-here'
