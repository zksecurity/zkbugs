pragma circom 2.0.0;
include "./if_else_then.circom";
include "./inclusion_proof.circom";
include "./erc20_sum.circom";
include "./non_fungible.circom";
include "./note_hash.circom";
include "./asset_hash.circom";
include "./nullifier.circom";
include "./ownership_proof.circom";
include "./spending_pubkey.circom";
include "./range_limit.circom";
include "../../../../dependencies/circomlib/circuits/eddsaposeidon.circom";
include "../../../../dependencies/circomlib/circuits/bitify.circom";

/**
 * Note properties
 *  asset_hash = poseidon(eth, token_addr, erc20Amount, nftId)
 *  note_hash = poseidon(P, salt, asset_hash)
 *  P = poseidon(pG.x, pG.y, n)
 *  pG = from EdDSA
 *
 *  nullifier_seed = n // nullifier_seed
 *  spending_note_data[1]: salt
 *  spending_note_data[1]: salt
 *  spending_note_data[1]: salt
 *  note[1]: Pub Key x
 *  note[2]: Pub Key y
 *  note[3]: salt
 *  note[4]: token
 *  note[5]: amount if token is ERC20
 *  note[6]: nft id if token is ERC721
 * For the atomic swap, please see private order matching for zk atomic swap
 * https://ethresear.ch/
 */
