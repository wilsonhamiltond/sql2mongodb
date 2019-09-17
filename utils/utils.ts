import { join } from "path";
import { existsSync, readFileSync } from "fs";

export const Config = function(){
    let env = process.env.NODE_ENV || 'default',
        config_path = join( process.cwd(), 'config', `${env}.json`);
    if(existsSync(config_path)){
        let config = readFileSync(config_path, { encoding: 'utf8'});
        return JSON.parse( config );
    }else{
        throw new Error(`No se encontro la configuración ${env}`);
        //process.exit(0);
    }
}

export class Utils {
    constructor() {

    }
}