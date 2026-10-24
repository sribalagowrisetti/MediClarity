import { useRef, useState } from "react";

function App() {
  const audioRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [results, setResults] = useState([]);

  // ================= FILE SELECTION =================

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      setResults([]);
      setMessage("");
    }
  };

  // ================= VOICE FUNCTION =================

  const speak = (text) => {
    if (!text || text.trim() === "") {
      alert("No explanation available to speak.");
      return;
    }

    // Stop previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    // Stop previous browser speech
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    } else {
      alert("Voice support is not available in this browser.");
      return;
    }

    const startSpeaking = () => {
      const voices = window.speechSynthesis.getVoices();

      // Prefer an English voice
      let selectedVoice = voices.find(
        (voice) =>
          voice.lang &&
          voice.lang.toLowerCase() === "en-in"
      );

      if (!selectedVoice) {
        selectedVoice = voices.find(
          (voice) =>
            voice.lang &&
            voice.lang.toLowerCase().startsWith("en")
        );
      }

      const speech = new SpeechSynthesisUtterance(text);

      speech.lang = "en-IN";
      speech.rate = 0.85;
      speech.pitch = 1;
      speech.volume = 1;

      if (selectedVoice) {
        speech.voice = selectedVoice;
      }

      window.speechSynthesis.speak(speech);
    };

    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      startSpeaking();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        startSpeaking();
      };
    }
  };

  // ================= FILE UPLOAD =================

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please choose a medical report first.");
      return;
    }

    const formData = new FormData();

    formData.append("medicalReport", file);

    try {
      setUploading(true);
      setMessage("");
      setResults([]);

      console.log("=================================");
      console.log("Sending file to backend...");
      console.log("File name:", file.name);
      console.log("File type:", file.type);
      console.log("File size:", file.size);
      console.log("=================================");

      const response = await fetch(
        "https://mediclarity.onrender.com/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Backend status:", response.status);
      console.log("Backend response:", data);

      if (response.ok) {
        setMessage(
          "✅ Medical report analyzed successfully!"
        );

        if (data.results) {
          setResults(data.results);
        }
      } else {
        setMessage(
          "❌ " +
            (data.message ||
              "Unable to analyze the medical report.")
        );
      }
    } catch (error) {
      console.error("Upload error:", error);

      setMessage(
        "❌ Unable to connect to the MediClarity backend."
      );
    } finally {
      setUploading(false);
    }
  };

  // ================= STATUS CLASS =================

  const getStatusClass = (status) => {
    if (status === "LOW") {
      return "status-low";
    }

    if (status === "HIGH") {
      return "status-high";
    }

    return "status-normal";
  };

  // ================= STATUS ICON =================

  const getStatusIcon = (status) => {
    if (status === "LOW") {
      return "🔴";
    }

    if (status === "HIGH") {
      return "🟠";
    }

    return "🟢";
  };

  // ================= MAIN UI =================

  return (
    <div className="app">

      {/* ================= HEADER ================= */}

      <header className="header">

        <div className="logo">
          Medi<span>Clarity</span>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
        </nav>

      </header>

      {/* ================= MAIN ================= */}

      <main>

        {/* ================= HERO ================= */}

        <section className="hero" id="home">

          <div className="hero-content">

            <p className="tagline">
              Understand Your Health Report Easily
            </p>

            <h1>
              Your Medical Report,
              <br />
              <span>Made Simple.</span>
            </h1>

            <p className="description">
              Upload your blood report and understand your
              test results in simple language with helpful
              health guidance.
            </p>

            {/* ================= UPLOAD CARD ================= */}

            <div className="upload-card">

              <div className="upload-icon">
                📄
              </div>

              <h2>
                Upload Your Blood Report
              </h2>

              <p>
                Upload your medical report in PDF, JPG or PNG format.
              </p>

              <label className="upload-button">

                Choose Report

                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  hidden
                />

              </label>

              {file && (
                <>
                  <p className="file-name">
                    Selected: {file.name}
                  </p>

                  <button
                    className="upload-button"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading
                      ? "Analyzing..."
                      : "Upload Report"}
                  </button>
                </>
              )}

              {message && (
                <p className="upload-message">
                  {message}
                </p>
              )}

            </div>

          </div>

        </section>

        {/* ================= MEDICAL REPORT RESULTS ================= */}

        {results.length > 0 && (

          <section className="results-section">

            <h2>
              🩺 Medical Report Results
            </h2>

            <p className="results-intro">
              Here is a simple explanation of the test
              results found in your uploaded medical report.
            </p>

            {/* ================= TABLE ================= */}

            <div className="table-wrapper">

              <table className="medical-table">

                <thead>

                  <tr>

                    <th>Test</th>

                    <th>Your Value</th>

                    <th>Reference Range</th>

                    <th>Status</th>

                    <th>What is it?</th>

                    <th>Easy English Explanation</th>

                    <th>Telugu Explanation</th>

                    <th>
                      🍎 General Food Guidance
                    </th>

                    <th>🔊 Voice</th>

                  </tr>

                </thead>

                <tbody>

                  {results.map((test, index) => (

                    <tr key={index}>

                      {/* TEST */}

                      <td className="test-name">
                        {test.testName ||
                          "Not available"}
                      </td>

                      {/* VALUE */}

                      <td>
                        {test.value ||
                          "Not available"}

                        {test.unit
                          ? ` ${test.unit}`
                          : ""}
                      </td>

                      {/* REFERENCE RANGE */}

                      <td>
                        {test.referenceRange ||
                          "Not available"}
                      </td>

                      {/* STATUS */}

                      <td>

                        <span
                          className={`status-badge ${getStatusClass(
                            test.status
                          )}`}
                        >

                          {getStatusIcon(
                            test.status
                          )}

                          {" "}

                          {test.status ||
                            "UNKNOWN"}

                        </span>

                      </td>

                      {/* WHAT IS IT */}

                      <td className="what-is-it">

                        {test.whatIsIt ||
                          "This test provides information about your health."}

                      </td>

                      {/* ENGLISH */}

                      <td className="explanation">

                        {test.englishExplanation ||
                          `Your ${
                            test.testName || "test"
                          } result is ${
                            test.status || "available"
                          }. Please compare it with the reference range shown above.`}

                      </td>

                      {/* TELUGU TEXT */}

                      <td className="telugu">

                        {test.teluguExplanation ||
                          "ఈ పరీక్ష మీ ఆరోగ్యానికి సంబంధించిన సమాచారాన్ని అందిస్తుంది."}

                      </td>

                      {/* FOOD GUIDANCE */}

                      <td className="food-guidance">

                        {test.foodGuidance ||
                          "Maintain a balanced diet with vegetables, fruits, whole grains and adequate water."}

                      </td>

                      {/* VOICE */}

                      <td>

                        <div className="voice-buttons">

                          <button
                            onClick={() =>
                              speak(
                                test.englishExplanation ||
                                  `Your ${
                                    test.testName ||
                                    "test"
                                  } result is ${
                                    test.status ||
                                    "available"
                                  }. Please compare it with the reference range shown above.`
                              )
                            }
                            title="Listen to explanation"
                          >
                            🔊 Voice
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            {/* ================= SIMPLE SUMMARY ================= */}

            <div className="simple-summary">

              <h2>
                📋 Simple Summary
              </h2>

              <p>
                Your report contains{" "}
                <strong>
                  {results.length}
                </strong>{" "}
                analyzed test results.
              </p>

              <div className="summary-counts">

                {/* NORMAL */}

                <div className="summary-card normal-summary">

                  <span>🟢</span>

                  <strong>
                    {
                      results.filter(
                        (test) =>
                          test.status ===
                          "NORMAL"
                      ).length
                    }
                  </strong>

                  <p>Normal</p>

                </div>

                {/* HIGH */}

                <div className="summary-card high-summary">

                  <span>🟠</span>

                  <strong>
                    {
                      results.filter(
                        (test) =>
                          test.status ===
                          "HIGH"
                      ).length
                    }
                  </strong>

                  <p>High</p>

                </div>

                {/* LOW */}

                <div className="summary-card low-summary">

                  <span>🔴</span>

                  <strong>
                    {
                      results.filter(
                        (test) =>
                          test.status ===
                          "LOW"
                      ).length
                    }
                  </strong>

                  <p>Low</p>

                </div>

              </div>

            </div>

            {/* ================= DISCLAIMER ================= */}

            <div className="medical-disclaimer">

              ⚠️ <strong>Important:</strong>

              <p>
                These results are for general information
                and health awareness only. They should not
                replace advice, diagnosis or treatment from
                a qualified healthcare professional.
              </p>

            </div>

          </section>

        )}

        {/* ================= FEATURES ================= */}

        <section
          className="features"
          id="features"
        >

          <h2>
            How MediClarity Helps You
          </h2>

          <div className="feature-grid">

            {/* UNDERSTAND TESTS */}

            <div className="feature-card">

              <div>🔍</div>

              <h3>
                Understand Tests
              </h3>

              <p>
                Understand difficult medical terms
                in simple language.
              </p>

            </div>

            {/* CHECK TEST RANGES */}

            <div className="feature-card">

              <div>📊</div>

              <h3>
                Check Test Ranges
              </h3>

              <p>
                See whether your test result is
                normal, borderline, high or low.
              </p>

            </div>

            {/* HEALTH GUIDANCE */}

            <div className="feature-card">

              <div>🍎</div>

              <h3>
                Health Guidance
              </h3>

              <p>
                Get general food and precaution
                information related to your results.
              </p>

            </div>

            {/* TELUGU EXPLANATION */}

            <div className="feature-card">

              <div>🇮🇳</div>

              <h3>
                Telugu Explanation
              </h3>

              <p>
                Understand your report through
                simple Telugu explanations.
              </p>

            </div>

            {/* VOICE EXPLANATION */}

            <div className="feature-card">

              <div>🔊</div>

              <h3>
                Voice Explanation
              </h3>

              <p>
                Listen to your report explanation
                using voice support.
              </p>

            </div>

            {/* REPORT HISTORY */}

            <div className="feature-card">

              <div>📁</div>

              <h3>
                Report History
              </h3>

              <p>
                Save and view your previous reports
                for comparison.
              </p>

            </div>

          </div>

        </section>

      </main>

      {/* ================= FOOTER ================= */}

      <footer>

        <p>
          © 2026 MediClarity | Medical Report
          Interpretation and Patient Guidance System
        </p>

      </footer>

    </div>
  );
}

export default App;