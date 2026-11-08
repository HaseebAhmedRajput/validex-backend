import { client } from "../db/redisConfig.js";

import { Attempt } from "../models/testAttemptModel.js";
import { testSubmitHandler } from "./processTest.js";
import { LiveTimer } from "../models/liveTimerModel.js";


export const initAutoSubmitWorker = async () => {
  let changeStream = await LiveTimer.watch(
    [{ $match: { operationType: "delete" } }],
    { fullDocumentBeforeChange: "whenAvailable" },
  );
  changeStream.on("change", async (change: any) => {
    const deletedDoc = change.fullDocumentBeforeChange;
    if (!deletedDoc) {
      console.warn(
        "LiveTimer delete event received without pre-image; skipping auto-submit.",
      );
      return;
    }

    const studentId = deletedDoc.studentId.toString();
    const testId = deletedDoc.testId.toString();
    try {
      let isTestSubmitted = await Attempt.findOne({ testId, studentId });
      if (isTestSubmitted) return;

      let key = `studentProgress:${studentId}:${testId}`;
      let mcqsAns = [];
      let theoreticalAns = [];
      let startTime = new Date();
      let violation= 0

      let payload: any = await client.get(key);
      if (payload) {
        let data = JSON.parse(payload);
        mcqsAns = data.mcqsAns || [];
        theoreticalAns = data.theoreticalAns || [];
        startTime = data.startTime;
        violation = data.violation || 0
      }

      await testSubmitHandler(studentId, testId, startTime, mcqsAns, theoreticalAns, violation)
      


      await client.del(key);
    } catch (error: any) {
      console.error(
        " Fatal background operation failure inside change-stream wrapper:",
        error.message,
      );
    }
  });

  changeStream.on("error", (error: any) => {
    console.error("LiveTimer change stream error:", error);
  });

  changeStream.on("close", () => {
    console.warn("LiveTimer change stream closed");
  });
};
