import { Request, Response, NextFunction } from "express"
import Jwt  from "jsonwebtoken"
import { AuthRequest } from "../types/express.d"
export const authMiddleware = (req: Request, res: Response,next :NextFunction)=>{

    const AuthHeader = req.headers["authorization"]

    const token = AuthHeader && AuthHeader.split(' ')[1]

    if (!token) {
        res.status(400).json({message: "not authenticated",})
        return
        
    }

try {
    const decodedToken = Jwt.verify(token, process.env.SECRET_KEY || "MYfitnessappsecretkey") as {id: number}
    ;(req as AuthRequest).user = { id: decodedToken.id }
next()
} catch (error) {
    console.log(error)
    res.status(401).json({message: "invalid or expired token"})
    return
}

}


