
import { Request, Response } from "express";
import { AuthRequest } from "../types/express"
import { User } from "../types/types";
import {validationResult} from "express-validator"
import { hash, compare } from "bcrypt-ts"
import {prisma} from "../libs/prisma"
import {createToken} from "../libs/utility"

// create new user
export const registerUser = async (req: Request, res:Response)=>{
    const errors = validationResult(req);
if (!errors.isEmpty()) {
    res.status(400).json({errors: "invalid credentials", errorMessage:errors.array()})
    return;
};

const saltRound = 12;
    const { name, email, password } : User = req.body 

   

    try {
      const findemail = await prisma.user.findUnique({
        where: { email }
      })

    if (findemail) {
        res.status(409).json({message:"email already exist", error:"email already exist"});
        return
    }
const hashPassword = await hash(password, saltRound);

const  createUser = await prisma.user.create({
  data:{
    email:email,
    password:hashPassword,
    name: name
  }
});


    


const token = createToken(createUser.id);
const { password: _, ...safeUser } = createUser;
res.status(200).json({message: "user created successfully", data: safeUser, token: token});
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "server error", error: error instanceof Error ? error.message : error })
        return
    }


};




// Login a new user

export const login = async (req: Request, res: Response)=>{
const errors = validationResult(req)

if (!errors.isEmpty()) {
    res.status(400).json({message:"invalid credentials",})
    return
}

    const { email, password } = req.body 

    if (typeof password !== "string" || typeof email !== "string") {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid email" });
        }

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = createToken(user.id);
        return res.status(200).json({ message: "login successfully", token });

} catch (error) {
    console.log(error)
    res.status(500).json({message: "server error", error: error instanceof Error ? error.message : error})
    return
}


}


export const addImage = async (req: Request, res: Response)=>{
try {
    const image = req.file

    if (!image) {
        res.status(400).json({message: "No image provided"})
        return
    }

    const userId = (req as AuthRequest).user.id

    const user = await prisma.user.findUnique({ where: { id: userId}})

    if (!user) {
        res.status(404).json({message: "user does not exist"})
        return
    }

    const updateImage = await prisma.user.update({
        where: {id: user.id},
        data: {
            image: image.filename
        }
    })

    res.status(200).json({message: "Image updated successfully", data: updateImage})
} catch (error) {
    console.log(error)
    res.status(500).json({message: "server error", error: error instanceof Error ? error.message : error})
}
}


 export const getUser = async (req : Request, res:Response)=>{
  try {
    const userId = (req as AuthRequest).user.id

    const user = await prisma.user.findUnique({where : { id : userId }})

    if (!user) {
      res.status(404).json({message: "user not found"})
      return
    }

    const { password: _, ...safeUser } = user
    res.status(200).json({user : safeUser, message: "user found"})
  } catch (error) {
       console.log(error)
    res.status(500).json({message: "server error", error: error instanceof Error ? error.message : error})
  }
  



}