import { Router } from "express";
import {body} from "express-validator"
import { addImage, login, registerUser, getUser } from "../controllers/auth";
import { authMiddleware } from "../middleware/auth";
export const userRoutes = Router()

const loginValidator = [
    body("email").isString().notEmpty().isLength({ min: 3 }).isEmail().normalizeEmail(),
    body("password").isString().trim().isLength({ min: 3 }).withMessage("password should be at least 3 characters long")
]

const registerValidator = [
    body("email").isString().notEmpty().isLength({ min: 3 }).isEmail().normalizeEmail().trim(),
    body("password").isString().trim().isLength({ min: 3 }).withMessage("password should be at least 3 characters long"),
    body("name").notEmpty().isString().trim().isLength({ min: 3 }).withMessage("name should be at least 3 characters long")
]


userRoutes.post("/login", loginValidator, login )
userRoutes.put("/addImage", authMiddleware,  addImage)
userRoutes.get("/me", authMiddleware, getUser )
userRoutes.post("/register", registerValidator, registerUser )