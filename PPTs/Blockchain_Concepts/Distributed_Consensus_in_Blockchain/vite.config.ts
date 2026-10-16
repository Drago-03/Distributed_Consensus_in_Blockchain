import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { getFontLinks } from '@porsche-design-system/components-react/partials';

// Injects the Porsche Next font-face links the design system needs — same approach
// as the design system's own demo app (packages/components-react/vite.config.ts upstream).
function porscheFontsPlugin() {
  return {
    name: 'porsche-font-links',
    transformIndexHtml(html: string) {
      const links = getFontLinks({ weights: ['regular', 'semi-bold', 'bold'] });
      return html.replace('</head>', `${links}\n  </head>`);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), porscheFontsPlugin()],
});
