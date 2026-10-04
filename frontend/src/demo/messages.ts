// Demo-mode error texts, copied from backend/locales/{en,id}.yaml so both behave the same
import type { ApiErrorCode } from '@/api/types';
import type { Lang } from '@/i18n/core';

type Pair = { title: string; message: string };

const errors: Record<ApiErrorCode, Record<Lang, Pair>> = {
  bad_request: {
    en: { title: 'Bad request', message: 'The request is invalid.' },
    id: { title: 'Permintaan tidak valid', message: 'Permintaan tidak valid.' },
  },
  err_invalid_credential: {
    en: { title: 'Login failed', message: 'The email or password is incorrect.' },
    id: { title: 'Login gagal', message: 'Email atau kata sandi salah.' },
  },
  err_unauthorized: {
    en: {
      title: 'Unauthorized',
      message: 'Your session is missing or has expired. Please log in again.',
    },
    id: {
      title: 'Tidak terautentikasi',
      message: 'Sesi Anda tidak ada atau sudah berakhir. Silakan login kembali.',
    },
  },
  err_forbidden: {
    en: { title: 'Access denied', message: 'You do not have permission to perform this action.' },
    id: { title: 'Akses ditolak', message: 'Anda tidak memiliki izin untuk melakukan aksi ini.' },
  },
  err_user_inactive: {
    en: {
      title: 'Account disabled',
      message: 'Your account has been disabled. Please contact an administrator.',
    },
    id: {
      title: 'Akun dinonaktifkan',
      message: 'Akun Anda sudah dinonaktifkan. Silakan hubungi administrator.',
    },
  },
  err_not_found: {
    en: { title: 'Not found', message: 'The data you are looking for does not exist.' },
    id: { title: 'Data tidak ditemukan', message: 'Data yang Anda cari tidak ada.' },
  },
  err_duplicate: {
    en: { title: 'Duplicate data', message: 'A record with the same unique value already exists.' },
    id: { title: 'Data duplikat', message: 'Data dengan nilai unik yang sama sudah ada.' },
  },
  internal_server_error: {
    en: {
      title: 'Internal server error',
      message: 'Something went wrong on our side. Please try again later.',
    },
    id: {
      title: 'Kesalahan server',
      message: 'Terjadi kesalahan di sisi kami. Silakan coba lagi nanti.',
    },
  },
};

// Dynamic messages (msg.* and validation.* in the backend locales)
const details = {
  duplicate_sku: {
    en: 'SKU {Sku} is already used by another product.',
    id: 'SKU {Sku} sudah dipakai produk lain.',
  },
  invalid_id: {
    en: 'The ID in the URL must be a positive integer.',
    id: 'ID pada URL harus berupa bilangan bulat positif.',
  },
  required: { en: '{Field} is required.', id: '{Field} wajib diisi.' },
  gte: {
    en: '{Field} must be greater than or equal to {Param}.',
    id: '{Field} harus lebih besar dari atau sama dengan {Param}.',
  },
  lte: {
    en: '{Field} must be less than or equal to {Param}.',
    id: '{Field} harus lebih kecil dari atau sama dengan {Param}.',
  },
  max_string: {
    en: '{Field} must be at most {Param} characters long.',
    id: '{Field} maksimal {Param} karakter.',
  },
  type: { en: '{Field} has the wrong type.', id: 'Tipe data {Field} tidak sesuai.' },
} satisfies Record<string, Record<Lang, string>>;

export type DetailKey = keyof typeof details;
export type Detail = { key: DetailKey; vars: Record<string, string | number> };

const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));

export function errorText(code: ApiErrorCode, lang: Lang, detail?: Detail): Pair {
  const base = errors[code][lang];
  if (!detail) return base;
  return { title: base.title, message: fill(details[detail.key][lang], detail.vars) };
}
