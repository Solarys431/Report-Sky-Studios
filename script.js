document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const reportTableBody = document.querySelector('#reportTable tbody');
    const editIndexField = document.getElementById('editIndex');

    // Carica i report dal localStorage o crea un array vuoto
    let reports = JSON.parse(localStorage.getItem('reports')) || [];

    // Dati per il grafico
    let productionData = {};
    let chart;

    // Funzione per aggiornare il grafico
    function updateChart() {
        const labels = Object.keys(productionData);
        const data = Object.values(productionData).map(problems => problems.length);

        console.log("Labels: ", labels);  // Debug: Mostra le produzioni nel grafico
        console.log("Data: ", data);      // Debug: Mostra i dati del grafico

        // Se il grafico esiste già, lo distruggiamo prima di crearne uno nuovo
        if (chart) chart.destroy();

        // Crea un nuovo grafico a barre
        const ctx = document.getElementById('issueChart').getContext('2d');
        chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels, // Produzioni
                datasets: [{
                    label: 'Numero di Problemi',
                    data: data, // Numero di problemi per produzione
                    backgroundColor: 'rgba(0, 123, 255, 0.5)',
                    borderColor: 'rgba(0, 123, 255, 1)',
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

    // Funzione per mostrare i report nella tabella
    function displayReports() {
        reportTableBody.innerHTML = ''; // Svuota la tabella prima di inserire i nuovi dati
        productionData = {}; // Resetta i dati per il grafico

        reports.forEach((report, index) => {
            // Aggiungi i report alla tabella
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

            // Aggiorna i dati per il grafico
            if (!productionData[report.production]) {
                productionData[report.production] = [];
            }
            productionData[report.production].push(report.issue);
        });

        updateChart(); // Aggiorna il grafico
    }

    // Aggiungi o modifica un report
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newReport = {
            dateTime: new Date().toLocaleString(), // Aggiungi la data e ora attuali
            production: reportForm.production.value,
            issue: reportForm.issue.value,
            resolution: reportForm.resolution.value,
            notes: reportForm.notes.value
        };

        const editIndex = editIndexField.value;

        if (editIndex === "") {
            // Aggiungi un nuovo report
            reports.push(newReport);
        } else {
            // Modifica il report esistente all'indice
            reports[editIndex] = newReport;
            editIndexField.value = "";  // Resetta l'indice del report da modificare
        }

        // Salva l'array dei report nel localStorage
        localStorage.setItem('reports', JSON.stringify(reports));
        displayReports(); // Mostra nuovamente la tabella aggiornata

        // Resetta il form dopo l'inserimento o modifica
        reportForm.reset();
    });

    // Funzione per caricare i dati del report selezionato nel form per la modifica
    window.editReport = function(index) {
        const report = reports[index];
        reportForm.production.value = report.production;
        reportForm.issue.value = report.issue;
        reportForm.resolution.value = report.resolution;
        reportForm.notes.value = report.notes;
        editIndexField.value = index;  // Imposta l'indice del report che si sta modificando
    };

    // Funzione per rimuovere un report
    window.deleteReport = function(index) {
        reports.splice(index, 1);  // Rimuovi il report dall'array
        localStorage.setItem('reports', JSON.stringify(reports)); // Aggiorna il localStorage
        displayReports(); // Mostra nuovamente la tabella aggiornata
    };

    // Mostra i report salvati al caricamento della pagina
    displayReports();
});
