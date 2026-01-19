// Automatyczne pobieranie danych dla podanych kont po załadowaniu strony
const githubUsers = ["bituzin"];

function getDateNDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

window.addEventListener("DOMContentLoaded", async () => {
  const resultDiv = document.getElementById("ghResult");
  if (!resultDiv) return;
  resultDiv.innerHTML = '<div class="loading">Ładowanie danych użytkowników...</div>';
  let tableRows = "";
  let activityRows = "";
  const since = getDateNDaysAgo(7);
  const until = new Date().toISOString().split('T')[0];
  const results = await Promise.all(githubUsers.map(async username => {
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
      // Commits (last 7 days, first 10 repos to avoid API rate limit)
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
      activityRows += events
        .filter(ev => ev.type === "PullRequestEvent" || ev.type === "PushEvent")
        .map(ev => `<tr><td>${user.login}</td><td>${ev.type}</td><td><a href='https://github.com/${ev.repo.name}' target='_blank'>${ev.repo.name}</a></td><td>${new Date(ev.created_at).toLocaleString()}</td></tr>`)
        .join('');
      tableRows += `<tr>
        <td><a href="https://github.com/${user.login}" target="_blank">${user.login}</a></td>
        <td>${publicRepos}</td>
        <td>${prCount}</td>
        <td>${commitCount}</td>
      </tr>`;
      return "";
    } catch (err) {
      tableRows += `<tr><td colspan="4" class="error">${username}: ${err.message}</td></tr>`;
      return "";
    }
  }));
  resultDiv.innerHTML = `
    <table style="width:100%;border-collapse:collapse;text-align:center;">
      <thead>
        <tr>
          <th>GitHub Username</th>
          <th>Public Repos</th>
          <th>Pull Requests (last 7 days)</th>
          <th>Commits (last 7 days)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <h3>Ostatnie PR i commity użytkownika</h3>
    <table style="width:100%;border-collapse:collapse;text-align:center;">
      <thead>
        <tr>
          <th>GitHub Username</th>
          <th>Event Type</th>
          <th>Repository</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${activityRows}
      </tbody>
    </table>
  `;
});
