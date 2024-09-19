# fastfile

fastfile is a package to read/write binary files with a transparent cache.

This library maintains a read and write cache that allows to write asynchronously
improving the speed of the reads and writes of big files.

## Usage

```
npm install fastfile
```

```javascript

const fastFile = require("fastfile");

async function writeFile() {
    const f = await fastFile.createOverride("pattern.bin");

    const buff = Buffer.from("0001020304050607", "hex");
    for (let i=0; i<1000; i++) {
        await f.write(buff, i*8);
    }

    await f.close();
}

async function readFile() {
    const f = await fastFile.readExisting("pattern.bin");

    const buff = await f.read(16, 8);

    await f.close();

    return buff;

}

writeFile().then( () => {
    readFile().then( (buff) => {
        console.log(buff.toString("hex"));
    });
});

```

## License

fastfile is part of the iden3 project copyright 2018 0KIMS association and published with GPL-3 license. Please check the COPYING file for more details.

