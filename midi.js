let midiOutput = null;

const initMidi = async () => {
  try {
    const midiAccess = await navigator.requestMIDIAccess();
    const outputs = Array.from(midiAccess.outputs.values());
    midiOutput = outputs[prompt(outputs.map((el, i) => i + ") " + el.name + "\n"))];
  } catch (error) {
    console.log(error);
  }

}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const sendNote = (note) => {
  if (!midiOutput) return;
  // Note ON (ch 1, note 60, velocity 100)
  midiOutput.send([0x90, 60, 100]);
  setTimeout(() => {
    midiOutput.send([0x80, 60, 0]);
  }, 200);
}

const sendRandomNote = (min = 20, max = 120) => {
  console.log(min, max);
  if (!midiOutput) return;
  const note = randomInt(+min, +max);
  // Note ON (ch 1, note rand, velocity 100)
  console.log(note);
  midiOutput.send([0x90, note, 100]);
  setTimeout(() => {
    midiOutput.send([0x80, note, 0]);
  }, 200);
}