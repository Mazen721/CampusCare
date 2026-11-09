import { DirectionProvider } from '@radix-ui/react-direction';
import { QueryClientProvider } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { AppRouter } from '@/routes/router';

export default function App() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <DirectionProvider dir={dir}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
            <Toaster
              position={lang === 'ar' ? 'top-left' : 'top-right'}
              dir={dir}
              richColors
              closeButton
            />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </DirectionProvider>
  );
}
