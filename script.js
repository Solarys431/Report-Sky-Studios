// Configurazione GitHub
const GITHUB_USERNAME = 'solarys431';
const GITHUB_REPO = 'Report-Sky-Studios';
const GITHUB_FILE_PATH = 'reports.json';
const GITHUB_TOKEN = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN'; // Sostituisci con il tuo token

// Funzione per salvare i report in localStorage
function saveReportsToLocalStorage(reports) {
    localStorage.setItem('reports', JSON.stringify(reports));
}

// Funzione per caricare i report da localStorage
function loadReportsFromLocalStorage() {
    const reports = localStorage.getItem('reports');
    return reports ? JSON.parse(reports) : [];
}

// Funzione per caricare i report da GitHub
async function loadReportsFromGitHub() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const content = atob(data.content);
        console.log('Dati caricati da GitHub:', content); // Log per debug
        const reports = JSON.parse(content);
        saveReportsToLocalStorage(reports); // Salva una copia in localStorage
        return reports;
    } catch (error) {
        console.error('Errore nel caricamento dei report da GitHub:', error);
        return loadReportsFromLocalStorage(); // Carica da localStorage in caso di errore
    }
}

// Funzione per salvare i report su GitHub
async function saveReportsToGitHub(reports) {
    try {
        const currentFileResponse = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`
            }
        });
        if (!currentFileResponse.ok) {
            throw new Error(`HTTP error! status: ${currentFileResponse.status}`);
        }
        const currentFile = await currentFileResponse.json();

        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Aggiornamento reports',
                content: btoa(JSON.stringify(reports)),
                sha: currentFile.sha
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Reports salvati con successo su GitHub');
        saveReportsToLocalStorage(reports); // Aggiorna anche la copia locale
    } catch (error) {
        console.error('Errore nel salvataggio dei report su GitHub:', error);
        saveReportsToLocalStorage(reports); // Salva comunque in localStorage
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const reportForm = document.getElementById('reportForm');
    const reportTableBody = document.querySelector('#reportTable tbody');
    const editIndexField = document.getElementById('editIndex');

    // Filtri
    const filterDate = document.getElementById('filterDate');
    const filterProduction = document.getElementById('filterProduction');
    const filterIssue = document.getElementById('filterIssue');

    filterDate.addEventListener('change', displayReports);
    filterProduction.addEventListener('change', displayReports);
    filterIssue.addEventListener('change', displayReports);

    // Variabile globale per i report
    let reports = [];

    // Funzione per creare il grafico con i dati organizzati per mese, produzione e causa del problema
    function createChart(monthlyData) {
        const ctx = document.getElementById('issueChart').getContext('2d');

        const labels = Object.keys(monthlyData);
        const datasets = [];

        const productions = [...new Set(reports.map(report => report.production))];
        const issues = [...new Set(reports.map(report => report.issue))];

        productions.forEach((production, pIndex) => {
            issues.forEach((issue, iIndex) => {
                const data = labels.map(month => monthlyData[month]?.[production]?.[issue] || 0);

                datasets.push({
                    label: `${production} - ${issue}`,
                    data: data,
                    backgroundColor: `hsl(${(pIndex * 60 + iIndex * 30) % 360}, 70%, 50%)`,
                    borderColor: `hsl(${(pIndex * 60 + iIndex * 30) % 360}, 70%, 40%)`,
                    borderWidth: 1
                });
            });
        });

        if (window.chart) {
            window.chart.destroy();
        }

        window.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true,
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Problemi per Mese, Produzione e Causa'
                    }
                }
            }
        });
    }

    // Funzione per organizzare i dati per il grafico
    function organizeData() {
        let monthlyData = {};

        reports.forEach(report => {
            const date = new Date(report.dateTime);
            const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });

            if (!monthlyData[month]) {
                monthlyData[month] = {};
            }
            if (!monthlyData[month][report.production]) {
                monthlyData[month][report.production] = {};
            }
            if (!monthlyData[month][report.production][report.issue]) {
                monthlyData[month][report.production][report.issue] = 0;
            }

            monthlyData[month][report.production][report.issue]++;
        });

        createChart(monthlyData);
    }

    // Funzione per popolare i filtri
    function populateFilters() {
        const dates = [...new Set(reports.map(report => new Date(report.dateTime).toLocaleDateString()))];
        const productions = [...new Set(reports.map(report => report.production))];
        const issues = [...new Set(reports.map(report => report.issue))];

        populateFilter(filterDate, dates, 'Tutte le Date');
        populateFilter(filterProduction, productions, 'Tutte le Produzioni');
        populateFilter(filterIssue, issues, 'Tutti i Problemi');
    }

    function populateFilter(selectElement, options, allText) {
        selectElement.innerHTML = `<option value="all">${allText}</option>`;
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
    }

    // Funzione per caricare e visualizzare i report
    async function displayReports() {
        try {
            reports = await loadReportsFromGitHub();
            console.log('Report caricati:', reports); // Log per debug

            reportTableBody.innerHTML = '';

            const selectedDate = filterDate.value;
            const selectedProduction = filterProduction.value;
            const selectedIssue = filterIssue.value;

            reports.forEach((report, index) => {
                const date = new Date(report.dateTime);
                const reportDateString = date.toLocaleDateString();

                if (selectedDate !== 'all' && selectedDate !== reportDateString) return;
                if (selectedProduction !== 'all' && selectedProduction !== report.production) return;
                if (selectedIssue !== 'all' && selectedIssue !== report.issue) return;

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${reportDateString}</td>
                    <td>${report.production}</td>
                    <td>${report.issue}</td>
                    <td>${report.resolution}</td>
                    <td>${report.notes}</td>
                    <td>
                        <button class="btn btn-sm btn-warning edit" onclick="editReport(${index})">Modifica</button>
                        <button class="btn btn-sm btn-danger delete" onclick="deleteReport(${index})">Rimuovi</button>
                        <button class="btn btn-sm btn-success send-mail" onclick="sendMail(${index})">Invia Mail</button>
                    </td>
                `;
                reportTableBody.appendChild(row);
            });

            organizeData();
            populateFilters();
        } catch (error) {
            console.error('Errore nella visualizzazione dei report:', error);
        }
    }

    // Gestione del form per salvare su GitHub
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newReport = {
            dateTime: reportForm.dateTime.value,
            production: reportForm.production.value,
            issue: reportForm.issue.value,
            resolution: reportForm.resolution.value,
            notes: reportForm.notes.value
        };

        const editIndex = editIndexField.value;

        if (editIndex === "") {
            reports.push(newReport);
        } else {
            reports[editIndex] = newReport;
            editIndexField.value = "";
        }

        await saveReportsToGitHub(reports);
        await displayReports();
        reportForm.reset();
    });

    // Funzioni di modifica e eliminazione
    window.editReport = function(index) {
        const report = reports[index];
        reportForm.dateTime.value = report.dateTime;
        reportForm.production.value = report.production;
        reportForm.issue.value = report.issue;
        reportForm.resolution.value = report.resolution;
        reportForm.notes.value = report.notes;
        editIndexField.value = index;
    };

    window.deleteReport = async function(index) {
        if (confirm('Sei sicuro di voler eliminare questo report?')) {
            reports.splice(index, 1);
            await saveReportsToGitHub(reports);
            await displayReports();
        }
    };

    window.sendMail = function(index) {
        const report = reports[index];
        const date = new Date(report.dateTime);
        const dateString = date.toLocaleString();

        const subject = `Report del ${dateString}`;
        const body = `
Produzione: ${report.production}
Problema: ${report.issue}
Risoluzione: ${report.resolution}
Note: ${report.notes}
        `;

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // Carica i report iniziali
    await displayReports();
});
