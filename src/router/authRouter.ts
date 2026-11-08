import { Router } from "express";
import {signInSchema, resetPasswordScehma} from "../schemas/generalSchemas.js"
import { loginUser, logoutUser, createUser, refreshAccessToken, desktopLogin, desktopLogout, getTestProgress, forgetPassword, resetPassword } from "../controllers/authController.js";
import { validateScehma } from "../middleware/validationMiddleware.js";
import { isUserLoggedIn } from "../middleware/authMiddleware.js";
import { isdesktopLoggedIn } from "../middleware/desktopMiddleware.js";


let router = Router()

router.route("/createUser").post(createUser) 
router.route("/forgetPassword").post(forgetPassword) 
router.route("/resetPassword").post(validateScehma(resetPasswordScehma),resetPassword) // check the otp and reset if correct
router.route("/loginUser").post(validateScehma(signInSchema),loginUser)
router.route("/logoutUser").post(isUserLoggedIn,logoutUser)
router.route("/refreshToken").post(refreshAccessToken)// refresh the token if user access token is expired
 
// these route is only accessbile by thr desktop app
router.route("/desktop/login").post(validateScehma(signInSchema),desktopLogin)
router.route("/desktop/logout").post(isdesktopLoggedIn,desktopLogout)// this route need bearer token 
router.route("/desktop/testProgress").post(isdesktopLoggedIn,getTestProgress)// this route need bearer token and will be call every three minute to store the current test progress ie: mcqsans, theoryans ,violance etc




export default router