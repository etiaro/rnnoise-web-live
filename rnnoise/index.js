// @flow

// Script expects to find rnnoise webassembly binary in the same public path root, otherwise it won't load
// During the build phase this needs to be taken care of manually
import rnnoiseWasmInit from './wasm/index.js';

import RnnoiseProcessor from './RnnoiseProcessor.js';

export { RNNOISE_SAMPLE_LENGTH } from './RnnoiseProcessor.js';

let rnnoiseModule;

export function createRnnoiseProcessor(data) {
  if (!rnnoiseModule) {
    rnnoiseModule = rnnoiseWasmInit(null, data);
  }
  return rnnoiseModule.then((mod) => new RnnoiseProcessor(mod));
}
