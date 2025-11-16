import fs from "fs/promises";

//Extracting API key from systembolaget.se
async function getApiKey() {

  //Send get request to the website and store the result as plain text in "home"
  const response = await fetch("https://www.systembolaget.se");
  const home = await response.text();

  //Find any sciptfile whose name contains "_app" and ends with ".js" This contains the API key.
  const scriptMatch = home.match(/<script src="([^"]+_app-[^"]+\.js)"/);
  if (!scriptMatch) throw new Error("Failed to find _app script");


  //It selects the first capture group from the regex, which contains the script URL inside the quotes.
  // It matches the first <script src="..."> tag which matches our regex logic and stores it in scriptUrl
  let scriptUrl = scriptMatch[1];

  let fullScriptUrl;

  //Take the scriptURL and concatenate it with systembolagets website-url - If 
  if (scriptUrl.startsWith("/")) {
    fullScriptUrl = "https://www.systembolaget.se" + scriptUrl;
  } else {
    fullScriptUrl = scriptUrl;
  }

  //Same type of operation as the one earlier but with the added scriptURL
  console.log("Fetching app bundle:", fullScriptUrl);
  const bundleResponse = await fetch(fullScriptUrl);
  const bundle = await bundleResponse.text();

  //Match the API key and store it in tokenMatch
  const tokenMatch = bundle.match(/NEXT_PUBLIC_API_KEY_APIM:"([^"]+)"/);
  if (!tokenMatch) throw new Error("Failed to extract API key");

  //Select the portion of the text containing the API key characters and return it
  const apiKey = tokenMatch[1];
  console.log("Extracted API key.");
  return apiKey;
}

//Use apiKey and desired url (for products or stores etc) to make an API call.
async function apiRequest(apiKey, url) {
  const result = await fetch(url, {
    //Specify headers that will be sent with our request
    headers: {

      //Set the request origin adress
      "Origin": "https://www.systembolaget.se",

      //We want the response in json format
      "Accept": "application/json",

      //Do not use cached data, forces a fresh response
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",

      //Add the API key to the request, so systemboalget accepts the request
      "Ocp-Apim-Subscription-Key": apiKey
    }
  });

  if (!result.ok) {
    throw new Error(`HTTP ${result.status} - ${result.statusText}`);
  }

  return result.json();
}

//Get the full systembolaget assortment of items
async function getFullAssortment(apiKey) {

  //"page" is the current page number we are requesting. "next" is the next page number returned by the API
  const all = [];
  let currentPage = 1;
  let nextPage = 1;

  console.log("Downloading product assortment...");

  //Iterate through the pages of the product catalog. Last page will return "0", so the loop will stop.
  while (nextPage > 0) {

    //Make url object to attach parameters to it
    const url = new URL("https://api-extern.systembolaget.se/sb-api-ecommerce/v1/productsearch/search");

    //Set the search parameter of the size to 30
    url.searchParams.set("size", "30");

    //Set the search parameter of our url to the value of "currentPage"
    url.searchParams.set("page", String(currentPage));

    //Run the apiRequest-function with key and url as parameters and store result
    const data = await apiRequest(apiKey, url);

    //"data" is an array of 30 products, this functions pushes each individual product into the "all"-array, separately
    all.push(...data.products);

    //The api-response contains metadata about what page to request next, so we set "nextPage" to that number
    nextPage = data.metadata.nextPage;
    console.log(`Fetched page ${currentPage} / next=${nextPage}, total so far=${all.length}`);

    currentPage = nextPage;
  }

  return all;
}

//Get data about the different stores
async function getStores(apiKey) {
  console.log("Downloading store list...");

  const url = new URL("https://api-extern.systembolaget.se/sb-api-ecommerce/v1/sitesearch/site");
  url.searchParams.set("includePredictions", "true");

  const data = await apiRequest(apiKey, url);
  return data.siteSearchResults;
}