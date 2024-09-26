document.addEventListener('DOMContentLoaded', () => {
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

    // Carica i report dal localStorage o crea un array vuoto
    let reports = JSON.parse(localStorage.getItem('reports')) || [];

    // Variabile per il grafico Chart.js
    let chart;

    // Funzione per creare il grafico con i dati organizzati per mese, produzione e causa del problema
    function createChart(monthlyData) {
        const ctx = document.getElementById('issueChart').getContext('2d');

        const labels = Object.keys(monthlyData); // Mesi
        const datasets = [];

        // Troviamo tutte le produzioni e le cause dei problemi
        const productions = [...new Set(reports.map(report => report.production))];
        const issues = [...new Set(reports.map(report => report.issue))];

        // Creiamo un dataset per ogni combinazione di produzione e causa del problema
        productions.forEach(production => {
            issues.forEach(issue => {
                const data = labels.map(month => {
                    return monthlyData[month]?.[production]?.[issue] || 0;
                });

                datasets.push({
                    label: `${production} - ${issue}`, // Etichetta unendo produzione e problema
                    data: data,
                    backgroundColor: getRandomColor(),
                    borderColor: getRandomColor(),
                    borderWidth: 1
                });
            });
        });

        // Se un grafico esiste già, distruggilo prima di crearne uno nuovo
        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels, // Mesi
                datasets: datasets // Dati per produzione e causa del problema
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Funzione per generare un colore casuale per le barre del grafico
    function getRandomColor() {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        return `rgba(${r},${g},${b},0.6)`;
    }

    // Funzione per organizzare i report per mese, produzione e causa del problema
    function organizeData() {
        let monthlyData = {};

        reports.forEach(report => {
            // Aggiungiamo ':00Z' per completare il formato della data
            const dateTimeString = report.dateTime + ':00Z';
            const date = new Date(dateTimeString);

            if (isNaN(date)) {
                console.error('Data non valida:', report.dateTime);
                return;
            }

            const month = date.toLocaleString('default', { month: 'long', year: 'numeric' }); // Otteniamo il mese in formato testo

            // Inizializza la struttura dei dati
            if (!monthlyData[month]) {
                monthlyData[month] = {};
            }

            if (!monthlyData[month][report.production]) {
                monthlyData[month][report.production] = {};
            }

            if (!monthlyData[month][report.production][report.issue]) {
                monthlyData[month][report.production][report.issue] = 0;
            }

            // Incrementa il conteggio dei problemi per produzione e causa del problema
            monthlyData[month][report.production][report.issue]++;
        });

        // Crea il grafico con i dati organizzati
        createChart(monthlyData);
    }

    // Funzione per popolare i filtri
    function populateFilters() {
        // Popola il filtro per Data
        const dates = [...new Set(reports.map(report => {
            const dateTimeString = report.dateTime + ':00Z';
            const date = new Date(dateTimeString);
            return date.toLocaleDateString();
        }))];

        filterDate.innerHTML = '<option value="all">Tutte le Date</option>';
        dates.forEach(date => {
            const option = document.createElement('option');
            option.value = date;
            option.textContent = date;
            filterDate.appendChild(option);
        });

        // Popola il filtro per Produzione
        const productions = [...new Set(reports.map(report => report.production))];
        filterProduction.innerHTML = '<option value="all">Tutte le Produzioni</option>';
        productions.forEach(prod => {
            const option = document.createElement('option');
            option.value = prod;
            option.textContent = prod;
            filterProduction.appendChild(option);
        });

        // Popola il filtro per Problema
        const issues = [...new Set(reports.map(report => report.issue))];
        filterIssue.innerHTML = '<option value="all">Tutti i Problemi</option>';
        issues.forEach(issue => {
            const option = document.createElement('option');
            option.value = issue;
            option.textContent = issue;
            filterIssue.appendChild(option);
        });
    }

    // Funzione per mostrare i report nella tabella
    function displayReports() {
        reportTableBody.innerHTML = ''; // Svuota la tabella

        const selectedDate = filterDate.value;
        const selectedProduction = filterProduction.value;
        const selectedIssue = filterIssue.value;

        reports.forEach((report, index) => {
            // Converte la stringa in un oggetto Date
            const dateTimeString = report.dateTime + ':00Z';
            const date = new Date(dateTimeString);

            if (isNaN(date)) {
                console.error('Data non valida nel report:', report.dateTime);
                return;
            }

            const reportDateString = date.toLocaleDateString();

            // Applica i filtri
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
                    <button class="edit" onclick="editReport(${index})">Modifica</button>
                    <button class="delete" onclick="deleteReport(${index})">Rimuovi</button>
                    <button class="send-mail" onclick="sendMail(${index})">Invia Mail</button>
                </td>
            `;
            reportTableBody.appendChild(row);
        });

        organizeData(); // Organizza i dati e aggiorna il grafico
        populateFilters(); // Aggiorna i filtri
    }

    // Aggiungi o modifica un report
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const dateTimeValue = reportForm.dateTime.value; // Prendi la data e ora inserite dall'utente

        const newReport = {
            dateTime: dateTimeValue,
            production: reportForm.production.value,
            issue: reportForm.issue.value,
            resolution: reportForm.resolution.value,
            notes: reportForm.notes.value
        };

        const editIndex = editIndexField.value;

        if (editIndex === "") {
            // Aggiungi nuovo report
            reports.push(newReport);
        } else {
            // Modifica report esistente
            reports[editIndex] = newReport;
            editIndexField.value = ""; // Resetta l'indice del report da modificare
        }

        localStorage.setItem('reports', JSON.stringify(reports)); // Salva i report aggiornati nel localStorage
        displayReports(); // Aggiorna la tabella e il grafico

        // Resetta il form dopo l'inserimento o la modifica
        reportForm.reset();
    });

    // Funzione per caricare i dati di un report nel form per la modifica
    window.editReport = function(index) {
        const report = reports[index];
        reportForm.dateTime.value = report.dateTime;
        reportForm.production.value = report.production;
        reportForm.issue.value = report.issue;
        reportForm.resolution.value = report.resolution;
        reportForm.notes.value = report.notes;
        editIndexField.value = index; // Imposta l'indice del report che si sta modificando
    };

    // Funzione per rimuovere un report
    window.deleteReport = function(index) {
        reports.splice(index, 1); // Rimuovi il report dall'array
        localStorage.setItem('reports', JSON.stringify(reports)); // Aggiorna il localStorage
        displayReports(); // Mostra nuovamente la tabella e aggiorna il grafico
    };

    // Funzione per inviare una mail con i dettagli del report
    window.sendMail = function(index) {
        const report = reports[index];
        const dateTimeString = report.dateTime + ':00Z';
        const date = new Date(dateTimeString);
        const dateString = date.toLocaleDateString();

        const subject = `Report del ${dateString}`;
        const body = `Produzione: ${report.production}\nProblema: ${report.issue}\nRisoluzione: ${report.resolution}\nNote: ${report.notes}`;

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // Mostra i report salvati al caricamento della pagina
    displayReports();
});
