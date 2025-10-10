pragma circom 2.1.9;

include "./vc_and_disclose_aadhaar.circom";

component main { public
    [
        attestation_id,
        currentYear,
        currentMonth,
        currentDay,
        ofac_name_dob_smt_root,
        ofac_name_yob_smt_root,
        merkle_root,
        scope,
        user_identifier
    ]
} = VC_AND_DISCLOSE_Aadhaar(1, 4, 8, 8);