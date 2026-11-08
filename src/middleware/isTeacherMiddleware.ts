import  type{Response,NextFunction} from "express"




export const allowedRoles = (...roles:string[])=>{
    return (req:any,res:Response,next:NextFunction)=>{
    if(!req.user?.role || !roles.includes(req.user?.role)){
        return res.status(403).json({"message":"Forbidden: you dont have the access"})
    }
    next()

}

}