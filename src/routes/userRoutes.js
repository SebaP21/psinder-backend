import express from "express";

import { registerUser, loginUser } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { matchUsers, sendMessage } from "../controllers/matchController.js";
import {
	getAllUsers,
	forgotPassword,
	resetPassword,
	getActivityHistory,
	deleteUser,
} from "../controllers/userController.js";
import { flagUser, getFlaggedUsers } from "../controllers/userController.js";

const router = express.Router();

// Trasa do pobierania wszystkich użytkowników
router.get("/allusers", getAllUsers);

// Rejestracja i logowanie użytkowników
router.post("/register", registerUser);
router.post("/login", loginUser);

router.delete("/delete", authMiddleware, deleteUser); // Usuwanie konta użytkownika

// Funkcje dostępne tylko dla zalogowanych użytkowników
router.post("/match", authMiddleware, matchUsers);
router.post("/message", authMiddleware, sendMessage);
router.get("/activity-history", authMiddleware, getActivityHistory); // Historia aktywności użytkownika

// Nowe trasy do resetowania hasła
router.post("/forgot-password", forgotPassword); // Wysyłanie linku do resetowania hasła
router.post("/reset-password/:token", resetPassword); // Resetowanie hasła na podstawie tokenu

// Route do flagowania użytkownika
router.post("/:userId/flag", flagUser);

// Route do pobierania zgłoszonych użytkowników (dla administratora)
router.get("/flagged", getFlaggedUsers);

export default router;

// {
// 	"message": "User registered successfully",
// 	"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2Nzg3YmU1M2I1Y2U2YmIxMmRjZjhmNDkiLCJpYXQiOjE3MzY5NDkzMzEsImV4cCI6MTczNjk1MjkzMX0.5u-bL9jISQtbUK_T4vX8zwfGRmtIoUz6KP0zUezh2Do",
// 	"user": {
// 		"id": "6787be53b5ce6bb12dcf8f49",
// 		"username": "firstMatch",
// 		"email": "first@match.com"
// 	}
// }
