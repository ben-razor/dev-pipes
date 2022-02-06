const { ethers, upgrades } = require("hardhat");

let network = hre.network.name;
let proxyAddress;

if(network === 'ropsten') {
  // proxyAddress = '0xE11aE662454edcEd8e3B9B2104ebcc84b979b34d';
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
  console.log("DevPipes address:", res.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });