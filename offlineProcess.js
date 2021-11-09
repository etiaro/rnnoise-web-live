import { createRnnoiseProcessor, RNNOISE_SAMPLE_LENGTH } from './rnnoise/index.js';

let audioContext;
const SAMPLE_LENGTH = 480;

window.processBlob = (blob, cb)=>{
    if(!audioContext) audioContext = new AudioContext({sampleRate: 44100});
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(blob);
    fileReader.onloadend = () => {
        let arrayBuffer = fileReader.result;
        audioContext.decodeAudioData(arrayBuffer, async (audioBuffer) => {
            const processor = await createRnnoiseProcessor();
            for(let ch = 0; ch < audioBuffer.numberOfChannels; ch++){
                const input = audioBuffer.getChannelData(0);
                const output = new Float32Array(input.length);
                for(let i = 0; i+RNNOISE_SAMPLE_LENGTH < audioBuffer.length; i += SAMPLE_LENGTH){
                    let tmp = [];
                    processor.calculateRnnoiseOutput(input.slice(i, i+RNNOISE_SAMPLE_LENGTH), tmp, SAMPLE_LENGTH);
                    output.set(tmp, i);
                }
                audioBuffer.copyToChannel(output, ch);
            }
            cb(audioBufferToBlob(audioBuffer));
        });
    }
}

window.blobToWav = (blob, cb)=>{
  if(!audioContext) audioContext = new AudioContext({sampleRate: 44100});
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(blob);
    fileReader.onloadend = () => {
        let arrayBuffer = fileReader.result;
        audioContext.decodeAudioData(arrayBuffer, async (audioBuffer) => {
          cb(audioBufferToBlob(audioBuffer));
        });
      }
}



function audioBufferToBlob(audioBuffer){
    const channels = audioBuffer.numberOfChannels;
    const [left, right] =  [
        audioBuffer.getChannelData(0), 
        channels > 1 ? audioBuffer.getChannelData(1) : new Float32Array(audioBuffer.length)
    ];

    // interleaved
    const interleaved = new Float32Array(left.length + right.length)
    for (let src=0, dst=0; src < left.length; src++, dst+=2) {
    interleaved[dst] =   left[src]
    interleaved[dst+1] = right[src]
    }

    // get WAV file bytes and audio params of your audio source
    const wavBytes = getWavBytes(interleaved.buffer, {
        isFloat: true,       // floating point or 16-bit integer
        numChannels: 2,
        sampleRate: 44100,
    })
    const wav = new Blob([wavBytes], { type: 'audio/wav' })
    return wav;
}


// Returns Uint8Array of WAV bytes
function getWavBytes(buffer, options) {
    const type = options.isFloat ? Float32Array : Uint16Array
    const numFrames = buffer.byteLength / type.BYTES_PER_ELEMENT
  
    const headerBytes = getWavHeader(Object.assign({}, options, { numFrames }))
    const wavBytes = new Uint8Array(headerBytes.length + buffer.byteLength);
  
    // prepend header, then add pcmBytes
    wavBytes.set(headerBytes, 0)
    wavBytes.set(new Uint8Array(buffer), headerBytes.length)
  
    return wavBytes
  }
  
  // adapted from https://gist.github.com/also/900023
  // returns Uint8Array of WAV header bytes
  function getWavHeader(options) {
    const numFrames =      options.numFrames
    const numChannels =    options.numChannels || 2
    const sampleRate =     options.sampleRate || 44100
    const bytesPerSample = options.isFloat? 4 : 2
    const format =         options.isFloat? 3 : 1
  
    const blockAlign = numChannels * bytesPerSample
    const byteRate = sampleRate * blockAlign
    const dataSize = numFrames * blockAlign
  
    const buffer = new ArrayBuffer(44)
    const dv = new DataView(buffer)
  
    let p = 0
  
    function writeString(s) {
      for (let i = 0; i < s.length; i++) {
        dv.setUint8(p + i, s.charCodeAt(i))
      }
      p += s.length
    }
  
    function writeUint32(d) {
      dv.setUint32(p, d, true)
      p += 4
    }
  
    function writeUint16(d) {
      dv.setUint16(p, d, true)
      p += 2
    }
  
    writeString('RIFF')              // ChunkID
    writeUint32(dataSize + 36)       // ChunkSize
    writeString('WAVE')              // Format
    writeString('fmt ')              // Subchunk1ID
    writeUint32(16)                  // Subchunk1Size
    writeUint16(format)              // AudioFormat
    writeUint16(numChannels)         // NumChannels
    writeUint32(sampleRate)          // SampleRate
    writeUint32(byteRate)            // ByteRate
    writeUint16(blockAlign)          // BlockAlign
    writeUint16(bytesPerSample * 8)  // BitsPerSample
    writeString('data')              // Subchunk2ID
    writeUint32(dataSize)            // Subchunk2Size
  
    return new Uint8Array(buffer)
  }