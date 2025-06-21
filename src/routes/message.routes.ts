import { Router } from "express";
import {
  sendMessage,
  getMessages,
  replyToMessage,
  deleteMessage,
} from "../controllers/message.controller";
import { protect, isOperator } from "../middleware/auth.middleware";

const router = Router();

// @desc    Send a message to operators
// @route   POST /api/messages
// @access  Private (authenticated users only)
router.post("/", protect, sendMessage);

// @desc    Get all messages for current user
// @route   GET /api/messages
// @access  Private
router.get("/", protect, getMessages);

// @desc    Reply to a message
// @route   POST /api/messages/reply
// @access  Private/Operator
router.post("/reply", protect, isOperator, replyToMessage);

// @desc    Delete a message
// @route   DELETE /api/messages/:id
// @access  Private/Operator
router.delete("/:id", protect, isOperator, deleteMessage);

export default router;
