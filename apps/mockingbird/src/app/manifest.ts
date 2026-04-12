import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mockingbird',
    short_name: 'Mockingbird',
    description: 'Mockingbird social app',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#F49D37',
    screenshots: [
      {
        src: '/screenshots/desktop.png',
        sizes: '2560x1440',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Mockingbird home feed',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '780x1688',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mockingbird home feed',
      },
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
