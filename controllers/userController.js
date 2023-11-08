import mongoose from "mongoose";
import Verification from "../model/emailVerification.js";
import Users from "../model/userModel.js";
import { compareString, createJWT, hashString } from "../utils/index.js";
import PasswordReset from "../model/passwordResetModel.js";
import { resetPasswordLink } from "../utils/sendEmail.js";
import FriendRequest from "../model/friendRequestModel.js";


export const verifyEmail = async (req, res) => {

    const { userId, token } = req.params;

    try {
        const result = await Verification.findOne({ userId })

        if (result) {
            const { expriesAt, token: hashedToken } = result;

            //token has expires
            if (expriesAt < Date.now()) {
                await Verification.findOneAndDelete({ userId })
                    .then(() => {
                        Users.findOneAndDelete({ _id: userId })
                            .then(() => {
                                const message = "Verification token has expries.";
                                res.redirect(`/user/verified?status=error&message=${message}`)
                            })
                            .catch((err) => {
                                res.redirect(`/users/verified?status=error&message=`)
                            })
                    })
                    .catch((err) => {
                        console.log(err)
                    })

            }
            else {
                //token valid
                compareString(token, hashedToken)
                    .then((isMatch) => {
                        if (isMatch) {
                            Users.findByIdAndUpdate(
                                { _id: userId },
                                { verified: true }
                            )
                                .then(() => {
                                    Verification.findOneAndDelete({ userId })
                                        .then(() => {
                                            const message = "Email verified successfully";
                                            res.redirect(`/users/verified?status=success&message=${message}`)
                                        })
                                })
                                .catch((error) => {
                                    console.log(error)
                                    const message = "Verification failed or link is invalid"
                                    res.redirect(`/users/verified?status=error&meessage=${message}`)
                                })
                        } else {
                            //invalid token
                            console.log("isMatch-false")
                            const message = "Verification failed or link is invalid"
                            res.redirect(`/users/verified?status=error&meessage=${message}`)
                        }

                    })
                    .catch((err) => {
                        console.log(err)
                        res.redirect(`/users/verified?message=`)

                    })
            }
        } else {
            console.log("result-false")
            const message = "Invalid verification link. Try again later";
            res.redirect(`/users/verified?status=error@message=${message}`)
        }
    } catch (error) {
        console.log(error)
        res.redirect(`/users/verified?staus='error'&message=`)
    }
}

export const requestPasswordReset = async (req, res) => {
    const { email } = req.body

    try {
        const user = await Users.findOne({ email })
        if (!user) {
            return res.status(404).json({
                status: "failed",
                message: 'Email adress not found'
            })
        }


        const existingRequest = await PasswordReset.findOne({ email })
        if (existingRequest) {
            if (existingRequest.expiresAt > Date.now()) {
                return res.status(201).json({
                    status: "PENDING",
                    message: "Reset password link has already been sent to your email."
                })
            }

            await PasswordReset.findOneAndDelete({ email })
        }

        await resetPasswordLink(user, res)

    } catch (error) {
        console.log(error)
        res.status(404), json({
            message: error.message
        })
    }
}

export const resetPassword = async (req, res) => {
    const { userId, token: resetToken } = req.params;

    try {
        const user = await Users.findById(userId);

        if (!user) {
            const message = "Invalid password link. Try again";
            res.redirect(`/users/resetpassword?type:reset&status=error&message=${message}`)
        }

        const resetPassword = await PasswordReset.findOne({ userId })
        if (!resetPassword) {
            const message = "Invalid password reset link.Try Again";
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        }

        const { expriesAt, token } = resetPassword;

        if (expriesAt < Date.now()) {
            const message = "Invalid password reset link.Try Again";
            res.redirect(`/users/resetpassword?status=error&message=${message}`)
        } else {
            const isMatch = await compareString(token, resetToken)
            if (!isMatch) {
                const message = "Invalid password reset link.Try Again";
                res.redirect(`/users/resetpassword?status=error&message=${message}`)
            } else {
                res.redirect(`users/resetpassword?type=reset&id=${userId}`)
            }
        }

    } catch (error) {
        console.log(error)
        res.status(404).json({ meessage: error.message })
    }
}

export const changePassword = async () => {
    const { userId, password } = req.body
    try {

        const hashedpassword = await hashString(password);

        const user = await Users.findByIdAndUpdate(
            { userId },
            { password: hashedpassword }
        )

        if (user) {
            await PasswordReset.findByIdAndDelete({ userId })

            res.status(200).json({
                ok: true
            })
        }


    } catch (error) {
        console.log(error)
        res.status(404).json({ message: error.message })
    }
}


