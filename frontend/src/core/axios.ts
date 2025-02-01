import { getCookieValue } from '@/utils/cookies';
import axios, { AxiosError, HttpStatusCode, type AxiosRequestConfig } from 'axios';
import createAuthRefreshInterceptor from 'axios-auth-refresh';

export interface HttpError {
  error: string;
  message: string;
  statusCode: string;
}

/**
 * Check if the error is an AxiosError with a specific status code.
 *
 * @param err error object
 * @param status status code to check for
 * @returns whether the error is an AxiosError with the specified status code
 */
export const isHttpError = (
  err: unknown,
  status?: HttpStatusCode
): err is AxiosError<HttpError> => {
  return axios.isAxiosError(err) && (status == null || err.request?.status === status);
};

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  withCredentials: true
});

// Jwt refresh logic, leveraging non-HttpOnly jwtRefreshFlag cookie
const refreshAuthLogic = async (_failedRequest: AxiosError): Promise<any> => {
  try {
    if (!getCookieValue('jwtRefreshFlag')) {
      return Promise.reject();
    }
    await http.post('auth/refresh', {}, {
      withCredentials: true,
      skipAuthRefresh: true
    } as AxiosRequestConfig);
    return Promise.resolve();
  } catch (err) {
    return Promise.reject();
  }
};

// Instantiate the interceptor
createAuthRefreshInterceptor(http, refreshAuthLogic, {
  retryInstance: http,
  statusCodes: [401]
});
