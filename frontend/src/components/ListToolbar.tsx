import { TextField } from '@rupa-ui/react';
import { Search } from 'lucide-react';
import type { ReactNode } from 'react';
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
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
      <TextField
        label={t('common.search')}
        hideLabel
        type="search"
        value={search}
        placeholder={placeholder ?? t('common.searchPlaceholder')}
        maxLength={100}
        onChange={(e) => onSearch(e.target.value)}
        prefix={<Search size={16} aria-hidden="true" />}
        fieldClassName="w-full max-w-xs"
      />
      {children}
    </div>
  );
}
