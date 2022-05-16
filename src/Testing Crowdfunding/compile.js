const path = require('path');
const fs = require('fs-extra');
const solc = require('solc');

const buildPath = path.resolve(__dirname, 'build/contracts');
fs.removeSync(buildPath);
fs.ensureDirSync(buildPath);

const filePath = path.resolve(__dirname, 'contracts', 'crowdfunding_v1.sol');
const filesource = fs.readFileSync(filePath, 'UTF-8');

var input = {
    language: 'Solidity',
    sources: {
        'crowdfunding_v1.sol' : {
            content: filesource
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': [ '*' ]
            }
        }
    }
}; 

console.log(solc.compile(JSON.stringify(input)));

//pas 2  exportar para test
	const contractsCompiled = JSON.parse(solc.compile(JSON.stringify(input))).contracts['crowdfunding_v1.sol'];

//console.log("\nABI:"+messageboxcompile.abi);
//console.log("\bytecode:"+messageboxcompile.evm);
for (let contract in contractsCompiled) {
	fs.outputJsonSync(
		path.resolve(buildPath, contract+'.json'),
		contractsCompiled[contract]);	
}
