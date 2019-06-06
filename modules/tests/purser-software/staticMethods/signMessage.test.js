import { hexSequenceNormalizer } from '@vutr/purser-core/normalizers';
import { messageValidator } from '@vutr/purser-core/validators';

import { signMessage } from '@vutr/purser-software/staticMethods';
import { messageOrDataValidator } from '@vutr/purser-core/helpers';

jest.dontMock('@vutr/purser-software/staticMethods');

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

/*
 * These values are not correct. Do not use the as reference.
 * If the validators wouldn't be mocked, they wouldn't pass.
 */
const mockedMessageSignature = 'mocked-signed-transaction';
const mockedInjectedCallback = jest.fn(transactionObject => {
  if (!transactionObject) {
    throw new Error();
  }
  return mockedMessageSignature;
});
const mockedMessage = 'mocked-message';
const mockedArgumentsObject = {
  message: mockedMessage,
  callback: mockedInjectedCallback,
};
describe('`Software` Wallet Module', () => {
  afterEach(() => {
    mockedInjectedCallback.mockClear();
    hexSequenceNormalizer.mockClear();
    messageValidator.mockClear();
  });
  describe('`signMessage()` static method', () => {
    test('Calls the injected callback', async () => {
      await signMessage(mockedArgumentsObject);
      expect(mockedInjectedCallback).toHaveBeenCalled();
      expect(mockedInjectedCallback).toHaveBeenCalledWith(mockedMessage);
    });
    test('Validates the message string', async () => {
      await signMessage(mockedArgumentsObject);
      expect(messageOrDataValidator).toHaveBeenCalled();
      expect(messageOrDataValidator).toHaveBeenCalledWith(
        expect.objectContaining({
          message: mockedMessage,
        }),
      );
    });
    test('Normalizes the message signature before returning', async () => {
      await signMessage(mockedArgumentsObject);
      /*
       * The message signature hex string
       */
      expect(hexSequenceNormalizer).toHaveBeenCalled();
      expect(hexSequenceNormalizer).toHaveBeenCalledWith(
        mockedMessageSignature,
      );
    });
    test('Throws if something goes wrong', async () => {
      expect(signMessage()).rejects.toThrow();
    });
  });
});
