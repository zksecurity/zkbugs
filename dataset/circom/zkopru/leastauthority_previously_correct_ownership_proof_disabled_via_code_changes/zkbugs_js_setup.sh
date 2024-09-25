rm -r eddsa-input-generator
mkdir eddsa-input-generator
cp generateInput.js eddsa-input-generator/
cd eddsa-input-generator
npm init -y
npm install circomlibjs
npm install crypto
cd ..
