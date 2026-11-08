import { Router } from "express";
import { isUserLoggedIn } from "../middleware/authMiddleware.js";
import { createTest, deleteTest, getStudentTestDetails, getTestDetails, getTestsByTeacher, seeTotalAttendees, updateTest } from "../controllers/teacherController.js";
import { validateScehma } from "../middleware/validationMiddleware.js";
import { testSchema } from "../schemas/testSchema.js";
import { allowedRoles } from "../middleware/isTeacherMiddleware.js";

let router = Router()

router.route("/createTest").post(isUserLoggedIn,allowedRoles("admin","teacher","superAdmin"),validateScehma(testSchema),createTest)

//we have to check thr api by giving the query parameter
router.route("/getAllTests").get(isUserLoggedIn,allowedRoles("admin","teacher","superAdmin"),getTestsByTeacher)
router.route("/seeAllAttendees/:testId").get(isUserLoggedIn,allowedRoles("admin","teacher","superAdmin"),seeTotalAttendees)
router.route("/getStudentTestDetails/:testId/:studentId").get(isUserLoggedIn,allowedRoles("admin","teacher","superAdmin"),getStudentTestDetails)

router.route("/updateTest/:testId").put(isUserLoggedIn,allowedRoles("teacher","admin","superAdmin"),validateScehma(testSchema),updateTest)

router.route("/deleteTest/:testId").delete(isUserLoggedIn,allowedRoles("teacher","admin","superAdmin"),deleteTest)

router.route("/getTestDetails/:testId").get(isUserLoggedIn,allowedRoles("teacher","admin","superAdmin"),getTestDetails)



export default router

