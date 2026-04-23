pragma circom 2.1.2;

include "circuits/hydra-s2.circom";

// Instantiate hydraS2 with small merkle tree heights for direct verification.
// Public signals match the original component main in circuits/hydra-s2.circom.
component main {public [commitmentMapperPubKey, registryTreeRoot, vaultNamespace, vaultIdentifier, requestIdentifier, proofIdentifier, destinationIdentifier, statementValue, extraData, accountsTreeValue, statementComparator, sourceVerificationEnabled, destinationVerificationEnabled]} = hydraS2(2, 2);
