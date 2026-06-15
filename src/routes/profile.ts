import { Router } from "express"
import { createProfile, updateProfile, getProfile } from "../controllers/profile"
import { body } from "express-validator"
import { authMiddleware } from "../middleware/auth"
export const profileRoutes = Router()

// Validation middleware
const profileValidator = [
  body("goal")
    .notEmpty()
    .withMessage("goal is required")
    .isString()
    .withMessage("goal must be a string")
    .isLength({ min: 3 })
    .withMessage("goal must be at least 3 characters long"),
  body("location")
    .notEmpty()
    .withMessage("location is required")
    .isIn(["gym", "homeWorkOut", "both"])
    .withMessage("location must be one of: gym, homeWorkOut, both"),
  body("difficultLevel")
    .notEmpty()
    .withMessage("difficultLevel is required")
    .isIn(["beginner", "intermitiate", "expert"])
    .withMessage("difficultLevel must be one of: beginner, intermitiate, expert"),
  body("age")
    .notEmpty()
    .withMessage("age is required")
    .isString()
    .withMessage("age must be a string"),
  body("dailyHours")
    .optional()
    .isString()
    .withMessage("dailyHours must be a string"),
  body("healthIssues")
    .optional()
    .isString()
    .withMessage("healthIssues must be a string"),

  body("weight")
    .optional()
    .isString()
    .withMessage("weight must be a string"),
  body("height")
    .optional()
    .isString()
    .withMessage("height must be a string"),
]

const profileUpdateValidator = [
  body("goal")
    .optional()
    .isString()
    .withMessage("goal must be a string")
    .isLength({ min: 3 })
    .withMessage("goal must be at least 3 characters long"),
  body("location")
    .optional()
    .isIn(["gym", "homeWorkOut", "both"])
    .withMessage("location must be one of: gym, homeWorkOut, both"),
  body("difficultLevel")
    .optional()
    .isIn(["beginner", "intermidiate", "expert"])
    .withMessage("difficultLevel must be one of: beginner, intermitiate, expert"),
  body("age")
    .optional()
    .isString()
    .withMessage("age must be a string"),
  body("dailyHours")
    .optional()
    .isString()
    .withMessage("dailyHours must be a string"),
  body("healthIssues")
    .optional()
    .isString()
    .withMessage("healthIssues must be a string"),


   
  body("weight")
    .optional()
    .isString()
    .withMessage("weight must be a string"),
  body("height")
    .optional()
    .isString()
    .withMessage("height must be a string"),
]

profileRoutes.post("/post", authMiddleware, profileValidator, createProfile)
profileRoutes.put("/update", profileUpdateValidator, authMiddleware, updateProfile)
profileRoutes.get("/me", authMiddleware, getProfile)



export default profileRoutes