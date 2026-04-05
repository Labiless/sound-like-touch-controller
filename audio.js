let audioContext;
let cont = 0;
let devices, audioInuputs;
let selectedAudioCount = 0;
let tresholdLevel = 20;


const audioInputsContainer = document.querySelector("#audio-inputs-container");
const audioLevelsContainer = document.querySelector("#audio-levels-container");

const displayAudioInputs = async () => {
    devices = await navigator.mediaDevices.enumerateDevices();
    audioInputs = devices.filter(d => d.kind === "audioinput" && d.label.includes(""));

    audioInputs.forEach((audioInput, i) => {
        const button = document.createElement("button");
        button.classList.add("audio-input-button");
        button.innerText = audioInput.label;
        button.addEventListener("click", async (e) => {
            const eventName = "treshold-input-" + i;
            const lightIndex = selectedAudioCount;
            window.addEventListener(eventName, async e => {
                const data = e.detail;
                const isTreshold = data.isTreshold;
                if (isTreshold) {
                    data.audioLevelDisplay.level.style.backgroundColor = "blue";
                    if (midiOutput) {
                        sendRandomNote(data.midiMin, data.midiMax);
                    }
                } else {
                    data.audioLevelDisplay.level.style.backgroundColor = "yellow";
                }
                if (writer) {
                    await lightOnAndOff(lightIndex, 100, isTreshold);
                }
            })
            selectedAudioCount++;
            await connectAudioInput(audioInput.label,
                data => {
                    window.dispatchEvent(
                        new CustomEvent(eventName, { detail: data })
                    );
                },
                data => {
                    window.dispatchEvent(
                        new CustomEvent(eventName, { detail: data })
                    );
                },
                false);
        })
        audioInputsContainer.appendChild(button);
    })
}

const connectAudioInput = async (inputLabel, trasholdCallback = null, untrasholdCallback = null, loopCallback = null) => {
    loading(true);

    let isTreshold = false;
    let rmsMultiplier = 800;

    const audioInput = audioInputs.find(el => el.label === inputLabel)
    const stream = await getAudioInputStream(audioInput.deviceId);
    const levelMeter = createLevelMeter(stream);
    const audioLevelDisplay = createAudioLevelDisplay(audioInput.label);
    const midiInputRange = createMidiRangeInput();
    audioLevelDisplay.container.appendChild(midiInputRange.container);
    audioLevelsContainer.appendChild(audioLevelDisplay.container)

    let lastIsTreshold = false;

    const loop = () => {
        const { rms, db } = levelMeter.getLevel();
        const value = rms * rmsMultiplier;
        audioLevelDisplay.setLevel(value);
        isTreshold = value > tresholdLevel;
        const callbackData = { value, audioLevelDisplay, isTreshold };
        if (isTreshold && isTreshold !== lastIsTreshold) {
            if (trasholdCallback) trasholdCallback({
                ...callbackData,
                midiMin : midiInputRange.midiMinInput.value,
                midiMax : midiInputRange.midiMaxInput.value
            });
        }
        if (!isTreshold && isTreshold !== lastIsTreshold) {
            if (untrasholdCallback) untrasholdCallback(callbackData);
        }
        lastIsTreshold = isTreshold;
        if (loopCallback) loopCallback(callbackData);
        requestAnimationFrame(loop);
    };
    loop();

    loading(false);
}

const getAudioInputStream = async (deviceId) => {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
            deviceId: { exact: deviceId },
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
        }
    });
    return stream;
}

const createAudioLevelDisplay = (label) => {
    const container = document.createElement("div");
    const level = document.createElement("div");
    container.classList.add("volume-container");
    container.innerText = label;
    level.classList.add("volume-level");
    container.appendChild(level);
    const setLevel = (height) => level.style.height = height + "px";
    return { container, level, setLevel };
}

const createMidiRangeInput = () => {
    const container = document.createElement("div");
    container.classList.add("midi-range-input-container")
    const midiMinInput = document.createElement("input");
    const midiMaxInput = document.createElement("input");
    midiMinInput.type = "number";
    midiMaxInput.type = "number";
    midiMinInput.value = 20;
    midiMaxInput.value = 120;
    container.appendChild(midiMinInput);
    container.appendChild(midiMaxInput);
    return {container, midiMinInput, midiMaxInput};
}

function createLevelMeter(stream) {
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 2048;
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);

    function getLevel() {
        analyser.getFloatTimeDomainData(buffer);

        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }

        const rms = Math.sqrt(sum / buffer.length); // 0..1 circa
        const db = 20 * Math.log10(rms || 0.00001);

        return { rms, db };
    }

    return { getLevel };
}


const initAudio = async () => {
    loading(true);
    audioContext = new AudioContext();
    await navigator.mediaDevices.getUserMedia({ audio: true });
    await displayAudioInputs();
    document.querySelector("#treshold-control").addEventListener("input", (e) => {
        tresholdLevel = parseInt(e.target.value);
    });
    loading(false);
}