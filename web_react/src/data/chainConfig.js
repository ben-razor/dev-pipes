import chains from './chains';
import devPipesContract from './contract/DevPipes';
import { isLocal } from '../js/helpers/helpers';

const validNetworks = [0x89];
if(isLocal()) {
  validNetworks.push(3, 4, 80001);
}

const ALCHEMY_API_KEY='cpzVPh7btoQR-urxOVQ3yOokLZVeHCjP';
const RINKEBY_API_KEY='RVEH7L1iIhCTLo8M5OW7XBBKnBK3E25N';
const MUMBAI_API_KEY='10BIpUHr-Z1uIgNj6R4WUQKSdtadul9S';

const chainConfig = {
  contracts: {
    'devPipes': {
      abi: devPipesContract.abi,
      address: {
        'rop': '0x3d03c70FdF9fB90EA8daf9964B3961Ddf3aEE069',
        'matic': '0x7fa0da86Cfc7c08800252Acb1FA4bb0e99ecF54d',
        'rin': '0x1DBFCaE8139dcB39b9e5AeCb8BC37460e9947f50',
        'maticmum': '0x6aaD449C1aD2513751752a3cCB721c06811B794c'
      },
      biconomy_api_key: {
        'rop': 'kAaHk8t-e.720fe16b-5762-4323-8f5a-e1b5ceebbccb',
        'rin': 'pSNcNg4vE.878477fd-7ff5-4486-b975-523435c70dde',
        'maticmum': 'YmHneYPby.00adf400-bb8c-41fa-92f5-12080a707297'
      },
    }
  },
  rpc_url: {
    'rop': `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
    'rin': `https://eth-rinkeby.alchemyapi.io/v2/${RINKEBY_API_KEY}`,
    'maticmum': `https://polygon-mumbai.g.alchemy.com/v2/${MUMBAI_API_KEY}`
  }
}

let chainCacheById = {

};

export function chainIdToField(chainId, field) {
  if(!(chainId in chainCacheById)) {
    for(let chain of chains) {
      if(chain.chainId === chainId) {
        chainCacheById[chainId] = chain;
        break;
      }
    }
  }

  return chainCacheById?.[chainId]?.[field];
}

export function getAbi(contractId) {
  return chainConfig?.contracts?.[contractId]?.abi;
}

export function chainIdToAddress(contractId, chainId) {
  let chainShortName = chainIdToField(chainId, 'shortName');
  return chainConfig.contracts[contractId].address[chainShortName]
}

export function validNetwork(networkId) {
  let nid = parseInt(networkId);
  return validNetworks.includes(nid);
}

export default chainConfig;
