import Message from "../models/messageModel.js";

// Endpoint do pobierania listy rozmów
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId; // Zakładamy, że id użytkownika jest w tokenie
    const conversations = await Message.aggregate([
      { $match: { $or: [{ from: userId }, { to: userId }] } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$from", userId] }, "$to", "$from"] },
          messages: { $push: "$$ROOT" },
        },
      },
      {
        $lookup: {
          from: "users", // Zakładamy, że kolekcja użytkowników to "users"
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
    ]);

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({ message: "No conversations found" });
    }

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching conversations", error: error.message });
  }
};

// Endpoint do pobierania wiadomości w ramach konkretnej rozmowy
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const messages = await Message.find({ _id: { $in: conversationId } })
      .populate("from", "username email")
      .populate("to", "username email")
      .sort({ createdAt: 1 }); // Posortowanie po dacie, aby wiadomości były w kolejności

    if (!messages || messages.length === 0) {
      return res.status(404).json({ message: "No messages found in this conversation" });
    }

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
};

// Endpoint do wysyłania wiadomości
export const sendMessage = async (req, res) => {
  const { to, content } = req.body; // Odbiorca i treść wiadomości

  if (!to || !content) {
    return res.status(400).json({ message: "Recipient and content are required" });
  }

  try {
    const from = req.userId; // Zakładamy, że użytkownik wysyłający wiadomość jest w tokenie

    const newMessage = new Message({
      from,
      to,
      content,
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Error sending message", error: error.message });
  }
};

// messageController.js
import Message from "../models/messageModel.js";

// Funkcja flagowania wiadomości
export const flagMessage = async (req, res) => {
  const { messageId } = req.params; // ID wiadomości
  const { userId, reason } = req.body; // ID użytkownika i powód

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    message.flagged = true;
    message.flaggedBy.push(userId);
    message.flagReasons.push(reason);
    await message.save();

    res.status(200).json({ message: "Message flagged successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error flagging message", error: error.message });
  }
};

// Endpoint do przeglądania zgłoszonych wiadomości (dla administratora)
export const getFlaggedMessages = async (req, res) => {
  try {
    const flaggedMessages = await Message.find({ flagged: true });
    res.status(200).json(flaggedMessages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching flagged messages", error: error.message });
  }
};
