import type { Request, Response, NextFunction } from "express";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { ApiError } from "../utills/ApiError.js";
import { User } from "../models/userModel.js";
import { signUpSchema, type userType } from "../schemas/signUpSchema.js";
import { client } from "../db/redisConfig.js";
import { sendMail } from "../utills/resendMailSend.js";
import crypto from "crypto";
import { Attempt } from "../models/testAttemptModel.js";
import { Test } from "../models/testModel.js";
import { testSubmitHandler } from "../utills/processTest.js";
import { LiveTimer } from "../models/liveTimerModel.js";
import { getDistance } from "../utills/locationHandler.js";
import { shuffleArray } from "../utills/questionShuffler.js";

const registerUser = AsyncHandler(async (req: Request, res: Response) => {
  const validatedData = signUpSchema.parse(req.body); //zod parsing so the name will be uppercase
  const { fullname, email, password, department, role, number, batch, regNo } =
    validatedData;
const existedUser = await User.findOne({
  $or: [{ email }, { regNo }]
}).lean();
  if (existedUser) throw new ApiError(400, "User with this email or reg num Already Exist");

  const otp = crypto.randomInt(10000, 99999);
  const redisKey = `tempUser:${email}`;

  try {
    await client.hset(redisKey, {
      fullname: fullname,
      password: String(password),
      department: String(department),
      role: String(role),
      number: number,
      batch: String(batch || ""),
      regNo: String(regNo || ""),
      otp: otp.toString(),
    });

    await client.expire(redisKey, 900);

    try {
      await sendMail(fullname, email, otp);

      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { email, fullname },
            `Verification code has been successfuelly  sent to ${email}`,
          ),
        );
    } catch (emailError: any) {
      await client.del(redisKey);
      throw new ApiError(500, "Email service failed");
    }
  } catch (redisError: any) {
    throw new ApiError(500, `Redis Error: ${redisError.message}`);
  }
});

const joinTest = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    let { testCode, lat, lng } = req.body;
    let { _id } = req.user;
  
    if (!testCode) {
      throw new ApiError(400, "Test code must required");
    }
  if (
  lat === undefined || lng === undefined ||
  lat === null || lng === null ||
  lat < -90 || lat > 90 ||
  lng < -180 || lng > 180
) {
  throw new ApiError(400, "Invalid or missing location");
}
    let test = await Test.findOne({ testCode }).populate("questions", "-correctOption").lean();
    if (!test) {
      throw new ApiError(404, "No test found with this test code");
    }

    let isAttempt = await Attempt.findOne({
      testId: test._id,
      studentId: _id,
    }).lean();

    if (isAttempt) {
      throw new ApiError(
        403,
        "Request Denied, you have already attempted the test",
      );
    }

   
const now = Date.now();

if (test.startTime && now < test.startTime.getTime()) {
  throw new ApiError(403, "Test has not started yet");
}

if (test.endTime && now > test.endTime.getTime()) {
  throw new ApiError(403, "Test has ended");
}

    if (test.allowedLocation?.radius>0) {
      const distance = getDistance(
        lat,
        lng,
        test.allowedLocation.lat,
        test.allowedLocation.lng,
      );

      if (distance > test.allowedLocation?.radius) {
        throw new ApiError(403, "You are not in the allowed test location");
      }
    }

await LiveTimer.findOneAndUpdate(
  { testId: test._id, studentId: _id },
  { expireAt: new Date(test.endTime) },
  { upsert: true, returnDocument: "after" }
);


// Shuffle Questions & MCQ Options

if (Array.isArray(test.questions) && test.questions.length > 0) {
  const shuffledQuestions = shuffleArray(test.questions);

  test.questions = shuffledQuestions.map((question: any) => {
    if (
      question.questionType !== "mcq" ||
      !Array.isArray(question.options)
    ) {
      return question;
    }

    return {
      ...question,
      options: shuffleArray(question.options),
    };
  });
}
    res
      .status(200)
      .json(new ApiResponse(200, test, "okay, you can join the test"));
  },
);




const submitTest = AsyncHandler(async (req: any, res: Response) => {
  const studentId = req.user?._id;

  const { mcqsAns, theoreticalAns, startTime, testId, violation } = req.body;
  let isTestSubmitted = await Attempt.findOne({ testId, studentId });
if (isTestSubmitted) {
  return res.status(403).json(new ApiResponse(403, {}, "Test already submitted"));
}


  let key = `studentProgress:${studentId}:${testId}`;

  await testSubmitHandler(
    studentId,
    testId,
    startTime,
    mcqsAns,
    theoreticalAns,
    violation,
  );

  await client.del(key);
  await LiveTimer.findOneAndDelete({ studentId, testId });
  res
    .status(202)
    .json(new ApiResponse(202, {}, "Successfully submitted the test"));
}); 


const getJoinedTests = AsyncHandler(async (req: any, res: Response) => {
  let { _id } = req.user;
  let testRecord: any = await Attempt.find({ studentId: _id })
    .populate("testId", "title subjectCode")
    .select("obtainedMarks testId startTime endTime violation totalMarks createdAt").lean();
 
  
  if (!testRecord || testRecord.length === 0) {
    res
      .status(404)
      .json(new ApiResponse(404, [], "you dont have any test record yet"));
  } else {
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          testRecord,
          "Successfully found all attempt tests",
        ),
      );
  }
});




// registered ✔️
// Login ✔️
// join test ✔️
// see the list of test joned  with marks✔️
// submit/attempt test✔️

export { registerUser, joinTest, getJoinedTests, submitTest };
