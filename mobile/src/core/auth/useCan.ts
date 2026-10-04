import {useAppSelector} from '@/app/hooks';
import type {Permission} from '@/core/api/types';
import {hasPermission} from './sessionSlice';

// `useCan('product.write')` -> true when the signed-in user holds the permission
export function useCan(permission: Permission) {
  return useAppSelector(state => hasPermission(state.session.user, permission));
}
