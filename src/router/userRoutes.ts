import { Router } from "express";
import { validateScehma } from "../middleware/validationMiddleware.js";
import { startTestSchema, signInSchema,verifyCodeSchema } from "../schemas/generalSchemas.js";

import { signUpSchema } from "../schemas/signUpSchema.js"; // scehma to check the validations
import { getJoinedTests, joinTest, registerUser, submitTest } from "../controllers/userControllers.js";
import { isUserLoggedIn } from "../middleware/authMiddleware.js";
import { isdesktopLoggedIn } from "../middleware/desktopMiddleware.js";
import { tesAttemptSchema } from "../schemas/testAttemptScehma.js";

const router = Router()

router.route("/registerUser").post(validateScehma(signUpSchema),registerUser)
router.route("/attemptList").get(isUserLoggedIn,getJoinedTests)
router.route("/desktop/joinTest").post(isdesktopLoggedIn,joinTest)
router.route("/desktop/submitTest").post(isdesktopLoggedIn,validateScehma(tesAttemptSchema),submitTest)




export default router