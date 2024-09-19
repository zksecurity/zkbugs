# blake-hash

This module provides native bindings to [Blake][1] [[pdf][2]]. In browser pure JavaScript implementation will be used.

## Usage

You can use this package as [node Hash][3].

```js
const createBlakeHash = require('blake-hash')

console.log(createBlakeHash('blake256').digest().toString('hex'))
// => 716f6e863f744b9ac22c97ec7b76ea5f5908bc5b2f67c61510bfc4751384ea7a

console.log(createBlakeHash('blake256').update('Hello world!').digest('hex'))
// => e0d8a3b73d07feca605c2376f5e54820cf8280af4a195d125ff5eadbf214adf3
```

## LICENSE

This library is free and open-source software released under the MIT license.

[1]: http://131002.net/blake/
[2]: http://131002.net/blake/blake.pdf
[3]: https://nodejs.org/api/crypto.html#crypto_class_hash
