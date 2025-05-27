import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import mic from "mic";
import natural from "natural";
import stringSimilarity from "string-similarity";

// Configuration for phrase detection
const CONFIDENCE_THRESHOLD = 0.45; // 45% similarity threshold (adjust between 0.0-1.0)
// Lower values = more sensitive (catches more variations but may have false positives)
// Higher values = more strict (fewer false positives but may miss some variations)

// Configuration for different target phrases
const PHRASE_CONFIGS = {
  "temu": {
    explicitMatches: [
      "t moon",
      "timu",
      "tee moo",
      "tea moo",
      "timo",
      "teamu",
      "tamo",
      "temoo",
      "tamoo",
      "te moo",
      "tay moo",
      "taymu",
      "taymou",
      "temew",
      "temeww",
      "teme",
      "temi",
      "temue",
      "temuh",
      "temewh",
      "tempoo",
      "temewoo",
      "timew",
      "chemu",
      "demo",
      "tma",
      "tenu",
      "tinu",
      "teemu",
      "tehmoo",
      "tumoo",
      "timoo",
      "tehmu",
      "tumew",
      "tamuh",
      "temooe"
    ]
  },
  "mcdonalds": {
    explicitMatches: [
      "mcdonald's",
      "mc donalds",
      "macdonalds",
      "mac donalds",
      "mickey d's",
      "mickey ds",
      "micky d's",
      "micky ds",
      "mcdonald",
      "mc donald",
      "macdonald",
      "mac donald",
      "mcdonals",
      "mc donals",
      "macdonals",
      "mac donals",
      "mac",
      "donald",
      "macs",
      "donalds"
    ]
  }
}

/**
 * Calculate similarity score between two phrases using multiple algorithms
 * @param {string} phrase1 - First phrase to compare
 * @param {string} phrase2 - Second phrase to compare
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(phrase1, phrase2) {
  const p1 = phrase1.toLowerCase().trim();
  const p2 = phrase2.toLowerCase().trim();

  // Exact match
  if (p1 === p2) return 1.0;

  // String similarity (Dice coefficient)
  const diceScore = stringSimilarity.compareTwoStrings(p1, p2);

  // Phonetic similarity using Soundex
  const soundex = new natural.SoundEx();
  const soundex1 = soundex.process(p1);
  const soundex2 = soundex.process(p2);
  const soundexMatch = soundex1 === soundex2 ? 1.0 : 0.0;

  // Phonetic similarity using Metaphone
  const metaphone = new natural.Metaphone();
  const metaphone1 = metaphone.process(p1);
  const metaphone2 = metaphone.process(p2);
  const metaphoneMatch = metaphone1 === metaphone2 ? 1.0 : 0.0;

  // Levenshtein distance normalized
  const maxLength = Math.max(p1.length, p2.length);
  const levenshteinScore = maxLength > 0 ? 1 - (natural.LevenshteinDistance(p1, p2) / maxLength) : 1.0;

  // Weighted average of different similarity measures
  const finalScore = (diceScore * 0.4) + (soundexMatch * 0.3) + (metaphoneMatch * 0.2) + (levenshteinScore * 0.1);

  return finalScore;
}

/**
 * Check if a transcript contains phrases similar to the target phrase
 * @param {string} transcript - The transcript text to analyze
 * @param {string} targetPhrase - The phrase to detect (e.g., "temu", "mcdonalds")
 * @returns {object} - Object containing processed transcript and detection info
 */
function detectSimilarPhrases(transcript, targetPhrase) {
  // Validate target phrase
  if (!PHRASE_CONFIGS[targetPhrase]) {
    throw new Error(`Target phrase "${targetPhrase}" not configured. Available: ${Object.keys(PHRASE_CONFIGS).join(', ')}`);
  }

  const config = PHRASE_CONFIGS[targetPhrase];
  const words = transcript.toLowerCase().split(/\s+/);
  let processedTranscript = transcript;
  let detections = [];

  // First, check for explicit matches (highest priority)
  const transcriptLower = transcript.toLowerCase();
  for (const explicitMatch of config.explicitMatches) {
    if (transcriptLower.includes(explicitMatch)) {
      detections.push({
        original: explicitMatch,
        target: targetPhrase,
        confidence: 1.0, // 100% confidence for explicit matches
        type: 'explicit_match'
      });
      // Replace in transcript (case-insensitive)
      const regex = new RegExp(explicitMatch.replace(/\s+/g, '\\s+'), 'gi');
      processedTranscript = processedTranscript.replace(regex, targetPhrase.toUpperCase());
    }
  }

  // If we found explicit matches, return early to avoid duplicate processing
  if (detections.length > 0) {
    return {
      original: transcript,
      processed: processedTranscript,
      detections: detections,
      hasDetections: true
    };
  }

  // Check individual words and combinations using similarity algorithms
  for (let i = 0; i < words.length; i++) {
    // Check single words
    const singleWordScore = calculateSimilarity(words[i], targetPhrase);
    if (singleWordScore >= CONFIDENCE_THRESHOLD) {
      detections.push({
        original: words[i],
        target: targetPhrase,
        confidence: singleWordScore,
        type: 'single_word'
      });
      // Replace in transcript (case-insensitive)
      const regex = new RegExp(`\\b${words[i]}\\b`, 'gi');
      processedTranscript = processedTranscript.replace(regex, targetPhrase.toUpperCase());
    }

    // Check two-word combinations
    if (i < words.length - 1) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      const twoWordScore = calculateSimilarity(twoWords, targetPhrase);
      if (twoWordScore >= CONFIDENCE_THRESHOLD) {
        detections.push({
          original: twoWords,
          target: targetPhrase,
          confidence: twoWordScore,
          type: 'two_words'
        });
        // Replace in transcript
        const regex = new RegExp(`\\b${words[i]}\\s+${words[i + 1]}\\b`, 'gi');
        processedTranscript = processedTranscript.replace(regex, targetPhrase.toUpperCase());
      }
    }
  }

  return {
    original: transcript,
    processed: processedTranscript,
    detections: detections,
    hasDetections: detections.length > 0
  };
}

