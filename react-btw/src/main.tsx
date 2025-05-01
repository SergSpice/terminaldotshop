import { createRoot } from 'react-dom/client'
import './index.css'
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Address } from './components/AddressForm';
import { ThemeProvider } from './context/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { CardView } from './components/CardView';
import { Checkout } from './components/Checkout';

const queryClient = new QueryClient()
axios.defaults.baseURL = 'https://api.dev.terminal.shop';
axios.defaults.headers.common['Authorization'] = `Bearer ${'trm_test_56006e2fc27fb3455287'}`;

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </HashRouter>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    for (const reg of regs) {
      reg.unregister();
    }
  });
}

function App() {
  return (
    <Routes>
      <Route path="/add-address" element={<Address />} />
      <Route path="/add-card" element={<CardView />} />
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  )
}

