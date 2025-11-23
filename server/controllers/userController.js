var express = require("express");
var router = express.Router();

var User = require("../models/UserSchema");
// GET ROUTE DEFINITIONS

// Get a list of users
router.get("/users", async (req, res, next) => {
    const users = await User
        .find()
        .catch(err => { next(err) });

    return res.json({ 
        "users": users,
        "_links": {
            "self": "/users",
            "create": { "url": "/users", "method": "POST" }
        }
    });
});

// Get a user's profile
router.get("/users/:userId", async (req, res, next) => {
    try {
        const user = await User
            .findById(req.params.userId);
        if (!user) {
            return res.status(404).json({"message": "User was not found"});
        }
        return res.json(user);
    } catch(err) { next(err) };
});

// Get a list of users that a user follows
router.get("/users/:userId/follows", async (req, res, next) => {
    try {
        const user = await User
            .findById(req.params.userId)
            .populate("follows"); // populate the "follows" field with user documents
        if (!user) {
            return res.status(404).json({"message": "User was not found"})
        }
        const userFollows = user.follows
            .filter(followedUser => followedUser)
            .map(followedUser => {
                return {
                    "userID": followedUser.userID,
                    "profilePicture": followedUser.profilePicture,
                    "userName": followedUser.userName,
                };
            });
        if (userFollows.length === 0) {
            return res.status(404).json({"message": "User does not follow any other users"});
        }
        return res.json({ "follows": userFollows });
    } catch(err) { next(err) };
});

// Get a list of a user's favorite drinks
router.get("/users/:userId/favorites/drinks", async (req, res, next) => {
    try{
        const user = await User
            .findById(req.params.userId)
            .where("triedDrinks.favorite")
            .populate("triedDrinks.drink") // populate the "drink" field
        if (!user) {
            return res.status(404).json({"message": "User was not found"})
        }
        const favoriteDrinks = user.triedDrinks
            .filter(entry => entry.favorite)
            .map(entry => entry.drink);
        if (favoriteDrinks.length === 0) {
            return res.status(404).json({"message": "User has no favorite drinks"});
        }
        return res.json({ "favoriteDrinks": favoriteDrinks });
    } catch(err) { next(err) };
});

// Get a user's favorite Systembolag store
router.get("/users/:userId/favorites/systembolag", async (req, res, next) => {
    const user = await User
        .findById(req.params.userId)
        .populate("favoriteSystembolag") // populate the "favoriteSystembolag" field
        .catch(err => { next(err) });

    if (!user.favoriteSystembolag) {
        return res.status(404).json({ "favoriteSystembolag": undefined });
    }
    return res.json({ "favoriteSystembolag": user.favoriteSystembolag });
});

router.get("/users/:userId/drinks", async (req, res, next) => {
    try {
        const user = await User
            .findById(req.params.userId)
            .populate("triedDrinks.drink"); // populate the "drink" field
        if (user.triedDrinks.length === 0) {
            return res.status(404).json({"message": "User has not tried any drinks"});
        } 
        return res.json({ "triedDrinks": user.triedDrinks });
    } catch(err) { next(err) };
});


// POST ROUTE DEFINITIONS


