import dotenv from "dotenv"
import path from "path"
dotenv.config({ path: path.resolve(__dirname, "../.env") })
import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { userRoutes } from "./routes/user"
import { aiResult } from "./routes/aiResult"
import { dailyLogsRouter } from "./routes/dailyLogs"
import {profileRoutes} from "./routes/profile"
import { subcriptionRouter } from "./routes/subscription"
import { webhookRouter } from "./routes/webhook"
import multer from "multer"
import fs from "fs"
const app = express()

const uploadDir = path.join(__dirname, "../images")
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
    destination: (_req, _file, cb)=>{
        cb(null, uploadDir)
    },
    filename:(_req, file , cb)=>{
        cb(null, new Date().toDateString() + "-" + file.originalname);
    }
})

const fileFilter = (_req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback

)=>{
if (file.mimetype ==="image/png" || file.mimetype === "image/jpg" || file.mimetype ==="image/jpeg") {
    cb(null, true)
}else {
    cb(null, false)
}
}

const PORT = process.env.PORT || 3001

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://weeklyt-fit-frontend-bg56.vercel.app/login',
    credentials: true
}));

// Logging
app.use(morgan("dev"));
app.use("/webhook", webhookRouter)
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(multer({storage, fileFilter}).single('image'))
app.use("/users", userRoutes)
app.use("/profile", profileRoutes)
app.use("/subscription", subcriptionRouter )
app.use("/aiResult",  aiResult )
app.use("/dailyLogs", dailyLogsRouter)

app.listen(PORT, ()=>{
console.log(`port is running at port ${PORT}`)
})