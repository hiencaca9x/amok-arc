import { readFileSync } from 'fs';
import path from 'path';
import solc from 'solc';
import { ethers } from 'ethers';

const ARC_RPC = 'https://rpc.testnet.arc.io';
const USDC_ADDRESS = '0x3600000000000000000000000000000000000000';

function findImports(importPath) {
  try {
    const fullPath = path.join(process.cwd(), 'node_modules', importPath);
    return { contents: readFileSync(fullPath, 'utf8') };
  } catch (e) {
    return { error: 'File not found: ' + importPath };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tokenSource = readFileSync(path.join(process.cwd(), 'contracts', 'AmokToken.sol'), 'utf8');
    const launchpadSource = readFileSync(path.join(process.cwd(), 'contracts', 'AmokLaunchpad.sol'), 'utf8');

    const input = {
      language: 'Solidity',
      sources: {
        'AmokToken.sol': { content: tokenSource },
        'AmokLaunchpad.sol': { content: launchpadSource },
      },
      settings: {
        outputSelection: { '*': { '*': ['abi', 'evm.bytecode.object'] } },
      },
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

    if (output.errors) {
      const fatal = output.errors.filter((e) => e.severity === 'error');
      if (fatal.length > 0) {
        return res.status(500).json({ error: 'Compile error', details: fatal.map((e) => e.formattedMessage) });
      }
    }

    const contract = output.contracts['AmokLaunchpad.sol']['AmokLaunchpad'];
    const provider = new ethers.JsonRpcProvider(ARC_RPC);
    const wallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const factory = new ethers.ContractFactory(contract.abi, contract.evm.bytecode.object, wallet);
    const treasuryAddress = process.env.TREASURY_ADDRESS || wallet.address;

    const deployed = await factory.deploy(USDC_ADDRESS, treasuryAddress);
    await deployed.waitForDeployment();
    const address = await deployed.getAddress();

    return res.status(200).json({
      success: true,
      contractAddress: address,
      txHash: deployed.deploymentTransaction().hash,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
