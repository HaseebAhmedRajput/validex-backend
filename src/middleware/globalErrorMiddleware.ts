import { ApiError } from "../utills/ApiError.js";
import type { Request,Response ,NextFunction } from "express";


 const errorHandler = (err:any, req:Request, res:Response,next:NextFunction)=>{
    let error = err;
    if (!(error instanceof ApiError)){
       error = new ApiError(error.statusCode|| 500, error.message || "Internal Server Error ",error.errors, error.stack)
     
    }

    res.status(error.statusCode).json({
        success:false,
       message: error.message,
    errors: err.errors || [],
        data:[]
    })

 



}
export {errorHandler}