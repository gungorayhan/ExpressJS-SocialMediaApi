import Posts from "../model/postModel.js"
import Users from "../model/userModel.js"
import Comments from "../model/commentModel.js"

export const createPost = async (req, res) => {
    const { userId } = req.body.user;
    const { description, image } = req.body;

    try {
        if (!description) {
            next("You must provide a description")
            return;
        }

        const post = await Posts.create({
            userId,
            description,
            image
        })

        res.status(200).json({
            status: true,
            message: "Post created successfully",
            data: post
        })
    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })

    }
}

export const getPosts = async (req, res, next) => {

    const { userId } = req.body.user;
    const { search } = req.body;
    try {

        const user = await Users.findById(userId);
        const friends = user?.friends?.toString().split(",") ?? [];
        friends.push(userId)

        const searchPostQuery = {
            $or: [
                {
                    description: { $regex: search, $options: "i" }
                }
            ]
        }

        const posts = await Posts.find(search ? searchPostQuery : {})
            .populate({
                path: "userId",
                select: "firstName lastName location profileUrl -password"
            }).sort({ _id: -1 });

        const friendsPosts = posts?.filter((post) => {
            return friends.includes(post?.userId?._id.toString());
        })

        const otherPosts = posts?.filter(
            (post) => { !friends.includes(post?.userId?._id.toString()) }
        );

        let postsRes = null;

        if (friendsPosts?.length > 0) {
            postsRes = search ? friendsPosts : [...friendsPosts, ...otherPosts]
        } else {
            postsRes: posts;
        }


        res.status(200).json({
            success: true,
            message: "Successfully",
            data: postsRes
        })


    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}


export const getPost = async (req, res) => {
    const { id } = req.params
    try {
        const post = await Posts.findById(id).populate({
            path: "userId",
            select: "firstName lastname profileUrl -password"
        })

        res.status(200).json({
            success: true,
            message: "successfully",
            data: post
        })
    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}

export const getUserPost = async (req, res, next) => {
    const { id } = req.params
    try {
        const post = await Posts.find({ userId: id })
            .populate({
                path: "userId",
                select: "firstName lastName location profileUrl -password"
            }).sort({ _id: -1 })
        res.status(200).json({
            success: true,
            message: "successfully",
            data: post
        })
    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}


export const getComments = async (req, res) => {
    const { postId } = req.params
    try {
        const postComments = await Comments.find({ postId })
            .populate({
                path: "userId",
                select: "firstName lastName location profileUrl -password"
            })
            .populate({
                path: "replies.userId",
                select: "firstName lastName location profileUrl -password"
            })
            .sort({ _id: -1 })

        res.status(200).json({
            status: true,
            message: "successfully",
            data: postComments
        })

    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}

export const likePost = async (req, res) => {
    const { userId } = req.body.user;
    const { id } = req.params;
    try {
        const post = await Posts.findById(id);

        const index = post.likes.findIndex((pid) => pid === String(userId))

        if (index === -1) {
            post.likes.push(userId)
        } else {
            post.likes = post.likes.filter((pid) => pid !== String(userId))
        }

        const newPost = await Posts.findByIdAndUpdate(id, post, { new: true })

        res.status(200).json({
            success: true,
            message: "Successfully",
            data: newPost,
        })


    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}


export const likePostComment = async (req, res) => {
    const { userId } = req.body.user;
    const { id, rid } = req.params;
    try {
        if (rid === undefined || rid === null || rid === 'false') {
            const comment = await Comments.findById(id);

            const index = comment.likes.findIndex((el) => el === String(userId));

            if (index === -1) {
                comment.likes.push(userId)
            } else {
                comment.likes = comment.likes.filter((i) => i !== String(userId))
            }

            const update = await Comments.findByIdAndUpdate(id, comment, { new: true });

            res.status(201).json(update);

        }
        else {
            const replyComments = await Comments.findOne({ _id: id }, {
                replices: {
                    $elemMatch: {
                        _id: rid,
                    }
                }
            });

            const index = replyComments?.replies[0]?.likes.findIndex(
                (i) => i !== String(userId)
            );
            if (index === -1) {
                replyComments.replies[0].likes.push(userId)
            } else {
                replyComments.replies = replyComments.replies.likes.filter((i) => i !== String(userId))
            }

            const query = { _id: id, "replies._id": rid };
            const updated = {
                $set: {
                    "replies.$.likes": replyComments.replies[0].likes
                },
            }

            const result = await Comments.updateOne(query, updated, { next: true })

            res.status(201).json(result);
        }
    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}

export const commentPost = async (req, res) => {
    const { comment, from } = req.body;
    const { userId } = req.body.user;
    const { id } = req.params;

    try {
        if (comment === null) {
            return res.status(404).json({
                message: "Comment is required"
            })
        }

        const newComment = new Comments({ comment, from, userId, postId: id })
        await newComment.save();

        //updating the post with the comments id
        const post = await Posts.findById(id);

        post.comments.push(newComment._id)

        const updatedPost = await Posts.findByIdAndUpdate(id, post, {
            new: true
        })

        res.status(201).json({ newComment });

    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}

export const replyPostComment = async (req, res) => {
    const {userId} = req.body.user;
    const {comment,repylAt,from} = req.body;
    const {id} = req.params;
    if(comment===null){
        return res.status(404).json({message:"Comment is required"})
    }

    try {
        const commentInfo = await Comments.findById(id);
        commentInfo.replies.push({
            comment,
            repylAt,
            from,
            userId,
            created_At:Date.now()
        })

        commentInfo.save();

        res.status(200).json(commentInfo)
        
    } catch (error) {
        console.log(error)
        res.status(404).json({
            message: error.message
        })
    }
}

export const deletePost = async (req, res, next) => { 

    const {id} =  req.params;
    try {
        await Posts.findByIdAndDelete(id);
        res.status(200).json({
            success:true,
            message:"Delete successfully"
        })
    } catch (error) {
        console.log(error)
        res.status(404).json({
            message:error.message
        })
    }
    
}