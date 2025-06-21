import { Request, Response } from "express";
import pool from "../db";
import { asyncHandler } from "../utils/asyncHandler";

// @desc    Send a message from user to operator
// @route   POST /api/messages
// @access  Private (authenticated users only)
export const sendMessage = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;
  const senderId = req.user.id;

  if (!message || message.trim() === "") {
    res.status(400);
    throw new Error("Message content is required");
  }

  // Find an operator to send the message to
  // For simplicity, we'll send to the first available operator
  const [operators]: any = await pool.query(
    "SELECT id FROM users WHERE role = 'operator' LIMIT 1"
  );

  if (operators.length === 0) {
    res.status(404);
    throw new Error("No operators available to receive messages");
  }

  const receiverId = operators[0].id;

  // Insert the message
  const [result]: any = await pool.query(
    "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
    [senderId, receiverId, message.trim()]
  );

  // Get the created message with sender info
  const [newMessage]: any = await pool.query(
    `SELECT m.*, 
            sender.username as sender_username,
            receiver.username as receiver_username
     FROM messages m
     JOIN users sender ON m.sender_id = sender.id
     JOIN users receiver ON m.receiver_id = receiver.id
     WHERE m.id = ?`,
    [result.insertId]
  );

  res.status(201).json({
    message: "Message sent successfully",
    data: newMessage[0],
  });
});

// @desc    Get all messages for the current user (conversation view)
// @route   GET /api/messages
// @access  Private
export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let query: string;
  let params: any[];

  if (userRole === "operator") {
    // Operators can see all messages
    query = `
      SELECT m.*, 
             sender.username as sender_username,
             receiver.username as receiver_username
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      ORDER BY m.created_at DESC
    `;
    params = [];
  } else {
    // Regular users can only see their own messages
    query = `
      SELECT m.*, 
             sender.username as sender_username,
             receiver.username as receiver_username
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      JOIN users receiver ON m.receiver_id = receiver.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `;
    params = [userId, userId];
  }

  const [messages]: any = await pool.query(query, params);

  res.json({
    success: true,
    count: messages.length,
    data: messages,
  });
});

// @desc    Reply to a message (operators only)
// @route   POST /api/messages/reply
// @access  Private/Operator
export const replyToMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const { originalMessageId, message } = req.body;
    const senderId = req.user.id; // This should be an operator

    if (!message || message.trim() === "") {
      res.status(400);
      throw new Error("Reply message content is required");
    }

    if (!originalMessageId) {
      res.status(400);
      throw new Error("Original message ID is required");
    }

    // Get the original message to find who to reply to
    const [originalMessages]: any = await pool.query(
      "SELECT sender_id, receiver_id FROM messages WHERE id = ?",
      [originalMessageId]
    );

    if (originalMessages.length === 0) {
      res.status(404);
      throw new Error("Original message not found");
    }

    const originalMessage = originalMessages[0];

    // Determine who to send the reply to
    // If operator is replying, send to the original sender (if they're not the operator)
    const receiverId =
      originalMessage.sender_id === senderId
        ? originalMessage.receiver_id
        : originalMessage.sender_id;

    // Insert the reply
    const [result]: any = await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)",
      [senderId, receiverId, message.trim()]
    );

    // Get the created reply with sender info
    const [newReply]: any = await pool.query(
      `SELECT m.*, 
            sender.username as sender_username,
            receiver.username as receiver_username
     FROM messages m
     JOIN users sender ON m.sender_id = sender.id
     JOIN users receiver ON m.receiver_id = receiver.id
     WHERE m.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Reply sent successfully",
      data: newReply[0],
    });
  }
);

// @desc    Delete a message (operators only)
// @route   DELETE /api/messages/:id
// @access  Private/Operator
export const deleteMessage = asyncHandler(
  async (req: Request, res: Response) => {
    const messageId = req.params.id;

    // Check if message exists
    const [messages]: any = await pool.query(
      "SELECT * FROM messages WHERE id = ?",
      [messageId]
    );

    if (messages.length === 0) {
      res.status(404);
      throw new Error("Message not found");
    }

    // Delete the message
    await pool.query("DELETE FROM messages WHERE id = ?", [messageId]);

    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  }
);
