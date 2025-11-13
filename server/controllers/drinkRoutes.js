import { Router } from "express";

const router = Router();

// GET ROUTES DEFINITION

router.get("/drinks", async (req, res) => {
    // Get all drinks logic
});

router.get("/drinks/:drinkId", async (req, res) => {
    // Get specific drink logic
});

router.get("/drinks/:drinkId/systembolag", async (req, res) => {
    // Logic to check where a drink is in stock
});

router.get("/drinks/:drinkId/systembolag/:systembolagId", async (req, res) => {
    // Logic to check if a drink is in stock at a specific systembolag
});



// POST ROUTES DEFINITION



router.post("/drinks", async (req, res) => {
    // Logic to add new drinks
});



// PATCH ROUTES DEFINITION



router.patch("/drinks/:drinkId", async (req, res) => {
    // Logic to update a drink
});



// DELETE ROUTES DEFINITION



router.delete("/drinks/:drinkId", async (req, res) => {
    // Logic to delete a drink
});