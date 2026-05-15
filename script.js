// Fichiers CSV utilisés comme sources de données.
const runningFiles = [
  { year: 2024, path: "data/running-2024.csv" },
  { year: 2025, path: "data/running-2025.csv" },
  { year: 2026, path: "data/running-2026.csv" },
];

const objectivesFile = "data/running-objectives.csv";

// Fonction principale appelée au chargement de la page.
// Elle coordonne le chargement des données et l'affichage du dashboard.
async function initDashboard() {
  try {
    const allRuns = await loadAllRuns();
    const objectives = await loadObjectives();

    renderStats(allRuns);
    renderYearlyStats(allRuns);
    renderHighlights(allRuns);
    renderObjectives(objectives);
    renderRunsTable(allRuns);
  } catch (error) {
    console.error("Erreur pendant le chargement des données :", error);
  }
}

// Charge tous les fichiers CSV de course, fusionne les données,
// puis trie les sorties de la plus récente à la plus ancienne.
async function loadAllRuns() {
  const yearlyRuns = await Promise.all(
    runningFiles.map(async (file) => {
      const response = await fetch(file.path);
      const csvText = await response.text();
      return parseRunningCsv(csvText, file.year);
    })
  );

  return yearlyRuns
    .flat()
    .sort((a, b) => b.dateObject - a.dateObject);
}

//Même chose qu'au dessus mais avec les objectifs
async function loadObjectives() {
  const response = await fetch(objectivesFile);
  const csvText = await response.text();
  return parseObjectivesCsv(csvText);
}

// Transforme le contenu brut d'un CSV de course en tableau d'objets JavaScript.
function parseRunningCsv(csvText, year) {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");

  // Les vraies sorties commencent à partir de la ligne 4 du CSV.
  const dataLines = lines.slice(3);

  return dataLines
    .map((line) => {
      const cells = parseCsvLine(line);

      const date = cells[0]?.trim();
      const distance = parseFrenchNumber(cells[1]);
      const time = cells[2]?.trim();
      const calories = Number(cells[3]);
      const speed = parseFrenchNumber(cells[4]);
      const comment = cells[5]?.trim() || "";

      if (!date || !distance || !time) {
        return null;
      }

      return {
        year,
        date,
        dateObject: parseFrenchDate(date),
        distance,
        time,
        timeInSeconds: parseTimeToSeconds(time),
        calories: Number.isNaN(calories) ? 0 : calories,
        speed,
        comment,
      };
    })
    .filter(Boolean);
}

// Transforme le CSV des objectifs en objets JavaScript exploitables.
function parseObjectivesCsv(csvText) {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");

  return lines
    .map((line) => {
      const cells = parseCsvLine(line);

      const title = cells[1]?.trim();
      const validatedText = cells[3]?.trim().toLowerCase();

      if (!title || title.toLowerCase() === "objectif") {
        return null;
      }

      return {
        title,
        validated: validatedText === "true",
      };
    })
    .filter(Boolean);
}

// Lit correctement une ligne CSV, y compris les valeurs entourées de guillemets.
function parseCsvLine(line) {
  const result = [];
  let currentValue = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      currentValue += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      result.push(currentValue);
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  result.push(currentValue);
  return result;
}

// Convertit un nombre au format français("10,5") en nombre JavaScript.
function parseFrenchNumber(value) {
  if (!value) return 0;
  return Number(value.replace(",", "."));
}

// Convertit une date française au format JJ/MM/AAAA en objet Date JavaScript.
function parseFrenchDate(dateText) {
  const [day, month, year] = dateText.split("/");

  const fullYear = year.length === 2 ? `20${year}` : year;

  return new Date(`${fullYear}-${month}-${day}`);
}

// Convertit une durée au format HH:MM:SS en nombre total de secondes.
function parseTimeToSeconds(timeText) {
  const parts = timeText.split(":").map(Number);

  if (parts.length !== 3) {
    return 0;
  }

  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(totalSeconds) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  return `${hours}h ${minutes}min`;
}

