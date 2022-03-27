import chains from './chains';
import devPipesContract from './contract/DevPipes';
import { isLocal } from '../js/helpers/helpers';

const validNetworks = [0x89];
if(isLocal()) {
  validNetworks.push(3);
}

let ALCHEMY_API_KEY='cpzVPh7btoQR-urxOVQ3yOokLZVeHCjP';

const chainConfig = {
  contracts: {
    'devPipes': {
      abi: devPipesContract.abi,
      address: {
        'rop': '0x3d03c70FdF9fB90EA8daf9964B3961Ddf3aEE069',
        'matic': '0x7fa0da86Cfc7c08800252Acb1FA4bb0e99ecF54d'
      },
      biconomy_api_key: {
        'rop': 'kAaHk8t-e.720fe16b-5762-4323-8f5a-e1b5ceebbccb'
      },
    }
  },
  rpc_url: {
    'rop': `https://eth-ropsten.alchemyapi.io/v2/${ALCHEMY_API_KEY}`
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
