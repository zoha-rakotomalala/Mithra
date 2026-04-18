import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zoha-rakotomalala.github.io',
  base: '/Mithra/',
  outDir: './dist',
  build: { assets: '_assets' },
});
