// CSV Merger functionality
class CSVMerger {
    constructor() {
        this.mergedData = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const mergeBtn = document.getElementById('mergeBtn');
        const fileInput = document.getElementById('mergeFileInput');

        if (!mergeBtn || !fileInput) {
            console.error('Required elements not found');
            return;
        }

        mergeBtn.addEventListener('click', () => this.mergeFiles());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files) {
                this.updateFileList(e.target.files);
            }
        });
    }

    updateFileList(files) {
        const fileList = document.getElementById('fileList');
        if (!fileList) return;

        if (!files || files.length === 0) {
            fileList.innerHTML = '<span class="text-muted">No files selected</span>';
            return;
        }

        const fileItems = Array.from(files).map(file => `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                <div>
                    <i class="fas fa-file-csv text-primary me-2"></i>
                    <span>${CSVUtils.escapeHtml(file.name)}</span>
                </div>
                <small class="text-muted">${this.formatFileSize(file.size)}</small>
            </div>
        `).join('');

        fileList.innerHTML = fileItems;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    parseCSVFile(file) {
        return new Promise((resolve, reject) => {
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.csv')) {
                reject(new Error(`"${file.name}" is not a CSV file`));
                return;
            }

            // Validate file size (max 100MB for merger)
            const maxSize = 100 * 1024 * 1024;
            if (file.size > maxSize) {
                reject(new Error(`"${file.name}" is too large (max 100MB)`));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    
                    if (!text || text.trim().length === 0) {
                        reject(new Error(`"${file.name}" is empty`));
                        return;
                    }

                    // Basic validation - check if it looks like a CSV with expected structure
                    const hasRequiredHeaders = text.includes('Click id') || text.includes('Click Time');
                    if (!hasRequiredHeaders) {
                        reject(new Error(`"${file.name}" doesn't appear to be a valid click data CSV`));
                        return;
                    }

                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        dynamicTyping: false,
                        complete: (results) => {
                            if (results.errors.length > 0) {
                                const criticalErrors = results.errors.filter(e => 
                                    e.type === 'FieldMismatch' || e.type === 'Quotes'
                                );
                                if (criticalErrors.length > 0) {
                                    console.warn(`Parse warnings for ${file.name}:`, criticalErrors);
                                }
                            }
                            
                            if (!results.data || results.data.length === 0) {
                                reject(new Error(`"${file.name}" has no valid data rows`));
                                return;
                            }

                            // Validate required columns
                            const firstRow = results.data[0];
                            if (!firstRow || typeof firstRow !== 'object') {
                                reject(new Error(`"${file.name}" has invalid data format`));
                                return;
                            }

                            const requiredColumns = ['Click id', 'Click Time', 'Click Region', 'Sub_id', 'Referrer'];
                            const missingColumns = requiredColumns.filter(col => !(col in firstRow));
                            
                            if (missingColumns.length > 0) {
                                reject(new Error(`"${file.name}" missing columns: ${missingColumns.join(', ')}`));
                                return;
                            }

                            // Filter out completely empty rows
                            const validData = results.data.filter(row => {
                                return row && (row['Click id'] || row['Click Time'] || row['Click Region']);
                            });

                            if (validData.length === 0) {
                                reject(new Error(`"${file.name}" has no valid data after filtering`));
                                return;
                            }

                            // Add source file info to each row
                            validData.forEach(row => {
                                row.source_file = file.name;
                            });

                            resolve(validData);
                        },
                        error: (error) => {
                            reject(new Error(`Failed to parse "${file.name}": ${error.message}`));
                        }
                    });
                } catch (error) {
                    reject(new Error(`Error reading "${file.name}": ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error(`Failed to read file "${file.name}"`));
            };

            reader.readAsText(file);
        });
    }

    async mergeFiles() {
        const fileInput = document.getElementById('mergeFileInput');
        const files = fileInput ? fileInput.files : null;
        
        if (!files || files.length === 0) {
            this.showError('Please select at least one CSV file');
            return;
        }

        if (files.length === 1) {
            this.showError('Please select at least 2 files to merge');
            return;
        }

        const removeDuplicates = document.getElementById('removeDuplicates')?.checked ?? true;
        const sortByTime = document.getElementById('sortByTime')?.checked ?? true;

        // Show loading state
        const mergeBtn = document.getElementById('mergeBtn');
        if (!mergeBtn) return;

        const originalText = mergeBtn.innerHTML;
        mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Merging...';
        mergeBtn.disabled = true;

        // Hide previous results
        const mergeResults = document.getElementById('mergeResults');
        if (mergeResults) {
            mergeResults.style.display = 'none';
        }

        try {
            // Parse all files with better error handling
            const parseResults = [];
            let successfulFiles = 0;
            const errors = [];
            
            for (const file of files) {
                try {
                    console.log(`Parsing file: ${file.name}`);
                    const data = await this.parseCSVFile(file);
                    parseResults.push(data);
                    successfulFiles++;
                    console.log(`✓ Successfully parsed ${file.name}: ${data.length} rows`);
                } catch (error) {
                    console.error(`✗ Failed to parse ${file.name}:`, error.message);
                    errors.push(`${file.name}: ${error.message}`);
                }
            }

            if (successfulFiles === 0) {
                throw new Error('No valid CSV files could be processed');
            }

            if (errors.length > 0) {
                this.showWarning(`Skipped ${errors.length} file(s) due to errors. Check console for details.`);
            }
            
            // Merge all data
            let mergedData = parseResults.flat();
            const initialCount = mergedData.length;

            console.log(`Total rows before processing: ${initialCount}`);

            // Remove duplicates if requested
            let duplicatesRemoved = 0;
            if (removeDuplicates) {
                const beforeDedupe = mergedData.length;
                mergedData = this.removeDuplicates(mergedData);
                duplicatesRemoved = beforeDedupe - mergedData.length;
                console.log(`Removed ${duplicatesRemoved} duplicates`);
            }

            // Sort by time if requested
            if (sortByTime) {
                mergedData.sort((a, b) => {
                    try {
                        const timeA = new Date(a['Click Time'] || 0);
                        const timeB = new Date(b['Click Time'] || 0);
                        return timeA - timeB;
                    } catch (error) {
                        return 0; // If date parsing fails, keep original order
                    }
                });
                console.log('Sorted by Click Time');
            }

            if (mergedData.length === 0) {
                throw new Error('No data remaining after processing');
            }

            // Show results
            this.showMergeResults(mergedData, initialCount, successfulFiles, duplicatesRemoved);

        } catch (error) {
            console.error('Merge error:', error);
            this.showError(`Merge failed: ${error.message}`);
        } finally {
            // Restore button state
            mergeBtn.innerHTML = originalText;
            mergeBtn.disabled = false;
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

    showMergeResults(mergedData, initialCount, fileCount, duplicatesRemoved) {
        const uniqueRegions = new Set(mergedData.map(row => row['Click Region']).filter(Boolean)).size;
        const uniqueReferrers = new Set(mergedData.map(row => row.Referrer).filter(Boolean)).size;
        
        const statsHtml = `
            <h6 class="mb-3">Merge Statistics:</h6>
            <ul class="list-unstyled mb-0">
                <li class="mb-2"><i class="fas fa-file text-primary me-2"></i><strong>Files merged:</strong> ${fileCount}</li>
                <li class="mb-2"><i class="fas fa-database text-success me-2"></i><strong>Total rows:</strong> ${mergedData.length.toLocaleString()}</li>
                ${duplicatesRemoved > 0 ? 
                    `<li class="mb-2"><i class="fas fa-filter text-warning me-2"></i><strong>Duplicates removed:</strong> ${duplicatesRemoved.toLocaleString()}</li>` : ''}
                <li class="mb-2"><i class="fas fa-globe text-info me-2"></i><strong>Unique regions:</strong> ${uniqueRegions}</li>
                <li class="mb-2"><i class="fas fa-share-alt text-secondary me-2"></i><strong>Unique referrers:</strong> ${uniqueReferrers}</li>
            </ul>
        `;

        const mergeStats = document.getElementById('mergeStats');
        if (mergeStats) {
            mergeStats.innerHTML = statsHtml;
        }

        const mergeResults = document.getElementById('mergeResults');
        if (mergeResults) {
            mergeResults.style.display = 'block';
        }

        // Store merged data for download
        this.mergedData = mergedData;

        // Setup download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                const filename = `merged_clicks_${timestamp}.csv`;
                this.downloadCSV(this.mergedData, filename);
            };
        }

        // Scroll to results
        if (mergeResults) {
            setTimeout(() => {
                mergeResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }

    downloadCSV(data, filename) {
        try {
            if (!data || data.length === 0) {
                this.showError('No data to download');
                return;
            }

            const csv = Papa.unparse(data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            this.showSuccess(`Downloaded: ${filename}`);
        } catch (error) {
            console.error('Download error:', error);
            this.showError(`Failed to download: ${error.message}`);
        }
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    showWarning(message) {
        this.showNotification(message, 'warning');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Try to use Bootstrap alert if available
        const container = document.querySelector('.container');
        if (container) {
            const alert = document.createElement('div');
            alert.className = `alert alert-${type} alert-dismissible fade show mt-3`;
            alert.setAttribute('role', 'alert');
            alert.innerHTML = `
                ${CSVUtils.escapeHtml(message)}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            // Insert after the navigation
            const navRow = document.querySelector('.row.mb-4');
            if (navRow && navRow.nextSibling) {
                navRow.parentNode.insertBefore(alert, navRow.nextSibling);
            } else {
                container.insertBefore(alert, container.firstChild);
            }
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.classList.remove('show');
                    setTimeout(() => alert.remove(), 150);
                }
            }, 5000);
        } else {
            // Fallback to console
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
}

// Initialize merger when page loads
document.addEventListener('DOMContentLoaded', () => {
    new CSVMerger();
});
