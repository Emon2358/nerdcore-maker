// This AudioWorkletProcessor handles audio output for ZMUSIC.
// It receives audio buffers (left and right channels) via its message port.
// If no data is received, it outputs silence.

class ZMUSICProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Initialize default buffers for left and right channels with a size of 128 samples.
    this.bufferL = new Float32Array(128);
    this.bufferR = new Float32Array(128);
    this.ready = false;
    
    // Listen for incoming messages from the host.
    this.port.onmessage = event => {
      if (event.data.command === 'data') {
        // Copy the data received into the local buffers.
        // We assume that event.data.left and event.data.right contain the correct Float32Array data.
        if (event.data.left && event.data.right) {
          // If the incoming buffer lengths differ from our defaults, adjust the buffer sizes.
          const length = event.data.left.length;
          this.bufferL = new Float32Array(length);
          this.bufferR = new Float32Array(length);
          
          // Copy the incoming data.
          this.bufferL.set(event.data.left);
          this.bufferR.set(event.data.right);
          this.ready = true;
        }
      }
    };
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];

    if (this.ready) {
      // If new audio data has been received, output it.
      // We assume a stereo output and copy the corresponding buffers.
      for (let channel = 0; channel < output.length; channel++) {
        const outputChannel = output[channel];
        if (channel === 0) {
          outputChannel.set(this.bufferL);
        } else if (channel === 1) {
          outputChannel.set(this.bufferR);
        } else {
          // If there are more channels than expected, output silence.
          outputChannel.fill(0);
        }
      }
      // Reset the flag until new data arrives.
      this.ready = false;
    } else {
      // If no data is available, output silence.
      output.forEach(channel => channel.fill(0));
    }

    // Returning true indicates that the processor should continue running.
    return true;
  }
}

// Register the processor under the name 'zmusic-processor'.
registerProcessor('zmusic-processor', ZMUSICProcessor);
