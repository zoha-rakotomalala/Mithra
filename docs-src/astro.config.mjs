import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://zoha-rakotomalala.github.io',
  base: '/Mithra/',
  outDir: '../docs',
  build: { assets: '_assets' },
});
