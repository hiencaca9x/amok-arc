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
    return res.status(405).json({ stage: 'method', error: 'Method not allowed' });
  }

  let stage = 'init';
  try {
    stage = 'read_env';
    const pk = process.env.DEPLOYER_PRIVATE_KEY;
    if (!pk) throw new Error('Thiếu biến DEPLOYER_PRIVATE_KEY');
    if (!/^0x[0-9a-fA-F]{64}$/.test(pk)) {
      throw new Error('DEPLOYER_PRIVATE_KEY sai định dạng, độ dài hiện tại: ' + pk.length);
    }
    const treasury = process.env.TREASURY_ADDRESS;
    if (treasury && !/^0x[0-9a-fA-F]{40}$/.test(treasury)) {
      throw new Error('TREASURY_ADDRESS sai định dạng: ' + treasury);
    }

    stage = 'read_files';
    const tokenSource = readFileSync(path.join(process.cwd(), 'contracts', 'AmokToken.sol'), 'utf8');
    const launchpadSource = readFileSync(path.join(process.cwd(), 'contracts', 'AmokLaunchpad.sol'), 'utf8');

    stage = 'compile';
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
        return res.status(500).json({ stage: 'compile', error: fatal.map((e) => e.formattedMessage).join('\n') });
      }
    }

    stage = 'get_contract';
    const contract = output.contracts['AmokLaunchpad.sol']['AmokLaunchpad'];
    if (!contract) throw new Error('Không tìm thấy contract AmokLaunchpad sau khi compile');

    stage = 'connect_wallet';
    const provider = new ethers.JsonRpcProvider(ARC_RPC);
    const wallet = new ethers.Wallet(pk, provider);
    const treasuryAddress = treasury || wallet.address;

    stage = 'check_balance';
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) {
      throw new Error('Ví ' + wallet.address + ' chưa có USDC testnet để trả gas');
    }

    stage = 'deploy';
    const factory = new ethers.ContractFactory(contract.abi, contract.evm.bytecode.object, wallet);
    const deployed = await factory.deploy(USDC_ADDRESS, treasuryAddress);
    await deployed.waitForDeployment();
    const address = await deployed.getAddress();

    return res.status(200).json({
      success: true,
      contractAddress: address,
      txHash: deployed.deploymentTransaction().hash,
    });
  } catch (err) {
    return res.status(500).json({ stage, error: err.message, stack: err.stack });
  }
}
