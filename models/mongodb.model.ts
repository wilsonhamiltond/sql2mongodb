import { MongoClient } from "mongodb"

export class MongoDBModel {
    mongo_config: any;
    url:string;
    constructor(mongo_config: any) {
        this.mongo_config = mongo_config;
        this.url = `mongodb://${this.mongo_config['host']}:${this.mongo_config['port']}`
    }
    
    async connect( ) {
        try{    
            let client:any = await MongoClient.connect(this.url)

            return client;
        }catch(e){
            console.log(e);
        }
    }

    async create_collection(table: any, client:any) {
        try{    
            const db = await client.db(this.mongo_config['dbName']);
            
            let collection = await db.createCollection( table.name.toUpperCase() );

            return collection;
        }catch(e){
            console.log(e);
        }
    }

    close(client:any){
         client.close();
    }
}