rm -r rln-input-generator
mkdir rln-input-generator
cp generateInput.js rln-input-generator/
cd rln-input-generator
npm init -y
npm install @zk-kit/incremental-merkle-tree@1.0.0
npm install poseidon-lite@0.0.2
npm install ffjavascript
cd ..
