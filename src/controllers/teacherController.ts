import { client } from "../db/redisConfig.js";
import type { Request, Response, NextFunction } from "express";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { Test } from "../models/testModel.js";
import { Question } from "../models/questionModel.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { Attempt } from "../models/testAttemptModel.js";
import { LiveTimer } from "../models/liveTimerModel.js";

const createTest = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();

    let { _id, role, email, fullname } = req.user;
    let {
      title,
      subjectCode,
      totalMarks,
      allowedLocation,
      questions,
      // duration,
      startTime,
      endTime,
      isCameraMonitoring,
    } = req.body;

    try {
      let testCode = crypto.randomInt(10000, 99999);

      session.startTransaction();
      let createdTest = new Test({
        createdBy: _id,
        title,
        subjectCode,
        testCode,
        isCameraMonitoring,
        allowedLocation,
        // duration
        startTime,
        endTime,
        totalMarks,
      });
      await createdTest.save({ session });

      if (!createdTest) {
        throw new ApiError(
          500,
          "Internal Server Error , please resubmit again",
        );
      }

      // sorting the quesion with test id
      let questionToInsert = questions.map((q: any) => ({
        ...q,
        testId: createdTest?._id,
      }));

      let createdQuestions = await Question.insertMany(questionToInsert, {
        session,
      });

      if (!createdQuestions) {
        throw new ApiError(500, "server Error while creating the quetions");
      }

      let questionIds = createdQuestions.map((q) => q._id); // gives the array of questions id of this test
      createdTest.questions = questionIds;

      await createdTest.save({ session });
      await session.commitTransaction();
      await session.endSession();

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            { testCode: testCode },
            "Succesfully created the test",
          ),
        );
    } catch (error: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      await session.endSession();
      console.log(error.message);
      next(error);
    }
  },
);

const deleteTest = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();

    try {
      const { testId } = req.params;

      session.startTransaction();

      const test = await Test.findById(testId).session(session);

      if (!test) {
        throw new ApiError(404, "Test not found");
      }
      const isOwner = test.createdBy.toString() === req.user._id.toString();

      const isAdmin =
        req.user.role === "Admin" || req.user.role === "superAdmin";

      if (!isOwner && !isAdmin) {
        throw new ApiError(403, "Unauthorized Request");
      }

      const hasAttempts = await Attempt.exists({
        testId: test._id,
      });

      if (hasAttempts) {
        throw new ApiError(
          400,
          "This test already contains student attempts and cannot be deleted.",
        );
      }

      await Question.deleteMany({ testId: test._id }, { session });

      await Attempt.deleteMany({ testId: test._id }, { session });

      await LiveTimer.deleteMany({ testId: test._id }, { session });

      await Test.findByIdAndDelete(test._id, { session });

      await session.commitTransaction();
      await session.endSession();

      res
        .status(200)
        .json(new ApiResponse(200, null, "Test deleted successfully"));
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      await session.endSession();
      next(err);
    }
  },
);

const updateTest = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    const session = await mongoose.startSession();

    try {
      const { testId } = req.params;

      const {
        title,
        subjectCode,
        totalMarks,
        allowedLocation,
        questions,
        // duration,
        startTime,
        endTime,
        isCameraMonitoring,
      } = req.body;

      session.startTransaction();

      const test = await Test.findById(testId).session(session);

      if (!test) {
        throw new ApiError(404, "Test not found");
      }

      if (test.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorised Request");
      }

      test.title = title;
      test.subjectCode = subjectCode;
      test.totalMarks = totalMarks;
      test.allowedLocation = allowedLocation;
      // test.duration = duration;
      test.startTime = startTime;
      test.endTime = endTime;
      test.isCameraMonitoring = isCameraMonitoring;

      await Question.deleteMany({ testId: test._id }, { session });

      const newQuestions = questions.map((q: any) => ({
        ...q,
        testId: test._id,
      }));

      const insertedQuestions = await Question.insertMany(newQuestions, {
        session,
      });

      test.questions = insertedQuestions.map((q) => q._id);

      await test.save({ session });

      await session.commitTransaction();
      await session.endSession();

      res
        .status(200)
        .json(new ApiResponse(200,  { testCode: test.testCode }, "Test updated successfully"));
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }

      await session.endSession();
      next(err);
    }
  },
);

const getTestsByTeacher = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    let { _id, role } = req.user;
    if (role === "admin" || role === "superAdmin") {
      _id = req.params?.teacherId || _id;
    }
  
    
    let page = Number(req.query?.page) || 1;
    page = Math.max(1, page);
    let limit = 10;
    let skip = (page - 1) * limit;

    const testList = await Test.find({ createdBy: _id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("_id title testCode startTime endTime")
      .lean();
    
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          testList,
          "Succesfully fetched the top newest tests  ",
        ),
      );
  },
);

const getTestDetails = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    let { testId } = req.params;
    let { role, _id } = req.user;

    if (!testId) {
      throw new ApiError(404, "can not find with this test id");
    }

    const testDetails = await Test.findById({ _id: testId })
      .populate("questions")
      .lean();
    if (!testDetails) {
      throw new ApiError(500, "No record found!");
    }

    // teacher ownership check
    if (
      role === "teacher" &&
      testDetails.createdBy.toString() !== _id.toString()
    ) {
      throw new ApiError(403, "Access denied");
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          testDetails,
          "Sucessfully fetched the test details",
        ),
      );
  },
);

const getStudentTestDetails = AsyncHandler(async (req: any, res: Response) => {
  const { testId, studentId } = req.params;
  const { role, _id } = req.user;

  if (!testId) {
    throw new ApiError(400, "Test ID is required");
  }

  const test = await Test.findById(testId).lean();
  if (!test) {
    throw new ApiError(404, "Test not found");
  }




// Teacher sirf apne tests dekh sakta hai
if (role === "teacher") {
  if (test.createdBy.toString() !== _id.toString()) {
    throw new ApiError(403, "Access denied");
  }
}

if (
  role !== "teacher" &&
  role !== "admin" &&
  role !== "superAdmin" &&
  role !== "student"
) {
  throw new ApiError(403, "Access denied");
}

  let targetStudentId = studentId;
  if (role === "student") {
    targetStudentId = _id;
  }

  const attempt = await Attempt.findOne({
    testId,
    studentId: targetStudentId,
  }).populate("studentId","fullname email regNo")
.populate({
    path:"mcqsAns.questionId",
    select:"questionText options correctOption marks questionType"
})
.populate({
    path:"theoreticalAns.questionId",
    select:"questionText marks questionType"
})
.lean();

  if (!attempt) {
    throw new ApiError(404, "No attempt found for this student");
  }
  
  

 
  res.status(200).json(
    new ApiResponse(
      200,
      {
        test,
        result: attempt,
      },
      "Successfully fetched test report",
    ),
  );
});

const seeTotalAttendees = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let { testId } = req.params;
    if (!testId) {
      throw new ApiError(400, "Test ID not found");
    }
    let studentList = await Attempt.find({ testId })
      .select("studentId totalMarks obtainedMarks violation")
      .populate("studentId", "fullname email regNo ")
      .lean();

    res
      .status(200)
      .json(
        new ApiResponse(200, studentList, "Successfully fecthed all students"),
      );
  },
);


export {
  createTest,
  updateTest,
  deleteTest,
  getTestsByTeacher,
  getTestDetails,
  seeTotalAttendees,
  getStudentTestDetails,
};
