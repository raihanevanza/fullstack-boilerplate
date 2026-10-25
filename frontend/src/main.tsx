import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
// Order matters: Tailwind preflight → Rupa tokens + components → Tailwind utilities
import './styles/preflight.css';
import '@rupa-ui/react/styles.css';
import '@rupa-ui/react/base.css';
import './index.css';
import App from '@/app/App';
import { store } from '@/app/store';
import { APP_NAME } from '@/lib/config';

document.title = APP_NAME;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
