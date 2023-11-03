import Users from "../model/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import { sendVerificationEmail } from "../utils/sendEmail.js";

//register
export const register = async (req, res, next) => {
    const { firstName, lastName, email, password } = req.body;

    //validate fileds
    if (!(firstName || lastName || email || password)) {
        next("provide required fields")
        return
    }
    try {
        const userExist = await Users.findOne({ email })
        if (userExist) {
            next("email adress already exist")
            return
        }

        const hashedPasword = await hashString(password)
        const user= await Users.create({
            firstName,
            lastName,
            email,
            password:hashedPasword
        })

        //send email verification to user
        sendVerificationEmail(user,res)

    } catch (error) {
        console.log(error);
        res.status(404).json({
            message: error.message
        })
    }
}

export const login = async (req,res,next)=>{
    const {email,password} = req.body;
    if(!email || !password){
        next("Please PRodvide user Credentials")
        return;
    }
    try {
        //find user
        const user= await Users.findOne({email}).select("+password").populate({
            path:"friends",
            select:"firstname lastname location profileUrl -password"
        })

        if(!user){
            next("Invalid email or password")
        }

        if(!user?.verified){
            next("user mail is not verified.check your email acount and verify your mail");
            return;
        }

        //compare password
        const isMatch= compareString(password,user?.password)
        if(!isMatch){
            next("Invalid email or password")
            return;
        }

        user.password=undefined;
        const token = createJWT(user?._id)

        res.status(201).json({
            succcess:true,
            message:"login successfuly",
            user,
            token
        })

        
        
    } catch (error) {
        console.log(error)
        res.status(404).json({message:error.message});
    } 
}