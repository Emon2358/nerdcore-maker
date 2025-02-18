const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    // Reference for Ace editor instance and error messages.
    const editor = ref(null);
    const errorMsg = ref("");

    const defaultMml = "; Default MML code\nv12 o5 l8 cdefgab>c";

    // Function to convert MML to OPM-compatible text.
    function convertToOPM(mml) {
      // Remove forbidden "$0b00" escape sequences.
      if (/\$0b00/i.test(mml)) {
        console.warn("Detected forbidden escape sequence $0b00. Removing it.");
        mml = mml.replace(/\$0b00/gi, "");
      }
      // Remove any hexadecimal escape sequence matching "$0b" followed by two hex digits.
      mml = mml.replace(/\$0b[0-9A-Fa-f]{2}/g, "");
      // Remove non-printable characters (keep newline).
      return mml.replace(/[^\x20-\x7E\n]/g, "");
    }

    // Function to post-process the ArrayBuffer to remove any forbidden "$0b00" byte sequence.
    function removeForbiddenSequence(buffer) {
      const arr = new Uint8Array(buffer);
      // "$0b00" in ASCII: $, 0, b, 0, 0 -> [36, 48, 98, 48, 48]
      const forbidden = [36, 48, 98, 48, 48];
      let result = [];
      for (let i = 0; i < arr.length; ) {
        let isForbid = true;
        for (let j = 0; j < forbidden.length && i + j < arr.length; j++) {
          if (arr[i + j] !== forbidden[j]) {
            isForbid = false;
            break;
          }
        }
        if (isForbid) {
          // Skip forbidden sequence.
          console.warn("Removing forbidden byte sequence: $0b00");
          i += forbidden.length;
        } else {
          result.push(arr[i]);
          i++;
        }
      }
      return new Uint8Array(result).buffer;
    }

    // Method to trigger ZMUSIC.playback using the content from Ace.
    function playMml() {
      const mmlCode = editor.value.getValue();
      // Convert the MML code to ensure forbidden sequences are removed.
      const opmMmlText = convertToOPM(mmlCode);
      if (/\$0b/.test(opmMmlText)) {
        console.warn("Converted MML still contains $0b sequences:", opmMmlText);
      }
      // Encode the converted text into an ArrayBuffer.
      const encoder = new TextEncoder();
      let opmMmlBuffer = encoder.encode(opmMmlText).buffer;
      // Further remove any forbidden "$0b00" byte sequences from the buffer.
      opmMmlBuffer = removeForbiddenSequence(opmMmlBuffer);
      
      // Call compileAndPlay with the processed ArrayBuffer.
      ZMUSIC.compileAndPlay(opmMmlBuffer)
        .then(() => {
          console.info("Playback started successfully.");
        })
        .catch((err) => {
          console.error("Error during playback:", err);
          errorMsg.value = "Error: " + err;
        });
    }

    // Method to resume the audio context (required on some browsers).
    function resumeAudio() {
      if (window.ZMUSIC && ZMUSIC.resume) {
        ZMUSIC.resume();
      }
    }

    // Initialize Ace editor and ZMUSIC when the component mounts.
    onMounted(() => {
      // Create Ace editor in the div with id "editor".
      editor.value = ace.edit("editor");
      editor.value.setTheme("ace/theme/monokai");
      // Set editing mode (for plain text, "ace/mode/text" is appropriate).
      editor.value.session.setMode("ace/mode/text");
      // Set default MML in the editor.
      editor.value.setValue(defaultMml, -1);

      // Initialize ZMUSIC.
      ZMUSIC.install()
        .then(() => {
          const convertedMml = convertToOPM(defaultMml);
          console.log("Converted default MML:", convertedMml);
        })
        .catch((err) => {
          console.error("Error during ZMUSIC initialization:", err);
          errorMsg.value = "Error: " + err;
        });
    });

    return {
      errorMsg,
      playMml,
      resumeAudio
    };
  },
  template: `
    <div>
      <h1>ZMUSIC MML Editor (Vue + Ace)</h1>
      <div id="editor"></div>
      <br>
      <button @click="playMml">Play</button>
      <button @click="resumeAudio">Unmute</button>
      <div v-if="errorMsg" style="color:red;">{{ errorMsg }}</div>
    </div>
  `
}).mount('#app');
