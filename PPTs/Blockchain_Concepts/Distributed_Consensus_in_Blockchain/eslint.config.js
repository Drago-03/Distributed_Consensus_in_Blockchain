import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // react-three-fiber's useFrame loop mutates refs/geometry outside React's render
    // cycle by design — that's how it drives 60fps WebGL without re-rendering every frame.
    // The purity/immutability rules assume pure render bodies and don't know about useFrame.
    files: ['src/world/**/*.{ts,tsx}', 'src/slides/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  {
    // Slide modules export one data object (scene + steps) and prop modules export shared
    // constants next to components; fast refresh just falls back to a full reload for them.
    files: ['src/slides/Slide*.tsx', 'src/world/props.tsx', 'src/world/people.tsx', 'src/world/medieval.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
