import { Router } from "express";

const router = Router();

// GET ROUTE DEFINITIONS

// Get a user's profile
router.get("/users/:userId", async (req, res) => {
    // Logic to get user profile
});

// Get a user's current settings
router.get("/users/:userId/settings", async (req, res) => {
    // Logic to get user settings
});

// Get a list of users that a user follows
router.get("/users/:userId/follows", async (req, res) => {
    // Logic to get list of followed users
});

// Get a list of a user's favorite drinks
router.get("/users/:userId/favorites/drinks", async (req, res) => {
    // Logic to get list of favorite drinks
});

// Get a list of a user's favorite Systembolag stores
router.get("/users/:userId/favorites/systembolag", async (req, res) => {
    // Logic to get list of favorite Systembolag stores
});

router.get("/users/:userId/locations", async (req, res) => {
    // Logic to get list of user's saved locations
});

router.get("/users/:userId/locations/:locationId", async (req, res) => {
    // Logic to get details of a specific saved location
});

router.get("/users/:userId/drinks", async (req, res) => {
    // Logic to get drinks a user has tried
});


// POST ROUTE DEFINITIONS
 

// Sign up a new user
router.post("/users", async (req, res) => {
    // Logic to sign up user
});

// Create a new session (log in)
router.post("/sessions", async (req, res) => {
    // Logic to create a new session (log in)
});

// Follow a user
router.post("/users/:userId/follows/:targetUserId", async (req, res) => {
    // Logic to follow a user
});

// Favorite a drink
router.post("/users/:userId/favorites/drinks/:drinkId", async (req, res) => {
    // Logic to favorite a drink
});

// Favorite a Systembolag store
router.post("/users/:userId/favorites/systembolag/:systembolagId", async (req, res) => {
    // Logic to favorite a Systembolag store
});


// PATCH ROUTE DEFINITIONS


// Update user profile
router.patch("/users/:userId", async (req, res) => {
    // Logic to update user profile
});

// Update user credentials (change email/password including restore forgotten password)
router.patch("/users/:userId/credentials", async (req, res) => {
    // Logic to update user credentials
});

// Update user settings
router.patch("/users/:userId/settings", async (req, res) => {
    // Logic to update user settings
});


// DELETE ROUTE DEFINITIONS


// Unfavorite a drink
router.delete("/users/:userId/favorites/drinks/:drinkId", async (req, res) => {
    // Logic to delete favorite drink
});

// Unfavorite a Systembolag store
router.delete("/users/:userId/favorites/systembolag/:systembolagId", async (req, res) => {
    // Logic to delete favorite Systembolag store
});

// Unfollow a user
router.delete("/users/:userId/follows/:targetUserId", async (req, res) => {
    // Logic to delete followed user
});

// Log out (delete current session)
router.delete("/sessions/current", async (req, res) => {
    // Logic to log out (delete current session)
});

// Delete a user's own account
router.delete("/users/:userId", async (req, res) => {
    // Logic to delete a user's own account
});

export default router;