import { Router } from "express";

const router = Router();

var Location=require("../Schemas/LocationSchema");

// GET ROUTE DEFINITIONS

// Get a list of locations
router.get("/locations", async (req, res) => {
    // Logic to get list of locations
});

// Get details of a specific location
router.get("/locations/:locationId", async (req, res) => {
    // Logic to get location details
    const id=req.params.id;
    const myLocation=await Location.findById(id).catch(err=>{res.status(404).json({"message":"No location found"});});
    res.json(myLocation)
});

// POST ROUTE DEFINITIONS

router.post("/locations", async (req, res) => {
    // Logic to create a new location
    var myLocation=new Location({
        "locationID": req.body.LocationID,
        "longitude": req.body.longitude,
        "latitude": req.body.latitude,
        "postalCode": req.body.address.postalCode,
        "street": req.body.adress.street,
        "streetNumber": req.body.adress.streetNumber,
        "city": req.body.address.city
    });
    await myLocation.save().catch(err=>{next(err)});

    res.status(201).json(myLocation);
});

// PATCH ROUTE DEFINITIONS

router.patch("/locations/:locationId", async (req, res) => {
    // Logic to update location details
    const id=req.params.id;
    const updatedLocation=await Location.findById(id).catch(err=>{next(err)});
    updatedLocation.locationID=(req.body.LocationID || updatedLocation.locationID);
    updatedLocation.longitude=(req.body.longitude || updatedLocation.longitude);
    updatedLocation.latitude=(req.body.latitude || updatedLocation.latitude);
    updatedLocation.postalCode=(req.body.postalCode || updatedLocation.postalCode);
    updatedLocation.street=(req.body.street || updatedLocation.street);
    updatedLocation.streetNumber=(req.body.streetNumber || updatedLocation.streetNumber);
    updatedLocation.city=(req.body.city || updatedLocation.city);
    await updatedLocation.save().catch(err=>{next(err)});
    res.json(updatedLocation);
});

// DELETE ROUTE DEFINITIONS

router.delete("/locations/:locationId", async (req, res) => {
    // Logic to delete a location
    const id=req.params.id;
    const deletedLocation=await Location.findByIdAndDelete(id).catch(err=>{next(err)});
    res.json(deletedLocation);
});

export default router;