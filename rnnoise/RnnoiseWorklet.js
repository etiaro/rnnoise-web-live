import { createRnnoiseProcessor, RNNOISE_SAMPLE_LENGTH } from './index.js';

class RnnoiseProcessorrr extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.init(options.processorOptions.wasm);
    this.buffer = [];
    this.outputBuffer = [];
  }
  async init(data) {
    this.processor = await createRnnoiseProcessor(data);
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const input = inputs[0];
    for (let ch = 0; ch < input.length; ch++) {
      if (this.buffer.length <= ch) this.buffer[ch] = [];
      if (this.outputBuffer.length <= ch) this.outputBuffer[ch] = [];
      // add input at the end
      this.buffer[ch].push(...input[ch]);
      
      if(this.buffer[ch].length >= RNNOISE_SAMPLE_LENGTH)
        this.processor.calculateRnnoiseOutput(this.buffer[ch].splice(0, RNNOISE_SAMPLE_LENGTH), this.outputBuffer[ch], RNNOISE_SAMPLE_LENGTH);

      output[ch].set(this.outputBuffer[ch].splice(0,128));
    }

    return true;
  }
}

registerProcessor('rnnoise-processor', RnnoiseProcessorrr);
