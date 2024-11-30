const { default: mongoose } = require("mongoose");
const Post = require("../models/postModel");
const User = require("../models/userModel");
const Reply = require("../models/replyModel");
const { body } = require("express-validator");

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find().populate("user"); //POPULATE: WE WANT THAT EVERY POST HAS THEIR USER(THAT MEANS WHOLE USER MODLE, WHOLE DATA OF USER)
    res.json({
      length: posts.length,
      results: posts,
    });
  } catch (err) {
    res.json({
      message: "No data Found uet.",
    });
  }
};
exports.createNewPost = async (req, res) => {
  const { title, content, user } = req.body;

  //STEP-1)) CHECK WHETHER TITLE OR CONTENT IS EMPTY
  if (!title || !content) {
    return res.json({
      message: "Please provide suitable title and description.",
    });
  }

  //CHECK IF CURRENT USER EXIST WITH THE THAT PROVIDED FOR THIS POST
  let currentUser;
  try {
    currentUser = await User.findById(user);
  } catch (err) {
    return res.json({
      message: "Creating post failed, Please try agina later.",
    });
  }

  if (!currentUser) {
    return res.json({
      message: "Could not find user.",
    });
  }
  //STEP-2)) HERE WE CONFIROM THAT WE HAVE TITLE AND CONTENT, NOW STORE INTO DATABASE WITH REPSECTD USER
  let newPost = new Post({ title, content, user });
  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await newPost.save({ session: sess });
    currentUser.posts.push(newPost);
    await currentUser.save({ session: sess });
    await sess.commitTransaction();
    res.json({ message: "Blog created successfully.", data: newPost });
  } catch (err) {
    res.json({ message: err });
  }
};
exports.updatePost = async (req, res) => {
  const { postId } = req.params;
  const { content, title, user } = req.body;
  // console.log(postId, user);

  // STEP-1: CHECK WHETHER OR NOT POST EXISTS
  if (!postId) {
    return res.json({
      message: "We could not find that post.",
    });
  }

  // STEP-2: CHECK WHETHER OR NOT CONTENT AND TITLE ARE VALID.
  if (!content || !title) {
    return res.json({
      message: "Please provide valid content and title.",
    });
  }

  // STEP-3: FIND POST BY ID.
  let post;

  try {
    post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error finding the post. Try again later.",
      error: err,
    });
  }

  // STEP-4: CHECK IF THE USER OWNS THE POST
  // if (post.user.toString() !== user) {
  //   return res.status(403).json({
  //     message: "You are not authorized to edit this post.",
  //   });
  // }

  // STEP-5: UPDATE THE POST
  try {
    if (title) post.title = title; // Update title if provided
    if (content) post.content = content; // Update content if provided
    await post.save();
    res.status(200).json({
      message: "Post updated successfully.",
      post,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating the post.",
      error: err,
    });
  }
};
exports.deletePost = async (req, res) => {
  const { postId } = req.params;

  if (!postId) {
    return res.status(400).json({
      message: "Post ID is required.",
    });
  }

  let post;
  try {
    post = await Post.findById(postId).populate("user");
    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error finding the post. Try again later.",
      error: err,
    });
  }

  const sess = await mongoose.startSession();
  sess.startTransaction();
  try {
    // Delete associated replies
    await Reply.deleteMany({ post: postId }, { session: sess });

    // Delete the post
    await post.deleteOne({ session: sess });

    // Remove the post reference from the user
    post.user.posts.pull(post._id);
    await post.user.save({ session: sess });

    await sess.commitTransaction();
    sess.endSession();
  } catch (err) {
    await sess.abortTransaction();
    sess.endSession();
    return res.status(500).json({
      message: "Error deleting the post. Try again later.",
      error: err,
    });
  }

  res.status(200).json({
    message: "Post and associated replies deleted successfully.",
  });
};
exports.getPost = async (req, res) => {
  const { postId } = req.params;
  // console.log(postId);
  try {
    const post = await Post.findById(postId)
      .populate("user")
      .populate("replies");
    console.log(post);
    return res.json({
      post,
    });
  } catch (err) {
    return res.json({
      message: "Sorry, we could not find that post.",
    });
  }
};
exports.getRepliesByPostId = async (req, res) => {
  const { postId } = req.params;
  try {
    const replies = await Post.findById(postId).populate({
      path: "replies",
      populate: {
        path: "user",
        select: "name",
      },
    });
    console.log(replies);
    res.json({
      postReplies: replies,
    });
  } catch (err) {
    res.json({ err });
  }
};
exports.postReply = async (req, res) => {
  const { content, user, post } = req.body;
  console.log(user, post);

  // STEP-1) CHECKING IF WE HAVE VALID DATA
  if (!content || !user || !post) {
    return res.json({
      message: "Please provide valid information",
    });
  }

  // STEP-2) CREATING OUR REPLY DOCUMENT
  let replyToPost;
  try {
    replyToPost = new Reply({
      content,
      user,
      post, // The reference to the post we are replying to
    });
  } catch (err) {
    return res.json({
      message: "Could not save your reply.",
    });
  }

  // STEP-3) RETRIEVING THE POST THAT WE WANT TO REPLY ON
  let postBeingReplied;
  try {
    postBeingReplied = await Post.findById(post).populate("replies");
  } catch (err) {
    return res.json({
      message: "Post that you want to reply to is not found!",
    });
  }

  // STEP-4) TRANSACTION TO SAVE REPLY AND UPDATE POST
  const sess = await mongoose.startSession();
  sess.startTransaction();

  try {
    // Save the reply first
    (await replyToPost.save({ session: sess })).populate("user");

    // Push the reply to the Post's replies array
    postBeingReplied.replies.push(replyToPost._id); // Use the reply's ObjectId
    await postBeingReplied.save({ session: sess });

    // Commit the transaction
    await sess.commitTransaction();
    // console.log(replyToPost.user.name);
    return res.json({
      message: "Reply added successfully",
      replyToPost,
    });
  } catch (err) {
    // If error occurs, abort the transaction and return error response
    await sess.abortTransaction();
    return res.json({
      message: "Error occurred while replying to post",
      error: err,
    });
  } finally {
    // End the session
    sess.endSession();
  }
};
exports.updateReply = async (req, res) => {
  const { replyId } = req.params;
  const { content, user } = req.body;
  console.log(replyId, user);

  // STEP-1: CHECK WHETHER OR NOT POST EXISTS
  if (!replyId) {
    return res.json({
      message: "We could not find that reply.",
    });
  }

  // STEP-2: CHECK WHETHER OR NOT CONTENT AND TITLE ARE VALID.
  if (!content) {
    return res.json({
      message: "Please provide valid content and title.",
    });
  }

  // STEP-3: FIND POST BY ID.
  let reply;

  try {
    reply = await Reply.findById(replyId);
    if (!reply) {
      return res.status(404).json({
        message: "Reply not found.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error finding the reply. Try again later.",
      error: err,
    });
  }

  // STEP-4: CHECK IF THE USER OWNS THE POST
  if (reply.user.toString() !== user) {
    return res.status(403).json({
      message: "You are not authorized to edit this post.",
    });
  }

  // STEP-5: UPDATE THE POST
  try {
    if (content) reply.content = content; // Update content if provided
    await reply.save();
    res.status(200).json({
      message: "Reply updated successfully.",
      reply,
    });
  } catch (err) {
    res.status(500).json({
      message: "Error updating the reply.",
      error: err,
    });
  }
};
exports.deleteReply = async (req, res) => {
  const { replyId } = req.params;
  console.log(replyId);

  // STEP-1) VALIDATE INPUT
  if (!replyId) {
    return res.json({
      message: "Please provide valid reply id",
    });
  }

  const sess = await mongoose.startSession();
  sess.startTransaction();

  try {
    // STEP-2) FIND THE REPLY
    const reply = await Reply.findById(replyId);
    if (!reply) {
      await sess.abortTransaction();
      return res.status(404).json({
        message: "Reply not found.",
      });
    }

    // STEP-3)----STEP-1 HERE, WE ARE ONLY REMOVING REPLY FROM POST'S REPLIES ARRAY
    await Post.findByIdAndUpdate(
      reply.post,
      { $pull: { replies: replyId } },
      { session: sess }
    );

    //----STEP-2 HERE, WE ARE ACTUALLY DELETING THE REPLY ITSELF
    await Reply.findByIdAndDelete(replyId, { session: sess });

    // STEP-5) COMMIT THE TRANSACTION
    await sess.commitTransaction();
    sess.endSession();

    res.status(200).json({
      message: "Reply deleted successfully.",
    });
  } catch (err) {
    await sess.abortTransaction();
    sess.endSession();
    res.status(500).json({
      message: "Error occurred while deleting the reply.",
      error: err,
    });
  }
};
exports.toggleLike = async (req, res) => {
  const { postId } = req.params;
  const userId = req.body.user;

  let user;
  try {
    user = await User.findById(userId);
  } catch (err) {
    return res.json({
      message: "Sorry, We could not find user.",
    });
  }

  if (!user) {
    return res.json({
      message: "User does not exist.",
    });
  }
  console.log(user);
  // STEP-1) FIND THE POST
  let post;
  try {
    post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        message: "Post not found.",
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error retrieving the post.",
      error: err,
    });
  }

  // STEP-2) TOGGLE LIKE STATUS
  try {
    if (post.likes.includes(userId)) {
      // User already liked the post, so unlike it
      console.log(post);
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      await post.save();
      return res.status(200).json({
        message: "Post unliked successfully.",
        post,
      });
    } else {
      // User has not liked the post, so like it
      post.likes.push(userId);
      await post.save();
      return res.status(200).json({
        message: "Post liked successfully.",
        post,
      });
    }
  } catch (err) {
    return res.status(500).json({
      message: "Error toggling like status.",
      error: err,
    });
  }
};