// Sign up a new user
router.post("/users", async (req, res, next) => {
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
router.post("/sessions", async (req, res) => {
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

// PATCH ROUTE DEFINITIONS

// Follow a user
router.patch("/users/:userId/follows/:targetUserId", async (req, res, next) => {
    if (req.params.userId === req.params.targetUserId) {
        return res.status(400).json({
            "message": "Users cannot follow themselves"
        });
    }
    
    const user = await User
        .findByIdAndUpdate(
            req.params.userId,
            { $addToSet: { follows: req.params.targetUserId } },
            { new: true }) // return the updated document
        .catch(err => { next(err) });

    return res.json(user);
});

// Add a tried drink to a user's profile
router.patch("/users/:userId/drinks/:drinkId", async (req, res, next) => {
    const user = await User
        .findByIdAndUpdate(
            req.params.userId,
            { $addToSet: {
                triedDrinks: {
                    drink: req.params.drinkId,
                    favorite: false
                }}},
            { new: true }) // return the updated document
        .catch(err => { next(err) });

    return res.json(user);
});

// Favorite a drink
router.patch("/users/:userId/favorites/drinks/:drinkId", async (req, res, next) => {
    const user = await User
        .findByIdAndUpdate(req.params.userId)
        .catch(err => { next(err) });

    // Check if the drink is already in triedDrinks
    const existingEntry = user.triedDrinks
        .find(entry => entry.drink.toString() === req.params.drinkId);

    if (existingEntry) {
        existingEntry.favorite = true;
    } else {
        user.triedDrinks.push({
            drink: req.params.drinkId,
            favorite: true
        });
    }

    const favoriteEntries = user.triedDrinks
        .filter(entry => entry.favorite)
        .map(entry => {
            return {
                "drink": entry.drink,
                "favorite": entry.favorite
            };
        });

    await user.save().catch(err => { next(err) });

    return res.json({ "favoriteDrinks": favoriteEntries });
});

// Favorite a Systembolag store
router.patch("/users/:userId/favorites/systembolag/:systembolagId", async (req, res, next) => {
    const user = await User
        .findByIdAndUpdate(
            req.params.userId,
            { $set: { favoriteSystembolag: req.params.systembolagId } }, // set the favoriteSystembolag field
            { new: true })
        .catch(err => { next(err) });

    return res.json(user);
});

// Update user profile
router.patch("/users/:userId", async (req, res, next) => {
    // Find the user to update
    const userToUpdate = await User
        .findById(req.params.userId)
        .catch(err => { next(err) });

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

    userToUpdate.settings = (req.body.settings || userToUpdate.settings);

    // Save the updated user to the database
    await userToUpdate.save().catch(err => { next(err) });

    return res.json(userToUpdate);
});

// Update user settings
router.patch("/users/:userId/settings", async (req, res, next) => {
    const userToUpdate = await User
        .findById(req.params.userId)
        .catch(err => { next(err) });

    userToUpdate.settings.darkMode = (req.body.darkMode !== undefined) ? req.body.darkMode : userToUpdate.settings.darkMode;
    userToUpdate.settings.notifications = (req.body.notifications !== undefined) ? req.body.notifications : userToUpdate.settings.notifications;
    userToUpdate.settings.language = (req.body.language || userToUpdate.settings.language);

    await userToUpdate.save().catch(err => { next(err) });

    return res.json(userToUpdate.settings);
});


// DELETE ROUTE DEFINITIONS


// Unfavorite a drink
router.delete("/users/:userId/favorites/drinks/:drinkId", async (req, res, next) => {
    const user = await User
        .findByIdAndUpdate(
            req.params.userId,
            { $pull: {
                triedDrinks: {
                    drink: req.params.drinkId
                }}}, // remove the drink from triedDrinks array
            { new: true }) // return the updated document
        .catch(err => { next(err) });

    return res.json(user);
});

// Unfavorite a Systembolag store
router.delete("/users/:userId/favorites/systembolag/:systembolagId", async (req, res, next) => {
    const user = await User
        .findByIdAndUpdate(
            req.params.userId,
            { $set: { favoriteSystembolag: null } }, // set to null to indicate no favorite
            { new: true } // return the updated document
        )
        .catch(err => { next(err) });

    return res.json(user);
});

// Unfollow a user
router.delete("/users/:userId/follows/:targetUserId", async (req, res, next) => {
    const user = await User
        .findByIdAndUpdate(
            req.params.userId,
            { $pull: { follows: req.params.targetUserId } }, // remove the targetUserId from follows array
            { new: true })
        .catch(err => { next(err) });

    return res.json(user);
});

// Log out (delete current session)
router.delete("/sessions/:userId", async (req, res, next) => {
    // TEMPORARY LOGOUT LOGIC FOR DEMO PURPOSES ONLY
    const user = await User
        .findById(req.params.userId)
        .catch(err => { next(err) });

    return res.json({
        "message": "Logged out successfully",
        "user": user
    });
});

// Delete a user's own account
router.delete("/users/:userId", async (req, res, next) => {
    const deletedUser = await User
        .findByIdAndDelete(req.params.userId)
        .catch(err => { next(err) });

    return res.json(deletedUser);
});

// Delete all sessions (log out from all devices)
router.delete("/sessions", async (req, res) => {
    return res.json({
        "message": "Logged out from all devices successfully"
    });
});

module.exports = router;
