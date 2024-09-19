# ffjavascript

Finite Field Library in Javascript

This package is tested to work in the following environments:

- **NodeJS**
- **Browser**
- **Chrome Extension**
- **Metamask Snaps (SES)**

## Knows Issues

### Webpack Configuration

If you're using the `ffjavascript` package in a webpack project (Next.js/Angular), you may need to disable the `splitChunks` option in your webpack configuration.

```javascript
module.exports = {
  // ...
  optimization: {
    splitChunks: false,
  },
  // ...
};
```

## License

ffjavascript is part of the iden3 project copyright 2020 0KIMS association and published with GPL-3 license. Please check the COPYING file for more details.
