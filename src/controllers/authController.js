import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

// Rejestracja użytkownika
export const registerUser = async (req, res) => {
	try {
		const { username, email, password } = req.body;

		// Hashowanie hasła
		const hashedPassword = await bcrypt.hash(password, 10);

		// Tworzenie nowego użytkownika
		const newUser = new User({
			username,
			email,
			password: hashedPassword,
		});

		await newUser.save();

		// Generowanie tokena JWT
		const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		res.status(201).json({
			message: "User registered successfully",
			token,
			user: {
				id: newUser._id,
				username: newUser.username,
				email: newUser.email,
			},
		});
	} catch (error) {
		console.error("Error during registration:", error.message);
		res.status(500).json({
			message: "Error during registration",
			error: error.message,
		});
	}
};

// Logowanie użytkownika
export const loginUser = async (req, res) => {
	const { email, password } = req.body;

	try {
		const user = await User.findOne({ email });
		if (!user) {
			return res.status(400).json({ message: "User not found" });
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return res.status(400).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		res.status(200).json({ token, user });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error during login", error: error.message });
	}
};
