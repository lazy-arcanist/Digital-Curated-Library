/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // `Key` is a publishable Supabase key; the NEXT_PUBLIC_ alias makes it available to browser code.
  env: {
    NEXT_PUBLIC_LIBRARY_SUPABASE_KEY: process.env.Key,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
