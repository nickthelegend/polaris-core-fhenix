import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "polaris";

async function seed() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db(dbName);
    
    // Clear existing data
    await db.collection("positions").deleteMany({});
    await db.collection("transactions").deleteMany({});
    console.log("🗑️  Cleared existing positions and transactions");
    
    // Note: Positions and transactions will be created when users interact with the protocol
    // This script just ensures the collections exist
    
    await db.collection("positions").createIndex({ walletAddress: 1 });
    await db.collection("positions").createIndex({ type: 1, symbol: 1 });
    await db.collection("transactions").createIndex({ userAddress: 1, timestamp: -1 });
    
    console.log("✅ Created indexes for positions and transactions");
    console.log("\n📝 Note: Positions and transactions will be populated when users:");
    console.log("   - Supply/Borrow from lending pools");
    console.log("   - Swap tokens on AMM");
    console.log("   - Repay loans or withdraw collateral");
    
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✅ Database connection closed");
  }
}

seed();
