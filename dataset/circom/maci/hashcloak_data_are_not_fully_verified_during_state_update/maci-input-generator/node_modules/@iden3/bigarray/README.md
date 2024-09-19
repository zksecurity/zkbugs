# bigarray

Array object for nodejs that Support millions of elements

## usage

```
npm install bigarray
```

```
import BigArray from "@iden3/bigarray";

A = new BigArray(1000000);

for (let i=0; i<1000000; i++) {
	A.push({
		num: i;
		square: i*i;
	});
}

console.log(A[3].num * A[700000].square);
```
