import User from "../models/userModel.js"; // Zaimportuj model użytkownika
import bcrypt from "bcryptjs"; // Biblioteka do haszowania haseł
import jwt from "jsonwebtoken"; // Biblioteka do generowania tokenów
import nodemailer from "nodemailer"; // Biblioteka do wysyłania e-maili
import crypto from "crypto"; // Do generowania tokenu resetującego hasło

import dotenv from "dotenv";
dotenv.config(); // Ładuje zmienne środowiskowe z pliku .env

// Funkcja do pobierania wszystkich użytkowników
export const getAllUsers = async (req, res) => {
	try {
		const users = await User.find().select("-password"); // Pobieramy użytkowników bez hasła

		if (!users || users.length === 0) {
			return res.status(404).json({ message: "No users found" });
		}

		res.status(200).json(users); // Zwracamy listę użytkowników
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching users", error: error.message });
	}
};

// Funkcja do zmiany hasła użytkownika
export const changePassword = async (req, res) => {
	const { oldPassword, newPassword } = req.body;
	const userId = req.userId; // Zakładamy, że użytkownik jest zalogowany i jego ID jest w tokenie

	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Sprawdzenie starego hasła
		const isMatch = await bcrypt.compare(oldPassword, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Old password is incorrect" });
		}

		// Haszowanie nowego hasła
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		user.password = hashedPassword;
		await user.save();

		res.status(200).json({ message: "Password changed successfully" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error changing password", error: error.message });
	}
};

// Funkcja do zmiany zdjęcia profilowego
export const changeProfilePicture = async (req, res) => {
	const { profilePicture } = req.body; // Zakładając, że zdjęcie profilowe jest w formie URL

	try {
		const user = await User.findById(req.userId); // Używamy userId z tokenu
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		user.profilePicture = profilePicture;
		await user.save();

		res.status(200).json({ message: "Profile picture updated successfully" });
	} catch (error) {
		res.status(500).json({
			message: "Error updating profile picture",
			error: error.message,
		});
	}
};

// Funkcja do zapomnianego hasła (wysyłanie maila z linkiem do resetu)
export const forgotPassword = async (req, res) => {
	const { email } = req.body;

	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Tworzenie tokenu resetującego hasło
		const resetToken = crypto.randomBytes(32).toString("hex");
		user.resetPasswordToken = resetToken;
		user.resetPasswordExpires = Date.now() + 3600000; // Token ważny przez godzinę
		await user.save();

		// Konfiguracja nodemailer do wysyłania e-maili
		const transporter = nodemailer.createTransport({
			service: "gmail",
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
		});

		// Treść wiadomości e-mail
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: user.email,
			subject: "Password Reset Request",
			text: `You requested a password reset. Please click on the following link to reset your password: 
            http://localhost:5000/reset-password/${resetToken}`,
		};

		// Wysyłanie e-maila
		transporter.sendMail(mailOptions, (error, info) => {
			if (error) {
				return res
					.status(500)
					.json({ message: "Error sending email", error: error.message });
			}
			res.status(200).json({ message: "Password reset email sent" });
		});
	} catch (error) {
		res.status(500).json({
			message: "Error processing password reset",
			error: error.message,
		});
	}
};

// Funkcja do resetowania hasła
export const resetPassword = async (req, res) => {
	const { token } = req.params;
	const { newPassword } = req.body;

	try {
		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpires: { $gt: Date.now() }, // Sprawdzamy, czy token nie wygasł
		});

		if (!user) {
			return res.status(400).json({ message: "Invalid or expired token" });
		}

		// Haszowanie nowego hasła
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);

		user.password = hashedPassword;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save();

		res.status(200).json({ message: "Password reset successfully" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error resetting password", error: error.message });
	}
};

// Funkcja do usuwania konta użytkownika
export const deleteUser = async (req, res) => {
	const userId = req.user.id; // Pobieramy userId z tokenu
	console.log("UserId from token:", userId); // Logowanie ID użytkownika

	try {
		// Szukamy użytkownika w bazie danych na podstawie userId
		const user = await User.findByIdAndDelete(userId);

		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.status(200).json({ message: "User account deleted successfully" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error deleting user", error: error.message });
	}
};

// Funkcja do pobierania historii aktywności użytkownika
export const getActivityHistory = async (req, res) => {
	const userId = req.userId; // Pobieramy userId z tokenu

	try {
		// Sprawdzamy, czy mamy użytkownika
		const user = await User.findById(userId).select("messages matches"); // Pobieramy tylko wiadomości i sparowania, bez 'populate' na razie

		// Sprawdzamy, czy użytkownik istnieje
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Logowanie, aby sprawdzić, co zawiera użytkownik
		console.log("User's messages:", user.messages);
		console.log("User's matches:", user.matches);

		// Jeśli wiadomości i sparowania są puste, zwrócimy komunikat
		if (!user.messages || !user.matches) {
			return res.status(404).json({
				message: "No activity history found for this user",
			});
		}

		// Jeśli wiadomości i sparowania są dostępne, dodajemy populację
		const populatedUser = await User.findById(userId)
			.populate("messages.from", "username email") // Pobieramy dane użytkownika z pola 'from'
			.populate("messages.to", "username email") // Pobieramy dane użytkownika z pola 'to'
			.populate("matches", "username email") // Pobieramy dane sparowanych użytkowników
			.select("messages matches");

		// Logowanie, aby sprawdzić, co zawiera użytkownik po populacji
		console.log("Populated user's messages:", populatedUser.messages);
		console.log("Populated user's matches:", populatedUser.matches);

		// Zwracamy wynik
		res.status(200).json({
			messages: populatedUser.messages,
			matches: populatedUser.matches,
		});
	} catch (error) {
		res.status(500).json({
			message: "Error fetching activity history",
			error: error.message,
		});
	}
};

// userController.js
import User from "../models/userModel.js";

// Funkcja flagowania użytkownika
export const flagUser = async (req, res) => {
	const { userId } = req.params; // ID użytkownika
	const { flaggedBy, reason } = req.body; // ID użytkownika zgłaszającego i powód

	try {
		const user = await User.findById(userId);
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		user.flagged = true;
		user.flaggedBy.push(flaggedBy);
		user.flagReasons.push(reason);
		await user.save();

		res.status(200).json({ message: "User flagged successfully" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error flagging user", error: error.message });
	}
};

// Endpoint do przeglądania zgłoszonych użytkowników (dla administratora)
export const getFlaggedUsers = async (req, res) => {
	try {
		const flaggedUsers = await User.find({ flagged: true });
		res.status(200).json(flaggedUsers);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching flagged users", error: error.message });
	}
};
