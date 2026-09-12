import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validate = (schema: ZodType) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      return next(result.error);
    }

    const data = result.data as {
      body?: unknown;
      query?: unknown;
      params?: unknown;
    };

    if (data.body !== undefined) {
      req.body = data.body;
    }

    if (data.query !== undefined) {
      Object.defineProperty(req, "query", {
        value: data.query,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    if (data.params !== undefined) {
      Object.defineProperty(req, "params", {
        value: data.params,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    return next();
  };
};