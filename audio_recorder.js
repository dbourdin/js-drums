let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let mediaStreamDestination = audioContext.createMediaStreamDestination();
let mediaRecorder;
let chunks = [];
let recordingAudioStream;

// buttons
const drumButtons = document.querySelectorAll('button.drum-button');
const startRecordButton = document.getElementById('startRecording');
const stopRecordButton = document.getElementById('stopRecording');
const playRecordedButton = document.getElementById('playRecording');
const recordingAudio = document.getElementById('recordingAudio');



// Define an object to store audio buffers
const audioBuffers = {};

// Function to load and store audio buffers
async function loadAndStoreSound(soundName, url) {
  const response = await fetch(url);
  const audioData = await response.arrayBuffer();
  const buffer = await audioContext.decodeAudioData(audioData);
  audioBuffers[soundName] = buffer;
}

// Load and store audio buffers for different sounds
loadAndStoreSound('drumSound1', 'Bass-Drum-1.wav');
loadAndStoreSound('drumSound2', 'Bass-Drum-2.wav');

// Function to create an AudioBufferSourceNode for a specific sound
function createSourceNode(soundName) {
  const sourceNode = audioContext.createBufferSource();
  sourceNode.buffer = audioBuffers[soundName];
  return sourceNode;
}

// Function to play a sound using a stored audio buffer
function playSound(soundName) {
  const buffer = audioBuffers[soundName];

  if (buffer) {
    const sourceNode = createSourceNode(soundName);
    // Required to hear the sound
    sourceNode.connect(audioContext.destination);
    // Required to record
    sourceNode.connect(mediaStreamDestination);
    sourceNode.start();
  } else {
    console.error(`Sound '${soundName}' not found.`);
  }
}

// Assign the playSound function to the buttons. This has to run after start recording
function setup_drums() {
  drumButtons.forEach((button, index) => {
    button.addEventListener('click', function () {
      playSound('drumSound' + (index + 1));
    });
  });
}

// Initial setup before recording to be able to play without recording
setup_drums()

// Function to create a media stream destination
function createRecordingAudioStream() {
  if (!recordingAudioStream) {
    recordingAudioStream = mediaStreamDestination.stream;
  }
  return recordingAudioStream;
}

// Function to start recording
function startRecording() {
  recordingAudioStream = createRecordingAudioStream();

  // Reset the chunks array to start a new recording. Sound is stored in this array
  chunks = [];

  // set up drum sounds to be recorded
  setup_drums()

  mediaRecorder = new MediaRecorder(recordingAudioStream);
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      chunks.push(event.data);
      console.log(`Received data chunk of size: ${event.data.size}`);
    }
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(chunks, { type: 'audio/wav' });
    console.log(chunks)
    console.log(audioBlob)
    recordingAudio.src = URL.createObjectURL(audioBlob);
    startRecordButton.disabled = false;
    stopRecordButton.disabled = true;
    playRecordedButton.disabled = false;
  };

  mediaRecorder.start();
  startRecordButton.disabled = true;
  stopRecordButton.disabled = false;
  playRecordedButton.disabled = true;
}

// Function to stop recording
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

// Event listeners for record buttons
startRecordButton.addEventListener('click', startRecording);
stopRecordButton.addEventListener('click', stopRecording);

// Event listener for play recorded audio button
playRecordedButton.addEventListener('click', () => {
  recordingAudio.play();
});
