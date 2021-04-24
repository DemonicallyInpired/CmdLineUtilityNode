"use strict";
const HTTP_PORT = (process.env.PORT || 8081);
async function main(){
    for(let i = 0; i< 100000000000; i++){
        i = i;
    }
    process.exitCode = 0;
}