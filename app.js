// Main analytics application
class AnalyticsApp {
    constructor() {
        this.mergedData = [];
        this.charts = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        if (!analyzeBtn || !fileInput || !uploadArea) {
            console.error('Required elements not found');
            return;
        }

        analyzeBtn.addEventListener('click', () => this.analyzeFiles());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length > 0) {
                this.updateFileList(e.target.files);
            }
        });

        // Drag and drop
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.highlightArea(), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadArea.addEventListener(eventName, () => this.unhighlightArea(), false);
        });

        uploadArea.addEventListener('drop', (e) => this.handleDrop(e), false);
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    highlightArea() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.add('dragover');
        }
    }

    unhighlightArea() {
        const uploadArea = document.getElementById('uploadArea');
        if (uploadArea) {
            uploadArea.classList.remove('dragover');
        }
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files && files.length > 0) {
            // Filter only CSV files
            const csvFiles = Array.from(files).filter(file => 
                file.name.toLowerCase().endsWith('.csv')
            );
            
            if (csvFiles.length === 0) {
                CSVUtils.showAlert('Please drop CSV files only', 'warning');
                return;
            }

            // Create a new DataTransfer to set filtered files
            const dataTransfer = new DataTransfer();
            csvFiles.forEach(file => dataTransfer.items.add(file));
            
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.files = dataTransfer.files;
                this.updateFileList(dataTransfer.files);
            }
        }
    }

    updateFileList(files) {
        if (!files || files.length === 0) return;

        const fileNames = Array.from(files).map(file => file.name);
        const fileList = fileNames.join(', ');
        
        const uploadText = document.querySelector('#uploadArea p.text-muted');
        if (uploadText) {
            uploadText.textContent = `Selected: ${files.length} file(s) - ${fileList}`;
        }
    }

    async analyzeFiles() {
        const fileInput = document.getElementById('fileInput');
        const files = fileInput ? fileInput.files : null;
        
        if (!files || files.length === 0) {
            CSVUtils.showAlert('Please select at least one CSV file', 'warning');
            return;
        }

        this.showLoading(true);
        this.hideResults();

        try {
            // Parse all files with individual error handling
            const parsePromises = Array.from(files).map(file => 
                CSVUtils.parseCSV(file).catch(error => {
                    CSVUtils.showAlert(`Skipped ${file.name}: ${error.message}`, 'warning');
                    return null; // Return null for failed files
                })
            );
            
            const results = await Promise.all(parsePromises);
            
            // Filter out failed parses and flatten
            const validResults = results.filter(result => result !== null);
            
            if (validResults.length === 0) {
                throw new Error('No valid CSV files could be processed');
            }

            this.mergedData = validResults.flat();
            
            if (this.mergedData.length === 0) {
                throw new Error('No valid data found in the uploaded files');
            }

            // Remove duplicates based on Click id
            const uniqueData = this.removeDuplicates(this.mergedData);
            
            if (uniqueData.length < this.mergedData.length) {
                const duplicates = this.mergedData.length - uniqueData.length;
                CSVUtils.showAlert(`Removed ${duplicates} duplicate entries`, 'info');
            }
            
            this.mergedData = uniqueData;
            
            // Analyze data
            const analysis = DataAnalyzer.analyzeData(this.mergedData);
            
            // Display results
            this.displayResults(analysis);
            
            const fileWord = validResults.length === 1 ? 'file' : 'files';
            CSVUtils.showAlert(
                `Successfully analyzed ${validResults.length} ${fileWord} with ${this.mergedData.length.toLocaleString()} total clicks`, 
                'success'
            );
            
        } catch (error) {
            CSVUtils.showAlert(`Error analyzing files: ${error.message}`, 'danger');
            console.error('Analysis error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    removeDuplicates(data) {
        const seen = new Set();
        return data.filter(row => {
            const id = row['Click id'];
            if (!id || seen.has(id)) {
                return false;
            }
            seen.add(id);
            return true;
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
        if (analyzeBtn) {
            analyzeBtn.disabled = show;
        }
    }

    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }

    displayResults(analysis) {
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) {
            console.error('Results section not found');
            return;
        }

        resultsSection.style.display = 'block';
        
        this.updateOverviewCards(analysis);
        this.updateTables(analysis);
        this.createCharts(analysis);
        this.updateRawDataTable(analysis.rawData);

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateOverviewCards(analysis) {
        const cardsHtml = `
            <div class="col-md-4 mb-4">
                <div class="card stat-card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h2 class="card-title">${analysis.totalClicks.toLocaleString()}</h2>
                                <p class="card-text">Total Clicks</p>
                            </div>
                            <i class="fas fa-mouse fa-3x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card stat-card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h2 class="card-title">${analysis.regionStats.length}</h2>
                                <p class="card-text">Unique Regions</p>
                            </div>
                            <i class="fas fa-globe fa-3x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="card stat-card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <div>
                                <h2 class="card-title">${analysis.referrerStats.length}</h2>
                                <p class="card-text">Traffic Sources</p>
                            </div>
                            <i class="fas fa-share-alt fa-3x opacity-75"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const overviewCards = document.getElementById('overviewCards');
        if (overviewCards) {
            overviewCards.innerHTML = cardsHtml;
        }
    }

    updateTables(analysis) {
        // Region table
        const regionTableBody = analysis.regionStats.map(stat => `
            <tr>
                <td>${CSVUtils.escapeHtml(stat.region)}</td>
                <td>${stat.count.toLocaleString()}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2" style="height: 6px;">
                            <div class="progress-bar" role="progressbar" style="width: ${stat.percentage}%" aria-valuenow="${stat.percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <span>${stat.percentage}%</span>
                    </div>
                </td>
            </tr>
        `).join('');
        
        const regionTable = document.querySelector('#regionTable tbody');
        if (regionTable) {
            regionTable.innerHTML = regionTableBody;
        }

        // Referrer table
        const referrerTableBody = analysis.referrerStats.map(stat => `
            <tr>
                <td>${CSVUtils.escapeHtml(stat.referrer)}</td>
                <td>${stat.count.toLocaleString()}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2" style="height: 6px;">
                            <div class="progress-bar bg-success" role="progressbar" style="width: ${stat.percentage}%" aria-valuenow="${stat.percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                        <span>${stat.percentage}%</span>
                    </div>
                </td>
            </tr>
        `).join('');
        
        const referrerTable = document.querySelector('#referrerTable tbody');
        if (referrerTable) {
            referrerTable.innerHTML = referrerTableBody;
        }
    }

    createCharts(analysis) {
        this.createRegionChart(analysis.regionStats);
        this.createReferrerChart(analysis.referrerStats);
        this.createDailyChart(analysis.dailyStats);
    }

    createRegionChart(regionStats) {
        const canvas = document.getElementById('regionChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.region) {
            this.charts.region.destroy();
        }

        const topRegions = regionStats.slice(0, 10);

        this.charts.region = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topRegions.map(stat => stat.region),
                datasets: [{
                    label: 'Clicks',
                    data: topRegions.map(stat => stat.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'Top 10 Regions by Clicks'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    createReferrerChart(referrerStats) {
        const canvas = document.getElementById('referrerChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.referrer) {
            this.charts.referrer.destroy();
        }

        this.charts.referrer = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: referrerStats.map(stat => stat.referrer),
                datasets: [{
                    data: referrerStats.map(stat => stat.count),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    title: {
                        display: true,
                        text: 'Traffic Sources Distribution'
                    }
                }
            }
        });
    }

    createDailyChart(dailyStats) {
        const canvas = document.getElementById('dailyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }

        if (dailyStats.length === 0) {
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No date data available', canvas.width / 2, canvas.height / 2);
            return;
        }

        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dailyStats.map(stat => stat.date),
                datasets: [{
                    label: 'Daily Clicks',
                    data: dailyStats.map(stat => stat.count),
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Daily Click Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    updateRawDataTable(rawData) {
        const tableBody = rawData.map(row => `
            <tr>
                <td><code>${CSVUtils.escapeHtml((row['Click id'] || 'N/A').toString().substring(0, 12))}${(row['Click id'] || '').length > 12 ? '...' : ''}</code></td>
                <td>${CSVUtils.escapeHtml(row['Click Time'] || 'N/A')}</td>
                <td><span class="badge bg-light text-dark">${CSVUtils.escapeHtml(row['Click Region'] || 'N/A')}</span></td>
                <td>${CSVUtils.escapeHtml(row.Sub_id || 'N/A')}</td>
                <td><span class="badge bg-light text-dark">${CSVUtils.escapeHtml(row.Referrer || 'N/A')}</span></td>
                <td><small class="text-muted">${CSVUtils.escapeHtml(row.source_file || 'N/A')}</small></td>
            </tr>
        `).join('');
        
        const rawDataTable = document.querySelector('#rawDataTable tbody');
        if (rawDataTable) {
            rawDataTable.innerHTML = tableBody;
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsApp();
});