/**
 * Detect multiple target phrases in a transcript
 * @param {string} transcript - The transcript text to analyze
 * @param {string[]} targetPhrases - Array of phrases to detect (e.g., ["temu", "mcdonalds"])
 * @returns {object} - Object containing processed transcript and all detections
 */
function detectMultiplePhrases(transcript, targetPhrases = ["temu"]) {
  let allDetections = [];
  let processedTranscript = transcript;

  for (const targetPhrase of targetPhrases) {
    const result = detectSimilarPhrases(transcript, targetPhrase);
    if (result.hasDetections) {
      allDetections.push(...result.detections);
      processedTranscript = result.processed;
      // If we found a match, use the processed transcript for subsequent searches
      transcript = result.processed;
    }
  }

  return {
    original: transcript,
    processed: processedTranscript,
    detections: allDetections,
    hasDetections: allDetections.length > 0
  };
}

const live = async () => {
  // The API key you created in step 1
  const deepgramApiKey = "012ac08d5a581714b343fd2011014da0eb66933e";

  // Check if API key is still the placeholder
  if (deepgramApiKey === "APIKEY") {
    console.error("❌ Error: Please replace 'APIKEY' with your actual Deepgram API key");
    console.log("💡 Get your API key from: https://console.deepgram.com/");
    console.log("💡 Then replace 'APIKEY' on line 232 with your actual key");
    process.exit(1);
  }

  // Initialize the Deepgram SDK
  const deepgram = createClient(deepgramApiKey);

  // Create a websocket connection to Deepgram
  // Configure for raw microphone audio (16-bit PCM, 16kHz, mono)
  const connection = deepgram.listen.live({
    smart_format: true,
    model: 'nova-3',
    language: 'en-US',
    encoding: 'linear16',
    sample_rate: 16000,
    channels: 1,
  });

  // Listen for connection errors
  connection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error("❌ Deepgram connection error:", error);
    console.log("💡 Make sure you have a valid Deepgram API key set in the code.");
    process.exit(1);
  });

  // Listen for the connection to open.
  connection.on(LiveTranscriptionEvents.Open, () => {
    // Listen for any transcripts received from Deepgram and write them to the console.
    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      // Extract and print only the transcript text
      if (data.channel && data.channel.alternatives && data.channel.alternatives.length > 0) {
        const transcript = data.channel.alternatives[0].transcript;
        if (transcript && transcript.trim()) {
          // Process transcript for similarity detection
          // 🔧 CONFIGURE HERE: Specify which phrases to detect
          // Options: ["temu"], ["mcdonalds"], or ["temu", "mcdonalds"]
          const result = detectMultiplePhrases(transcript, ["temu", "mcdonalds"]);

          if (result.hasDetections) {
            console.log(`🎯 DETECTED: ${result.processed}`);
            console.log(`📊 Detections:`);
            result.detections.forEach(detection => {
              console.log(`   "${detection.original}" → "${detection.target}" (${(detection.confidence * 100).toFixed(1)}% confidence, ${detection.type})`);
            });
          } else {
            console.log(transcript);
          }
        }
      }
    });

    // Listen for any metadata received from Deepgram and write it to the console.
    connection.on(LiveTranscriptionEvents.Metadata, (data) => {
      console.dir(data, { depth: null });
    });

    // Listen for the connection to close.
    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log("Connection closed.");
    });

    // Set up microphone input
    const micInstance = mic({
      rate: '16000',
      channels: '1',
      debug: false
    });

    const micInputStream = micInstance.getAudioStream();

    // Send microphone audio data to Deepgram
    micInputStream.on('data', (data) => {
      connection.send(data);
    });

    micInputStream.on('error', (err) => {
      console.log("Error in microphone input stream: " + err);
    });

    micInputStream.on('startComplete', () => {
      console.log("Microphone started");
    });

    micInputStream.on('stopComplete', () => {
      console.log("Microphone stopped");
    });

    micInputStream.on('pauseComplete', () => {
      console.log("Microphone paused");
    });

    micInputStream.on('resumeComplete', () => {
      console.log("Microphone resumed");
    });

    micInputStream.on('silence', () => {
      console.log("Silence detected");
    });

    micInputStream.on('processExitComplete', () => {
      console.log("Microphone process exited");
    });

    // Start the microphone
    micInstance.start();

    console.log("Microphone input started. Speak into your microphone...");
  });
};

live();
