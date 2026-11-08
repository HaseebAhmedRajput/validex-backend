import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import {errorHandler} from "./middleware/globalErrorMiddleware.js"
import process from "node:process";
import 'dotenv/config';

let app = express()


const allowedOrigins = [
  ...(process.env.FRONTEND_ORIGIN?.split(",").map(origin => origin.trim()) || []),
  process.env.WAILS_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without Origin (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);


app.use(express.json({limit:"20kb"}))

app.use(cookieParser())
app.use(express.urlencoded({extended:true,limit:"16kb"}))




//Declaring Routes for controllers
import userRouter from "./router/userRoutes.js"
import authRouter from "./router/authRouter.js"
import teacherRouter from "./router/teacherRoutes.js"
import adminRouter from "./router/adminRoutes.js"



//Routing api calls
app.use("/api/v1/users/",userRouter)
app.use("/api/v1/users/auth",authRouter)
app.use("/api/v1/teacher",teacherRouter)
app.use("/api/v1/admin",adminRouter)


app.get("/health",(req,res)=>{
  res.status(200).json({
success: true,
message: "Server is running",
uptime: process.uptime(),
timestamp: new Date().toISOString(),
});
})




app.use(errorHandler)
export  default app



//