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
      <button
        type="button"
        onClick={() => setLang(next)}
        title={`${t('common.language')}: ${options.find((o) => o.value === lang)?.name}`}
        aria-label={`${t('common.language')}: ${options.find((o) => o.value === next)?.name}`}
        className="mx-auto grid h-10 w-10 place-items-center rounded-xl text-xs font-bold text-ink-2 hover:bg-surface-3 hover:text-ink"
      >
        {lang.toUpperCase()}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5">
      <Languages size={18} className="shrink-0 text-ink-2" aria-hidden="true" />
      <div
        role="radiogroup"
        aria-label={t('common.language')}
        className="flex flex-1 rounded-lg bg-surface-3 p-0.5"
      >
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={lang === o.value}
            title={o.name}
            onClick={() => setLang(o.value)}
            className={`flex-1 rounded-md py-1 text-xs font-bold transition-colors ${
              lang === o.value ? 'bg-surface text-accent shadow-sm' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
