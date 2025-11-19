# Website Click Analytics

A client-side web application for analyzing website click data. Processes CSV files directly in your browser - no server required!

## ✨ Features

- 📊 **Interactive Analytics Dashboard** - Visualize your click data with beautiful charts
- 🔄 **Multiple CSV File Support** - Upload and automatically merge multiple files
- 📈 **Beautiful Charts & Visualizations** - Region distribution, referrer stats, and daily trends
- 🎯 **Duplicate Detection & Removal** - Automatically removes duplicate click IDs
- 📅 **Time-based Sorting** - Sort data chronologically for trend analysis
- 💾 **Client-side Processing** - Your data never leaves your computer (100% private)
- 📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- ♿ **Accessible** - Built with accessibility best practices

## 🚀 How to Use

1. **Visit the website**: Open `index.html` in your browser
2. **Upload CSV files**: Drag & drop or click to select one or multiple CSV files
3. **Analyze data**: View interactive charts, tables, and insights automatically
4. **Merge files** (optional): Use the CSV merger tool to combine multiple files

## 📋 CSV Format Requirements

Your CSV files should include these columns:
- `Click id` - Unique identifier for each click
- `Click Time` - Timestamp of the click
- `Click Region` - Geographic region
- `Sub_id` - Optional sub-identifier
- `Referrer` - Traffic source/referrer

**Example CSV format:**
```csv
Click id,Click Time,Click Region,Sub_id,Referrer
abc123,2025-01-15 10:30:00,US,sub1,google.com
def456,2025-01-15 11:45:00,UK,sub2,facebook.com
```

## 🛠️ Features Breakdown

### Analytics Dashboard (`index.html`)
- Upload multiple CSV files simultaneously
- Automatic duplicate removal based on Click ID
- Overview cards showing total clicks, regions, and traffic sources
- Interactive charts:
  - Bar chart: Top 10 regions
  - Doughnut chart: Traffic source distribution
  - Line chart: Daily click trends
- Detailed statistics tables with percentages
- Raw data preview (first 100 rows)

### CSV Merger (`merge.html`)
- Merge multiple CSV files into one
- Remove duplicate entries automatically
- Sort by timestamp
- Download merged file
- View merge statistics

## 🌐 Deployment

### GitHub Pages
1. Fork or clone this repository
2. Go to repository Settings → Pages
3. Select branch (usually `main`) and root directory
4. Your site will be live at `https://[username].github.io/[repository-name]`

### Local Usage
Simply open `index.html` in any modern web browser. No server or installation required!

## 🔒 Privacy & Security

- **100% Client-side**: All data processing happens in your browser
- **No Server Uploads**: Your CSV files never leave your computer
- **No Tracking**: No analytics or tracking scripts
- **Offline Capable**: Works without an internet connection (after initial load)

## 🧰 Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with CSS variables and animations
- **JavaScript (ES6+)** - Vanilla JS with classes
- **Bootstrap 5** - Responsive UI framework
- **Font Awesome 6** - Icons
- **Chart.js** - Interactive charts
- **PapaParse** - CSV parsing library

## 🐛 Bug Fixes & Improvements (Latest Version)

### Critical Fixes
- ✅ Added missing `DataAnalyzer` class for data analysis
- ✅ Fixed incorrect file paths (`css/style.css` → `style.css`, `js/*.js` → `*.js`)
- ✅ Fixed drag-and-drop file handling using `DataTransfer` API
- ✅ Added proper file type validation (.csv only)
- ✅ Added file size validation (50MB for analytics, 100MB for merger)

### Enhanced Error Handling
- ✅ Individual file error handling (continues processing other files if one fails)
- ✅ Proper error messages with file names
- ✅ Better empty data handling
- ✅ Validation for required CSV columns
- ✅ Chart destruction checks before creating new charts

### UI/UX Improvements
- ✅ Replaced `alert()` with Bootstrap alerts
- ✅ Added CSS styles for drag-over state
- ✅ Added loading states and disabled buttons during processing
- ✅ Auto-dismiss alerts after 5 seconds
- ✅ Smooth scroll to results
- ✅ Better accessibility (ARIA labels, roles, semantic HTML)
- ✅ HTML escaping to prevent XSS attacks
- ✅ Improved responsive design for mobile devices

### Code Quality
- ✅ Null/undefined checks throughout
- ✅ Better error recovery
- ✅ Memory cleanup (URL.revokeObjectURL)
- ✅ Consistent code formatting
- ✅ Better comments and documentation

## 📄 Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 💡 Tips

- **Large files**: For files over 100MB, consider splitting them first
- **Performance**: Processing thousands of rows is fast, but chart rendering may slow down with very large datasets
- **Data format**: Ensure your CSV files have consistent column names across all files
- **Duplicates**: The app automatically removes duplicates based on Click ID during analysis

## 📞 Support

If you encounter any issues, please check:
1. Your CSV file format matches the required structure
2. File size is within limits (50-100MB)
3. You're using a modern browser
4. JavaScript is enabled in your browser

---

**Made with ❤️ for data analysts who value privacy**
