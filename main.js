const { createApp, ref, onMounted } = Vue;

createApp({
  setup() {
    // Reference to the Ace editor instance and for error messages.
    const editor = ref(null);
    const errorMsg = ref("");

    const defaultMml = "; Default MML code\nv12 o5 l8 cdefgab>c";

    // Function to convert MML to OPM compatible text.
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

    // Method to trigger ZMUSIC.playback using the content from Ace.
    function playMml() {
      const mmlCode = editor.value.getValue();
      const opmMmlCode = convertToOPM(mmlCode);
      if (/\$0b/.test(opmMmlCode)) {
        console.warn("Converted MML still contains $0b sequences:", opmMmlCode);
      }
      // Call ZMUSIC.compileAndPlay with the converted code.
      ZMUSIC.compileAndPlay(opmMmlCode)
        .then(() => {
          console.info("Playback started successfully.");
        })
        .catch((err) => {
          console.error("Error during playback:", err);
          errorMsg.value = "Error: " + err;
        });
    }

    // Method to resume the audio context (useful for browsers that require user interaction).
    function resumeAudio() {
      if (window.ZMUSIC && ZMUSIC.resume) {
        ZMUSIC.resume();
      }
    }

    // Initialize Ace editor and ZMUSIC on component mount.
    onMounted(() => {
      // Create the Ace editor in the div with id "editor".
      editor.value = ace.edit("editor");
      editor.value.setTheme("ace/theme/monokai");
      // Use a mode that best fits your editing needs. (For plain text editing, you might use "ace/mode/text")
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
