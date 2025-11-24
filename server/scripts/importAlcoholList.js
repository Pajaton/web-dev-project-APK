var fs = require("fs");
var path = require("path");
const drinksURL = `http://localhost:3000/api/v1/drinks`;
var oldDataDate = require("../Resources/lastImported.json");
var oldDate = oldDataDate.lastImported;

var filePath = path.join(__dirname, "..", "Resources", "drinkAssortment.json");
var raw = fs.readFileSync(filePath, "utf8");
var alcohol = JSON.parse(raw);
var jsonDate = alcohol.assortmentDate;

if (jsonDate > oldDate) {
    console.log("Adding new list");
    async function importAlcoholList() {

    //Get all existing drinks
    var res = await fetch(drinksURL, { method: "GET" });
    var body = await res.json();
    var drinks = body.drinks || [];

    //Concatenate all beverages so they exist on the same level
    var allDrinks =
        (alcohol.beers || [])
        .concat(alcohol.wines || [])
        .concat(alcohol.ciders || [])
        .concat(alcohol.liquors || []);

    for (var i = 0; i < allDrinks.length; i++) {
        var newDrink = allDrinks[i];
        var found = false;

            //Loop through existing drinks
            for (var j = 0; j < drinks.length; j++) {
                var existingDrink = drinks[j];

                if (existingDrink.productNumber === newDrink.productNumber) {
                    found = true;
                    console.log("Updating old entry")
                    //Patch existing drinks
                    await fetch(`${drinksURL}/${existingDrink._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            "productNumber": newDrink.productNumber,
                            "name": newDrink.name,
                            "type": newDrink.type,
                            "container": newDrink.container,
                            "volume": newDrink.volume,
                            "percentage": newDrink.percentage,
                            "colour": newDrink.colour,
                            "price": newDrink.price,
                            "image": newDrink.image,
                            "apk": (newDrink.percentage * newDrink.volume) / newDrink.price
                        })
                    });
                }
            }

            if (!found) {
                console.log("Adding new entry")
                //If productnumber not found, add the new drink to the database
                await fetch(drinksURL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        "productNumber": newDrink.productNumber,
                        "name": newDrink.name,
                        "type": newDrink.type,
                        "container": newDrink.container,
                        "volume": newDrink.volume,
                        "percentage": newDrink.percentage,
                        "colour": newDrink.colour,
                        "price": newDrink.price,
                        "image": newDrink.image,
                        "apk": (newDrink.percentage * newDrink.volume) / newDrink.price
                    })
                });
            }
        }
            //Add the date of the new Json to the lastImported.json for future reference
            fs.writeFileSync(
                path.join(__dirname, "..", "Resources", "lastImported.json"),
                JSON.stringify({ lastImported: jsonDate 
                    }
                )
            );
        }
        importAlcoholList().catch(err => console.error(err));
    }
    else {
        console.log("Current assortment is already updated")
        return
    }