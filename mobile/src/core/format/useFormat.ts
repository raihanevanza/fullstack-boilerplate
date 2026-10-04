import {useAppSelector} from '@/app/hooks';
import {formatters} from './format';

export function useFormat() {
  return formatters(useAppSelector(state => state.prefs.lang));
}
