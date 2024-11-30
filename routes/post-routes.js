const express = require("express");
const Post = require("../models/postModel");
const postController = require("../controllers/post-controller");

const router = express.Router();

router.post("/create", postController.createNewPost);
router.get("/", postController.getAllPosts);
router.patch("/post/:postId", postController.updatePost);
router.delete("/:postId", postController.deletePost);
router.get("/:postId", postController.getPost);
router.get("/post/:postId/getReplies", postController.getRepliesByPostId);
router.post("/post/reply", postController.postReply);
router.patch("/post/reply/:replyId", postController.updateReply);
router.post("/:postId/like", postController.toggleLike);
router.delete("/post/:replyId", postController.deleteReply);
module.exports = router;
