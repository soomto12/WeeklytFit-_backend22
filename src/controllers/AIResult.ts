import { Request, Response } from "express"
import { AuthRequest } from "../types/express.d"
import { prisma } from "../libs/prisma"
import OpenAI from "openai"

const ai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
})
export const getAllAIResults = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const results = await prisma.ai_Result.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: { id: true, dailyPlans: true, createdAt: true },
        })

        res.status(200).json({ data: results })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "server error" })
    }
}

export const getAIResult = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const latest = await prisma.ai_Result.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        })

        if (!latest) {
            res.status(404).json({ message: "No AI results found for this user" })
            return
        }

        res.status(200).json({ data: latest })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "server error" })
    }
}

export const updateAIResult = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const user = await prisma.user.findFirst({ where: { id: userId } })

        if (!user) {
            res.status(404).json({ message: "user not found" })
            return
        }

        const latest = await prisma.ai_Result.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
        })

        if (!latest) {
            res.status(404).json({ message: "No AI result found to update" })
            return
        }

        const profile = await prisma.profile.findFirst({ where: { userid: user.id as number } })

        if (!profile) {
            res.status(404).json({ message: "profile not found" })
            return
        }

        const restDaysLabel = profile.restDays?.length ? profile.restDays.join(", ") : "none"
        const locationLabel =
            profile.location === "gym" ? "gym only"
            : profile.location === "homeWorkOut" ? "home only"
            : "gym and home"

        const prompt = `
You are an expert fitness coach and nutritionist. Generate a complete, personalized 7-day weekly fitness and meal plan for this user.

USER PROFILE:
- Age: ${profile.age}
- Weight: ${profile.weight ?? "not provided"}
- Height: ${profile.height ?? "not provided"}
- Fitness goal: ${profile.goal}
- Experience level: ${profile.difficultLevel}
- Workout location: ${locationLabel}
- Available hours per day: ${profile.dailyHours ?? "flexible"}
- Rest days: ${restDaysLabel}
- Health issues / limitations: ${profile.healthIssues ?? "none"}
- Include daily motivation: ${profile.ai_motivation ? "yes" : "no"}

RULES:
1. On rest days (${restDaysLabel}), set workoutType to "rest", duration to 0, exercises to [], warmup to ["light stretching"], focus to "recovery".
2. Tailor meals to the user's goal — e.g. high protein for muscle gain, caloric deficit for weight loss.
3. Suggest exercises appropriate for the user's level and location.
4. If health issues are listed, avoid exercises that could aggravate them.
5. ${profile.ai_motivation ? 'Add a short motivational message for each day in the "motivation" field.' : 'Omit the "motivation" field entirely.'}
6. Return ONLY raw valid JSON — no markdown fences, no explanations, nothing outside the JSON object.

OUTPUT FORMAT (fill every field with real values):
{
  "sunday":    { "day": "Sunday",    "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "monday":    { "day": "Monday",    "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "tuesday":   { "day": "Tuesday",   "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "wednesday": { "day": "Wednesday", "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "thursday":  { "day": "Thursday",  "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "friday":    { "day": "Friday",    "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "saturday":  { "day": "Saturday",  "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} }
}
`.trim()

        const result = await ai.chat.completions.create({
            model: "qwen/qwen-2.5-7b-instruct",
            messages: [{ role: "user", content: prompt }],
        })

        const text = result.choices[0]?.message?.content

        if (!text) {
            res.status(500).json({ message: "AI returned empty response" })
            return
        }

        const cleanText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any
        try {
            parsed = JSON.parse(cleanText)
        } catch {
            res.status(500).json({ message: "AI response was not valid JSON", raw: cleanText })
            return
        }

        const updated = await prisma.ai_Result.update({
            where: { id: latest.id },
            data: { dailyPlans: parsed },
        })

        res.status(200).json({ message: "AI result updated", data: { id: updated.id, dailyPlans: updated.dailyPlans } })

    } catch (error: any) {
        console.log(error)
        res.status(500).json({ message: "server error", error: error?.message ?? String(error) })
    }
}

