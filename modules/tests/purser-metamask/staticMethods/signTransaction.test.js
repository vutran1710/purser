import EthereumTx from 'ethereumjs-tx';

import { transactionObjectValidator } from '@vutr/purser-core/helpers';
import { warning } from '@vutr/purser-core/utils';

import { signTransaction } from '@vutr/purser-metamask/staticMethods';
import { methodCaller } from '@vutr/purser-metamask/helpers';
import {
  addressNormalizer,
  hexSequenceNormalizer,
} from '@vutr/purser-core/normalizers';
import {
  addressValidator,
  safeIntegerValidator,
  hexSequenceValidator,
} from '@vutr/purser-core/validators';

import { STD_ERRORS } from '@vutr/purser-metamask/defaults';

jest.dontMock('@vutr/purser-metamask/staticMethods');

jest.mock('@vutr/purser-core/validators');
/*
 * @TODO Fix manual mocks
 * This is needed since Jest won't see our manual mocks (because of our custom monorepo structure)
 * and will replace them with automatic ones
 */
jest.mock('@vutr/purser-core/helpers', () =>
  require('@mocks/purser-core/helpers'),
);
jest.mock('@vutr/purser-core/normalizers', () =>
  require('@mocks/purser-core/normalizers'),
);
jest.mock('@vutr/purser-core/utils', () => require('@mocks/purser-core/utils'));
jest.mock('@vutr/purser-metamask/helpers', () =>
  require('@mocks/purser-metamask/helpers'),
);

/*
 * Mock the injected web3 proxy object
 */
const mockedTransactionHash = 'mocked-transaction-hash';
const mockedRawSignedTransaction = {};
const callbackError = { message: 'no-error-here' };
global.web3 = {
  eth: {
    sendTransaction: jest.fn((transactionObject, callback) =>
      callback(callbackError, mockedTransactionHash),
    ),
    getTransaction: jest.fn(() => Promise.resolve(mockedRawSignedTransaction)),
  },
};

/*
 * Mock ethereumjs-tx serialization
 */
const mockedSerializedSignedTransaction =
  'mocked-serialized-signed-transaction';
jest.mock('ethereumjs-tx', () =>
  jest.fn().mockImplementation(() => ({
    serialize: jest.fn().mockReturnValue({
      toString: jest.fn().mockReturnValue(mockedSerializedSignedTransaction),
    }),
  })),
);

/*
 * These values are not correct. Do not use the as reference.
 * If the validators wouldn't be mocked, they wouldn't pass.
 */
const mockedAddress = 'mocked-address';
const inputData = 'mocked-data';
const gasLimit = 'mocked-gas-limit';
const gasPrice = 'mocked-gas-price';
const nonce = 'mocked-nonce';
const to = 'mocked-destination-address';
const value = 'mocked-transaction-value';
const mockedTransactionObject = {
  gasPrice,
  gasLimit,
  to,
  value,
  inputData,
};
const mockedArgumentsObject = {
  ...mockedTransactionObject,
  from: mockedAddress,
};

