import { Button, Segmented } from '@rupa-ui/react';
import { Languages } from 'lucide-react';
import type { Lang } from '@/i18n/core';
import { useT } from '@/i18n/useT';

const options: { value: Lang; label: string; name: string }[] = [
  { value: 'en', label: 'EN', name: 'English' },
  { value: 'id', label: 'ID', name: 'Bahasa Indonesia' },
];

// EN / ID segmented control. compact = collapsed sidebar → a single toggle button.
export default function LanguageSwitch({ compact = false }: { compact?: boolean }) {
  const { t, lang, setLang } = useT();

  if (compact) {
    const next = lang === 'en' ? 'id' : 'en';
    return (
      <Button
        variant="ghost"
        onClick={() => setLang(next)}
        title={`${t('common.language')}: ${options.find((o) => o.value === lang)?.name}`}
        aria-label={`${t('common.language')}: ${options.find((o) => o.value === next)?.name}`}
        className="mx-auto"
      >
        {lang.toUpperCase()}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5">
      <Languages size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
      <Segmented
        label={t('common.language')}
        size="sm"
        block
        className="flex-1"
        value={lang}
        onChange={setLang}
        options={options.map((o) => ({
          value: o.value,
          label: (
            <span title={o.name} lang={o.value}>
              {o.label}
            </span>
          ),
        }))}
      />
    </div>
  );
}
