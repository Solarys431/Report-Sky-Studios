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

    // Funzioni per il grafico, organizzazione dati, etc. rimangono invariate...

    // Modifica la funzione displayReports
    function displayReports() {
        reportTableBody.innerHTML = ''; // Svuota la tabella

        const selectedDate = filterDate.value;
        const selectedProduction = filterProduction.value;
        const selectedIssue = filterIssue.value;

        reports.forEach((report, index) => {
            const reportDate = new Date(report.dateTime);
            const reportDateString = reportDate.toLocaleDateString();

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

    // Aggiungi le funzioni populateFilters e sendMail come descritto in precedenza...

    // Al caricamento della pagina
    displayReports();
});
