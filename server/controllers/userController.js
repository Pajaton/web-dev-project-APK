var express = require("express");
var session = require("express-session");
var bcrypt = require('bcrypt');
var router = express.Router();

var User = require("../models/UserSchema");
const Systembolag = require("../models/SystembolagSchema.js")
// GET ROUTE DEFINITIONS

// Get a list of users
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

// Get a user's profile
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
                    "userID": followedUser._id,
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
    try {
        const user = await User
            .findById(req.params.userId)
            .populate("favoriteSystembolag"); // populate the "favoriteSystembolag" field

        if (!user.favoriteSystembolag) {
            return res.status(404).json({ "favoriteSystembolag": undefined });
        }
        return res.json({ "favoriteSystembolag": user.favoriteSystembolag });
    } catch(err) { next(err) };
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


// POST ROUTE DEFINITIONS


// Sign up a new user
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

// Create a new session (log in)
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

// PATCH ROUTE DEFINITIONS

// Follow a user
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

// Add a tried drink to a user's profile
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

// Favorite a drink
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

// Favorite a Systembolag store
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

// Update user profile
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

// Update user settings
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


// DELETE ROUTE DEFINITIONS


// Unfavorite a drink
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

// Unfavorite a Systembolag store
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

// Unfollow a user
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

// Delete a user's own account
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

// Log out (delete current session)
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

// Delete all sessions (log out everyone from all devices)
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
