export interface GrpcException {
  code: number;
  details: string;
  metadata: Record<string, string | Buffer>;
}
