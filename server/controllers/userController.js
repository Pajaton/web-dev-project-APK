var express = require("express");
var session = require("express-session");
var bcrypt = require('bcrypt');
var router = express.Router();

var User = require("../models/UserSchema");
const Systembolag = require("../models/SystembolagSchema.js")

/**
 * @route GET /users
 * @description Retrieves a list of all users.
 * @returns {Object} 200 - Object containing array of users and HATEOAS links.
 * @returns {Object} 404 - No users found.
 */
router.get("/users", async (req, res, next) => {
    try {
        const users = await User
            .find();
        if (users.length === 0) {
            return res.status(404).json({"message": "No users was found"});
        }
        
        return res.json({ 
            "users": users,
            "_links": {
                "self": "/users",
                "create": { "url": "/users", "method": "POST" }
            }
        });
    } catch(err) { next(err) };
});

/**
 * @route GET /users/:userId
 * @description Retrieves a user's profile by ID with HATEOAS links.
 * @param {string} userId - The ID of the user.
 * @returns {Object} 200 - User object with _links for related resources.
 * @returns {Object} 404 - User not found.
 */
router.get("/users/:userId", async (req, res, next) => {
    try {
        const user = await User
            .findById(req.params.userId);
        if (!user) {
            return res.status(404).json({"message": "User was not found"});
        }

        // Convert Mongoose document to plain object for addition of "_links"
        const userObject = user.toObject();

        userObject._links = {
            self: `/users/${userObject._id}`,
            update: { url: `/users/${userObject._id}`, method: "PATCH" },
            delete: { url: `/users/${userObject._id}`, method: "DELETE" },
            follows: `/users/${userObject._id}/follows`,
            favoritesDrinks: `/users/${userObject._id}/favorites/drinks`,
            favoritesSystembolag: `/users/${userObject._id}/favorites/systembolag`,
            settings: `/users/${userObject._id}/settings`,
            drinks: `/users/${userObject._id}/drinks`
        };

        return res.json(userObject);
    } catch(err) { next(err) };
});

/**
 * @route GET /users/:userId/follows
 * @description Retrieves a list of users that the specified user follows.
 * @param {string} userId - The ID of the user.
 * @returns {Object} 200 - Object containing array of followed users (userID, profilePicture, userName).
 * @returns {Object} 404 - User not found.
 */
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
                    "userID": followedUser._id,
                    "profilePicture": followedUser.profilePicture,
                    "userName": followedUser.userName,
                };
            });
        return res.json({ "follows": userFollows });
    } catch(err) { next(err) };
});

/**
 * @route GET /users/:userId/favorites/drinks
 * @description Retrieves a list of a user's favorite drinks.
 * @param {string} userId - The ID of the user.
 * @returns {Object} 200 - Object containing array of favorite drinks.
 * @returns {Object} 404 - User not found or user has no favorite drinks.
 */
router.get("/users/:userId/favorites/drinks", async (req, res, next) => {
    try{
        const user = await User
            .findById(req.params.userId)
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

/**
 * @route GET /users/:userId/favorites/systembolag
 * @description Retrieves a user's favorite Systembolaget store.
 * @param {string} userId - The ID of the user.
 * @returns {Object} 200 - Object containing the favorite Systembolag or undefined.
 * @returns {Object} 404 - User not found.
 */
router.get("/users/:userId/favorites/systembolag", async (req, res, next) => {
    try {
        const user = await User
            .findById(req.params.userId)
            .populate("favoriteSystembolag"); // populate the "favoriteSystembolag" field
        if (!user) {
            return res.status(404).json({"message": "User was not found"})
        }
        if (!user.favoriteSystembolag) {
            return res.json({ "favoriteSystembolag": undefined });
        }
        return res.json({ "favoriteSystembolag": user.favoriteSystembolag });
    } catch(err) { next(err) };
});

/**
 * @route GET /users/:userId/drinks
 * @description Retrieves all drinks a user has tried.
 * @param {string} userId - The ID of the user.
 * @returns {Object} 200 - Object containing array of tried drinks.
 * @returns {Object} 404 - User has not tried any drinks.
 */
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

/**
 * @route GET /users/:userId/alcoholConsumed
 * @description Retrieves a user's alcohol consumption history.
 * @param {string} userId - The ID of the user.
 * @returns {Object} 200 - Object containing userId, alcoholConsumed array, and timestamp.
 * @returns {Object} 404 - User not found.
 */
router.get("/users/:userId/alcoholConsumed", async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({"message":"No user found"});
        }

        res.json({
            userId: user._id,
            alcoholConsumed: user.alcoholConsumed,
            timestamp: user.timstamp
        });
    } catch(err) { next(err) };
});

/**
 * @route GET /sessions/currentlyLoggedin
 * @description Checks if a user is currently logged in and returns their data.
 * @returns {Object} 200 - Object containing the logged-in user.
 * @returns {Object} 401 - Not logged in.
 */
router.get('/sessions/currentlyLoggedin', async (req, res, next) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ message: 'Not logged in' });
        }

    const user = await User.findById(req.session.userId);
        return res.json({ user });
    } catch (err) {
        next(err);
    }
});

/**
 * @route GET /guest-sessions
 * @description Checks if a guest user has confirmed their age.
 * @returns {Object} 200 - Object containing ageConfirmed boolean.
 */
router.get(`/guest-sessions`, function(req, res) {
    const ageConfirmed = req.session.ageConfirmed;

    return res.json({ 'ageConfirmed': ageConfirmed });
});

/**
 * @route POST /users
 * @description Creates a new user account with hashed password.
 * @body {string} email - User's email address.
 * @body {string} [profilePicture] - URL to profile picture.
 * @body {string} userName - Username.
 * @body {string} password - Password (will be hashed).
 * @body {string} [street] - Street name.
 * @body {string} [streetNumber] - Street number.
 * @body {string} [postalCode] - Postal code.
 * @body {string} [city] - City name.
 * @body {number} [longitude] - Longitude coordinate.
 * @body {number} [latitude] - Latitude coordinate.
 * @returns {Object} 201 - The created user object.
 */
router.post("/users", async (req, res, next) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 5); // 5 is the salt rounds parameter

        const newUser = new User({
            "email": req.body.email,
            "profilePicture": req.body.profilePicture,
            "userName": req.body.userName,
            "password": hashedPassword,
            "street": req.body.street,
            "streetNumber": req.body.streetNumber,
            "postalCode": req.body.postalCode,
            "city": req.body.city,
            "longitude": req.body.longitude,
            "latitude": req.body.latitude,
        });
        await newUser.save();
        return res.status(201).json(newUser);
    } catch(err) { next(err) };
    });

/**
 * @route POST /sessions
 * @description Authenticates a user and creates a new session (login).
 * @body {string} email - User's email address.
 * @body {string} password - User's password.
 * @returns {Object} 201 - Login successful with user ID.
 * @returns {Object} 401 - Authentication failed or invalid password.
 */
router.post("/sessions", async (req, res, next) => {
    // TEMPORARY AUTHENTICATION LOGIC FOR DEMO PURPOSES ONLY
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(401).json({
                "message": "Authentication failed"
            });
        }
        
        console.log(user.password)

        const passOk = await bcrypt.compare(req.body.password, user.password);
        console.log(passOk);
        if (!passOk) {
          return res.status(401).json({
            "message": "Invalid password"
          });
        }

        req.session.userId = user._id.toString();
        req.session.save();

        return res.status(201).json({
            "message": "Logged in successfully",
            "user": req.session.userId,
        });
    } catch(err) { next(err) };
});

/**
 * @route POST /guest-sessions
 * @description Confirms age for a guest user session.
 * @returns {Object} 200 - Age confirmation success message.
 */
router.post(`/guest-sessions`, function(req, res) {
    req.session.ageConfirmed = true;
    return res.json({ 'message': 'Age confirmed for session' });
});

/**
 * @route POST /users/:userId/alcoholConsumed
 * @description Adds an alcohol consumption entry to a user's history.
 * @param {string} userId - The ID of the user.
 * @body {number} volume - Volume of alcohol consumed in ml.
 * @body {number} percent - Alcohol percentage.
 * @returns {Object} 201 - The created consumption entry.
 * @returns {Object} 404 - User not found.
 */
router.post("/users/:userId/alcoholConsumed", async (req, res, next) => {
    try {
        //Could possibly add some data error fault handling in case the server receives the wrong 
        //data type, even if the frontend enforces correct data type input
        const userId = req.params.userId;
        const {volume, percent} = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({"message":"No user found"});
            }

        user.alcoholConsumed.push({
                volume,
                percent
        });

        await user.save().catch(err=>{next(err)});

        res.status(201).json({
                volume: volume,
                percent: percent
        });
    } catch(err) { next(err) };
});

/**
 * @route PATCH /users/:userId/follows/:targetUserId
 * @description Adds a user to the follows list (follow a user).
 * @param {string} userId - The ID of the user who is following.
 * @param {string} targetUserId - The ID of the user to follow.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 400 - Users cannot follow themselves.
 * @returns {Object} 404 - User not found.
 */
router.patch("/users/:userId/follows/:targetUserId", async (req, res, next) => {
    try {
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
        if (!user || !req.params.targetUserId) {
            return res.status(404).json({"message": "User was not found"});
        } 

        return res.json(user); 
    } catch(err) { next(err) };      
});

/**
 * @route PATCH /users/:userId/drinks/:drinkId
 * @description Adds a drink to a user's tried drinks list.
 * @param {string} userId - The ID of the user.
 * @param {string} drinkId - The ID of the drink to add.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 404 - User or drink not found.
 */
router.patch("/users/:userId/drinks/:drinkId", async (req, res, next) => {
    try {
        const user = await User
            .findByIdAndUpdate(
                req.params.userId,
                { $addToSet: {
                    triedDrinks: {
                        drink: req.params.drinkId,
                        favorite: false
                    }}},
                { new: true }); // return the updated document
        if (!user) { 
            return res.status(404).json({"message": "User was not found"});
        } 
        else if (!req.params.drinkId) {
            return res.status(404).json({"message": "Drink was not found"});
        }
        return res.json(user);
    } catch(err) { next(err) };
});

/**
 * @route PATCH /users/:userId/favorites/drinks/:drinkId
 * @description Marks a drink as favorite for a user.
 * @param {string} userId - The ID of the user.
 * @param {string} drinkId - The ID of the drink to favorite.
 * @returns {Object} 200 - Object containing array of favorite drinks.
 * @returns {Object} 404 - User or drink not found.
 */
router.patch("/users/:userId/favorites/drinks/:drinkId", async (req, res, next) => {
    try {
        const user = await User
            .findByIdAndUpdate(req.params.userId);
        if (!user) {
            return res.status(404).json({"message": "User was not found"});
        }    

        // Check if the drink is already in triedDrinks
        const existingEntry = user.triedDrinks
            .find(entry => entry.drink.toString() === req.params.drinkId);
        if (!req.params.drinkId) {
            return res.status(404).json({"message": "Drink was not found"});
        }
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
    } catch(err) { next(err) };
});

/**
 * @route PUT /users/:userId/favorites/systembolag/:systembolagId
 * @description Sets a Systembolaget store as a user's favorite.
 * @param {string} userId - The ID of the user.
 * @param {string} systembolagId - The Systembolag ID to favorite.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 404 - User or Systembolag not found.
 */
router.put("/users/:userId/favorites/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const systembolagToFavorite = await Systembolag.findOne({ systembolagID: req.params.systembolagId })

        if (!systembolagToFavorite) {
          return res.status(404).json({"message": "Systembolag not found" })
        }

        const user = await User
            .findByIdAndUpdate(
                req.params.userId,
                { $set: { favoriteSystembolag: systembolagToFavorite._id } }, // set the favoriteSystembolag field
                { new: true });
        if (!user) {
          console.log(":)")
            return res.status(404).json({"message": "User was not found"});
        }

        return res.json(user);
    } catch(err) { next(err) };
});

/**
 * @route PATCH /users/:userId
 * @description Partially updates a user's profile.
 * @param {string} userId - The ID of the user to update.
 * @body {string} [email] - User's email address.
 * @body {string} [profilePicture] - URL to profile picture.
 * @body {string} [userName] - Username.
 * @body {string} [street] - Street name.
 * @body {string} [streetNumber] - Street number.
 * @body {string} [postalCode] - Postal code.
 * @body {string} [city] - City name.
 * @body {number} [longitude] - Longitude coordinate.
 * @body {number} [latitude] - Latitude coordinate.
 * @body {Object} [settings] - User settings object.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 404 - User not found.
 */
router.patch("/users/:userId", async (req, res, next) => {
    // Find the user to update
    try {
        const userToUpdate = await User
            .findById(req.params.userId)
        if (!userToUpdate) {
            return res.status(404).json({"message": "User was not found"});
        }

        // Update only the fields provided in the request body
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
    } catch(err) { next(err) };
}); 

/**
 * @route PATCH /users/:userId/settings
 * @description Updates a user's settings.
 * @param {string} userId - The ID of the user.
 * @body {boolean} [darkMode] - Enable/disable dark mode.
 * @body {boolean} [notifications] - Enable/disable notifications.
 * @body {string} [language] - Preferred language.
 * @returns {Object} 200 - The updated settings object.
 * @returns {Object} 404 - User not found.
 */
