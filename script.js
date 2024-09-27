// Configurazione JSONBin
const BIN_ID = '66f591daad19ca34f8ae0b22'; // Sostituisci con il tuo Bin ID
const API_KEY = '$2a$10$z.gsA2cdHbVfQZ6rB8VKw.kv0kkW1KsuMYDim97yQsCw.fYk1S0j2'; // Sostituisci con la tua X-Master-Key

// Costanti per la paginazione
const REPORTS_PER_PAGE = 5;

// Funzione per generare un ID univoco per il report
function generateUniqueId() {
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `REP-${random}`;
}

// Funzione per caricare i report da JSONBin
async function loadReportsFromJSONBin() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Dati caricati da JSONBin:', data.record);
        return data.record.reports || [];
    } catch (error) {
        console.error('Errore nel caricamento dei report da JSONBin:', error);
        return [];
    }
}

// Funzione per salvare i report su JSONBin
async function saveReportsToJSONBin(reports) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ reports: reports })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Reports salvati con successo su JSONBin');
    } catch (error) {
        console.error('Errore nel salvataggio dei report su JSONBin:', error);
        alert('Si è verificato un errore nel salvataggio dei report. Riprova più tardi.');
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

    // Variabili globali
    let reports = [];
    let currentPage = 1;

    // Funzione per mostrare il popup
    function showPopup(message) {
        const popup = document.createElement('div');
        popup.className = 'alert alert-success alert-dismissible fade show';
        popup.setAttribute('role', 'alert');
        popup.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        document.querySelector('.container').prepend(popup);

        // Rimuovi il popup dopo 5 secondi
        setTimeout(() => {
            popup.remove();
        }, 5000);
    }

    // Funzione per scorrere alla posizione del nuovo report
    function scrollToNewReport() {
        const reportTable = document.getElementById('reportTable');
        const tableRect = reportTable.getBoundingClientRect();
        window.scrollTo({
            top: window.pageYOffset + tableRect.top,
            behavior: 'smooth'
        });
    }

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
            reports = await loadReportsFromJSONBin();
            console.log('Report caricati:', reports);

            reportTableBody.innerHTML = '';

            const selectedDate = filterDate.value;
            const selectedProduction = filterProduction.value;
            const selectedIssue = filterIssue.value;

            const filteredReports = reports.filter(report => {
                const date = new Date(report.dateTime);
                const reportDateString = date.toLocaleDateString();
                return (selectedDate === 'all' || selectedDate === reportDateString) &&
                       (selectedProduction === 'all' || selectedProduction === report.production) &&
                       (selectedIssue === 'all' || selectedIssue === report.issue);
            });

            const startIndex = (currentPage - 1) * REPORTS_PER_PAGE;
            const endIndex = startIndex + REPORTS_PER_PAGE;
            const paginatedReports = filteredReports.slice(startIndex, endIndex);

            paginatedReports.forEach((report, index) => {
                const date = new Date(report.dateTime);
                const reportDateString = date.toLocaleDateString();

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${report.id || 'N/A'}</td>
                    <td>${reportDateString}</td>
                    <td>${report.production}</td>
                    <td>${report.issue}</td>
                    <td>${report.resolution}</td>
                    <td>${report.notes}</td>
                    <td>
                        <button class="btn btn-sm btn-warning edit" onclick="editReport(${reports.indexOf(report)})">Modifica</button>
                        <button class="btn btn-sm btn-danger delete" onclick="deleteReport(${reports.indexOf(report)})">Rimuovi</button>
                        <button class="btn btn-sm btn-success send-mail" onclick="sendMail(${reports.indexOf(report)})">Invia Mail</button>
                    </td>
                `;
                reportTableBody.appendChild(row);
            });

            updatePagination(filteredReports.length);
            organizeData();
            populateFilters();
        } catch (error) {
            console.error('Errore nella visualizzazione dei report:', error);
        }
    }

    // Funzione per aggiornare la paginazione
    function updatePagination(totalReports) {
        const totalPages = Math.ceil(totalReports / REPORTS_PER_PAGE);
        const paginationElement = document.getElementById('pagination');
        paginationElement.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" onclick="changePage(${i})">${i}</a>`;
            paginationElement.appendChild(li);
        }
    }

    // Funzione per cambiare pagina
    window.changePage = function(page) {
        currentPage = page;
        displayReports();
    };

    // Gestione del form per salvare su JSONBin
    reportForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const newReport = {
            id: generateUniqueId(),
            dateTime: reportForm.dateTime.value,
            production: reportForm.production.value,
            issue: reportForm.issue.value,
            resolution: reportForm.resolution.value,
            notes: reportForm.notes.value
        };

        const editIndex = editIndexField.value;

        if (editIndex === "") {
            reports.unshift(newReport); // Aggiungi il nuovo report all'inizio dell'array
            showPopup('Report inserito correttamente!');
        } else {
            newReport.id = reports[editIndex].id || generateUniqueId();
            reports[editIndex] = newReport;
            editIndexField.value = "";
            showPopup('Report modificato correttamente!');
        }

        await saveReportsToJSONBin(reports);
        await displayReports();
        reportForm.reset();

        scrollToNewReport();
        currentPage = 1; // Torna alla prima pagina dopo l'inserimento o la modifica
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
            await saveReportsToJSONBin(reports);
            await displayReports();
        }
    };

    window.sendMail = function(index) {
        const report = reports[index];
        const date = new Date(report.dateTime);
        const dateString = date.toLocaleString();

        const subject = `Report ${report.id} del ${dateString}`;
        const body = `
ID Report: ${report.id}
Data: ${dateString}
Produzione: ${report.production}
Problema: ${report.issue}
Risoluzione: ${report.resolution}
Note: ${report.notes}
        `;

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // Carica i report iniziali
    await displayReports();

    // Aggiungi stile alle intestazioni della tabella
    const reportTable = document.getElementById('reportTable');
    if (reportTable) {
        const headers = reportTable.querySelectorAll('th');
        headers.forEach(header => {
            header.style.backgroundColor = '#e9ecef';
            header.style.color = '#495057';
            header.style.fontWeight = 'bold';
            header.style.padding = '10px';
            header.style.border = '1px solid #dee2e6';
        });
    }
});