function formatNumber(value) {
  return value.toFixed(2).replace(".", ",");
}

// Affiche les statistiques globales dans les cards du dashboard.
function renderStats(runs) {
  const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
  const totalRuns = runs.length;
  const totalTime = runs.reduce((sum, run) => sum + run.timeInSeconds, 0);
  const averageSpeed = totalDistance / (totalTime / 3600);

  document.querySelector("#totalDistance").textContent = `${formatNumber(totalDistance)} km`;
  document.querySelector("#totalRuns").textContent = totalRuns;
  document.querySelector("#totalTime").textContent = formatDuration(totalTime);
  document.querySelector("#averageSpeed").textContent = `${formatNumber(averageSpeed)} km/h`;
}

// Affiche la plus longue sortie et la sortie la plus rapide.
function renderHighlights(runs) {
  const longestRun = runs.reduce((best, run) => {
    return run.distance > best.distance ? run : best;
  }, runs[0]);

  const fastestRun = runs.reduce((best, run) => {
    return run.speed > best.speed ? run : best;
  }, runs[0]);

  document.querySelector("#longestRun").textContent =
    `${longestRun.distance} km le ${longestRun.date}`;

  document.querySelector("#fastestRun").textContent =
    `${formatNumber(fastestRun.speed)} km/h le ${fastestRun.date}`;
}

// Affiche la liste des objectifs avec un statut validé ou à faire.
function renderObjectives(objectives) {
  const objectivesList = document.querySelector("#objectivesList");

  objectivesList.innerHTML = objectives
    .map((objective) => {
      const status = objective.validated ? "Validé" : "À faire";
      const className = objective.validated ? "validated" : "pending";

      return `
        <div class="objective-item ${className}">
          <span>${objective.title}</span>
          <strong>${status}</strong>
        </div>
      `;
    })
    .join("");
}

// Génère les lignes du tableau d'historique des sorties.
function renderRunsTable(runs) {
  const tableBody = document.querySelector("#runsTableBody");

  tableBody.innerHTML = runs
    .map((run) => {
      return `
        <tr>
          <td>${run.date}</td>
          <td>${run.distance} km</td>
          <td>${run.time}</td>
          <td>${run.calories}</td>
          <td>${formatNumber(run.speed)} km/h</td>
        </tr>
      `;
    })
    .join("");
}

// Calcule et affiche les statistiques séparées par année.
function renderYearlyStats(runs) {
  const yearlyStatsContainer = document.querySelector("#yearlyStats");

  const statsByYear = {};

  runs.forEach((run) => {
    if (!statsByYear[run.year]) {
      statsByYear[run.year] = {
        year: run.year,
        totalRuns: 0,
        totalDistance: 0,
        totalTime: 0,
        totalCalories: 0,
      };
    }

    statsByYear[run.year].totalRuns += 1;
    statsByYear[run.year].totalDistance += run.distance;
    statsByYear[run.year].totalTime += run.timeInSeconds;
    statsByYear[run.year].totalCalories += run.calories;
  });

  const yearlyStats = Object.values(statsByYear).sort((a, b) => b.year - a.year);

  yearlyStatsContainer.innerHTML = yearlyStats
    .map((stats) => {
      const averageSpeed = stats.totalDistance / (stats.totalTime / 3600);

      return `
        <article class="year-card">
          <h3>${stats.year}</h3>
          <ul>
            <li><strong>Sorties :</strong> ${stats.totalRuns}</li>
            <li><strong>Distance :</strong> ${formatNumber(stats.totalDistance)} km</li>
            <li><strong>Temps :</strong> ${formatDuration(stats.totalTime)}</li>
            <li><strong>Vitesse moyenne :</strong> ${formatNumber(averageSpeed)} km/h</li>
            <li><strong>Calories :</strong> ${stats.totalCalories}</li>
          </ul>
        </article>
      `;
    })
    .join("");
}

initDashboard();