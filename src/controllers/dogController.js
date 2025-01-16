import Dog from "../models/dogModel.js";

// Funkcja do wyszukiwania psów
export const searchDogs = async (req, res) => {
	const { breed, age, interests, location, description } = req.query;

	try {
		const filter = {};

		// Filtrowanie po rasie
		if (breed) filter.breed = breed;

		// Filtrowanie po wieku
		if (age) filter.age = age;

		// Filtrowanie po zainteresowaniach (interests)
		if (interests) filter.interests = { $in: interests.split(",") };

		// Filtrowanie po lokalizacji
		if (location) {
			const [lat, lon] = location.split(",");
			filter.location = {
				$near: {
					$geometry: {
						type: "Point",
						coordinates: [parseFloat(lon), parseFloat(lat)],
					},
					$maxDistance: 5000, // Odległość w metrach (np. 5 km)
				},
			};
		}

		// Filtrowanie po opisie (description)
		if (description)
			filter.description = { $regex: description, $options: "i" }; // 'i' - ignorowanie wielkości liter

		// Wyszukiwanie psów
		const dogs = await Dog.find(filter);

		if (!dogs || dogs.length === 0) {
			return res.status(404).json({ message: "No dogs found" });
		}

		res.status(200).json(dogs);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error searching dogs", error: error.message });
	}
};

// dogController.js
import Dog from "../models/dogModel.js";

// Funkcja flagowania psa
export const flagDog = async (req, res) => {
	const { dogId } = req.params; // ID psa
	const { userId, reason } = req.body; // ID użytkownika i powód zgłoszenia

	try {
		const dog = await Dog.findById(dogId);
		if (!dog) {
			return res.status(404).json({ message: "Dog not found" });
		}

		// Dodajemy powód flagowania do psa
		dog.flagged = true;
		dog.flaggedBy.push(userId);
		dog.flagReasons.push(reason);
		await dog.save();

		res.status(200).json({ message: "Dog flagged successfully" });
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error flagging dog", error: error.message });
	}
};

// Endpoint do przeglądania zgłoszonych psów (dla administratora)
export const getFlaggedDogs = async (req, res) => {
	try {
		const flaggedDogs = await Dog.find({ flagged: true });
		res.status(200).json(flaggedDogs);
	} catch (error) {
		res
			.status(500)
			.json({ message: "Error fetching flagged dogs", error: error.message });
	}
};
