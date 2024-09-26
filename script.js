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

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
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

    // Funzione per organizzare i report per mese, produzione e causa del problema
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

    // Funzione per mostrare i report nella tabella
    function displayReports() {
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
    }

    // Aggiungi o modifica un report
    reportForm.addEventListener('submit', (e) => {
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

        localStorage.setItem('reports', JSON.stringify(reports));
        displayReports();
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
        editIndexField.value = index;
    };

    // Funzione per rimuovere un report
    window.deleteReport = function(index) {
        if (confirm('Sei sicuro di voler eliminare questo report?')) {
            reports.splice(index, 1);
            localStorage.setItem('reports', JSON.stringify(reports));
            displayReports();
        }
    };

    // Funzione per inviare una mail con i dettagli del report
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

        const mailtoLink = `mailto:?subject=${encodeURIComponent(
