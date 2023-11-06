import mongoose from "mongoose";
import Verification from "../model/emailVerification.js";
import Users from "../model/userModel.js";
import { compareString, hashString } from "../utils/index.js";
import PasswordReset from "../model/passwordResetModel.js";
import { resetPasswordLink } from "../utils/sendEmail.js";


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
    const { userId, token } = req.params;

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
        
        if(user){
            await PasswordReset.findByIdAndDelete({userId})

            res.status(200).json({
                ok:true
            })
        }


    } catch (error) {
        console.log(error)
        res.status(404).json({message:error.message})
    }
}