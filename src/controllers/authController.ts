import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utills/ApiError.js";
import { ApiResponse } from "../utills/ApiResponse.js";
import { AsyncHandler } from "../utills/AsyncHandler.js";
import { client } from "../db/redisConfig.js";
import { User } from "../models/userModel.js";
import jwt, { type Secret } from "jsonwebtoken";
import crypto from "crypto";
import { sendForgetPasswordMail } from "../utills/resendMailSend.js";

const createUser = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let { email, otp } = req.body;

    if (!email || !otp) {
      throw new ApiError(404, "OTP and Email must required");
    }

    const user = await client.hgetall(`tempUser:${email}`);
    if (!user || Object.keys(user).length === 0) {
      throw new ApiError(
        404,
        "OTP expired or User not found. Please sign up again.",
      );
    }

    if (Number(otp) !== Number(user.otp)) {
      throw new ApiError(400, "Incorrect OTP");
    }

    let { fullname, regNo, batch, number, department, role, password } = user;
       if(regNo=== null || regNo=== undefined || regNo===""){
        regNo= undefined
       }

    let verificationStatus = role === "student" ? true : false;

    let createdUser = await User.create({
      fullname,
      email,
      password,
      regNo,
      batch,
      number: Number(number),
      department,
      role,
      // isLoggedIn: true,
      isUserVerified: verificationStatus,
    });

    if (!createdUser) {
      throw new ApiError(500, "Internal Server Error while creating a user");
    }
    await client.del(`tempUser:${email}`);

    if (role === "student") {
      try {
        let accessToken = createdUser.generateAccessToken();
        let refreshToken = createdUser.generateRefreshToken();
        await client.hset(`user:${email}`, {
          fullname: createdUser.fullname,
          email: createdUser.email,
          role: createdUser.role,
          refreshToken: refreshToken,
          isLoggedIn: true,
        });
        await client.expire(`user:${email}`, 86400); // 86400 sec = 1day
        const user = await User.findById(createdUser._id).select("-password");

        let options = {
          httpOnly: true,
          secure: true,
        };
        res
          .status(200)
          .cookie("accessToken", accessToken, {
            ...options,
            maxAge: 60 * 60 * 1000,
          })
          .cookie("refreshToken", refreshToken, {
            ...options,
            maxAge: 24 * 60 * 60 * 1000,
          })
          .json(new ApiResponse(200, user, "User Created Successfully"));
      } catch (error: any) {
        throw new ApiError(500, "error while saving the tokens", error.message);
      }
    } else {
      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            {},
            "Successfully created The Account please wait until approval ",
          ),
        );
    }
  },
);

const loginUser = AsyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "email and password must required");
    }

    let key = `user:${email}`;
  
    // if user isnt in redis means user have not been loggedin
    let userExist = await User.findOne({ email });
    if (!userExist) {
      throw new ApiError(404, "Invalid Credintials!");
    }

    let validUser = await userExist.isCorrectPassword(password);
    if (!validUser) {
      throw new ApiError(404, "Invalid Credintials!");
    }

   if (userExist.role === "teacher" && userExist.isUserVerified === false) {
     return  res
        .status(403)
        .json(
          new ApiResponse(403, {}, "Please wait for approval of your account"),
        );
    }

    try {
      let accessToken = userExist.generateAccessToken();
      let refreshToken = userExist.generateRefreshToken();

      let tempUser = await client.hset(key, {
        fullname: userExist.fullname,
        email: userExist.email,
        role: userExist.role,
        refreshToken: refreshToken,
        isLoggedIn: true,
      });
      await client.expire(key, 86400); // 86400 sec = 1day
      const user = await User.findById(userExist._id).select("-password");

      let options = {
        httpOnly: true,
        secure: true,
      };
      res
        .status(200)
        .cookie("accessToken", accessToken, {
          ...options,
          maxAge: 60 * 60 * 1000,
        })
        .cookie("refreshToken", refreshToken, {
          ...options,
          maxAge: 24 * 60 * 60 * 1000, // one day
        })
        .json(new ApiResponse(200, user, "User LoggedIn Successfully"));
    } catch (error: any) {
      throw new ApiError(500, "error while saving the tokens", error.message);
    }
  },
);

const logoutUser = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    let {email} = req?.user
 
    let options = {
      httpOnly: true,
      secure: true,
    };
    
    let key = `user:${email}`;
    try {
      await client.del(key);
      res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "", "succefully Logout the user"));
    } catch (error: any) {
      throw new ApiError(
        500,
        `error while logging out the user, ${error.message}`,
      );
    }
  },
);

const refreshAccessToken = AsyncHandler(
  async (req: Request, res: Response) => {
    let incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
    if (!incomingToken) {
      throw new ApiError(404, "Refresh Token is Missing");
    }
    let decodedToken = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET as Secret,
    ) as { email: string; _id: string };

    if (!decodedToken) {
      throw new ApiError(404, "Token is Inavalid or expired! please re-Login ");
    }

    let key = `user:${decodedToken?.email}`;

    let redisUser = await client.hgetall(key);
    if (!redisUser) {
      throw new ApiError(
        404,
        "something went wrong when refreshing acces token please login again",
      );
    }
    // console.log('refreshtoken api is used');

    if (redisUser.refreshToken !== incomingToken) {
      throw new ApiError(404, "invalid refresh token");
    }

    let user = await User.findById(decodedToken._id).select("-password");
    try {
      let accessToken = user?.generateAccessToken();
      let refreshToken = user?.generateRefreshToken();

      await client.hset(key, {
        fullname: user?.fullname,
        email: user?.email,
        role: user?.role,
        refreshToken: refreshToken,
        isLoggedIn: true,
      });

      client.expire(key, 86400);
      let options = {
        httpOnly: true,
        secure: true,
      };
      res
        .status(200)
        .cookie("accessToken", accessToken, {
          ...options,
          maxAge: 60 * 60 * 1000,
        })

        .cookie("refreshToken", refreshToken, {
          ...options,
          maxAge: 24 * 60 * 60 * 1000,
        })
        .json(
          new ApiResponse(
            200,
            { refreshToken: refreshToken },
            "successfully refreshed the access token",
          ),
        );
    } catch (error: any) {
      throw new ApiError(
        501,
        `something went wrong while refreshing the access token :${error.meesage}`,
      );
    }
  },
);

