document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const reportTableBody = document.querySelector('#reportTable tbody');
    const editIndexField = document.getElementById('editIndex');

    // Carica i report dal localStorage o crea un array vuoto
    let reports = JSON.parse(localStorage.getItem('reports')) || [];

    // Variabile per il grafico Chart.js
    let chart;

    // Funzione per creare il grafico con i dati aggiornati
    function createChart(productionData) {
        const ctx = document.getElementById('issueChart').getContext('2d');

        const labels = Object.keys(productionData); // Produzioni
        const data = Object.values(productionData); // Numero di problemi per ogni produzione

        if (chart) {
            chart.destroy(); // Distruggi il grafico precedente prima di crearne uno nuovo
        }

        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Numero di Problemi',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
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

    // Funzione per aggiornare il grafico
    function updateChart() {
        let productionData = {};

        // Conta i problemi per produzione
        reports.forEach((report) => {
            if (!productionData[report.production]) {
                productionData[report.production] = 0;
            }
            productionData[report.production]++;
        });

        // Crea o aggiorna il grafico con i nuovi dati
        createChart(productionData);
    }

    // Funzione per mostrare i report nella tabella
    function displayReports() {
        reportTableBody.innerHTML = ''; // Svuota la tabella prima di inserire i nuovi dati

        reports.forEach((report, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.dateTime}</td>
                <td>${report.production}</td>
                <td>${report.issue}</td>
                <td>${report.resolution}</td>
                <td>${report.notes}</td>
                <td>
                    <button onclick="editReport(${index})">Modifica</button>
                    <button onclick="deleteReport(${index})">Rimuovi</button>
                </td>
            `;
            reportTableBody.appendChild(row);
        });

        updateChart(); // Aggiorna il grafico ogni volta che mostri i report
    }

    // Aggiungi o modifica un report
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newReport = {
            dateTime: new Date().toLocaleString(),
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
            editIndexField.value = "";  // Resetta il campo di modifica
        }

        localStorage.setItem('reports', JSON.stringify(reports)); // Salva i report
        displayReports(); // Aggiorna la tabella e il grafico

        // Resetta il form dopo l'inserimento
        reportForm.reset();
    });

    // Funzione per caricare i dati di un report nel form per la modifica
    window.editReport = function(index) {
        const report = reports[index];
        reportForm.production.value = report.production;
        reportForm.issue.value = report.issue;
        reportForm.resolution.value = report.resolution;
        reportForm.notes.value = report.notes;
        editIndexField.value = index;  // Imposta l'indice del report da modificare
    };

    // Funzione per rimuovere un report
    window.deleteReport = function(index) {
        reports.splice(index, 1);  // Rimuovi il report dall'array
        localStorage.setItem('reports', JSON.stringify(reports)); // Aggiorna il localStorage
        displayReports(); // Mostra nuovamente la tabella e il grafico aggiornato
    };

    // Mostra i report salvati al caricamento della pagina
    displayReports();
});
