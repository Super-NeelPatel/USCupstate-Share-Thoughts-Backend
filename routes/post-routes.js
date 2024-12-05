const express = require("express");
const Post = require("../models/postModel");
const postController = require("../controllers/post-controller");
const checkAuth = require("../middleware/check-auth");
const router = express.Router();

router.use(checkAuth);
router.get("/", postController.getAllPosts);
router.post("/create", checkAuth, postController.createNewPost);
router.patch("/post/:postId", postController.updatePost);
router.delete("/:postId", postController.deletePost);
router.get("/:postId", postController.getPost);
router.get("/post/:postId/getReplies", postController.getRepliesByPostId);
router.post("/post/reply", postController.postReply);
router.patch("/post/reply/:replyId", postController.updateReply);
router.post("/:postId/like", postController.toggleLike);
router.delete("/post/:replyId", postController.deleteReply);

router.get("/getUserStats/:userId", postController.getUserStats);
module.exports = router;
