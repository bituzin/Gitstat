import React, { useEffect, useState } from "react";

function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export default function GithubStats({ username }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    setError("");
    setStats(null);
    setActivity([]);
    const since = getDateNDaysAgo(7);
    const until = new Date().toISOString().split('T')[0];

    async function fetchData() {
      try {
        // Public repos
        const userRes = await fetch(`https://api.github.com/users/${username}`);
        if (userRes.status === 403) throw new Error("GitHub API rate limit exceeded. Wait ~1 hour.");
        if (!userRes.ok) throw new Error("Nie znaleziono użytkownika");
        const user = await userRes.json();
        const publicRepos = user.public_repos;
        // PR count (last 7 days)
        const prRes = await fetch(`https://api.github.com/search/issues?q=type:pr+author:${username}+created:${since}..${until}`);
        const prData = prRes.ok ? await prRes.json() : { total_count: 0 };
        const prCount = prData.total_count || 0;
        // Commits (last 7 days, first 10 repos)
        const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
        const repos = reposRes.ok ? await reposRes.json() : [];
        let commitCount = 0;
        for (const repo of repos.slice(0, 10)) {
          const commitsRes = await fetch(`https://api.github.com/repos/${repo.owner.login}/${repo.name}/commits?author=${username}&since=${since}T00:00:00Z&until=${until}T23:59:59Z&per_page=100`);
          if (commitsRes.ok) {
            const commits = await commitsRes.json();
            commitCount += Array.isArray(commits) ? commits.length : 0;
          } else if (commitsRes.status === 403) {
            throw new Error("GitHub API rate limit exceeded. Wait ~1 hour or use GitHub token.");
          }
        }
        // Aktywności (ostatnie eventy) - tylko PR i commity
        const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public`);
        const events = eventsRes.ok ? await eventsRes.json() : [];
        setActivity(events.filter(ev => ev.type === "PullRequestEvent" || ev.type === "PushEvent"));
        setStats({
          login: user.login,
          publicRepos,
          prCount,
          commitCount
        });
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    fetchData();
  }, [username]);

  if (loading) return <div className="loading">Loading user data...</div>;
  if (error) return <div className="error">{username}: {error}</div>;
  if (!stats) return null;

  return (
    <>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr>
            <th>GitHub Username</th>
            <th>Public Repos</th>
            <th>Pull Requests (last 7 days)</th>
            <th>Commits (last 7 days)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href={`https://github.com/${stats.login}`} target="_blank" rel="noopener noreferrer">{stats.login}</a></td>
            <td>{stats.publicRepos}</td>
            <td>{stats.prCount}</td>
            <td>{stats.commitCount}</td>
          </tr>
        </tbody>
      </table>
      <h3>Latest PRs and commits</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center" }}>
        <thead>
          <tr>
            <th>GitHub Username</th>
            <th>Event Type</th>
            <th>Repository</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {activity.map(ev => (
            <tr key={ev.id}>
              <td>{stats.login}</td>
              <td>{ev.type}</td>
              <td><a href={`https://github.com/${ev.repo.name}`} target="_blank" rel="noopener noreferrer">{ev.repo.name}</a></td>
              <td>{new Date(ev.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
