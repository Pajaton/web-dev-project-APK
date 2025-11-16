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