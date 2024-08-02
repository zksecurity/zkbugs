const wc  = require("./witness_extractor.js");
const { readFileSync, writeFile } = require("fs");

if (process.argv.length != 5) {
    console.log("Usage: node export_witness.js <file.wasm> <circuit.json> <output.wtns>");
} else {
    const input = JSON.parse(readFileSync(process.argv[3], "utf8"));
    
    const buffer = readFileSync(process.argv[2]);
    wc(buffer).then(async witnessExtractor => {
	const buff= await witnessExtractor.fromJSONtoWTNSBin(input,0);
	writeFile(process.argv[4], buff, function(err) {
	    if (err) throw err;
	});
    });
}
