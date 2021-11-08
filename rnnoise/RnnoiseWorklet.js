import { createRnnoiseProcessor, RNNOISE_SAMPLE_LENGTH } from './index.js';

class RnnoiseProcessorrr extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.init(options.processorOptions.wasm);
    this.buffer = [];
  }
  async init(data) {
    this.processor = await createRnnoiseProcessor(data);
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const input = inputs[0];
    for (let ch = 0; ch < output.length; ch++) {
      if (this.buffer.length <= ch) this.buffer[ch] = new Float32Array(RNNOISE_SAMPLE_LENGTH);
      // move everything by input length
      for (let i = 0; i < RNNOISE_SAMPLE_LENGTH - input[ch].length; i++) {
        this.buffer[ch][i] = this.buffer[ch][i + input[ch].length];
      }
      // add input at the end
      this.buffer[ch].set(input[ch], RNNOISE_SAMPLE_LENGTH - input[ch].length);
      // copy buffer because rnnoise is modifying input array
      this.processor.calculateRnnoiseOutput(this.buffer[ch].slice(0), output[ch], input[ch].length);
    }

    return true;
  }
}

registerProcessor('rnnoise-processor', RnnoiseProcessorrr);
