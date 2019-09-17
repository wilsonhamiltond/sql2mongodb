import { Config } from './utils/utils';
import { MSSqlModel } from './models/mssql.model';
import { MongoDBModel } from './models/mongodb.model';

declare let process:any

class AppServer{
    private mongo_config:any;
    private sql_config:any;
    private max_record:number = 0;
    constructor(){
        this.mongo_config = Config()["mongo_config"];
        this.sql_config = Config()["sql_config"];
        
        this.max_record = <number>Config()["max_record"];
    }

    async run(){
        console.log('STARTING PROGRAM.')
        
        console.log('SEARCHING TABLES...')
        let mssqlModel = new MSSqlModel(this.sql_config);
        let pool:any = await mssqlModel.connect();
        let tables = await mssqlModel.getTables(pool);
        console.log('TABLES CHARGED...')
        let mongoDBModel = new MongoDBModel(this.mongo_config);
        let client = await mongoDBModel.connect();
        for( let ti = 0; ti < tables.length; ti++){
            let table:any = tables[ti];
            console.log(`GETTING SCHEMA OF TABLE ${table.name}.`);
            let columns = await mssqlModel.getColumns(pool, table);
            let primaries = await mssqlModel.getPrimaries(pool, table);

            let total_record = await mssqlModel.countData(pool, table, columns);
            console.log(`CHARGING ${total_record} RECORDS.`);

            console.log(`CREATING COLLECTION ${table.name}.`);
            
            let collection = await mongoDBModel.create_collection(table, client);

            let total_inserted = total_record + 0,
                max_record  = this.max_record;
                
            for( let index = 0; index < total_inserted; index += max_record ){

                let data = await mssqlModel.getData(pool, table, columns, primaries, index, this.max_record);

                await collection.insertMany(data);
                
                if(this.max_record > total_record){
                    max_record = total_record;
                }
                console.log(`${table.name}( ${index} - ${total_inserted} ).`);
            }
        }
        mongoDBModel.close(client);
    }

    public async bootstrap(){
       let app = new AppServer();
       await app.run();
       process.exit(0)
    }

}

(async()=>{
    await new AppServer().bootstrap();
})();