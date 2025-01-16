import express from "express";
import {
	getConversations,
	getMessages,
	sendMessage,
} from "../controllers/messageController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
	flagMessage,
	getFlaggedMessages,
} from "../controllers/messageController.js";

const router = express.Router();

router.use(authMiddleware); // Zabezpieczenie endpointów przez authMiddleware

// Pobieranie listy rozmów
router.get("/conversations", getConversations);

// Pobieranie wiadomości w ramach konkretnej rozmowy
router.get("/messages/:conversationId", getMessages);

// Wysyłanie wiadomości
router.post("/send", sendMessage);

// Route do flagowania wiadomości
router.post("/:messageId/flag", flagMessage);

// Route do pobierania zgłoszonych wiadomości (dla administratora)
router.get("/flagged", getFlaggedMessages);

export default router;
