import { Request, Response } from "express"
import { validationResult } from "express-validator"
import { AuthRequest } from "../types/express.d"
import { prisma } from "../libs/prisma"

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
type Day = typeof DAYS[number]

export const updateDailyLog = async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return
    }

    const userId = (req as AuthRequest).user.id
    const { aiResultId, day, status } = req.body as { aiResultId: number; day: Day; status: string }

    try {
        const log = await prisma.dailyLogs.upsert({
            where: { aiResultId: Number(aiResultId) },
            create: { userId, aiResultId: Number(aiResultId), [day]: status },
            update: { [day]: status },
        })

        res.status(200).json({ message: "Log updated", data: log })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "server error" })
    }
}

export const getUserDailyLogs = async (req: Request, res: Response) => {
    const userId = (req as AuthRequest).user.id

    try {
        const latestResult = await prisma.ai_Result.findFirst({
            where: { userId },
            orderBy: { createdAt: "desc" },
        })

        if (!latestResult) {
            res.status(200).json({ data: null })
            return
        }

        const log = await prisma.dailyLogs.findUnique({
            where: { aiResultId: latestResult.id },
        })

        res.status(200).json({ data: log })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "server error" })
    }
}
