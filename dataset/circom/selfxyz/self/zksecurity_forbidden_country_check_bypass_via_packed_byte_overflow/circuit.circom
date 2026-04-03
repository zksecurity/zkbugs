pragma circom 2.1.9;
include "circuits/circuits/utils/passport/customHashers.circom";
include "circuits/circuits/utils/aadhaar/disclose/country_not_in_list.circom";
component main = CountryNotInList(1);
