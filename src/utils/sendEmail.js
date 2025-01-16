import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config(); // Ładuje zmienne środowiskowe z pliku .env

const sendEmail = async ({ email, subject, message }) => {
	const transporter = nodemailer.createTransport({
		service: "gmail", // Możesz zmienić na inny dostawca, np. SendGrid, Mailgun
		auth: {
			user: process.env.EMAIL_USER, // Dodaj swoje dane logowania
			pass: process.env.EMAIL_PASS, // Dodaj swoje dane logowania
		},
	});

	await transporter.sendMail({
		from: `"Dog Tinder" <${process.env.EMAIL_USER}>`,
		to: email,
		subject,
		text: message,
	});
};

export default sendEmail;
