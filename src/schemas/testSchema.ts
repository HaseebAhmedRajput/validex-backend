import z, { string } from "zod"
import { questionSchema } from "./questionsSchema.js"

export const  testSchema = z.object({
    title: z.string().min(4,"Title must be four Characters Long"),
    subjectCode: z.string().min(6,"Subject Code must be valid").transform((value)=>value.toUpperCase),
    duration:z.number().min(5,"Duration must be atleast 5 minutes "),
   //  status: z.enum(["start","draft","ended"]),
    totalMarks:z.number().min(0).max(100).optional(),
     questions: z.array(questionSchema).max(100),
   //   questions:z.array(z.array(string().max(5).optional())).optional(),
     startTime:z.coerce.date(),
     endTime:z.coerce.date(),
     allowedLocation: z.object({
        lat:z.number(),
        lng:z.number(),
        radius:z.number()
     }),
     isCameraMonitoring:z.boolean()

})


export type createTestScehma = z.infer<typeof testSchema>