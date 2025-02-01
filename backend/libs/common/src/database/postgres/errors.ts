import { PostgresError } from 'pg-error-enum';

export interface DatabaseError {
  code: PostgresError;
  detail: string;
  table: string;
  column?: string;
  constraint?: string;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function isDatabaseError(value: unknown, errorCode?: PostgresError): value is DatabaseError {
  if (!isRecord(value)) {
    return false;
  }
  const { code, detail, table } = value;
  return Boolean(code && detail && table && (!errorCode || code === errorCode));
}
