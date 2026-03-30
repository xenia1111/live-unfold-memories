import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.unfoldmemories',
  appName: 'live-unfold-memories',
  webDir: 'dist',
  server: {
    url: "https://43827bc0-84e3-4e42-99d1-7b52e6fbbd58.lovableproject.com?forceHideBadge=true",
    cleartext: true
  }
};

export default config;
