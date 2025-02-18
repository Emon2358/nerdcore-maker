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
      // Remove any non-printable characters (keep newline).
      return mml.replace(/[^\x20-\x7E\n]/g, "");
    }

    // Method to trigger ZMUSIC.playback using the content from Ace.
    function playMml() {
      const mmlCode = editor.value.getValue();
      const opmMmlCode = convertToOPM(mmlCode);
      if (/\$0b/.test(opmMmlCode)) {
        console.warn("Converted MML still contains $0b sequences:", opmMmlCode);
      }
      // Encode converted text into an ArrayBuffer
      const encoder = new TextEncoder();
      const opmMmlBuffer = encoder.encode(opmMmlCode).buffer;
      
      // Call compileAndPlay with the ArrayBuffer instead of a string.
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
      // Set editing mode (for plain text, you might use "ace/mode/text")
      editor.value.session.setMode("ace/mode/text");
      // Set default MML code in the editor.
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
