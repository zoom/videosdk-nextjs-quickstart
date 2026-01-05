class WhiteNoiseProcessor extends AudioProcessor {
    constructor(port, options) {
        super(port, options);
        this.port.onmessage = (event) => {
            const { cmd, data } = event.data;
            console.log(`onmessage() cmd:${cmd}, data:${data}`);
        };
    }
    process(inputs, outputs) {
        const output = outputs[0];
        output.forEach((channel) => {
            for (let i = 0; i < channel.length; i++) {
                channel[i] = Math.random() * 2 - 1;
            }
        });
        return true;
    }
}

registerProcessor('white-noise-processor', WhiteNoiseProcessor);