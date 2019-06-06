---
title: '@vutr/purser-metamask'
section: Modules
order: 2
---

These docs serve to outline the `API` format and methods provided by the `@colony/purser-metamsk` library.

Unlike other wallet libraries, this one works entirely in `async` mode, meaning every `return` will be a `Promise` that must `resolve` _(or `reject`, if something goes wrong...)_.

#### Console output

In `development` mode there will be a number of warnings or errors outputted verbosely to the console.

When building with `NODE_ENV=production` all output will be silenced.

### Metmask

A browser extension that provides a more secure interface to a software wallet. Available for [Chrome](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn), [Firefox](https://addons.mozilla.org/en-US/firefox/addon/ether-metamask/) or [Opera](https://addons.opera.com/en/extensions/details/metamask/).

For a more in-depth look at what the resulting object looks like, see the [Common Wallet Interface](/purser/interface-common-wallet-interface/) docs.

#### Note: Transaction signing and implicit sending

Although this library focuses to be offline, this is not entirely true in the case of Metamask. This is because Metamask doesn't allow you to just sign a transaction. After signing, it will also broadcast it to the network.

Currently this cannot be overcome and you as a developer have to be aware of it.

There's an issue tracking the progress of this currently: [MetaMask/metamask-extension#3475](https://github.com/MetaMask/metamask-extension/issues/3475).

#### Note: Metamask upgrade to EIP-1102

Metamask's newest version implements [EIP-1102](https://eips.ethereum.org/EIPS/eip-1102). Since [release v1.2.0](https://github.com/JoinColony/purser/releases/tag/v1.2.0-rc.0) this functionality has also been added to `purser-metamask`.

While the API has not benn changed, there are some under-the-hood changes done to the `open()` method of the package.

Since this change been made backwards compatible, you won't have to modify any existing code _(You you will get a warning in `dev` mode if you're running in Legacy)_, but do keep in mind that your users will need to go through an extra step to allow the extension on your domain.

See more details about the change in [the official announcement](https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8).

#### Imports:

There are different ways in which you can import the library in your project _(as a module)_, but in the end they all bring in the same thing:

Using `ES5` `require()` statements:
```js
var metamask = require('@vutr/purser-metamask'); // metamask.open().then();

var open = require('@vutr/purser-metamask').open; // open().then();
```

Using `ES6` `import` statements:
```js
import metamask from '@vutr/purser-metamask'; // await metamask.open();

import { open } from '@vutr/purser-metamask'; // await open();
```

## Methods

### `open`

```js
await open(walletArguments: Object);
```

This method returns a `Promise` which, after resolving, it will `return` a new `MetamaskWallet` instance object. _(See: [Common Wallet Interface](/purser/interface-common-wallet-interface/) for details)_.

Unlike the other wallet types in this library, this static method does not take any arguments. It will use the selected address from Metamask.

**Note:**

_If Metamask is not unlocked it cannot access the address, so an Error will be thrown._

**Usage examples:**

Open the metamask wallet:
```js
import { open } from '@vutr/purser-metamask';

const wallet = await open();
```

### `detect`

```js
await detect();
```

This is a helper method to detect if the Metamask injected `web3` proxy instance is available. It's not necessary for you to use since it's baked into the library, it's just exposed here for convenience.

This method returns a `Promise` which, after resolving, it will `return` only return `true`, if the Metamask instance is available and can be interacted with _(not locked)_. Otherwise it will `throw` an Error with the specific problem it encountered.

**Usage examples:**

Detect if Metamask is available:
```js
import { detect as isMetamaskAvailable } from '@vutr/purser-metamask';

await isMetamaskAvailable(); // true
```

### `accountChangeHook`

```js
await accountChangeHook(callback: Function);
```

This is a utility method to allow end users to hook into Metamask's State Event Observer, and execute a callback when that changes. _(Eg: When an account is changed in the Metamask UI)_

This method takes a callback as an argument, which will be added to the state events array. When the state changes, all the callbacks added to that array are called in order.

When this is is called, it will receive a `state` Object as an only argument, Object which contains the new updated state.

This utility method is useful to act on account changes from within a dApp. _(Eg: To logout a user)_

**Note:**

_Opening Metamaks's UI counts as a State Event Change, so your callback will be called each time. It's up to you to provide a filtering._

**Usage examples:**

Hook into the state change events with a simple callback:
```js
import { accountChangeHook } from '@vutr/purser-metamask';

const walletChangedCallback = (state) => {
  console.log(`The State Change Event triggered!`, state);
};

await accountChangeHook(walletChangedCallback);
```

Hook into the state change events with filtering:
```js
import { open, accountChangeHook } from '@vutr/purser-metamask';

const metamaskInstance = await open();
let addressState = metamaskInstance.address;

const walletChangedCallback = ({ selectedAddress }) => {
  /*
   * Note that you can't use `metamaskInstance.address` to compare
   * since that will always reflect the newly selected address.
   * It uses the same method `accountChangeHook` internally to achieve this
   */
  if (addressState !== selectedAddress) {
    addressState = selectedAddress;
    console.log(`You changed your wallet. The new address is: ${selectedAddress}`);
  }
};

await accountChangeHook(walletChangedCallback);
```
