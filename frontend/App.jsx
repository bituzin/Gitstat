import React, { useState } from "react";
import GithubStats from "./components/GithubStats";

export default function App() {
  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="container">
      <h1>GitHub User Info</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="ghUser">GitHub Username:</label>
        <input
          type="text"
          id="ghUser"
          name="ghUser"
          required
          placeholder="np. octocat"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <button type="submit">Pobierz dane</button>
      </form>
      {submitted && <GithubStats username={username} />}
    </div>
  );
}
