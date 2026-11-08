import type { Request, Response, NextFunction } from "express";
import { User } from "../models/userModel.js";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { confirmApproval } from "../utills/resendMailSend.js";
import { Attempt } from "../models/testAttemptModel.js";

const approveTeacher = AsyncHandler(async (req: any, res: Response) => {
  let teacherId = req.params?.teacherId;
  let teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new ApiError(500, "something went wrong when finding the teacher");
  }
  teacher.isUserVerified = true;
  await teacher.save();
  await confirmApproval(teacher.fullname, teacher.email);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `${teacher.fullname} has been Successfully approved as verified Teacher`,
      ),
    );
});

const removeTeacher = AsyncHandler(async (req: any, res: Response) => {
  let teacherId = req.params?.teacherId;
  let teacher = await User.findByIdAndDelete(teacherId);
  if (!teacher) {
    throw new ApiError(500, "something went wrong when finding the teacher");
  }
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `${teacher.fullname} has been Successfully removed as Teacher`,
      ),
    );
});

const adminRoleHandler = AsyncHandler(async (req: any, res: Response) => {
  let role = "";
  let teacherId = req.params?.teacherId;
  let teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new ApiError(500, "something went wrong when finding the teacher");
  }

  if (teacher.role === "teacher") {
    teacher.role = "admin";
    role = "admin";
  } else if (teacher.role === "admin") {
    teacher.role = "teacher";
    role = "teacher";
  }
  await teacher.save();
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        `The role of ${teacher.fullname} has been  set to ${role}`,
      ),
    );
});

const getTeachersList = AsyncHandler(async (req: Request, res: Response) => {
  let teacherList = await User.find({ role: { $in: ["admin", "teacher"] } })
    .select("_id fullname role email isUserVerified department number")
    .lean();

  res
    .status(200)
    .json(new ApiResponse(200, teacherList, "Fetched All approved Teachers"));
});

const getStudentList = AsyncHandler(async (req: any, res: Response) => {
  const role = req.user?.role;

  if (role !== "admin" && role !== "superAdmin") {
    throw new ApiError(403, "You are not allowed to use this api.");
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = 50;
  const skip = (page - 1) * limit;

  const search = (req.query.search as string)?.trim() || "";

  const filter: any = {
    role: "student",
  };

  if (search) {
    filter.$or = [
      { fullname: { $regex: search, $options: "i" } },
      { regNo: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
    ];
  }

  const [students, totalStudents] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("_id fullname regNo email department number")
      .lean(),

    User.countDocuments(filter),
  ]);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        students,
        page,
        limit,
        totalStudents,
        totalPages: Math.ceil(totalStudents / limit),
      },
      "Students fetched successfully."
    )
  );
});

const removeStudent=AsyncHandler(async(req:any,res:Response)=>{
   let role = req.user?.role;
  if (role !== "admin" && role !== "superAdmin") {
    throw new ApiError(403, "Your are not allowed to use this api..");
  }
  if (role === "admin" || role === "superAdmin") {
    let studentId = req.params.studentId
    const student = await User.findById(studentId);

if (!student) {
    throw new ApiError(404, "Student not found");
}

await User.findByIdAndDelete(studentId);
await Attempt.deleteMany({ studentId });
    

    res.status(200).json(new ApiResponse(200,{},"Successfully Removed The Student"))
  }

})

export { approveTeacher, removeTeacher, adminRoleHandler, getTeachersList ,getStudentList,removeStudent};
