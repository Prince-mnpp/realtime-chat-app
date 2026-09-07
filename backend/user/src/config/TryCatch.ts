import type { NextFunction, Request, RequestHandler, Response } from "express";

const TryCatch = (handler: RequestHandler): RequestHandler => {
  return async(req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      if(error instanceof Error){
        res.status(500).json({
        message: error.message,
      });
      }
      else{
        res.status(500).json({
          message: "something went wrong"
        });
      }
    }
  };
};

export default TryCatch;