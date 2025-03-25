/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      // Get Supabase URL domain from environment variable
      process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', ''),
      // Add any other domains you need to use with next/image
    ],
  },
};

module.exports = nextConfig; 