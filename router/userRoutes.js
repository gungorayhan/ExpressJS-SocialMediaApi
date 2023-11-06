import express from "express"
import path from "path"
import { requestPasswordReset, resetPassword, verifyEmail } from "../controllers/userController.js"

const router = express.Router()

const __dirname = path.resolve(path.dirname(""))

router.get("/verify/:userId/:token",verifyEmail)
//password reset
router.post("/request-passwordreset", requestPasswordReset)
router.get("/reset-password/:userId/:token",resetPassword)


router.get("/verified",(req,res)=>{
  res.sendFile(path.join(__dirname,"./views/verifiedpage.html"));
    // res.sendFile(__dirname,"./views/build","index.hmtl")
})
router.get("/resetpassword",(req,res)=>{
  res.sendFile(path.join(__dirname,"./views/verifiedpage.html"));
    // res.sendFile(__dirname,"./views/build","index.hmtl")
})

export default router