export const generateAIResult = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const user = await prisma.user.findFirst({ where: { id: userId } })

        if (!user) {
            res.status(404).json({ message: "user not found" })
            return
        }
        const [freeLimit, subscription] = await Promise.all([
            prisma.freeLimit.findFirst({ where: { userId: user.id } }),
            prisma.subscription.findFirst({ where: { userId: user.id, status: "active" } }),
        ])

        if (!subscription && freeLimit && freeLimit.limitCount >= 3) {
            res.status(400).json({ message: "You have reached your free limit. Please subscribe to continue generating plans." })
            return
        }

        const profile = await prisma.profile.findFirst({ where: { userid: user.id as number } })

        if (!profile) {
            res.status(404).json({ message: "profile not found" })
            return
        }

        const restDaysLabel = profile.restDays?.length
            ? profile.restDays.join(", ")
            : "none"

        const locationLabel =
            profile.location === "gym"
                ? "gym only"
                : profile.location === "homeWorkOut"
                ? "home only"
                : "gym and home"

        const prompt = `
You are an expert fitness coach and nutritionist. Generate a complete, personalized 7-day weekly fitness and meal plan for this user.

USER PROFILE:
- Age: ${profile.age}
- Weight: ${profile.weight ?? "not provided"}
- Height: ${profile.height ?? "not provided"}
- Fitness goal: ${profile.goal}
- Experience level: ${profile.difficultLevel}
- Workout location: ${locationLabel}
- Available hours per day: ${profile.dailyHours ?? "flexible"}
- Rest days: ${restDaysLabel}
- Health issues / limitations: ${profile.healthIssues ?? "none"}
- Include daily motivation: ${profile.ai_motivation ? "yes" : "no"}

RULES:
1. On rest days (${restDaysLabel}), set workoutType to "rest", duration to 0, exercises to [], warmup to ["light stretching"], focus to "recovery".
2. Tailor meals to the user's goal — e.g. high protein for muscle gain, caloric deficit for weight loss.
3. Suggest exercises appropriate for the user's level and location.
4. If health issues are listed, avoid exercises that could aggravate them.
5. ${profile.ai_motivation ? 'Add a short motivational message for each day in the "motivation" field.' : 'Omit the "motivation" field entirely.'}
6. Return ONLY raw valid JSON — no markdown fences, no explanations, nothing outside the JSON object.

OUTPUT FORMAT (fill every field with real values):
{
  "sunday":    { "day": "Sunday",    "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "monday":    { "day": "Monday",    "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "tuesday":   { "day": "Tuesday",   "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "wednesday": { "day": "Wednesday", "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "thursday":  { "day": "Thursday",  "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "friday":    { "day": "Friday",    "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} },
  "saturday":  { "day": "Saturday",  "focus": "", "workoutType": "", "duration": 0, "warmup": [], "exercises": [{ "name": "", "sets": 0, "reps": "", "rest": 0 }], "meals": { "breakfast": "", "lunch": "", "dinner": "" }${profile.ai_motivation ? ', "motivation": ""' : ''} }
}
`.trim()

        const result = await ai.chat.completions.create({
            model: "qwen/qwen-2.5-7b-instruct",
            messages: [{ role: "user", content: prompt }],
        })

        const text = result.choices[0]?.message?.content

        if (!text) {
            res.status(500).json({ message: "AI returned empty response" })
            return
        }

        console.log("AI raw response:", text)

        const cleanText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let parsed: any
        try {
            parsed = JSON.parse(cleanText)
        } catch (parseError) {
            console.log("JSON parse failed:", cleanText)
            res.status(500).json({ message: "AI response was not valid JSON", raw: cleanText })
            return
        }

        const weeklyRoutine = await prisma.ai_Result.create({
            data: {
                userId: user.id,
                dailyPlans: parsed,
            },
        })

        await prisma.dailyLogs.create({
            data: { userId: user.id, aiResultId: weeklyRoutine.id },
        })

        await prisma.freeLimit.upsert({
            where: { userId: user.id },
            create: { userId: user.id, limitCount: 1 },
            update: { limitCount: { increment: 1 } },
        })

        res.status(200).json({ message: "AI result generated", data: { id: weeklyRoutine.id, dailyPlans: weeklyRoutine.dailyPlans } })

    } catch (error: any) {
        console.log(error)
        res.status(500).json({ message: "server error", error: error?.message ?? String(error) })
    }
}