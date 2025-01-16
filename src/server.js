import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dogRoutes from "./routes/dogRoutes.js"; // Importuj dogRoutes
import userRoutes from "./routes/userRoutes.js"; // Importuj userRoutes
import http from "http"; // Dodajemy http, by obsługiwać WebSocket
import { Server } from "socket.io"; // Poprawny import z 'socket.io'

dotenv.config(); // Załaduj zmienne środowiskowe z pliku .env

const app = express();

// Tworzymy serwer HTTP
const server = http.createServer(app);

// Tworzymy instancję WebSocket za pomocą 'Server' z socket.io
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json());

// Połączenie z MongoDB
mongoose
	.connect(process.env.MONGO_URI)
	.then(() => console.log("Connected to MongoDB"))
	.catch((err) => console.error("MongoDB connection error: ", err));

// Ruter API
app.use("/api/dogs", dogRoutes); // Używaj dogRoutes do obsługi ścieżek
app.use("/api/users", userRoutes); // Używaj userRoutes do obsługi użytkowników
app.use("/api/messages", messageRoutes);

// Obsługa WebSocket
io.on("connection", (socket) => {
	console.log("New client connected");

	// Obsługa wiadomości
	socket.on("send_message", (messageData) => {
		const { from, to, content } = messageData;
		console.log("Received message:", content);

		// Wysyłanie wiadomości do odbiorcy
		io.to(to).emit("new_message", { from, content });
	});

	// Obsługa rozłączenia
	socket.on("disconnect", () => {
		console.log("Client disconnected");
	});
});

// Obsługa błędów
app.use((err, req, res, next) => {
	console.error(err.stack);
	res
		.status(500)
		.send({ message: "Something went wrong!", error: err.message });
});

// Startowanie serwera
const port = process.env.PORT || 5000;
server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
