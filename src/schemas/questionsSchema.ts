
import z, { date } from "zod"

export const questionSchema = z.object({
    questionType:z.enum(["mcq","theory"]),
    questionText: z.string().min(5,"Question must be more then 5 characters Long"),
    options:z.array(z.string()).optional(),
    correctOption:z.number().int().min(0).max(3).optional(),
    marks:z.number().int().positive().default(1)
}).refine((data) => {
  // Only validate MCQ strictly
  if (data.questionType === "mcq") {
    return Array.isArray(data.options) && data.options.length === 4;
  }

  // Ignore theory completely
  return true;
}, {
  message: "MCQS must have exactly four options",
  path: ["options"]
})






export  type QuestionType = z.infer<typeof questionSchema>