export const getUser = async (req, res) => {
    const { userId } = req.body.user;
    const { id } = req.params;
    try {

        const user = await Users.findById(id ?? userId).populate({
            path: "friends",
            select: "-password",
        })

        if (!user) {
            return res.status(404).send({
                message: "User not found",
                success: false,
            })
        }

        user.password = undefined;
        return res.status(200).json({
            success: true,
            user: user
        })



    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "auth error",
            success: "false",
            error: error.message
        })
    }
}

export const updateUser = async (req, res) => {
    const { firstName, lastName, location, profileUrl, profession } = req.body

    try {
        if (!(firstName || lastName || location || profileUrl || profession)) {
            next("Please provide all required fields")
            return;
        }

        const { userId } = req.body.user;
        const updateUser = {
            firstName,
            lastName,
            location,
            profileUrl,
            profession,
            _id: userId
        }

        const user = await Users.findByIdAndUpdate(
            userId,
            updateUser,
            { new: true }
        )

       await user.populate({ path: "friends", select: "-password" })
        const token = createJWT(user?._id)
        user.password = undefined;
        res.status(200).json({
            success: true,
            message: "User update successfully",
            user,
            token
        })
    } catch (error) {
        console.log(error)
        res.status(404).json({
            status: error,
            message: error.message
        })
    }
}


export const friendRequest = async (req, res, next) => {

    const { userId } = req.body.user;
    const { requestTo } = req.body;
    try {
        const requestExist = await FriendRequest.findOne({
            requestFrom: userId,
            requestTo,
        })

        if (requestExist) {
            next("Friend Request already sent")
            return;
        }

        const accountExist = await FriendRequest.findOne({
            requestTo,
            requestFrom: userId
        });

        if (accountExist) {
            next("friend request already sent")
            return
        }

        const newRes = await FriendRequest.create({
            requestTo,
            requestFrom: userId
        })

        res.status(201).json({
            success: true,
            message: "Friend request sent successfully"
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success: false,
            error: error.message,
        });

    }
}

export const getFriendRequest = async (req, res) => {
    const { userId } = req.body.user
    try {
        const request = await FriendRequest.find({
            requestTo: userId,
            requestStatus: "Pending"
        })
            .populate({
                parh: "requestFrom",
                select: "firstname lastname profileUrl profession -password"
            })
            .limit(10)
            .sort({
                _id: -1
            })

        res.status(200).json({
            success: true,
            data: request,
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success: false,
            error: error.message,
        });
    }
}

export const acceptRequest = async (req, res) => {
    const id = req.body.user.userId;

    const { rid, status } = req.body;

    try {
        const requestExist =  await FriendRequest.findById(rid);

        if(!requestExist){
            next("No friend request found")
            return;
        }

        const newRes = await FriendRequest.findByIdAndUpdate(
            {_id:rid},
            {requestStatus:status},
            // {new:true}
        )

        if(status === "Accepted"){
            const user = await Users.findById(id);
            user.friends.push(newRes?.requestFrom);
            await user.save();

            const friend = await Users.findById(newRes?.requestFrom);
            friend.friends.push(newRes?.requestTo);
            await friend.save();
        }

        res.status(201).json({
            success:true,
            message:"Friend Request" + status,
        })
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "auth error",
            success: false,
            error: error.message,
        });
    }
}

export const profileViews =async (req,res)=>{
    const {userId} = req.body.user;
    const {id} = req.body;

    try {
        const user = await Users.findById(id);
        user.views.push(userId);

        await user.save();
        
        res.status(201).json({
            success:true,
            message:"Successfully"
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message:"auth error",
            success:false,
            error:error.message
        })
    }

}


export const suggestedFriends = async (req,res)=>{
    const {userId} = req.body.user

    try {
        let queryObject = {}
        queryObject._id={$ne : userId}
        queryObject.friends = {$nin : userId}

        let queryResult  =  Users.find(queryObject)
        .limit(15)
        .select("firstName lastName profileUrl profession -password");

        const suggestedFriends = await queryResult;

        res.status(200).json({
            success:true,
            data:suggestedFriends,
        })
    } catch (error) {
        console.log(error)
        res.status(404).json({message:error.message})
    }

}