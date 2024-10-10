pragma circom 2.0.5;

function getNumBitsPerRegister() {
    return 55;
}

function getNumRegisters() {
    return 7;
}

function getSyncCommitteeSize() {
    return 512;
}

function getLog2SyncCommitteeSize() {
    return 9;
}

function getFinalizedHeaderDepth() {
    return 6;
}

function getFinalizedHeaderIndex() {
    return 105;
}

function getExecutionStateRootDepth() {
    return 8;
}

function getExecutionStateRootIndex() {
    return 402;
}

function getSyncCommitteeDepth() {
    return 5;
}

function getSyncCommitteeIndex() {
    return 55;
}

function getTruncatedSha256Size() {
    return 253;
}

function getG1PointSize() {
    return 48;
}

function getDomainSeperatorTag() {
    var dst[43];
    dst[0] = 66;
    dst[1] = 76;
    dst[2] = 83;
    dst[3] = 95;
    dst[4] = 83;
    dst[5] = 73;
    dst[6] = 71;
    dst[7] = 95;
    dst[8] = 66;
    dst[9] = 76;
    dst[10] = 83;
    dst[11] = 49;
    dst[12] = 50;
    dst[13] = 51;
    dst[14] = 56;
    dst[15] = 49;
    dst[16] = 71;
    dst[17] = 50;
    dst[18] = 95;
    dst[19] = 88;
    dst[20] = 77;
    dst[21] = 68;
    dst[22] = 58;
    dst[23] = 83;
    dst[24] = 72;
    dst[25] = 65;
    dst[26] = 45;
    dst[27] = 50;
    dst[28] = 53;
    dst[29] = 54;
    dst[30] = 95;
    dst[31] = 83;
    dst[32] = 83;
    dst[33] = 87;
    dst[34] = 85;
    dst[35] = 95;
    dst[36] = 82;
    dst[37] = 79;
    dst[38] = 95;
    dst[39] = 80;
    dst[40] = 79;
    dst[41] = 80;
    dst[42] = 95;
    return dst;
}

function getBLS128381Prime() {
    var p[7];
    p[0] = 35747322042231467;
    p[1] = 36025922209447795;
    p[2] = 1084959616957103;
    p[3] = 7925923977987733;
    p[4] = 16551456537884751;
    p[5] = 23443114579904617;
    p[6] = 1829881462546425;
    return p;
}