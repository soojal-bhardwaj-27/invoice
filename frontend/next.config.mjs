const backendUrl = (process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const nextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [{source: '/api/:path*', destination: backendUrl + '/api/:path*/'}];
  }
};
export default nextConfig;
