import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
	from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
	content: { type: String, required: true },
	createdAt: { type: Date, default: Date.now },
	flagged: { type: Boolean, default: false }, // Flaga zgłoszenia
	flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Użytkownicy, którzy zgłosili wiadomość
	flagReasons: [String], // Powody zgłoszenia
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
