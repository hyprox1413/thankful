import { useState } from "react";
import "./App.css";

function App() {
  const [textFieldValue, setTextFieldValue] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle POST request
  const handlePostRequest = async () => {
    setIsLoading(true);
    setResponseMessage("");

    try {
      const response = await fetch(
        "http://localhost:3000/entry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: textFieldValue,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setResponseMessage(`Success!`);
        setTextFieldValue("");
      } else {
        setResponseMessage("Error: Failed to create post");
      }
    } catch {
      setResponseMessage("Error: Network request failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <h2>POST Request Demo</h2>
        <div className="input-group">
          <input
            type="text"
            value={textFieldValue}
            onChange={(e) => setTextFieldValue(e.target.value)}
            placeholder="Enter text to send"
            className="text-input"
          />
          <button
            onClick={handlePostRequest}
            disabled={isLoading}
            className="post-button"
          >
            {isLoading ? "Sending..." : "Send POST Request"}
          </button>
        </div>
        {responseMessage && (
          <p className="response-message">{responseMessage}</p>
        )}
      </div>
    </>
  );
}

export default App;
