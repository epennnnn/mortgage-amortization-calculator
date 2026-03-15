let myChart = null; 

const calculateBtn = document.getElementById('calculateBtn');
const downloadBtn = document.getElementById('downloadPdf');

function formatInput(input) {
    let numericString = input.value.replace(/[^0-9]/g, ''); 
    if (numericString) {
        input.value = numericString.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } else {
        input.value = '';
    }
}

function formatIDR(amount) {
    return new Intl.NumberFormat('id-ID', { 
        style: 'currency', 
        currency: 'IDR',
        maximumFractionDigits: 0 
    }).format(amount);
}

calculateBtn.addEventListener('click', function() {
    const rawLoan = document.getElementById('loanAmount').value.replace(/\./g, '');
    const rawDP = document.getElementById('downPayment').value.replace(/\./g, '');
    
    const totalPrice = parseFloat(rawLoan) || 0;
    const dp = parseFloat(rawDP) || 0; 
    const rYearly = parseFloat(document.getElementById('interestRate').value);
    const tYears = parseFloat(document.getElementById('loanTerm').value);

    const p = totalPrice - dp;

    if (isNaN(p) || isNaN(rYearly) || isNaN(tYears) || p <= 0) {
        alert("Mohon masukkan data yang valid!");
        return;
    }

    const rMonthly = (rYearly / 100) / 12; 
    const nMonths = tYears * 12;

    const x = Math.pow(1 + rMonthly, nMonths);
    const monthlyPayment = (p * x * rMonthly) / (x - 1);
    const totalInterest = (monthlyPayment * nMonths) - p;

    document.getElementById('monthlyPayment').innerText = formatIDR(monthlyPayment);
    document.getElementById('summary-details').style.display = 'block';
    document.getElementById('summaryPrincipal').innerText = formatIDR(p);
    document.getElementById('summaryInterest').innerText = formatIDR(totalInterest);
    
    downloadBtn.style.display = 'block';

    generateTable(p, rMonthly, nMonths, monthlyPayment);
    updateChart(p, totalInterest);
});

function generateTable(p, r, n, monthly) {
    const tbody = document.querySelector('#amortizationTable tbody');
    tbody.innerHTML = ''; 
    let remainingBalance = p;

    for (let i = 1; i <= n; i++) {
        let interestPayment = remainingBalance * r;
        let principalPayment = monthly - interestPayment;
        remainingBalance -= principalPayment;
        if (remainingBalance < 0) remainingBalance = 0;

        const row = `<tr>
            <td>${i}</td>
            <td>${formatIDR(interestPayment)}</td>
            <td>${formatIDR(principalPayment)}</td>
            <td>${formatIDR(remainingBalance)}</td>
        </tr>`;
        tbody.innerHTML += row;
    }
}

function updateChart(principal, interest) {
    const ctx = document.getElementById('myChart').getContext('2d');
    if (myChart) { myChart.destroy(); } 

    myChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Pokok Pinjaman', 'Total Bunga'],
            datasets: [{
                data: [principal, interest],
                backgroundColor: ['#2b6cb0', '#e53e3e'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}

downloadBtn.addEventListener('click', async function() {
    const container = document.querySelector('.container');
    const overlay = document.getElementById('loadingOverlay');
    
    window.scrollTo(0, 0);
    overlay.style.display = 'flex';

    await new Promise(resolve => setTimeout(resolve, 300));

    document.body.classList.add('pdf-print-body');
    container.classList.add('pdf-mode');

    const opt = {
        margin: [15, 10, 15, 10],
        filename: 'Laporan_KPR_Final.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            useCORS: true, 
            logging: false,
            scrollY: 0,
            windowWidth: document.documentElement.offsetWidth
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] } 
    };

    try {
        await html2pdf().set(opt).from(container).save();
    } catch (error) {
        console.error(error);
        alert("Terjadi kesalahan saat membuat PDF.");
    } finally {
        container.classList.remove('pdf-mode');
        document.body.classList.remove('pdf-print-body');
        overlay.style.display = 'none';
    }
});