var express = require("express");
var router = express.Router();

var User = require("../models/UserSchema");
// GET ROUTE DEFINITIONS

// Get a list of users
router.get("/api/v1/users", async (req, res) => {
    const users = await User.find();

    return res.json({ "users": users });
});
// Get a user's profile
router.get("/api/v1/users/:userId", async (req, res) => {
    const id = req.params.userId;
    const user = await User.findById(id).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    return res.json(user);
});

// Get a user's current settings
router.get("/api/v1/users/:userId/settings", async (req, res) => {
    const id = req.params.userId;
    const user = await User.findById(id).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    return res.json(user.settings);
});

// Get a list of users that a user follows
router.get("/api/v1/users/:userId/follows", async (req, res) => {
    const id = req.params.userId;
    const user = await User.findById(id)
        .populate("follows") // populate the "follows" field with user documents
        .catch(err => {
            res.status(404).json({
                "message": "No user found"
            });
        });
    const userFollows = user.follows
        .filter(followedUser => followedUser) // null check, in case of dangling references
        .map(followedUser => {
            return {
                "userID": followedUser.userID,
                "profilePicture": followedUser.profilePicture,
                "userName": followedUser.userName,
            };
        });

    return res.json({ "follows": userFollows });
});

// Get a list of a user's favorite drinks
router.get("/api/v1/users/:userId/favorites/drinks", async (req, res) => {
    const id = req.params.userId;
    const user = await User.findById(id)
        .populate("triedDrinks.drink") // populate the "drink" field
        .catch(err => {                // within "triedDrinks" with the drink documents
            res.status(404).json({     // based on the references
                "message": "No user found"
            });
        });
    const favoriteDrinks = user.triedDrinks
        .filter(triedDrink => triedDrink.favorite && triedDrink.drink) // check if favorite and not null
        .map(triedDrink => triedDrink.drink);

    return res.status(200).json({ "favoriteDrinks": favoriteDrinks });
});

// Get a user's favorite Systembolag store
router.get("/api/v1/users/:userId/favorites/systembolag", async (req, res) => {
    const id = req.params.userId;
    const user = await User.findById(id)
        .populate("favoriteSystembolag") // populate the "favoriteSystembolag" field
        .catch(err => {
            res.status(404).json({
                "message": "No user found"
            });
        });

    return res.status(200).json({ "favoriteSystembolag": user.favoriteSystembolag });
});

router.get("/api/v1/users/:userId/address", async (req, res) => {
    const id = req.params.userId;
    const user = await User.findById(id).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    const address = {
        "street": user.street,
        "streetNumber": user.streetNumber,
        "postalCode": user.postalCode,
        "city": user.city
    };

    return res.status(200).json(address);
});

router.get("/api/v1/users/:userId/drinks", async (req, res) => {
    // Logic to get drinks a user has tried
    const id = req.params.userId;
    const user = await User.findById(id)
        .populate("triedDrinks.drink") // populate the "drink" field
        .catch(err => {                // within "triedDrinks"
            res.status(404).json({
                "message": "No user found"
            });
        });
    const triedDrinks = user.triedDrinks
        .filter(triedDrink => triedDrink.drink) // null check in case of dangling references
        .map(triedDrink => triedDrink.drink);

    return res.status(200).json({ "triedDrinks": triedDrinks });
});


// POST ROUTE DEFINITIONS


// Sign up a new user
router.post("/api/v1/users", async (req, res, next) => {
    var newUser = new User({
        "userID": req.body.userID,
        "email": req.body.email,
        "profilePicture": req.body.profilePicture,
        "userName": req.body.userName,
        "street": req.body.street,
        "streetNumber": req.body.streetNumber,
        "postalCode": req.body.postalCode,
        "city": req.body.city,
        "longitude": req.body.longitude,
        "latitude": req.body.latitude,
    });
    await newUser.save().catch(err => { next(err) });

    return res.status(201).json(newUser);
});

// Create a new session (log in)
router.post("/api/v1/sessions", async (req, res) => {
    // TEMPORARY AUTHENTICATION LOGIC FOR DEMO PURPOSES ONLY
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return res.status(401).json({
            "message": "Authentication failed"
        });
    }

    return res.status(201).json({
        "message": "Logged in successfully",
        "user": user,
    });
});

// Follow a user
router.post("/api/v1/users/:userId/follows/:targetUserId", async (req, res) => {
    const targetId = req.params.targetUserId;

    const user = await User.findById(req.params.userId).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    // Avoid duplicate follows
    if (!user.follows.includes(targetId)) {
        user.follows.push(targetId);

        await user.save().catch(err => { next(err) });
    }

    return res.status(200).json(user);
});

