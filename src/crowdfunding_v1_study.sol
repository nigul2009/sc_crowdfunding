// for study only
// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract CrowdFunding {
   
    enum Estado  {Abierta, Cancelada, Activa}

	address payable public campainManager;
	string public campainName;
	string public campainDescription;
    Estado public  campainEstado;
    uint256 public campainGoal;
	uint256 public participationRate;
    mapping(address => uint256) public participaciones;
    address[] public participantes;
    uint256 public totalParticipaciones;
    uint immutable public CAMPANIN_DUEDATE;

    modifier only_manager() {
        require(campainManager == msg.sender,"Only Campain manager");
        _;
    }

    constructor(string memory _campainName, string memory _campainDesc,uint256 _campainGoal, uint256 _participationRate, uint256 campainduration)  {
        require(_campainGoal > 0 && _participationRate > 0 );
		campainName = _campainName;
		campainDescription = _campainDesc;
		campainManager = payable(msg.sender);
		participationRate = _participationRate;
        campainGoal = _campainGoal;
        campainEstado = Estado.Abierta;
        CAMPANIN_DUEDATE = block.timestamp + campainduration * 1 seconds; //days
    }

    function participar() public payable {
        require(msg.value >= participationRate, "Participacion minima no alcanzada" );
        require(campainEstado == Estado.Abierta,"Finalizado plazo participacion");
        if(participaciones[msg.sender] == 0) {  //nuevo participante
            participantes.push(msg.sender);
        }
        uint256 newParticipaciones = msg.value / participationRate;
        participaciones[msg.sender] =  participaciones[msg.sender] + newParticipaciones;
        totalParticipaciones = totalParticipaciones +newParticipaciones;
    }
    receive () external payable {
        participar();
    }
    fallback () external payable {
        participar();
    }
    function getUserParticipaciones(address user) public view returns(uint256) {
        return participaciones[user];
    }
    function getTotalParticipantes() public view returns(uint256) {
        return participantes.length;
    }
    function getParticipantes() public view returns(address[] memory) {
        return participantes;
    }
    function finalizarCampain() public  {
        require(campainEstado == Estado.Abierta,"Campanya no abierta");
        if(msg.sender != campainManager) {
            require(block.timestamp >=  CAMPANIN_DUEDATE, "Campain is not over yet");
        }

        if(campainGoal <= address(this).balance) {
            campainEstado = Estado.Activa;
        }else {
            campainEstado = Estado.Cancelada;
        }
    }


    function withdrawCanceledCampain() public {
        require(participaciones[msg.sender] > 0, "fondos retirados");
        require(campainEstado == Estado.Cancelada,"Campanya no cancelada");
        uint256 aportacionUsuario = participaciones[msg.sender] * participationRate;
        participaciones[msg.sender] = 0;
        payable(msg.sender).transfer(aportacionUsuario);
    }
    function adminGetFunds() public only_manager {
        campainManager.transfer(address(this).balance);
    }
    function test_contractBalance() public view returns (uint256) {
       // require (campainEstado == Estado.Activa,"Campanya no activa");
        return address(this).balance;
    }

}
