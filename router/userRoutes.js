import express from "express"
import path from "path"
import { acceptRequest, changePassword, friendRequest, getFriendRequest, getUser, profileViews, requestPasswordReset, resetPassword, suggestedFriends, updateUser, verifyEmail } from "../controllers/userController.js"
import userAuth from "../middleware/authMiddleware.js"

const router = express.Router()

const __dirname = path.resolve(path.dirname(""))

router.get("/verify/:userId/:token",verifyEmail)
//password reset
router.post("/request-passwordreset", requestPasswordReset)
router.get("/reset-password/:userId/:token",resetPassword)
router.post("/reset-password",changePassword)

//user routes
router.get("/get-user/:id?",userAuth,getUser)
router.put("/update-user",userAuth,updateUser)

//friend request
router.post("/friends-request",userAuth,friendRequest)
router.post("/get-friends-request",userAuth,getFriendRequest)

//accept /deny friend request
router.post("/accept-request",userAuth,acceptRequest)

//view profile
router.post("/profile-view",userAuth,profileViews)

//suggest friends
router.post("/suggest-friends",userAuth, suggestedFriends)

router.get("/verified",(req,res)=>{
  res.sendFile(path.join(__dirname,"./views/verifiedpage.html"));
    // res.sendFile(__dirname,"./views/build","index.hmtl")
})
router.get("/resetpassword",(req,res)=>{
  const {} = req.params
  res.sendFile(path.join(__dirname,"./views/verifiedpage.html"));
    // res.sendFile(__dirname,"./views/build","index.hmtl")
})

export default router
