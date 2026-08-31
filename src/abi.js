"name": "sell",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "token", "type": "address" }],
    "name": "claimCreatorRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "name": "tokens",
    "outputs": [
      { "internalType": "address", "name": "creator", "type": "address" },
      { "internalType": "uint256", "name": "reserveUSDC", "type": "uint256" },
      { "internalType": "uint256", "name": "reserveToken", "type": "uint256" },
      { "internalType": "uint256", "name": "creatorEarned", "type": "uint256" },
      { "internalType": "bool", "name": "graduated", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
