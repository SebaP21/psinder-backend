import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import Dog from "../models/dogModel.js";
import { authMiddleware } from "../middleware/authMiddleware.js"; // Import middleware
import { searchDogs } from "../controllers/dogController.js";
import { flagDog, getFlaggedDogs } from "../controllers/dogController.js";
import dotenv from "dotenv";

dotenv.config();
// Konfiguracja Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware do przesyłania plików
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// Endpoint do wyszukiwania psów
router.get("/search-dogs", searchDogs);

/**
 * Dodanie nowego psa (chronione)
 * POST /api/dogs/add
 */
router.post(
	"/add",
	authMiddleware,
	upload.array("images", 3),
	async (req, res, next) => {
		try {
			const { name, breed, age, description, interests, location } = req.body;
			const imageUrls = [];

			// Przesyłanie obrazów do Cloudinary
			const uploadPromises = req.files.map(async (file) => {
				const result = await cloudinary.uploader.upload(file.path, {
					folder: "dogs_tinder",
					transformation: [
						{
							width: 800,
							height: 800,
							crop: "limit",
							fetch_format: "auto",
							quality: "auto",
						},
					],
				});
				imageUrls.push(result.secure_url);

				// Usuń plik lokalny
				fs.unlink(file.path, (err) => {
					if (err) console.error("Error deleting local file", err);
				});
			});

			await Promise.all(uploadPromises);

			const newDog = new Dog({
				name,
				breed,
				age,
				description,
				interests: interests ? interests.split(",") : [],
				location: JSON.parse(location),
				images: imageUrls,
			});

			await newDog.save();
			res.status(201).json(newDog);
		} catch (error) {
			next(error);
		}
	}
);

/**
 * Edytowanie istniejącego psa (chronione)
 * PUT /api/dogs/edit/:id
 */
router.put(
	"/edit/:id",
	authMiddleware,
	upload.array("images", 3),
	async (req, res, next) => {
		try {
			const { name, breed, age, description, interests, location } = req.body;
			const imageUrls = [];

			if (req.files.length > 0) {
				for (const file of req.files) {
					const result = await cloudinary.uploader.upload(file.path, {
						folder: "dogs_tinder",
					});
					imageUrls.push(result.secure_url);
					fs.unlinkSync(file.path);
				}
			}

			const updatedDog = await Dog.findByIdAndUpdate(
				req.params.id,
				{
					name,
					breed,
					age,
					description,
					interests: interests ? interests.split(",") : [],
					location: JSON.parse(location),
					...(imageUrls.length > 0 && { images: imageUrls }),
				},
				{ new: true }
			);

			if (!updatedDog)
				return res.status(404).json({ message: "Dog not found" });

			res.json(updatedDog);
		} catch (error) {
			next(error);
		}
	}
);

/**
 * Usuwanie psa (chronione)
 * DELETE /api/dogs/:id
 */
router.delete("/:id", authMiddleware, async (req, res, next) => {
	try {
		const deletedDog = await Dog.findByIdAndDelete(req.params.id);
		if (!deletedDog) return res.status(404).json({ message: "Dog not found" });
		res.json({ message: "Dog deleted successfully" });
	} catch (error) {
		next(error);
	}
});

/**
 * Pobieranie listy psów (ogólnodostępne)
 * GET /api/dogs/
 */
router.get("/", async (req, res, next) => {
	try {
		const dogs = await Dog.find();
		res.json(dogs);
	} catch (error) {
		next(error);
	}
});

/**
 * Pobieranie szczegółów psa (ogólnodostępne)
 * GET /api/dogs/:id
 */
router.get("/:id", async (req, res, next) => {
	try {
		const dog = await Dog.findById(req.params.id);
		if (!dog) return res.status(404).json({ message: "Dog not found" });
		res.json(dog);
	} catch (error) {
		next(error);
	}
});

// Route do flagowania psa
router.post("/:dogId/flag", flagDog);

// Route do pobierania zgłoszonych psów (dla administratora)
router.get("/flagged", getFlaggedDogs);

export default router;
