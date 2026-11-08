import { ZodObject, ZodError } from "zod";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import type { Request, Response, NextFunction } from "express";

const validateScehma = (schema: ZodObject) =>
  AsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
    //   await schema.parseAsync(req.body);
       schema.parse(req.body);
      next();
    } catch (error:any) {
      console.log(error.errors);
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        }));
        return next(
          new ApiError(
            400,
            "Validation Error in validation middleware ",
            formattedErrors,
          ),
        );
      }
      next(error);
    }
  });

export { validateScehma };
