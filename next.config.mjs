const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['lucide-react'],
  async redirects() {
    return [
      {
        source: '/print station/:path*',
        destination: '/print-station/:path*',
        permanent: true,
      },
      {
        source: '/print%20station/:path*',
        destination: '/print-station/:path*',
        permanent: true,
      },
      {
        source: '/print station',
        destination: '/print-station',
        permanent: true,
      },
      {
        source: '/print%20station',
        destination: '/print-station',
        permanent: true,
      },
    ];
  },
  // Allow access to remote image placeholder.
  images: {
    unoptimized: true,
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '2080',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '2080',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
  turbopack: {},
};

export default nextConfig;
