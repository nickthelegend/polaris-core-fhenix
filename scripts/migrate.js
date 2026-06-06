const { MongoClient } = require('mongodb');

async function migrate() {
    const localUri = "mongodb://127.0.0.1:27017";
    // URL encoded @ is %40
    const remoteUri = "mongodb+srv://polaris:Nicolas1234%40@cluster0.mpnsajv.mongodb.net/?appName=Cluster0";
    
    const localClient = new MongoClient(localUri);
    const remoteClient = new MongoClient(remoteUri);
    
    try {
        await localClient.connect();
        await remoteClient.connect();
        console.log("Connected to both local and remote MongoDB");
        
        const dbsToMigrate = ["polaris", "polaris_merchant"];
        
        for (const dbName of dbsToMigrate) {
            console.log(`Migrating database: ${dbName}`);
            const localDb = localClient.db(dbName);
            const remoteDb = remoteClient.db(dbName);
            
            const cols = await localDb.listCollections().toArray();
            for (const col of cols) {
                console.log(`  Migrating collection: ${col.name}`);
                const data = await localDb.collection(col.name).find({}).toArray();
                if (data.length > 0) {
                    await remoteDb.collection(col.name).deleteMany({}); 
                    await remoteDb.collection(col.name).insertMany(data);
                    console.log(`    Migrated ${data.length} documents.`);
                } else {
                    console.log(`    Collection is empty.`);
                }
            }
        }
        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await localClient.close();
        await remoteClient.close();
    }
}

migrate();