router.patch("/users/:userId/settings", async (req, res, next) => {
    try{
        const userToUpdate = await User
            .findById(req.params.userId);
        if (!userToUpdate) {
            return res.status(404).json({"message": "User was not found"})
        }

        userToUpdate.settings.darkMode = (req.body.darkMode !== undefined) ? req.body.darkMode : userToUpdate.settings.darkMode;
        userToUpdate.settings.notifications = (req.body.notifications !== undefined) ? req.body.notifications : userToUpdate.settings.notifications;
        userToUpdate.settings.language = (req.body.language || userToUpdate.settings.language);

        await userToUpdate.save().catch(err => { next(err) });

        return res.json(userToUpdate.settings);
    } catch(err) { next(err) };
});

/**
 * @route DELETE /users/:userId/favorites/drinks/:drinkId
 * @description Removes a drink from a user's tried drinks list.
 * @param {string} userId - The ID of the user.
 * @param {string} drinkId - The ID of the drink to remove.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 404 - User or drink not found.
 */
router.delete("/users/:userId/favorites/drinks/:drinkId", async (req, res, next) => {
try {
        const user = await User
            .findByIdAndUpdate(
                req.params.userId,
                { $pull: {
                    triedDrinks: {
                        drink: req.params.drinkId
                    }}}, // remove the drink from triedDrinks array
                { new: true }); // return the updated document
            if (!user) {
                return res.status(404).json({"message": "User was not found"})
            }
            else if (!req.params.drinkId) {
                return res.status(404).json({"message": "Drink was not found"});
            }
        return res.json(user);
    } catch(err) { next(err) };
});

/**
 * @route DELETE /users/:userId/favorites/systembolag/:systembolagId
 * @description Removes a user's favorite Systembolaget store.
 * @param {string} userId - The ID of the user.
 * @param {string} systembolagId - The ID of the Systembolag to unfavorite.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 404 - User or Systembolag not found.
 */
router.delete("/users/:userId/favorites/systembolag/:systembolagId", async (req, res, next) => {
    try {
        const user = await User
            .findByIdAndUpdate(
                req.params.userId,
                { $set: { favoriteSystembolag: null } }, // set to null to indicate no favorite
                { new: true } // return the updated document
            );
            if (!user) {
                return res.status(404).json({"message": "user was not found"})
            }
            else if (!req.params.systembolagId) {
                return res.status(404).json({"message": "Systembolag was not found"});
            }
        return res.json(user);
    } catch(err) { next(err) };
});

/**
 * @route DELETE /users/:userId/follows/:targetUserId
 * @description Removes a user from the follows list (unfollow).
 * @param {string} userId - The ID of the user who is unfollowing.
 * @param {string} targetUserId - The ID of the user to unfollow.
 * @returns {Object} 200 - The updated user object.
 * @returns {Object} 404 - User not found.
 */
router.delete("/users/:userId/follows/:targetUserId", async (req, res, next) => {
    try {
        const user = await User
            .findByIdAndUpdate(
                req.params.userId,
                { $pull: { follows: req.params.targetUserId } }, // remove the targetUserId from follows array
                { new: true })
        if (!user || !req.params.targetUserId) {
                return res.status(404).json({"message": "user was not found"})
            }
    return res.json(user);
    } catch(err) { next(err) };
});

/**
 * @route DELETE /users/:userId
 * @description Deletes a user's account.
 * @param {string} userId - The ID of the user to delete.
 * @returns {Object} 200 - The deleted user object.
 * @returns {Object} 404 - User not found.
 */
router.delete("/users/:userId", async (req, res, next) => {
    try {    
        const deletedUser = await User
            .findByIdAndDelete(req.params.userId)
        if (!deletedUser) {
            return res.status(404).json({"message": "user was not found"})
        }
        return res.json(deletedUser);
    } catch(err) { next(err) };
});

/**
 * @route DELETE /sessions/:userId
 * @description Logs out a user by destroying their session.
 * @param {string} userId - The ID of the user to log out.
 * @returns {Object} 200 - Logout success message with user data.
 * @returns {Object} 404 - User not found.
 */
router.delete("/sessions/:userId", async (req, res, next) => {
   try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({"message": "user was not found"});
        }

        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
        
            return res.json({
                "message": "Logged out successfully",
                "user": user
            });
        });
    } catch(err) { next(err) };
});

/**
 * @route DELETE /sessions
 * @description Logs out all users by clearing all sessions. Use with caution.
 * @returns {Object} 200 - Success message.
 * @returns {Object} 500 - Error clearing sessions.
 */
router.delete("/sessions", (req, res) => {
    req.sessionStore.clear((err) => {
        if (err) {
            return res.status(500).json({
                "message": "Error logging out everyone from all devices"
            });
        }

        return res.json({
            "message": "Logged out from all devices successfully"
        });
    });
});

module.exports = router;
