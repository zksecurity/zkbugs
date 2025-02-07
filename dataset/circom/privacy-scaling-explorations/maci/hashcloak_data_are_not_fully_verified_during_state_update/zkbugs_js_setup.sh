rm -r maci-input-generator
mkdir maci-input-generator
cd maci-input-generator
npm init -y
npm install maci-core@1.1.0 maci-domainobjs@1.1.0 maci-crypto@1.1.0
cp ../generateInput.js .
cd ..