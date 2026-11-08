import type { NextFunction, Request, Response } from "express";

type HandlerType = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

const AsyncHandler = (Handler: HandlerType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await Handler(req, res, next);
    } catch (error: any) {
      next(error);
    }
  };
};
export { AsyncHandler };
