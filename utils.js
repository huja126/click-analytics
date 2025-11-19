// Utility functions
class CSVUtils {
    static parseCSV(file) {
        return new Promise((resolve, reject) => {
            // Validate file type
            if (!file.name.toLowerCase().endsWith('.csv')) {
                reject(new Error(`"${file.name}" is not a CSV file`));
                return;
            }

            // Validate file size (max 50MB)
            const maxSize = 50 * 1024 * 1024;
            if (file.size > maxSize) {
                reject(new Error(`"${file.name}" is too large (max 50MB)`));
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

                    Papa.parse(text, {
                        header: true,
                        skipEmptyLines: true,
                        dynamicTyping: false,
                        complete: (results) => {
                            if (results.errors.length > 0) {
                                const criticalErrors = results.errors.filter(e => e.type === 'FieldMismatch' || e.type === 'Quotes');
                                if (criticalErrors.length > 0) {
                                    console.error('Parse errors:', criticalErrors);
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

    static downloadCSV(data, filename) {
        try {
            if (!data || data.length === 0) {
                throw new Error('No data to download');
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
            
            return true;
        } catch (error) {
            console.error('Download error:', error);
            CSVUtils.showAlert(`Failed to download file: ${error.message}`, 'danger');
            return false;
        }
    }

    static showAlert(message, type = 'info') {
        const alertArea = document.getElementById('alertArea');
        if (!alertArea) {
            console.warn('Alert area not found, using console:', message);
            return;
        }

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.setAttribute('role', 'alert');
        alert.innerHTML = `
            ${this.escapeHtml(message)}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        alertArea.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 150);
            }
        }, 5000);
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    static formatDate(dateString) {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return dateString;
            }
            return date.toLocaleDateString();
        } catch {
            return dateString;
        }
    }

    static formatNumber(num) {
        return num.toLocaleString();
    }
}

// Data Analysis Class
class DataAnalyzer {
    static analyzeData(data) {
        if (!data || data.length === 0) {
            throw new Error('No data to analyze');
        }

        const analysis = {
            totalClicks: data.length,
            regionStats: this.calculateRegionStats(data),
            referrerStats: this.calculateReferrerStats(data),
            dailyStats: this.calculateDailyStats(data),
            rawData: data.slice(0, 100) // Limit raw data display to first 100 rows
        };

        return analysis;
    }

    static calculateRegionStats(data) {
        const regionCounts = {};
        let validRegions = 0;

        data.forEach(row => {
            const region = (row['Click Region'] || 'Unknown').trim();
            if (region) {
                regionCounts[region] = (regionCounts[region] || 0) + 1;
                validRegions++;
            }
        });

        const stats = Object.entries(regionCounts)
            .map(([region, count]) => ({
                region,
                count,
                percentage: validRegions > 0 ? ((count / validRegions) * 100).toFixed(1) : '0.0'
            }))
            .sort((a, b) => b.count - a.count);

        return stats;
    }

    static calculateReferrerStats(data) {
        const referrerCounts = {};
        let validReferrers = 0;

        data.forEach(row => {
            const referrer = (row['Referrer'] || 'Unknown').trim();
            if (referrer) {
                referrerCounts[referrer] = (referrerCounts[referrer] || 0) + 1;
                validReferrers++;
            }
        });

        const stats = Object.entries(referrerCounts)
            .map(([referrer, count]) => ({
                referrer,
                count,
                percentage: validReferrers > 0 ? ((count / validReferrers) * 100).toFixed(1) : '0.0'
            }))
            .sort((a, b) => b.count - a.count);

        return stats;
    }

    static calculateDailyStats(data) {
        const dailyCounts = {};

        data.forEach(row => {
            try {
                const timestamp = row['Click Time'];
                if (!timestamp) return;

                const date = new Date(timestamp);
                if (isNaN(date.getTime())) return;

                const dateKey = date.toISOString().split('T')[0];
                dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;
            } catch (error) {
                // Skip invalid dates
            }
        });

        const stats = Object.entries(dailyCounts)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return stats;
    }
}
