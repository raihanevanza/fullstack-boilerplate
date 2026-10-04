import { useAppSelector } from '@/app/hooks';
import type { Permission } from '@/api/types';

export function useCurrentUser() {
  return useAppSelector((state) => state.auth.user);
}

// Permissions come from the backend (/api/auth/me); the client never maps roles itself
export function usePermission(permission: Permission): boolean {
  const user = useCurrentUser();
  return user?.permissions.includes(permission) ?? false;
}
