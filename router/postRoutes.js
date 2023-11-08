import express from "express"
import { createPost, getPosts,getPost, getUserPost, getComments, likePost, likePostComment, replyPostComment, deletePost } from "../controllers/postController.js"
import userAuth from "../middleware/authMiddleware.js"
const router = express.Router()


//create-post
router.post("/create-post", userAuth ,createPost)

router.get("/", userAuth ,getPosts)
router.get("/:id", userAuth ,getPost)

router.get("/get-user-post/:id",userAuth, getUserPost)

//get comments
router.get("/comments/:postId",getComments)

//like and comment on posts
router.post("/like/:id",userAuth,likePost);
router.post("/like-comment/:id/:rid?",userAuth,likePostComment)
router.post("/reply-comment/:id", userAuth, replyPostComment)

//delete
router.delete("/:id",userAuth,deletePost);
export default router