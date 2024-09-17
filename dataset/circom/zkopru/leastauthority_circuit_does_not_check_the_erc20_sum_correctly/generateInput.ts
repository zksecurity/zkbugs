/// <reference path="./circomlibjs.d.ts" />

import { buildPoseidon, buildEddsa } from "circomlibjs";
import { BigNumber } from "@ethersproject/bignumber";

async function generateInput() {
  const poseidon = await buildPoseidon();
  const eddsa = await buildEddsa();

  // Generate a key pair
  const privateKey = Buffer.from("1".padStart(64, "0"), "hex");
  const publicKey = eddsa.prv2pub(privateKey);

  // Input note data
  const nullifierSeed = BigNumber.from(1);
  const salt = BigNumber.from(2);
  const eth = BigNumber.from(1000);
  const tokenAddr = BigNumber.from(0);
  const erc20 = BigNumber.from(0);
  const erc721 = BigNumber.from(0);

  // Calculate spending pubkey
  const spendingPubkey = poseidon([publicKey[0], publicKey[1], nullifierSeed.toString()]);

  // Calculate asset hash
  const assetHash = poseidon([eth.toString(), tokenAddr.toString(), erc20.toString(), erc721.toString()]);

  // Calculate note hash
  const noteHash = poseidon([spendingPubkey, salt.toString(), assetHash]);

  // Sign the note
  const signature = eddsa.signPoseidon(privateKey, noteHash);

  // Generate a simple Merkle tree
  const leafIndex = BigNumber.from(0);
  const siblings = [
    BigNumber.from(1),
    BigNumber.from(2),
    BigNumber.from(3),
    BigNumber.from(4),
  ];
  let root = noteHash;
  for (let i = 0; i < 4; i++) {
    root = poseidon([root, siblings[i].toString()]);
  }

  // Calculate nullifier
  const nullifier = poseidon([nullifierSeed.toString(), leafIndex.toString()]);

  // Output note data
  const newSalt = BigNumber.from(3);
  const newEth = BigNumber.from(999); // 1000 - 1 (fee)
  const fee = BigNumber.from(1);

  // Calculate new note hash
  const newAssetHash = poseidon([newEth.toString(), tokenAddr.toString(), erc20.toString(), erc721.toString()]);
  const newNoteHash = poseidon([spendingPubkey, newSalt.toString(), newAssetHash]);

  const input = {
    spending_note_eddsa_point: [
      [publicKey[0].toString(), publicKey[1].toString()],
    ],
    spending_note_eddsa_sig: [
      signature.R8[0].toString(),
      signature.R8[1].toString(),
      signature.S.toString(),
    ],
    spending_note_nullifier_seed: [nullifierSeed.toString()],
    spending_note_salt: [salt.toString()],
    spending_note_eth: [eth.toString()],
    spending_note_token_addr: [tokenAddr.toString()],
    spending_note_erc20: [erc20.toString()],
    spending_note_erc721: [erc721.toString()],
    note_index: [leafIndex.toString()],
    siblings: siblings.map((s) => [s.toString()]),
    inclusion_references: [root.toString()],
    nullifiers: [nullifier.toString()],
    new_note_spending_pubkey: [spendingPubkey.toString()],
    new_note_salt: [newSalt.toString()],
    new_note_eth: [newEth.toString()],
    new_note_token_addr: [tokenAddr.toString()],
    new_note_erc20: [erc20.toString()],
    new_note_erc721: [erc721.toString()],
    new_note_hash: [newNoteHash.toString()],
    typeof_new_note: ["0"],
    public_data_to: ["0"],
    public_data_eth: ["0"],
    public_data_token_addr: ["0"],
    public_data_erc20: ["0"],
    public_data_erc721: ["0"],
    public_data_fee: ["0"],
    fee: fee.toString(),
    swap: "0",
  };

  return input;
}

generateInput().then((input) => {
  console.log(JSON.stringify(input, null, 2));
});