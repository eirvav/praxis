'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import Cookies from 'js-cookie';

export const LanguageSwitcher = () => {
  const router = useRouter();
  const locale = useLocale();

  console.log('LanguageSwitcher - Current locale:', locale);
  console.log('LanguageSwitcher - Current cookie:', Cookies.get('locale'));

  const toggleLanguage = () => {
    const newLocale = locale === 'en' ? 'no' : 'en';
    console.log('LanguageSwitcher - Setting new locale:', newLocale);
    Cookies.set('locale', newLocale);
    router.refresh();
  };

  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={toggleLanguage}
      title={locale === 'en' ? 'Bytt til norsk' : 'Switch to English'}
      className="text-lg"
    >
      {locale === 'en' ? '🇬🇧' : '🇳🇴'}
    </Button>
  );
}; 