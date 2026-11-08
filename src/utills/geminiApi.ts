import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config()
dotenv.config({ path: "../../.env" });



// delay function tp make adelay in api call if responce isnot okay
const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

type QuestionWithAns = {
  questionId: string;
  question: string;
  answer: string;
  marks: number;
};

export async function getMarks(questions: QuestionWithAns[]) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("CRITICAL: GEMINI_API_KEY is completely missing in process.env variables.");
  }

const ai = new GoogleGenAI({
  apiKey:process.env.GEMINI_API_KEY,
});


  let retries = 3;
  while (retries > 0) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
You are a professional university exam evaluator.
Your task is to grade students answers fairly, consistently, and logically.
IMPORTANT EVALUATION RULES:
1. Students may answer in:
- English
- Hinglish (Roman Urdu + English mixed)
  Both languages are completely acceptable.
2. Marks MUST be awarded based on:
- concept understanding
- logical correctness
- relevant explanation
NOT based on:
- grammar
- spelling
- formal English
- sentence structure
3. DO NOT use overly strict marking.
If a student:
- understands the concept
- gives partial explanation
- gives correct definition
- explains in simple wording
- explains in Hinglish
then award reasonable partial marks.
4. IMPORTANT WORD LIMIT CONTEXT
Students have a maximum 300-word answer limit.
Therefore:
- concise answers are acceptable
- students should NOT be punished for short but conceptually correct answers
- if question says "Explain" but student gives a correct definition with brief concept explanation, still award 90% marks 
5. MARKING CONSISTENCY RULES
The SAME answer should receive nearly the SAME marks every time.
To ensure consistency:
- strictly follow concept-based grading
- avoid random scoring
- avoid emotional grading
- avoid unnecessary variation
6. STRICT OUTPUT REQUIREMENTS
For EACH question:
- evaluate answer carefully
- award marks out of provided maximum marks
- NEVER exceed maximum marks
- marks should be integer only
- feedback should be short, objective, and academic
7. GRADING PHILOSOPHY
Use this general logic:
- Completely wrong answer => 0-20%
- Very weak but related concept => 20-40%
- Basic correct definition/concept=> 40-60%
- Good explanation with understanding => 60-80%
- Excellent complete answer => 80-100%
QUESTIONS DATA
${JSON.stringify(questions)}
      `,
        config: {
          responseMimeType: "application/json",
          temperature: 0.0,
          topP: 0.1,
          seed: 42,
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: {
                  type: Type.STRING,
                },
                marksObtained: {
                  type: Type.INTEGER,
                  description:
                    "Integer marks awarded based on concept understanding and max marks of question",
                },
                feedback: {
                  type: Type.STRING,
                  description: "Short complete academic feedback in one line",
                },
              },
              required: ["questionId", "marksObtained", "feedback"],
            },
          },
        },
      });

      // Parse data and convert marks back to numbers safely
      const rawData = JSON.parse(response.text as string);
      const finalData = rawData.map((item: any) => ({
        ...item,
        marksObtained: parseInt(item.marksObtained, 10), // String se number conversion
      }));

      return finalData;
    
    } catch (error: any) {
      
      const msg = (error?.message || "").toLowerCase();
      const code = error?.code || "";
      console.log(msg);
      

      if (msg.includes("rate") || msg.includes("limit") || code === 429) {
        console.log("Rate limit hit. Waiting 1 minute...");
        await delay(60000);
      } else {
        console.log("Gemini failed. Retrying in 5 seconds...");
        await delay(5000);
      }
      retries--;
    }
  }

  throw new Error("Failed after retries");
}