const desktopLogin = AsyncHandler(
  async (req: any, res: Response) => {
    let { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "email and password must required");
    }

    // console.log("desktop runnning");
    

    let key = `desktopSession:${email}`;
    let redisUser = await client.hgetall(key); // check if user is already logged in desktop so dont call the db

    if (redisUser && redisUser.isLoggedIn === "true") {
      throw new ApiError(
        404,
        "loggin Denied As you are already Logged In some Other desktop",
      );
    }

    // if user isnt in redis means user have not been loggedin
    let userExist = await User.findOne({ email });
    if (!userExist) {
      throw new ApiError(404, "Invalid Credintials!");
    }

    let validUser = await userExist.isCorrectPassword(password);
    if (!validUser) {
      throw new ApiError(404, "Invalid Credintials!");
    }

    if (userExist.isUserVerified === false) {
      return res
        .status(403)
        .json(
          new ApiResponse(403, {}, "Please wait for approval of your account"),
        );
    }

    let accessToken = jwt.sign(
      {
        _id: userExist._id,
        email: userExist.email,
        role: userExist.role,
        deviceType: "desktop",
      },
      process.env.ACCESS_TOKEN_SECRET as Secret,
      {
        expiresIn: "1d",
      },
    );

    await client.hset(key, {
      email: userExist.email,
      role: userExist.role,
      isLoggedIn: true,
    });
    await client.expire(key, 86400); // 86400 sec = 1day

    res
      .status(200)
      .json(new ApiResponse(200, accessToken, "successfulyy logged in "));
  },
);

const desktopLogout = AsyncHandler(
  async (req: any, res: Response, next: NextFunction) => {
    let { email } = req.user;
   
    let key = `desktopSession:${email}`;
    await client.del(key);
    res
      .status(200)
      .json(new ApiResponse(200, {}, "Successfully Logout from desktop "));
  },
);

const getTestProgress = AsyncHandler(async (req: any, res: Response) => {
  let studentId = req.user?._id;
  let { testId, mcqsAns, theoreticalAns, startTime, violation} = req.body;

  let key = `studentProgress:${studentId}:${testId}`;

  let payload = JSON.stringify({
    studentId: req.user?._id,
    mcqsAns,
    theoreticalAns,
    testId,
    startTime,
    violation
  });
  await client.setex(key, 3600, payload);
  res
    .status(200)
    .json(
      new ApiResponse(200, {}, "Successfully stored the current test progress"),
    );
});

const forgetPassword = AsyncHandler(async (req: Request, res: Response) => {
  let { email } = req.body;
  if (!email) {
    throw new ApiError(403, "Email is required for your identification");
  }
  let user = await User.findOne({ email }).lean();
  if (!user) {
    return res
      .status(404)
      .json(new ApiResponse(404, {}, "Sorry we can not found that user"));
  }

  let otp = crypto.randomInt(10000, 99999);
  let key = `forgetPass:${email}`;
  try {
    await client.hset(key, {
      _id: user?._id,
      otp: otp,
    });
    await client.expire(key, 600); // 600s = 10 mint

    try {
      await sendForgetPasswordMail(user.fullname, email, otp);
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            { email, fullname: user.fullname },
            `Verification code has been successfully  sent to ${email}`,
          ),
        );
    } catch (emailError: any) {
      console.log(
        " error while sending the otp via email ",
        emailError.message,
      );

      throw new ApiError(500, "something went wrong in sending the email");
    }
  } catch (redisError: any) {
    console.log(
      " error while storing the forget password otp in redis ",
      redisError.message,
    );

    throw new ApiError(
      500,
      "something went wrong while processing the request",
    );
  }
});

const resetPassword = AsyncHandler(async (req: any, res: Response) => {
  let { otp, email, newPassword } = req.body;
  if (!otp || !email || !newPassword) {
    throw new ApiError(400, "inavlid data, needs email, new password and otp ");
  }

  let key = `forgetPass:${email}`;
  let data = await client.hgetall(key);

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json(new ApiResponse(400, {}, "OTP expired"));
  }

  if (data.otp !== otp.toString()) {
    return res.status(400).json(new ApiResponse(400, {}, "Invalid OTP"));
  }

  let user = await User.findById(data._id);
  if (!user) {
    throw new ApiError(500, "Failed to reset the password , please try again");
  }
  user.password = newPassword;
  await user.save();
  await client.del(key);
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Successfully Upadted the password"));
});


export {
  createUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  forgetPassword,
  desktopLogin,
  desktopLogout,
  getTestProgress,
  resetPassword,
};



// i have to make  teacher logic based on thier emails insyaed of object id,
