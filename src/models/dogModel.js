import mongoose from "mongoose";

const dogSchema = new mongoose.Schema({
	name: { type: String, required: true },
	breed: { type: String, required: true },
	age: { type: Number, required: true },
	description: { type: String },
	interests: [String],
	location: {
		type: { type: String, enum: ["Point"], default: "Point" },
		coordinates: { type: [Number], required: true },
	},
	images: { type: [String], required: true },
	flagged: { type: Boolean, default: false }, // Flaga zgłoszenia
	flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Użytkownicy, którzy zgłosili psa
	flagReasons: [String], // Powody zgłoszenia
});

const Dog = mongoose.model("Dog", dogSchema);

export default Dog;
