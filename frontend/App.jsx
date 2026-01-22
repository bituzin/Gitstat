import React, { useState } from "react";
import GithubStats from "./components/GithubStats";
import GithubAutocomplete from "./components/GithubAutocomplete";

export default function App() {

  const [username, setUsername] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const handleSelect = (selected) => {
    setUsername(selected);
    setSubmitted(true);
  };

  return (
    <div className="container">
      <h1>GitHub User Info</h1>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label htmlFor="ghUser">GitHub Username:</label>
        <GithubAutocomplete
          value={username}
          onChange={setUsername}
          onSelect={handleSelect}
        />
        <button type="submit">Fetch Data</button>
      </form>
      {submitted && <GithubStats username={username} />}
    </div>
  );
}
