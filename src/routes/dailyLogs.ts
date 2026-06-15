import { Router } from "express"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth"
import { updateDailyLog, getUserDailyLogs } from "../controllers/dailyLogs"

export const dailyLogsRouter = Router()

const validateLog = [
    body("aiResultId")
        .notEmpty().withMessage("aiResultId is required")
        .isInt({ gt: 0 }).withMessage("aiResultId must be a positive integer"),
    body("day")
        .isIn(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"])
        .withMessage("day must be a valid day of the week"),
    body("status")
        .isIn(["done", "unable", "missed"])
        .withMessage("status must be one of: done, unable, missed"),
]

dailyLogsRouter.get("/", authMiddleware, getUserDailyLogs)
dailyLogsRouter.post("/", authMiddleware, validateLog, updateDailyLog)