describe('`Metamask` Wallet Module Static Methods', () => {
  afterEach(() => {
    global.web3.eth.sendTransaction.mockClear();
    global.web3.eth.getTransaction.mockClear();
    EthereumTx.mockClear();
    methodCaller.mockClear();
    transactionObjectValidator.mockClear();
    addressValidator.mockClear();
    safeIntegerValidator.mockClear();
    hexSequenceValidator.mockClear();
    warning.mockClear();
    addressNormalizer.mockClear();
    hexSequenceNormalizer.mockClear();
  });
  describe('`signTransaction()` static method', () => {
    test('Calls the correct metamask injected method', async () => {
      await signTransaction(mockedArgumentsObject);
      expect(global.web3.eth.sendTransaction).toHaveBeenCalled();
      expect(global.web3.eth.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          from: mockedAddress,
          gasPrice,
          gas: gasLimit,
          data: inputData,
          to,
          value,
        }),
        expect.any(Function),
      );
    });
    test('Detects if the injected proxy is avaialable', async () => {
      await signTransaction(mockedArgumentsObject);
      expect(methodCaller).toHaveBeenCalled();
    });
    test('Validates the transaction object', async () => {
      await signTransaction(mockedArgumentsObject);
      /*
       * Calls the validation helper with the correct values
       */
      expect(transactionObjectValidator).toHaveBeenCalled();
      expect(transactionObjectValidator).toHaveBeenCalledWith(
        mockedTransactionObject,
      );
    });
    test('Throws if no argument provided', async () => {
      expect(signTransaction()).rejects.toThrow();
    });
    test('Validates the `from` address individually', async () => {
      await signTransaction(mockedArgumentsObject);
      /*
       * Calls the validation helper with the correct values
       */
      expect(addressValidator).toHaveBeenCalled();
      expect(addressValidator).toHaveBeenCalledWith(mockedAddress);
    });
    test('Validates the nonce individually (if set)', async () => {
      await signTransaction({
        ...mockedArgumentsObject,
        nonce,
      });
      /*
       * Calls the validation helper with the correct values
       */
      expect(safeIntegerValidator).toHaveBeenCalled();
      expect(safeIntegerValidator).toHaveBeenCalledWith(nonce);
      /*
       * And also warns the user about manually setting a nonce
       */
      expect(warning).toHaveBeenCalled();
    });
    test('And ignores the nonce if not set', async () => {
      await signTransaction(mockedArgumentsObject);
      /*
       * Does not try to validate the nonce
       */
      expect(safeIntegerValidator).not.toHaveBeenCalled();
      /*
       * Also does NOT warn the user
       */
      expect(warning).not.toHaveBeenCalled();
    });
    test('Normalizes some of the transaction input values', async () => {
      await signTransaction(mockedArgumentsObject);
      /*
       * Normalizes the sender's (your) address
       */
      expect(addressNormalizer).toHaveBeenCalled();
      expect(addressNormalizer).toHaveBeenCalledWith(mockedAddress);
      /*
       * Also Normalizes the destination addressw
       */
      expect(addressNormalizer).toHaveBeenCalledWith(to);
      /*
       * Normalizes the transaction input data
       */
      expect(hexSequenceNormalizer).toHaveBeenCalled();
      expect(hexSequenceNormalizer).toHaveBeenCalledWith(inputData);
    });
    test('Validates the transaction hash received from signing', async () => {
      await signTransaction(mockedArgumentsObject);
      expect(hexSequenceValidator).toHaveBeenCalled();
      expect(hexSequenceValidator).toHaveBeenCalledWith(mockedTransactionHash);
    });
    test('Normalizes the transaction hash received from signing', async () => {
      await signTransaction(mockedArgumentsObject);
      expect(hexSequenceNormalizer).toHaveBeenCalled();
      expect(hexSequenceNormalizer).toHaveBeenCalledWith(mockedTransactionHash);
    });
    test('Returns the valid hash received from signing', async () => {
      const signedTransaction = await signTransaction(mockedArgumentsObject);
      expect(global.web3.eth.getTransaction).toHaveBeenCalled();
      expect(signedTransaction).toEqual(mockedSerializedSignedTransaction);
    });
    test('Throws if something goes wrong while signing', async () => {
      /*
       * Mock it locally to simulate an error
       */
      hexSequenceValidator.mockImplementation(() => {
        throw new Error();
      });
      expect(signTransaction(mockedArgumentsObject)).rejects.toThrow();
    });
    test('Warns if the user cancelled signing the message', async () => {
      /*
       * Mock it locally to simulate an error
       */
      hexSequenceValidator.mockImplementation(() => {
        throw new Error();
      });
      global.web3.eth.sendTransaction.mockImplementation(
        (transactionObject, callback) =>
          callback(
            { ...callbackError, message: STD_ERRORS.CANCEL_TX_SIGN },
            mockedTransactionHash,
          ),
      );
      expect(() => signTransaction(mockedArgumentsObject)).not.toThrow();
      expect(warning).toHaveBeenCalled();
    });
  });
});
