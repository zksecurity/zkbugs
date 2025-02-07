pragma circom 2.0.0;

include "./lib/processMessages.circom";

component main {public [inputHash]} = ProcessMessages(10, 2, 1, 2);
