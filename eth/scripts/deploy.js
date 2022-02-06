const { ethers, upgrades } = require("hardhat");

let network = hre.network.name;
let proxyAddress;

if(network === 'ropsten') {
  proxyAddress = '0x8E04E2aa04c063b8d102882614FE9a454c4C9436';
  impAddress = '0x8D4e1e07829bB8387B764d4584daB6E810507AD3';
}

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  const DevPipes = await ethers.getContractFactory("DevPipes");
  let instance;
  let res;
  let initRes;

  if(!proxyAddress) {
    console.log('Deploying contract');
    instance = await upgrades.deployProxy(DevPipes);
    res = await instance.deployed();
    initRes = res.init();
  }
  else {
    console.log('Upgrading contract');
    res = await upgrades.upgradeProxy(proxyAddress, DevPipes);
  }

  console.log("Instance", instance);
  console.log("Res", res);
  console.log("initRes", initRes);

  console.log("Proxy address:", res.address);
  console.log('Implementation address: ', await upgrades.erc1967.getImplementationAddress(res.address));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });