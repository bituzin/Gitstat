document.getElementById("ghForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const username = document.getElementById("ghUser").value.trim();
  const resultDiv = document.getElementById("ghResult");
  resultDiv.innerHTML = '<div class="loading">Ładowanie...</div>';

  try {
    // Pobierz dane użytkownika
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error("Nie znaleziono użytkownika");
    const user = await userRes.json();

    // Pobierz ostatnie publiczne eventy
    const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public`);
    const events = eventsRes.ok ? await eventsRes.json() : [];

    // Pobierz repozytoria
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
    const repos = reposRes.ok ? await reposRes.json() : [];

    resultDiv.innerHTML = `
      <div class="user-card">
        <img class="avatar" src="${user.avatar_url}" alt="avatar">
        <span class="username">${user.login}</span>
        <div class="bio">${user.bio || ''}</div>
        <div class="stats">
          Followers: ${user.followers} | Following: ${user.following} | Public repos: ${user.public_repos}
        </div>
        <div class="stats">
          Lokalizacja: ${user.location || 'brak'}
        </div>
        <div class="stats">
          <a href="${user.html_url}" target="_blank">Profil na GitHub</a>
        </div>
        <div class="repos">
          <strong>Ostatnie repozytoria:</strong>
          ${repos.map(repo => `<div class="repo"><a href="${repo.html_url}" target="_blank">${repo.name}</a> (${repo.stargazers_count} ★)</div>`).join('') || 'brak'}
        </div>
        <div class="repos">
          <strong>Ostatnia aktywność:</strong>
          ${events.slice(0, 5).map(ev => `<div>${ev.type} w <a href="https://github.com/${ev.repo.name}" target="_blank">${ev.repo.name}</a> (${new Date(ev.created_at).toLocaleString()})</div>`).join('') || 'brak'}
        </div>
      </div>
    `;
  } catch (err) {
    resultDiv.innerHTML = `<div class="error">${err.message}</div>`;
  }
});

// Automatyczne pobieranie danych dla podanych kont po załadowaniu strony
const githubUsers = ["bituzin"];

window.addEventListener("DOMContentLoaded", async () => {
  const resultDiv = document.getElementById("ghResult") || document.getElementById("ghResultAuto");
  if (!resultDiv) return;
  resultDiv.innerHTML = '<div class="loading">Ładowanie danych użytkowników...</div>';
  let tableRows = "";
  const results = await Promise.all(githubUsers.map(async username => {
    try {
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      if (!userRes.ok) throw new Error("Nie znaleziono użytkownika");
      const user = await userRes.json();
      const publicRepos = user.public_repos;
      const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public`);
      const events = eventsRes.ok ? await eventsRes.json() : [];
      const prCount = events.filter(ev => ev.type === "PullRequestEvent").length;
      const commitCount = events.filter(ev => ev.type === "PushEvent").reduce((acc, ev) => acc + (ev.payload.commits ? ev.payload.commits.length : 0), 0);
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
          <th>Pull Requests (recent)</th>
          <th>Commits (recent)</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `;
});
