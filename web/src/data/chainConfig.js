import chains from './chains';
import devPipesContract from './contract/DevPipes';

const validNetworks = [3, 0x89];

const chainConfig = {
  contracts: {
    'devPipes': {
      abi: devPipesContract.abi,
      address: {
        'rop': '0x8D0676Da7F8A4Ae60f988beD23006f919f044756',
        'matic': '0x742a63530FC9982218490cda497B3F27dF836b51'
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
