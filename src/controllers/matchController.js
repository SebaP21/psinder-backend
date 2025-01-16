import User from "../models/userModel.js";

// Funkcja matchowania użytkowników
// Funkcja matchowania użytkowników
export const matchUsers = async (req, res) => {
	const { userId } = req.body; // Id użytkownika, z którym chcesz się "matchować"
	const loggedInUserId = req.user.id; // Id aktualnie zalogowanego użytkownika (pobrane z tokenu JWT)

	try {
		const loggedInUser = await User.findById(loggedInUserId);
		const userToMatch = await User.findById(userId);

		if (!loggedInUser || !userToMatch) {
			return res.status(404).json({ message: "User not found" });
		}

		// Dodajemy użytkownika do listy "matchów" obu użytkowników
		if (!loggedInUser.matches.includes(userId)) {
			loggedInUser.matches.push(userId);
			await loggedInUser.save();
		}

		if (!userToMatch.matches.includes(loggedInUserId)) {
			userToMatch.matches.push(loggedInUserId);
			await userToMatch.save();
		}

		res.status(200).json({ message: "Match successful" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error during match", error: error.message });
	}
};

// Wysyłanie wiadomości do matchowanego użytkownika
export const sendMessage = async (req, res) => {
	const { toUserId, content } = req.body; // ID użytkownika, do którego wysyłamy wiadomość

	const loggedInUserId = req.user.id;

	try {
		const loggedInUser = await User.findById(loggedInUserId);
		const recipientUser = await User.findById(toUserId);

		if (!loggedInUser || !recipientUser) {
			return res.status(404).json({ message: "User not found" });
		}

		// Sprawdzamy, czy użytkownicy się matchowali
		if (!loggedInUser.matches.includes(toUserId)) {
			return res
				.status(400)
				.json({ message: "You can only message matched users" });
		}

		// Tworzymy wiadomość
		const newMessage = {
			from: loggedInUserId,
			to: toUserId,
			content,
		};

		loggedInUser.messages.push(newMessage);
		recipientUser.messages.push(newMessage);

		await loggedInUser.save();
		await recipientUser.save();

		res.status(200).json({ message: "Message sent successfully" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error sending message", error: error.message });
	}
};