template ZkTransaction(tree_depth, n_i, n_o) {
    /** Spending notes - private signals */
    signal input spending_note_eddsa_point[2][n_i]; // pG, when P = poseidon(pG.x, pG.y, n)
    signal input spending_note_eddsa_sig[3][n_i]; // eddsa(p, pG)
    signal input spending_note_nullifier_seed[n_i]; // n, when P = poseidon(pG.x, pG.y, n)
    signal input spending_note_salt[n_i];
    signal input spending_note_eth[n_i];
    signal input spending_note_token_addr[n_i];
    signal input spending_note_erc20[n_i];
    signal input spending_note_erc721[n_i];
    signal input note_index[n_i];
    signal input siblings[tree_depth][n_i];
    /** Spending notes - public signals */
    signal input inclusion_references[n_i]; 
    signal input nullifiers[n_i]; // prevents double-spending

    /** New utxos - private signals */
    signal input new_note_spending_pubkey[n_o];
    signal input new_note_salt[n_o];
    signal input new_note_eth[n_o];
    signal input new_note_token_addr[n_o];
    signal input new_note_erc20[n_o];
    signal input new_note_erc721[n_o];
    /** New utxos - public signals */
    signal input new_note_hash[n_o];
    signal input typeof_new_note[n_o]; // 0: UTXO, 1: Withdrawal, 2: Migration

    /** 
     * public_data is Only for Withdrawal or Migration outflow.
     * Default values for UTXO are zero.
     */
    signal input public_data_to[n_o];
    signal input public_data_eth[n_o];
    signal input public_data_token_addr[n_o];
    signal input public_data_erc20[n_o];
    signal input public_data_erc721[n_o];
    signal input public_data_fee[n_o];
    
    /** Transaction metadata - public signals */
    signal input fee; // tx fee
    signal input swap; // for atomic swap


    /** MPC atomic swap binder TODO later
    signal input binding_factors[9];
    */

    /** MPC atomic swap: TODO later
    signal input binder[2]; // default: (0, 1)
    signal input counterpart_computation[2]; // default: (0, 1)
    */

    /** Constraints */

    /// Calculate spending pubkey
    component spending_pubkeys[n_i];
    for(var i = 0; i < n_i; i ++) {
        spending_pubkeys[i] = SpendingPubKey();
        spending_pubkeys[i].pubkey_x <== spending_note_eddsa_point[0][i];
        spending_pubkeys[i].pubkey_y <== spending_note_eddsa_point[1][i];
        spending_pubkeys[i].nullifier_seed <== spending_note_nullifier_seed[i];
    }
    
    /// Calculate asset hash
    component spending_note_asset[n_i];
    for(var i = 0; i < n_i; i++) {
        spending_note_asset[i] = AssetHash();
        spending_note_asset[i].eth <== spending_note_eth[i];
        spending_note_asset[i].token_addr <== spending_note_token_addr[i];
        spending_note_asset[i].erc20 <== spending_note_erc20[i];
        spending_note_asset[i].erc721 <== spending_note_erc721[i];
    }

    /// Calculate spending note hash using spending pubkey
    component note_hashes[n_i];
    for(var i = 0; i < n_i; i ++) {
        note_hashes[i] = NoteHash();
        note_hashes[i].spending_pubkey <== spending_pubkeys[i].out;
        note_hashes[i].salt <== spending_note_salt[i];
        note_hashes[i].asset_hash <== spending_note_asset[i].out;
    }

    /// Check the EdDSA signature
    component ownership_proof[n_i];
    for(var i = 0; i < n_i; i ++) {
        ownership_proof[i] = OwnershipProof();
        ownership_proof[i].note <== note_hashes[i].out;
        ownership_proof[i].pub_key[0] <== spending_note_eddsa_point[0][i];
        ownership_proof[i].pub_key[1] <== spending_note_eddsa_point[1][i];
        ownership_proof[i].sig[0] <== spending_note_eddsa_sig[0][i];
        ownership_proof[i].sig[1] <== spending_note_eddsa_sig[1][i];
        ownership_proof[i].sig[2] <== spending_note_eddsa_sig[2][i];
    }

    /// Nullifier proof
    component spending_nullifier[n_i];
    for(var i = 0; i < n_i; i ++) {
        spending_nullifier[i] = Nullifier();   // Constant
        spending_nullifier[i].nullifier_seed <== spending_note_nullifier_seed[i]; // nullifier seed
        spending_nullifier[i].leaf_index <== note_index[i]; // leaf index
        spending_nullifier[i].out === nullifiers[i];
    }    

    /// Inclusion proof
    component inclusion_proof[n_i];
    for(var i = 0; i < n_i; i ++) {
        inclusion_proof[i] = InclusionProof(tree_depth);
        inclusion_proof[i].root <== inclusion_references[i];
        inclusion_proof[i].leaf <== note_hashes[i].out;
        inclusion_proof[i].path <== note_index[i];
        for(var j = 0; j < tree_depth; j++) {
            inclusion_proof[i].siblings[j] <== siblings[j][i];
        }
    }

    /// Calculate new notes' asset hash
    component new_note_asset[n_o];
    for(var i = 0; i < n_o; i ++) {
        new_note_asset[i] = AssetHash();
        new_note_asset[i].eth <== new_note_eth[i];
        new_note_asset[i].token_addr <== new_note_token_addr[i];
        new_note_asset[i].erc20 <== new_note_erc20[i];
        new_note_asset[i].erc721 <== new_note_erc721[i];
    }
    /// New note hash proof
    // component poseidon_new_note_int[n_o];
    component poseidon_new_note[n_o];
    for(var i = 0; i < n_o; i ++) {
        poseidon_new_note[i] = NoteHash();
        poseidon_new_note[i].spending_pubkey <== new_note_spending_pubkey[i];
        poseidon_new_note[i].salt <== new_note_salt[i];
        poseidon_new_note[i].asset_hash <== new_note_asset[i].out;
        poseidon_new_note[i].out === new_note_hash[i];
    }

    /// Public data. "public_data.to == 0" means this note is a UTXO.
    /// Therefore if then every properties of public data must be zero.
    component revealed_eth[n_o];
    component revealed_token_addr[n_o];
    component revealed_erc20_amount[n_o];
    component revealed_erc721_id[n_o];
    signal typecheck_of_new_note[n_o];
    for(var i = 0; i < n_o; i ++) {
        typecheck_of_new_note[i] <== (typeof_new_note[i] - 1) * (typeof_new_note[i] - 2);
        typecheck_of_new_note[i] * typeof_new_note[i] === 0;

        revealed_eth[i] = IfElseThen(1);
        revealed_eth[i].obj1[0] <== typeof_new_note[i];
        revealed_eth[i].obj2[0] <== 0; // internal utxo type
        revealed_eth[i].if_v <== 0; // Do not reveal value
        revealed_eth[i].else_v <== new_note_eth[i]; // eth amount

        revealed_token_addr[i] = IfElseThen(1);
        revealed_token_addr[i].obj1[0] <== typeof_new_note[i];
        revealed_token_addr[i].obj2[0] <== 0; // internal utxo type
        revealed_token_addr[i].if_v <== 0; // Do not reveal value
        revealed_token_addr[i].else_v <== new_note_token_addr[i]; // token addr

        revealed_erc20_amount[i] = IfElseThen(1);
        revealed_erc20_amount[i].obj1[0] <== typeof_new_note[i];
        revealed_erc20_amount[i].obj2[0] <== 0; // internal utxo type
        revealed_erc20_amount[i].if_v <== 0; // Do not reveal nothing
        revealed_erc20_amount[i].else_v <== new_note_erc20[i]; // erc20 amount

        revealed_erc721_id[i] = IfElseThen(1);
        revealed_erc721_id[i].obj1[0] <== typeof_new_note[i];
        revealed_erc721_id[i].obj2[0] <== 0; // internal utxo type
        revealed_erc721_id[i].if_v <== 0; // Do not reveal nothing
        revealed_erc721_id[i].else_v <== new_note_erc721[i]; // erc721 id

        public_data_eth[i] === revealed_eth[i].out;
        public_data_token_addr[i] === revealed_token_addr[i].out;
        public_data_erc20[i] === revealed_erc20_amount[i].out;
        public_data_erc721[i] === revealed_erc721_id[i].out;
    }

    /// Range limitation to prevent overflow. Techincal maximum of inputs: 256
    var range_limit = (0 - 1) >> 8;
    component inflow_eth_range[n_i];
    for(var i = 0; i < n_i; i ++) {
        inflow_eth_range[i] = RangeLimit(245);
        inflow_eth_range[i].in <== spending_note_eth[i];
    }
    component inflow_erc20_range[n_i];
    for(var i = 0; i < n_i; i ++) {
        inflow_erc20_range[i] = RangeLimit(245);
        inflow_erc20_range[i].in <== spending_note_erc20[i];
    }
    component outflow_eth_range[n_o];
    for(var i = 0; i < n_o; i ++) {
        outflow_eth_range[i] = RangeLimit(245);
        outflow_eth_range[i].in <== new_note_eth[i];
    }
    component outflow_erc20_range[n_o];
    for(var i = 0; i < n_o; i ++) {
        outflow_erc20_range[i] = RangeLimit(245);
        outflow_erc20_range[i].in <== new_note_erc20[i];
    }

    /// Zero sum proof of ETH
    var eth_inflow = 0;
    var eth_outflow = 0;
    for ( var i = 0; i < n_i; i++) {
        eth_inflow += spending_note_eth[i];
    }
    for ( var i = 0; i < n_o; i++) {
        eth_outflow += new_note_eth[i]; // eth
        eth_outflow += public_data_fee[i]; // fee for withdrawal or migration, default = 0
    }
    eth_outflow += fee;
    eth_inflow === eth_outflow;

    ///  Only one of ERC20 and ERC721 exists.
    for(var i = 0; i < n_i; i ++) {
        spending_note_erc20[i]*spending_note_erc721[i] === 0;
    }
    for(var i = 0; i < n_o; i ++) {
        new_note_erc20[i]*new_note_erc721[i] === 0;
    }


    /// Zero sum proof of ERC20
    component inflow_erc20[n_i];
    component outflow_erc20[n_i];
    for (var i = 0; i <n_i; i++) {
        inflow_erc20[i] = ERC20Sum(n_i);
        outflow_erc20[i] = ERC20Sum(n_o);
        inflow_erc20[i].addr <== spending_note_token_addr[i];
        outflow_erc20[i].addr <== spending_note_token_addr[i];
        for (var j = 0; j <n_i; j++) {
            inflow_erc20[i].note_addr[j] <== spending_note_token_addr[j];
            inflow_erc20[i].note_amount[j] <== spending_note_erc20[j];
        }
        for (var j = 0; j <n_o; j++) {
            outflow_erc20[i].note_addr[j] <== new_note_token_addr[j];
            outflow_erc20[i].note_amount[j] <== new_note_erc20[j];
        }
        inflow_erc20[i].out === outflow_erc20[i].out;
    }

    /// Non fungible proof of ERC721
    component non_fungible = NonFungible(n_i, n_o);
    for(var i = 0; i < n_i; i++) {
        non_fungible.prev_token_addr[i] <== spending_note_token_addr[i];
        non_fungible.prev_token_nft[i] <== spending_note_erc721[i];
    }
    for(var i = 0; i < n_o; i++) {
        non_fungible.post_token_addr[i] <== new_note_token_addr[i];
        non_fungible.post_token_nft[i] <== new_note_erc721[i];
    }
}
