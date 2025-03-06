import { DynamoDBClient, GetItemCommand, DescribeTableCommand, ScanCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-2" });

async function getRandomQuoteFromDB() {

  const tableName = "DailyConfuciusQuotes";
  const numQuotes = await getNumQuotes(tableName);
  const generatedId = getRandomInt(0,numQuotes-1).toString();
  
  const params = {
    TableName: tableName,
    Key: {
      QuoteID: {N: generatedId},
    }
  };

  const command = new GetItemCommand(params);

  try {
    const response = await client.send(command);
    const selectedQuote = Object(response.Item);
    return selectedQuote;
  } catch (err) {
    console.error(err);
  }
}

export async function getNewQuote() {
  let selectedQuote = await getRandomQuoteFromDB();
  let quoteIsStale = await checkIfStale(selectedQuote.QuoteID.N);
  while (quoteIsStale) {
    selectedQuote = await getRandomQuoteFromDB();
    quoteIsStale = await checkIfStale(selectedQuote.QuoteID.N);
  }
  return selectedQuote;
}

async function getNumQuotes(tableName) {

  const params = {
    TableName: tableName
  }

  const command = new DescribeTableCommand(params);

  try {
    const response = await client.send(command);
    console.log("Item count: " + response.Table.ItemCount);
    return response.Table.ItemCount;
  } catch (err) {
    console.error("Error describing table:", err);
    throw err;
  }
}

export async function getAllItems(tableName) {
  try {
    let items = [];
    let lastEvaluatedKey = null;
    
    do {
      // Prepare params for scan operation
      const params = {
        TableName: tableName,
        Limit: 100 // Optional: limit items per scan
      };
      
      // If we have a lastEvaluatedKey, use it for pagination
      if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
      }
      
      // Perform scan operation
      const command = new ScanCommand(params);
      const data = await client.send(command);
      
      // Add items to our collection
      items = items.concat(data.Items);
      
      // Update lastEvaluatedKey for pagination
      lastEvaluatedKey = data.LastEvaluatedKey;
      
      // Continue until we've scanned all items
    } while (lastEvaluatedKey);
    
    console.log(`Retrieved ${items.length} items from ${tableName}`);
    return items;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
}

async function checkIfStale(quoteId) {
  const staleQuotes = await getAllItems("StaleQuotes");
  for(const item of staleQuotes) {
    if(item.QuoteID.N === quoteId.toString()) { 
      return true;
    }
  }
  return false;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function setStale(quoteId) {

  const ts = getUnixTimestamp();

  const params = {
    TableName: "StaleQuotes",
    Item: {
      Id: { N: generateUniqueNumericId().toString() },
      QuoteID: { N: quoteId },
      createdAt: { N: ts.toString() },
      expireAt: { N: (ts + 5266800).toString() } // expire in two months
    }
  };

  const command = new PutItemCommand(params);

  try {
    const response = await client.send(command);
    console.log(response);
    
    if(response) {
      return true;
    }
  } catch (err) {
    console.error(err);
  }
  return false;
}

function generateUniqueNumericId() {
  // Get current timestamp in milliseconds
  const timestamp = Date.now();
  
  // Generate a random number between 0 and 999999
  const randomPart = Math.floor(Math.random() * 1000000);
  
  // Combine timestamp and random number to create a unique ID
  // Multiply timestamp by 1000000 to leave room for the random part
  const uniqueId = (timestamp * 1000000) + randomPart;
  
  return uniqueId;
}

function getUnixTimestamp() {
  return Math.floor(Date.now() / 1000);
}