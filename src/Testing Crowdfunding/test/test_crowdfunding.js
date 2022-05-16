const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
var web3 = new Web3(ganache.provider());
const CFBuild = require('../build/contracts/CrowdFunding.json');

let accounts;
let crowdFund;
const objetivoICO = web3.utils.toWei("0.1");
const participantionRate = web3.utils.toWei("0.01");
const periodoIco = 3; //tiempo de la capamaña en segundos
let adminAccount, cuenta2, cuenta3;




describe('Crowdfunding tests', () => {
 
 before( async() => {
    accounts = await web3.eth.getAccounts();
    adminAccount = accounts[0];
	cuenta2 = accounts[1];
	cuenta3 =  accounts[2];
	console.log("admin account:"+adminAccount);
	console.log("account1:"+cuenta2);
	console.log("account2:"+cuenta3);
	
	 crowdFund = await new web3.eth.Contract(CFBuild.abi)
     .deploy({data: CFBuild.evm.bytecode.object, arguments: ["Nombre Campaña", "Descripcion de nuestra campaña",objetivoICO,participantionRate, periodoIco ]})
     .send({from: adminAccount, gas: 5000000 })
	 .once('transactionHash', function(hash){ console.log("txid:"+hash); });

    console.log("Contract deployed address: "+crowdFund.options.address);
  });//.timeout(60*1000+1000);

  it('contrato deployed', () => {
    assert.ok(crowdFund.options.address);
  });

  it('Participar', async()=>{
    const valorParticipacion = 2* participantionRate;
    console.log("valor participacion:"+valorParticipacion);
    await crowdFund.methods.participar().send({from: cuenta2, value: valorParticipacion, gas: 5000000 })
    //.then(function(receipt) {console.log(receipt);});

    const balanceParticipaciones = await crowdFund.methods.getUserParticipaciones(cuenta2).call();
    console.log("participaciones acc1: "+balanceParticipaciones);

    assert(balanceParticipaciones == valorParticipacion/participantionRate);
  });

  it('End ICO antes de tiempo',async() => {
		try {
			await crowdFund.methods.finalizarCampain().send({ from: cuenta2, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); })
			assert.fail(new TypeError('Error-Campaña no deberia finalizarse'));
		}
		catch (error) {
			console.log("mensaje error sc: "+error.message);
			assert(error.message != "Error-Campaña no deberia finalizarse"	);
		}
	}).timeout(periodoIco*1000+1000);

	it('End ICO objetivo no alcancado',async() => {
		const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
		await wait(periodoIco*1000);
		await crowdFund.methods.finalizarCampain().send({ from: cuenta2, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); })
		const estadoCampain = await crowdFund.methods.campainEstado().call();
		assert(estadoCampain == 1);
	}).timeout(periodoIco*1000+1000);

	it('End ICO - recuperar inversion',async() => {
		const balanceAccAntes = await web3.eth.getBalance(accounts[1]);

		await crowdFund.methods.withdrawCanceledCampain().send({ from: cuenta2, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); })
		const balanceAccDespues = await web3.eth.getBalance(cuenta2);
		assert(parseInt(balanceAccAntes) < parseInt(balanceAccDespues), "fondos recuperados");
	});


	it('End ICO objetivo Alcancado',async() => {

		crowdFund = await new web3.eth.Contract(CFBuild.abi)
			.deploy({data: CFBuild.evm.bytecode.object, arguments: ["Nombre Campaña", "Descripcion de nuestra campaña",objetivoICO,participantionRate, periodoIco ]})
			.send({ from: adminAccount, gas: 5000000 });

		console.log('contract address:'+crowdFund.options.address);

		const valorParticipacio = participantionRate * 5;
		await crowdFund.methods.participar().send({ from: adminAccount, value: valorParticipacio, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); });
		console.log("1 participacion");
		await crowdFund.methods.participar().send({ from: cuenta2, value: valorParticipacio, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); });
		console.log("2n participacion");
		await crowdFund.methods.participar().send({ from: cuenta3, value: valorParticipacio, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); });
		console.log("3a participacion");
		
		//const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
		//await wait(periodoIco*1000);
	
		await crowdFund.methods.finalizarCampain().send({ from: adminAccount, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); });
			//.then(function(receipt){ console.log(receipt); })
		const estadoCampain = await crowdFund.methods.campainEstado().call();
		console.log("campaña finalizado. estado:"+estadoCampain);
		assert(estadoCampain == 2);
	});
	
	it('Objetivo alcanzado inversor no recupera invertido',async() => {
				
		const balanceAccAntes = await web3.eth.getBalance(accounts[1]);
		try {
			await crowdFund.methods.withdrawCanceledCampain().send({ from: cuenta2, gas: 5000000 })
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); })
		}catch (error) {
			console.log("mensaje error sc: "+error.message);
			assert(error.message != "Error-campaña no es cancelada no se puede recuperar fondos"	);
		}
		const balanceAccDespues = await web3.eth.getBalance(cuenta2);
		assert(parseInt(balanceAccAntes) > parseInt(balanceAccDespues), "fondos no recuperados");
		
	}).timeout(periodoIco*1000+1000);
	
	it('Admin recupera inversion',async() => {
		const balanceAccAntes = await web3.eth.getBalance(adminAccount);

		await crowdFund.methods.adminGetFunds().send({ from: adminAccount})
			//.on('transactionHash', function(transactionHash){ console.log('txid:'+transactionHash); })
			//.then(function(receipt){ console.log(receipt); })
		const balanceAccDespues = await web3.eth.getBalance(adminAccount);
		//console.log(parseInt(balanceAcc1));
		//console.log(parseInt(balanceAcc2));
		assert(parseInt(balanceAccAntes) < parseInt(balanceAccDespues));
	});
	
});
