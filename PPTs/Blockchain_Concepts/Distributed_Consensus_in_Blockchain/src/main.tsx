import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PorscheDesignSystemProvider } from '@porsche-design-system/components-react';
import { MotionConfig } from 'framer-motion';
import '@fontsource/pacifico/latin-400.css';
import './index.css';
import App from './App';
import PresenterView from './presenter/PresenterView';

// The presenter popup loads this same bundle at a distinct hash so it never
// renders the 3D world or main slide UI — just the notes meant for one pair of eyes.
const isPresenter = window.location.hash.startsWith('#/presenter');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PorscheDesignSystemProvider cdn="auto">
      {/* framer-motion follows the OS reduced-motion setting: transforms off, opacity fades stay */}
      <MotionConfig reducedMotion="user">{isPresenter ? <PresenterView /> : <App />}</MotionConfig>
    </PorscheDesignSystemProvider>
  </StrictMode>
);
