/*
 * 1. npx hardhat compile
 * 2. npx hardhat test 
 * 3. npx hardhat run scripts/deploy.js --network ropsten
 * 4. Update proxy/impAddress
 * 5. npx hardhat verify --network ropsten <impAddress>
 * 6. Copy ABI to code
 * 7. Set code address to proxy address if not upgrading
 */
const { ethers, upgrades } = require("hardhat");
let network = hre.network.name;
let proxyAddress = '';
let impAddress = '';

if(network === 'polygon') {
  // proxyAddress = '0xb671A76Fe1Ee4E8535d827AdD0b260Ab71A124a9';
  // impAddress = '0x2649B83A236991176a5B9B2a51174e992d27e536';

  proxyAddress = '0x7fa0da86Cfc7c08800252Acb1FA4bb0e99ecF54d';
  impAddress = '0x38C73961E4147cad754dab0dB9615Cf7a87040D8';
}
else if(network === 'ropsten') {
  // proxyAddress = '0x8D0676Da7F8A4Ae60f988beD23006f919f044756';
  // impAddress = '0x1DBFCaE8139dcB39b9e5AeCb8BC37460e9947f50';

  proxyAddress = '0x4FFBB5fEa02d16e47bB769880f4C8d6024505714';
  impAddress = '0x1DBFCaE8139dcB39b9e5AeCb8BC37460e9947f50';
}

async function main() {
  let prevImpAddress = impAddress;

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
  }
  else {
    console.log('Upgrading contract');
    instance = await upgrades.upgradeProxy(proxyAddress, DevPipes);
  }

  res = await instance.deployed();
  impAddress = await upgrades.erc1967.getImplementationAddress(res.address);
  let contractChanged = impAddress !== prevImpAddress;

  if(contractChanged) {
    let devPipes = await DevPipes.attach(res.address);
    initRes = await devPipes.init();
  }

  console.log("Init tx hash: ", initRes.hash);
  console.log("Proxy address:", res.address);
  console.log('Implementation address: ', impAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });