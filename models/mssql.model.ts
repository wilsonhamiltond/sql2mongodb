import { ConnectionPool, NVarChar } from "mssql";

let mssql = require('mssql');


export class MSSqlModel {
    sql_config: any;
    constructor(sql_config: any) {
        this.sql_config = sql_config;
    }

    async connect() {
        try {
            let pool: ConnectionPool = await new ConnectionPool(this.sql_config).connect();
            return pool
        } catch (e) {
            console.log(e);
            throw e.message;
        }
    }
    close(pool:any){
        pool.close();
    }

    async getTables(pool:any) {
        try {
            let result = await pool.query`SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
            var tables = result.recordset.map((table: any) => {
                return {
                    catalog: table['TABLE_CATALOG'],
                    name: table['TABLE_NAME'],
                    table_schema: table['TABLE_SCHEMA'],
                    type: table['TABLE_TYPE']
                }
            })
            return tables
        } catch (e) {
            console.log(e);
            throw e.message;
        }
    }

    async getColumns(pool:any, table: any) {
        try {
            let result = await pool.request()
                    .input('table_name', NVarChar, table.name)
                    .query(`SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @table_name`);
            
            let columns = result.recordset.map((column: any) => {
                return {
                    name: column['COLUMN_NAME'],
                    alias: column['COLUMN_NAME'],
                    table: table,
                    position: column['ORDINAL_POSITION'],
                    default_value: column['COLUMN_DEFAULT'],
                    data_type: column['DATA_TYPE']
                }
            })
            return <Array<any>>columns
        } catch (error) {
            console.log(error);
            throw error.message;
        }
    }
    
    async getPrimaries(pool: any, table: any) {
        try {
            let result = await pool.request()
                    .input('table_name', NVarChar, table.name)
                    .query(`SELECT KU.table_name as TABLENAME,column_name as PRIMARYKEYCOLUMN
                        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS TC
                        INNER JOIN
                            INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS KU
                                ON TC.CONSTRAINT_TYPE = 'PRIMARY KEY' AND
                                    TC.CONSTRAINT_NAME = KU.CONSTRAINT_NAME AND 
                                    KU.table_name= @table_name
                        ORDER BY KU.TABLE_NAME, KU.ORDINAL_POSITION;`);
            
            let columns = result.recordset.map((column: any) => {
                return column['PRIMARYKEYCOLUMN'];
            })
            return <Array<string>>columns
        } catch (error) {
            console.log(error);
            throw error.message;
        }
    }

    async countData(pool:any, table: any, columns: any[]) {
        try {
            var query: string = `SELECT COUNT( ${columns[0].name } )`

            query += this.mappingsToString(table)
            
            let result = await pool.request().query(query);

            return result.recordset[0][""];
        } catch (error) {
            console.log(error);
            throw error.message;
        }
    }

    async getData(pool:any, table: any, columns: any[], primaries: string[], start:number, end:number) {
        try {
            if(primaries.length <= 0)
                primaries.push(columns[0].name)
            
            let query = this.queryBuilder(table, columns);
            query += ` ORDER BY ${primaries.join(', ')}`
            query += ` OFFSET ${start} ROWS
            FETCH NEXT ${end} ROWS ONLY;`
            let result = await pool.request().query(query);

            return <Array<any>>result.recordset;
        } catch (error) {
            console.log(error);
            throw error.message;
        }
    }

    private queryBuilder(table: any, columns: any[]) {
        try {
            var query: string = 'SELECT '
            query += this.columnsToString(columns)

            query += this.mappingsToString(table)

            return query
        } catch (error) {
            console.log(error)
            throw error.message;
        }
    }

    private columnsToString(columns: any[]) {
        var query = ''
        columns.forEach((column: any, index: number) => {
            query += column.name;

            if ((columns.length - 1) != index) {
                query += ',';
            }
        });
        return query
    }

    private mappingsToString(table: any) {
        var query = ` FROM [${table.table_schema}].[${table.name}]`;
        return query
    }

}