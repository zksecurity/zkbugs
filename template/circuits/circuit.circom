pragma circom 2.0.0;

// TODO: This is a "wrapper" circuit that includes the "implementation" circuit
include "./montgomery.circom";

// TODO: Initialize the "implementation" circuit, providing parameters and mark public inputs as needed
component main = Montgomery2Edwards();
