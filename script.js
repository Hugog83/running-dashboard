const runningFiles = [
  { year: 2024, path: "data/running-2024.csv" },
  { year: 2025, path: "data/running-2025.csv" },
  { year: 2026, path: "data/running-2026.csv" },
];

const objectivesFile = "data/running-objectives.csv";

async function initDashboard() {
  try {
    const allRuns = await loadAllRuns();
    const objectives = await loadObjectives();

    renderStats(allRuns);
    renderHighlights(allRuns);
    renderObjectives(objectives);
    renderRunsTable(allRuns);
  } catch (error) {
    console.error("Erreur pendant le chargement des données :", error);
  }
}

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

async function loadObjectives() {
  const response = await fetch(objectivesFile);
  const csvText = await response.text();
  return parseObjectivesCsv(csvText);
}

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

function parseFrenchNumber(value) {
  if (!value) return 0;
  return Number(value.replace(",", "."));
}

function parseFrenchDate(dateText) {
  const [day, month, year] = dateText.split("/");

  const fullYear = year.length === 2 ? `20${year}` : year;

  return new Date(`${fullYear}-${month}-${day}`);
}

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
          <td>${run.comment}</td>
        </tr>
      `;
    })
    .join("");
}

initDashboard();