// Favorite a drink
router.post("/api/v1/users/:userId/favorites/drinks/:drinkId", async (req, res) => {
    const user = await User.findById(req.params.userId).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    // Check if the drink is already in triedDrinks
    const existingEntry = user.triedDrinks.find(entry => entry.drink.toString() === req.params.drinkId);

    if (existingEntry) {
        existingEntry.favorite = true;
    } else {
        user.triedDrinks.push({
            drink: req.params.drinkId,
            favorite: true
        });
    }

    await user.save().catch(err => { next(err) });

    return res.status(200).json(user);
});

// Favorite a Systembolag store
router.post("/api/v1/users/:userId/favorites/systembolag/:systembolagId", async (req, res) => {
    // Logic to favorite a Systembolag store
});


// PATCH ROUTE DEFINITIONS


// Update user profile
router.patch("/api/v1/users/:userId", async (req, res, next) => {
    // Find the user to update
    const id = req.params.userId;
    const userToUpdate = await User.findById(id).catch(err => { next(err) });

    // Update only the fields provided in the request body
    userToUpdate.userID = (req.body.userID || userToUpdate.userID);
    userToUpdate.email = (req.body.email || userToUpdate.email);
    userToUpdate.profilePicture = (req.body.profilePicture || userToUpdate.profilePicture);
    userToUpdate.userName = (req.body.userName || userToUpdate.userName);
    userToUpdate.street = (req.body.street || userToUpdate.street);
    userToUpdate.streetNumber = (req.body.streetNumber || userToUpdate.streetNumber);
    userToUpdate.postalCode = (req.body.postalCode || userToUpdate.postalCode);
    userToUpdate.city = (req.body.city || userToUpdate.city);
    userToUpdate.longitude = (req.body.longitude || userToUpdate.longitude);
    userToUpdate.latitude = (req.body.latitude || userToUpdate.latitude);

    // Save the updated user to the database
    await userToUpdate.save().catch(err => { next(err) });

    return res.json(userToUpdate);
});

// Update user credentials (change email)
router.patch("/api/v1/users/:userId/credentials", async (req, res) => {
    const userToUpdate = await User.findById(req.params.userId).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    userToUpdate.email = (req.body.email || userToUpdate.email);

    await userToUpdate.save().catch(err => { next(err) });

    return res.json(userToUpdate);
});

// Update user settings
router.patch("/api/v1/users/:userId/settings", async (req, res) => {
    const userToUpdate = await User.findById(req.params.userId).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    userToUpdate.settings.darkMode = (req.body.darkMode !== undefined) ? req.body.darkMode : userToUpdate.settings.darkMode;
    userToUpdate.settings.notifications = (req.body.notifications !== undefined) ? req.body.notifications : userToUpdate.settings.notifications;
    userToUpdate.settings.language = (req.body.language || userToUpdate.settings.language);

    await userToUpdate.save().catch(err => { next(err) });

    return res.status(200).json(userToUpdate.settings);
});


// DELETE ROUTE DEFINITIONS


// Unfavorite a drink
router.delete("/api/v1/users/:userId/favorites/drinks/:drinkId", async (req, res) => {
    const user = await User.findById(
        req.params.userId,
        { $pull: { triedDrinks: { drink: req.params.drinkId } } }, // remove the drink from triedDrinks array
        { new: true } // return the updated document
    ).catch(err => {
        return res.status(404).json({
            "message": "No user found"
        });
    });

    return res.status(200).json(user);
});

// Unfavorite a Systembolag store
router.delete("/api/v1/users/:userId/favorites/systembolag/:systembolagId", async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.userId,
        { $set: { favoriteSystembolag: null } }, // set to null to indicate no favorite
        { new: true } // return the updated document
    ).catch(err => {
        return res.status(404).json({ "message": "No user found" });
    });

    return res.status(200).json(user);
});

// Unfollow a user
router.delete("/api/v1/users/:userId/follows/:targetUserId", async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.params.userId,
        { $pull: { follows: req.params.targetUserId } }, // remove the targetUserId from follows array
        { new: true } // return the updated document
    ).catch(err => {
        return res.status(404).json({ "message": "No user found" });
    });

    return res.status(200).json(user);
});

// Log out (delete current session)
router.delete("/api/v1/sessions/current", async (req, res) => {
    const user = await User.findById(req.params.userId).catch(err => {
        res.status(404).json({
            "message": "No user found"
        });
    });

    return res.status(200).json({
        "message": "Logged out successfully"
    });
});

// Delete a user's own account
router.delete("/api/v1/users/:userId", async (req, res, next) => {
    const id = req.params.userId;
    const deletedUser = await User.findByIdAndDelete(id).catch(err => { next(err) });

    return res.json(deletedUser);
});

// Delete all sessions (log out from all devices)
router.delete("/api/v1/sessions", async (req, res) => {
    return res.status(200).json({
        "message": "Logged out from all devices successfully"
    });
});

module.exports = router;
