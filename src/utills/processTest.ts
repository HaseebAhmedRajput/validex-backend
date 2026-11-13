import { Attempt } from "../models/testAttemptModel.js";
import { Question } from "../models/questionModel.js";
import { getMarks } from "./geminiApi.js";

 import {Test} from "../models/testModel.js";
import { LiveTimer } from "../models/liveTimerModel.js";



  export const testSubmitHandler = async(studentId:string, testId:string, startTime: Date, mcqsAns: any[], theoreticalAns: any[],violation:number)=>{
            
      let mcqsObtainedMarks = 0;

 if (violation > 1 && violation <= 2) {
  mcqsObtainedMarks -= 5;
} 
else if (violation > 2 && violation <= 3) {
  mcqsObtainedMarks -= 10;
} 
else if (violation >3) {
  mcqsObtainedMarks -= 20;
}




      let mcqsIds = mcqsAns.map((ans: any) => ans.questionId);
      let theoreticalIds = theoreticalAns?.map((ans: any) => ans.questionId) || [];
    
      const mcqs = await Question.find({ _id: { $in: mcqsIds } });
      const theoreticalQues = theoreticalIds.length
        ? await Question.find({ _id: { $in: theoreticalIds } })
        : [];
    
       // a collection of mcqs with respected to thier ids
      let mcqsCollection = new Map(mcqs.map((q) => [q._id.toString(), q]));
      let mcqsWithGrade: any[] = [];
    
      for (const ans of mcqsAns) {
        const questionToBeGrade = mcqsCollection.get(ans.questionId);
        if (!questionToBeGrade) continue;
        if (questionToBeGrade.correctOption === ans.selectedOption) {
          mcqsObtainedMarks += questionToBeGrade.marks;
          mcqsWithGrade.push({
            ...ans, // questionId , Selectedoption
            question: questionToBeGrade.questionText,
            obtainedMarks: questionToBeGrade.marks,
            isCorrect: true,
            status: "graded",
          });
        } else {
          // Input handling for wrong answers too
          mcqsWithGrade.push({
            ...ans,
            question: questionToBeGrade.questionText,
            obtainedMarks: 0,
            isCorrect: false,
            status: "graded",
          });
        }
      }

    
    
      let test = await Test.findById(testId).select("totalMarks");
    
      // Initial document structure creation
    let submittedTest = await Attempt.findOneAndUpdate(
    { studentId, testId },
    {
        studentId,
        testId,
        mcqsAns: mcqsWithGrade,
        theoreticalAns: theoreticalAns || [], 
        totalMarks: test?.totalMarks || 100,
        obtainedMarks:mcqsObtainedMarks < 0? 0: mcqsObtainedMarks  ,
        startTime,
        violation,
        submitTime:new Date(),
      },{
        upsert:true,
        returnDocument: "after",
      });

       
    
      // Background Processing for Theoretical Questions via Gemini AI
      if (theoreticalQues.length > 0) {
        let questionWithAns: any[] = [];
        let gradedQuestions: any[] = [];
    
        for (const ans of theoreticalAns) {
          let questionToBegrade = theoreticalQues.find((q) => q._id.toString() === ans.questionId);
          if (!questionToBegrade) continue;
          
          questionWithAns.push({
       
            questionId: questionToBegrade._id.toString(), 
            question: questionToBegrade.questionText,
            answer: ans.ans,
            marks: questionToBegrade.marks,
          });
        }
    
        (async()=>{
            try {
          // console.log("Sending data to Gemini API...");
          let rawResponse = await getMarks(questionWithAns);
          let obtainedMarks= mcqsObtainedMarks
          
          // Safe Parsing: Agar getMarks functions pehle se parse nahi kar rha
          let responseArray = typeof rawResponse === "string" ? JSON.parse(rawResponse) : rawResponse;
    
          if (Array.isArray(responseArray)) {
            for (let q of responseArray) {
    
              let question = questionWithAns.find((obj) => obj.questionId === q.questionId);
              if (!question) continue;
    
              obtainedMarks += Number(q.marksObtained || 0);
              gradedQuestions.push({
                questionId: question.questionId,
                question: question.question,
                ans: question.answer,
                obtainedMarks: Number(q.marksObtained || 0),
                feedback: q.feedback || "No conceptual feedback provided.",
                status: "graded",
              });
            }
            
           
            submittedTest.theoreticalAns = gradedQuestions;
            submittedTest.obtainedMarks = obtainedMarks<0?0:obtainedMarks; 
            await submittedTest.save();
            // console.log(" Gemini Evaluation Completed and Saved!");
          }
          
        } catch (error: any) {
          console.error(" Gemini service structural processing failed:", error.message);
          
          // Fallback state logic: mark as pending evaluation on crash
          const markedPending = questionWithAns.map(q => ({ ...q, status: "pending" }));
          submittedTest.theoreticalAns = markedPending;
          await submittedTest.save();
        }
        })();

      }
      return submittedTest





 }