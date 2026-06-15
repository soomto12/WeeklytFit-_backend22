import { Router } from "express"
import { authMiddleware } from "../middleware/auth"
import { generateAIResult, getAIResult, getAllAIResults, updateAIResult } from "../controllers/AIResult"
export const aiResult = Router()

aiResult.get("/results", authMiddleware, getAllAIResults)
aiResult.get("/result", authMiddleware, getAIResult)
aiResult.post("/generate", authMiddleware, generateAIResult)
aiResult.put("/generate", authMiddleware, updateAIResult)
