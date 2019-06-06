import { warning } from '@vutr/purser-core/utils';

import { signMessage } from '@vutr/purser-metamask/staticMethods';
import { methodCaller } from '@vutr/purser-metamask/helpers';
import { hexSequenceNormalizer } from '@vutr/purser-core/normalizers';
import {
  addressValidator,
  messageValidator,
  hexSequenceValidator,
} from '@vutr/purser-core/validators';
import { messageOrDataValidator } from '@vutr/purser-core/helpers';

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
const mockedMessageSignature = 'mocked-message-signature';
const callbackError = { message: 'no-error-here' };
global.web3 = {
  eth: {
    personal: {
      sign: jest.fn((message, address, callback) =>
        callback(callbackError, mockedMessageSignature),
      ),
    },
  },
};
/*
 * Mock the Buffer global object
 */
const mockedToString = jest.fn(function mockedToString() {
  return this;
});
global.Buffer = {
  from: jest.fn(value => ({
    toString: mockedToString.bind(value),
  })),
};

/*
 * These values are not correct. Do not use the as reference.
 * If the validators wouldn't be mocked, they wouldn't pass.
 */
const mockedAddress = 'mocked-address';
const mockedMessage = 'mocked-message';
const mockedArgumentsObject = {
  message: mockedMessage,
  currentAddress: mockedAddress,
};

describe('`Metamask` Wallet Module Static Methods', () => {
  afterEach(() => {
    global.web3.eth.personal.sign.mockClear();
    global.Buffer.from.mockClear();
    methodCaller.mockClear();
    addressValidator.mockClear();
    messageValidator.mockClear();
    hexSequenceValidator.mockClear();
    warning.mockClear();
    hexSequenceNormalizer.mockClear();
  });
  describe('`signMessage()` static method', () => {
    test('Calls the correct metamask injected method', async () => {
      await signMessage(mockedArgumentsObject);
      expect(global.web3.eth.personal.sign).toHaveBeenCalled();
      expect(global.web3.eth.personal.sign).toHaveBeenCalledWith(
        mockedMessage,
        mockedAddress,
        expect.any(Function),
      );
    });
    test('Detects if the injected proxy is avaialable', async () => {
      await signMessage(mockedArgumentsObject);
      expect(methodCaller).toHaveBeenCalled();
    });
    test('Throws if no argument provided', async () => {
      /*
       * Because of the way we mocked it (and not just spyed of it), jest doesn't
       * allow us to automatically restore it using `mockRestore`, so we actually
       * have to re-write part of it's functionality.
       *
       * See:https://jestjs.io/docs/en/mock-function-api.html#mockfnmockrestore
       */
      addressValidator.mockImplementation(value => {
        if (!value) {
          throw new Error();
        }
        return true;
      });
      expect(signMessage()).rejects.toThrow();
    });
    test('Validates the `currentAddress` individually', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * Calls the validation helper with the correct values
       */
      expect(addressValidator).toHaveBeenCalled();
      expect(addressValidator).toHaveBeenCalledWith(mockedAddress);
    });
    test('Validates the `message` string individually', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * Calls the validation helper with the correct values
       */
      expect(messageOrDataValidator).toHaveBeenCalled();
      expect(messageOrDataValidator).toHaveBeenCalledWith(
        expect.objectContaining({
          message: mockedMessage,
        }),
      );
    });
    test('Normalizes the message before sending it to Metamask', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * Calls the validation helper with the correct values
       */
      expect(hexSequenceNormalizer).toHaveBeenCalled();
      expect(hexSequenceNormalizer).toHaveBeenCalledWith(mockedMessage);
    });
    test('Validates the returned message signature', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * Calls the validation helper with the correct values
       */
      expect(hexSequenceValidator).toHaveBeenCalled();
      expect(hexSequenceValidator).toHaveBeenCalledWith(mockedMessageSignature);
    });
    test('Normalizes the message signature before returning', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * Calls the validation helper with the correct values
       */
      expect(hexSequenceNormalizer).toHaveBeenCalled();
      expect(hexSequenceNormalizer).toHaveBeenCalledWith(
        mockedMessageSignature,
      );
    });
    test('Returns the message signature', async () => {
      const messageSignature = await signMessage(mockedArgumentsObject);
      expect(messageSignature).toEqual(mockedMessageSignature);
    });
    test('Throws if something goes wrong while signing', async () => {
      /*
       * Mock it locally to simulate an error
       */
      hexSequenceValidator.mockImplementation(() => {
        throw new Error();
      });
      expect(signMessage(mockedArgumentsObject)).rejects.toThrow();
    });
    test('Warns if the user cancelled signing the message', async () => {
      /*
       * Mock it locally to simulate an error
       */
      hexSequenceValidator.mockImplementation(() => {
        throw new Error();
      });
      global.web3.eth.personal.sign.mockImplementation(
        (message, address, callback) =>
          callback(
            { ...callbackError, message: STD_ERRORS.CANCEL_MSG_SIGN },
            mockedMessageSignature,
          ),
      );
      expect(() => signMessage(mockedArgumentsObject)).not.toThrow();
      expect(warning).toHaveBeenCalled();
    });
  });
});
