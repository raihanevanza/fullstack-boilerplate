// Axios adapter for demo mode: requests never reach the network, server.ts answers them
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse } from 'axios';
import { handle } from './server';

// Small delay so loading states feel like a real app
const latency = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 180));

export const demoAdapter: AxiosAdapter = async (config) => {
  await latency();

  const headers = AxiosHeaders.from(config.headers);
  const auth = headers.get('Authorization');
  const lang = headers.get('Accept-Language');
  const data =
    typeof config.data === 'string' && config.data ? JSON.parse(config.data) : config.data;

  const result = handle({
    method: config.method ?? 'get',
    url: config.url ?? '',
    params: config.params,
    data,
    token: typeof auth === 'string' ? auth.replace(/^Bearer\s+/i, '') : null,
    lang: lang === 'id' ? 'id' : 'en',
  });

  const response: AxiosResponse = {
    data: result.body,
    status: result.status,
    statusText: String(result.status),
    headers: new AxiosHeaders({ 'Content-Type': 'application/json' }),
    config,
    request: null,
  };
  if (result.status >= 400) {
    throw new AxiosError(
      `Request failed with status code ${result.status}`,
      result.status >= 500 ? AxiosError.ERR_BAD_RESPONSE : AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    );
  }
  return response;
};
