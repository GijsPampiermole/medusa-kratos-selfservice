/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  // Lets the Dockerfile copy a self-contained .next/standalone output
  // instead of shipping full node_modules into the image. This project is
  // pinned to Next 12.1.6, where standalone output is still behind the
  // `experimental.outputStandalone` flag (it only became the top-level
  // `output: "standalone"` option in Next 12.2).
  experimental: {
    outputStandalone: true,
  },
}
