document.addEventListener('DOMContentLoaded', () => {
    const reportForm = document.getElementById('reportForm');
    const reportTableBody = document.querySelector('#reportTable tbody');
    const editIndexField = document.getElementById('editIndex');

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
                <td>
                    <button onclick="editReport(${index})">Modifica</button>
                    <button onclick="deleteReport(${index})">Rimuovi</button>
                </td>
            `;
            reportTableBody.appendChild(row);
        });
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

        localStorage.setItem('reports', JSON.stringify(reports));
        displayReports();

        // Resetta il form dopo l'inserimento o modifica
        reportForm.reset();
    });

    // Funzione per caricare un report nel form per la modifica
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
        localStorage.setItem('reports', JSON.stringify(reports));
        displayReports();
    };

    // Mostra i report salvati al caricamento della pagina
    displayReports();
});
