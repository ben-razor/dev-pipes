import chains from './chains';
import devPipesContract from './contract/DevPipes';

let chainConfig = {
  contracts: {
    'devPipes': {
      abi: devPipesContract.abi,
      address: {
        'rin': {
          address: '0xb671A76Fe1Ee4E8535d827AdD0b260Ab71A124a9'
        },
        'matic': {
          address: '0x742a63530FC9982218490cda497B3F27dF836b51'
        }
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
        chainCacheById[chainId] = chain[chainId];
      }
    }
  }

  return chainCacheById?.[chainId]?.[field];
}

export function getAbi(contractId) {
  return chainConfig?.contracts?.[contractId]?.abi;
}

export function chainIdToAddress(contractId, chainId) {
  let chainShortName = chainIdToField(chainId);
  return chainConfig.contracts[contractId].address[chainShortName]
}

module.exports = chainConfig;
