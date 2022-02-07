import chains from './chains';
import devPipesContract from './contract/DevPipes';

const validNetworks = [0x89];

const chainConfig = {
  contracts: {
    'devPipes': {
      abi: devPipesContract.abi,
      address: {
        'rop': '0x8D0676Da7F8A4Ae60f988beD23006f919f044756',
        'matic': '0x7fa0da86Cfc7c08800252Acb1FA4bb0e99ecF54d'
      }
    }
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
