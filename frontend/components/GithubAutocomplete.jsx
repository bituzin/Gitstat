import React, { useState } from "react";

export default function GithubAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchSuggestions(query) {
    if (!query) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.items || []);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  }

  function handleInput(e) {
    const val = e.target.value;
    onChange(val);
    fetchSuggestions(val);
  }

  function handleSelect(username) {
    onChange(username);
    setSuggestions([]);
    if (onSelect) onSelect(username);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={value}
        onChange={handleInput}
        placeholder="np. octocat"
        autoComplete="off"
        style={{ width: "100%" }}
      />
      {loading && <div className="loading">Ładowanie...</div>}
      {suggestions.length > 0 && (
        <ul style={{
          position: "absolute",
          left: 0,
          right: 0,
          background: "#fff",
          border: "1px solid #eee",
          zIndex: 10,
          listStyle: "none",
          margin: 0,
          padding: 0
        }}>
          {suggestions.map(user => (
            <li
              key={user.login}
              style={{ padding: "8px", cursor: "pointer" }}
              onClick={() => handleSelect(user.login)}
            >
              <img src={user.avatar_url} alt="avatar" style={{ width: 24, height: 24, borderRadius: "50%", marginRight: 8 }} />
              {user.login}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
