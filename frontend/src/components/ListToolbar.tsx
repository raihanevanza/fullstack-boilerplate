import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Input } from '@/components/ui/Field';
import { useT } from '@/i18n/useT';

export default function ListToolbar({
  search,
  onSearch,
  placeholder,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  children?: ReactNode;
}) {
  const { t } = useT();
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      <div className="relative w-full max-w-xs">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
        />
        <Input
          type="search"
          value={search}
          placeholder={placeholder ?? t('common.searchPlaceholder')}
          maxLength={100}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10"
          aria-label={t('common.search')}
        />
      </div>
      {children}
    </div>
  );
}
