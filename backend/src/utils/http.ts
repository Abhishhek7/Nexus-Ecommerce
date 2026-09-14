export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'BAD_REQUEST',
    public errors: unknown[] = [],
  ) {
    super(message);
  }
}

export const ok = (data: unknown, message = 'Success') => ({
  success: true,
  message,
  data,
});