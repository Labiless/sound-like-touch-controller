let port;
let writer;
let reader;
const encoder = new TextEncoder();
const decoder = new TextDecoderStream();

const channelMap = [2, 4, 5, 16, 17, 18, 19, 21];

const initEsp32 = async () => {
    loading(true);
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();

    const readableStreamClosed = port.readable.pipeTo(decoder.writable);
    reader = decoder.readable.getReader();
    /*while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        logEl.textContent += value;
        console.log(value);
    }*/
    loading(false);
}

const sendMessage = async (msg) => {
    console.log(msg);
    const data = encoder.encode(msg + "\n");
    await writer.write(data);
}

const lightOnAndOff = async (channel, timer, isTreshold) => {
    mappedChannel = channelMap[channel];
    console.log(mappedChannel)
    const el = document.querySelectorAll(".esp32-output")[channel];
    /*await sendMessage(channel + "_1");
    el.style.backgroundColor = "yellow";
    setTimeout(async () => {
        await sendMessage(channel + "_0");
        el.style.backgroundColor = "transparent";
    }, timer)*/
    if (isTreshold) {
        sendMessage(mappedChannel + "_0");
        el.style.backgroundColor = "yellow";
        lastTreshold = isTreshold;
    }
    else if (!isTreshold) {
        sendMessage(mappedChannel + "_1");
        el.style.backgroundColor = "transparent";
        lastTreshold = isTreshold;
    }
}