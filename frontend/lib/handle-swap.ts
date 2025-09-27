// import { createOrderHash, signOrder } from "./ethUtils";
// import { config } from "@/components/providers";
// import { writeContract, readContract, waitForTransactionReceipt } from "@wagmi/core";
// import { ADDRESSES } from "@/lib/ethUtils";
// import LimitOrderProtocolABI from "@/utils/LimitOrderProtocol.json";

// type EvmToTonOrderParams = {
//   makerSrcAddress: string;
//   fromToken: string;
//   toToken: string;
//   fromAmount: string;
//   toAmount: string;
//   makerDstAddress: string;
//   hashlock: string;
//   salt: number;
//   expiresAt: Date;
// };

// type TonToEvmOrderParams = {

// }

// export async function handleEvmToTonOrder({
//   makerSrcAddress,
//   fromToken,
//   toToken,
//   fromAmount,
//   toAmount,
//   makerDstAddress,
//   hashlock,
//   salt,
//   expiresAt,
// }: EvmToTonOrderParams) {

//   const order = {
//     maker: makerSrcAddress,
//     makerAsset: fromToken,
//     takerAsset: toToken,
//     makingAmount: BigInt(fromAmount),
//     takingAmount: BigInt(toAmount),
//     receiver: "0x0000000000000000000000000000000000000000",
//     hashlock: hashlock,
//     salt: salt,
//   };

//   const orderMetadata = {
//     adaAmount: BigInt(toAmount),
//     cardanoAddress: makerDstAddress,
//     safetyDeposit: 0.01, // Default safety deposit
//     deadline: expiresAt,
//     createdAt: new Date().toISOString(),
//   };

//   // Create order hash for EIP-712 signing
//   const orderHash = await createOrderHash(order);

//   const signedOrderData = {
//     ...order,
//     ...orderMetadata,
//     orderHash: orderHash,
//   };

//   const signature = await signOrder(signedOrderData);
//   // Get the LOP contract using ABI

//   if (fromToken === "0x0000000000000000000000000000000000000000") {
//     const preInteractionTx = await writeContract(config, {
//       abi: LimitOrderProtocolABI.abi,
//       address: ADDRESSES.limitOrderProtocol as `0x${string}`,
//       functionName: "preInteraction",
//       args: [order, signature],
//       value: BigInt(fromAmount),
//     });
//     console.log(`📋 Transaction hash: ${preInteractionTx}`);
//     console.log(`⏳ Waiting for confirmation...`);
//     const receipt = await waitForTransactionReceipt(config, {
//       hash: preInteractionTx,
//     });
//     console.log(`✅ PreInteraction completed in block ${receipt.blockNumber}`);
//   } else {
//     // Approve token to lop
//     const tokenContract = await readContract(config, {
//       address: fromToken as `0x${string}`,
//       abi: [
//         "function approve(address spender, uint256 amount) external returns (bool)",
//       ] as any,
//       functionName: "approve",
//       args: [ADDRESSES.limitOrderProtocol, BigInt(fromAmount)],
//     });
//     const approveTx = await writeContract(config, {
//       address: fromToken as `0x${string}`,
//       abi: [
//         "function approve(address spender, uint256 amount) external returns (bool)",
//       ] as any,
//       functionName: "approve",
//       args: [ADDRESSES.limitOrderProtocol, BigInt(fromAmount)],
//     });
//     console.log(`📋 Approve transaction hash: ${approveTx}`);
//     console.log(`⏳ Waiting for approval confirmation...`);
//     const receipt = await waitForTransactionReceipt(config, {
//       hash: approveTx,
//     });
//     console.log(`✅ Token approved in block ${receipt.blockNumber}`);

//     // Now call preInteraction
//     const preInteractionTx = await writeContract(config, {
//       address: ADDRESSES.limitOrderProtocol as `0x${string}`,
//       abi: LimitOrderProtocolABI.abi,
//       functionName: "preInteraction",
//       args: [order, signature],
//     });
//     console.log(`📋 Transaction hash: ${preInteractionTx}`);
//     console.log(`⏳ Waiting for confirmation...`);
//     const preReceipt = await waitForTransactionReceipt(config, {
//       hash: preInteractionTx,
//     });
//     console.log(
//       `✅ PreInteraction completed in block ${preReceipt.blockNumber}`
//     );
//   }
//   return { signature, orderHash };
// }


