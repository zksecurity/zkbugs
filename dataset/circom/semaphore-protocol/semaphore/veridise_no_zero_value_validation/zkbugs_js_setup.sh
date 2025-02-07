rm -r semaphore-input-generator
mkdir semaphore-input-generator
cp generateInput.js semaphore-input-generator/
cd semaphore-input-generator
npm init -y
npm install circomlibjs @ethersproject/bignumber @ethersproject/bytes @ethersproject/keccak256
cd ..
