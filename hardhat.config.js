require('@nomiclabs/hardhat-waffle');
const fs = require('fs');
const keyData = fs.readFileSync('./p-key.txt', {
  encoding: 'utf8',
  flag: 'r',
});
const projectId = fs.readFileSync('./p-id.txt', {
  encoding: 'utf8',
  flag: 'r',
});

module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      chainId: 1337, // config standard
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${projectId}`,
      accounts: [keyData],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${projectId}`,
      accounts: [keyData],
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${projectId}`,
      accounts: [`0x${keyData}`],
      // gasPrice: 470000000000,
    },
  },
  solidity: {
    version: '0.8.4',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
