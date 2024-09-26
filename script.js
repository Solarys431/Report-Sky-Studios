document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const reportTableBody = document.querySelector('#reportTable tbody');

    // Carica i report dal localStorage
    let reports = JSON.parse(localStorage.getItem('reports')) || [];

    // Mostra i report nella tabella
    function displayReports() {
        reportTableBody.innerHTML = ''; // Pulisce la tabella prima di inserire nuovi dati
        reports.forEach((report, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${report.dateTime}</td>
                <td>${report.production}</td>
                <td>${report.issue}</td>
                <td>${report.resolution}</td>
                <td>${report.notes}</td>
            `;
            reportTableBody.appendChild(row);
        });
    }

    // Aggiungi un nuovo report
    reportForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newReport = {
            dateTime: new Date().toLocaleString(),
            production: reportForm.production.value,
            issue: reportForm.issue.value,
            resolution: reportForm.resolution.value,
            notes: reportForm.notes.value
        };

        reports.push(newReport);
        localStorage.setItem('reports', JSON.stringify(reports));
        displayReports();

        // Resetta il form dopo l'inserimento
        reportForm.reset();
    });

    // Mostra i report salvati al caricamento della pagina
    displayReports();
});
