import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
	username: { type: String, required: true, unique: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	profilePicture: { type: String }, // Link do zdjęcia profilowego
	matches: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Lista użytkowników, którzy się matchowali
	messages: [
		{
			from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			content: { type: String, required: true },
			createdAt: { type: Date, default: Date.now },
		},
	],
	resetPasswordToken: { type: String }, // Token resetujący hasło
	resetPasswordExpires: { type: Date }, // Data wygaśnięcia tokenu
	flagged: { type: Boolean, default: false }, // Flaga zgłoszenia
	flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Użytkownicy, którzy zgłosili tego użytkownika
	flagReasons: [String], // Powody zgłoszenia
});

const User = mongoose.model("User", userSchema);

export default User;
