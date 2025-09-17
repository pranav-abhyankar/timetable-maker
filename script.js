// Timetable Generator JavaScript
class TimetableGenerator {
    constructor() {
        this.currentCell = null;
        this.timetableData = {};
        this.isEditing = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.generateTimetable();
    }

    bindEvents() {
        // Button event listeners
        document.getElementById('generateBtn').addEventListener('click', () => this.generateTimetable());
        document.getElementById('exportBtn').addEventListener('click', () => this.exportTimetable());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearTimetable());
        
        // Modal event listeners
        document.getElementById('addSubjectBtn').addEventListener('click', () => this.addSubject());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        document.getElementById('deleteSubjectBtn').addEventListener('click', () => this.deleteSubject());
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        
        // Modal backdrop click
        document.getElementById('subjectModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
            if (e.key === 'Enter' && document.getElementById('subjectModal').style.display === 'block') {
                e.preventDefault();
                this.addSubject();
            }
        });

        // Form validation
        document.getElementById('subjectName').addEventListener('input', this.validateForm);
    }

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    async generateTimetable() {
        this.showLoading();

        // Add a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 500));

        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;
        const slotDuration = parseInt(document.getElementById('slotDuration').value);
        
        const days = this.getSelectedDays();

        if (days.length === 0) {
            this.hideLoading();
            this.showAlert('Please select at least one day!', 'error');
            return;
        }

        if (!this.validateTimeRange(startTime, endTime)) {
            this.hideLoading();
            this.showAlert('End time must be after start time!', 'error');
            return;
        }

        const timeSlots = this.generateTimeSlots(startTime, endTime, slotDuration);
        
        if (timeSlots.length === 0) {
            this.hideLoading();
            this.showAlert('No valid time slots could be generated!', 'error');
            return;
        }

        this.createTimetableHTML(days, timeSlots);
        this.hideLoading();
        this.showAlert('Timetable generated successfully!', 'success');
    }

    getSelectedDays() {
        const days = [];
        const dayCheckboxes = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        
        dayCheckboxes.forEach((day, index) => {
            if (document.getElementById(day).checked) {
                days.push(dayNames[index]);
            }
        });
        
        return days;
    }

    validateTimeRange(start, end) {
        const startTime = new Date(`2000-01-01 ${start}`);
        const endTime = new Date(`2000-01-01 ${end}`);
        return startTime < endTime;
    }

    generateTimeSlots(start, end, duration) {
        const slots = [];
        let current = new Date(`2000-01-01 ${start}`);
        const endTime = new Date(`2000-01-01 ${end}`);

        while (current < endTime) {
            const next = new Date(current.getTime() + duration * 60000);
            if (next <= endTime) {
                slots.push({
                    start: this.formatTime(current),
                    end: this.formatTime(next)
                });
            }
            current = next;
        }
        
        return slots;
    }

    formatTime(date) {
        return date.toTimeString().slice(0, 5);
    }

    createTimetableHTML(days, timeSlots) {
        const table = document.getElementById('timetable');
        const thead = table.querySelector('thead tr');
        const tbody = table.querySelector('tbody');

        // Clear existing content
        thead.innerHTML = '<th>Time</th>';
        tbody.innerHTML = '';

        // Add day headers with animation
        days.forEach((day, index) => {
            const th = document.createElement('th');
            th.textContent = day;
            th.style.animationDelay = `${index * 0.1}s`;
            th.classList.add('fadeInDown');
            thead.appendChild(th);
        });

        // Add time slots
        timeSlots.forEach((slot, slotIndex) => {
            const row = document.createElement('tr');
            
            // Time slot cell
            const timeCell = document.createElement('td');
            timeCell.className = 'time-slot';
            timeCell.innerHTML = `<strong>${slot.start}</strong><br><small>${slot.end}</small>`;
            row.appendChild(timeCell);
            
            // Day cells
            days.forEach((day, dayIndex) => {
                const cell = document.createElement('td');
                cell.className = 'empty-slot';
                cell.innerHTML = '<span>Click to add</span>';
                cell.style.animationDelay = `${(slotIndex * days.length + dayIndex) * 0.05}s`;
                cell.classList.add('fadeIn');
                
                // Add click handler
                cell.addEventListener('click', () => this.openModal(cell, day, slot));
                
                // Check if there's existing data for this slot
                const key = `${day}-${slot.start}`;
                if (this.timetableData[key]) {
                    this.populateCell(cell, this.timetableData[key]);
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
    }

    openModal(cell, day, timeSlot) {
        this.currentCell = cell;
        this.currentCell.day = day;
        this.currentCell.timeSlot = timeSlot;
        
        // Check if editing existing entry
        const key = `${day}-${timeSlot.start}`;
        const existing = this.timetableData[key];
        this.isEditing = !!existing;
        
        // Pre-fill form with existing data or clear it
        if (existing) {
            document.getElementById('subjectName').value = existing.subject || '';
            document.getElementById('teacherName').value = existing.teacher || '';
            document.getElementById('roomNumber').value = existing.room || '';
            document.getElementById('subjectColor').value = existing.color || 'blue';
            document.getElementById('deleteSubjectBtn').style.display = 'inline-flex';
        } else {
            this.clearForm();
            document.getElementById('deleteSubjectBtn').style.display = 'none';
        }
        
        // Update modal title
        document.querySelector('.modal-header h3').textContent = 
            this.isEditing ? 'Edit Subject' : 'Add Subject';
        
        // Show modal
        document.getElementById('subjectModal').style.display = 'block';
        document.getElementById('subjectName').focus();
    }

    closeModal() {
        document.getElementById('subjectModal').style.display = 'none';
        this.currentCell = null;
        this.isEditing = false;
        this.clearForm();
    }

    clearForm() {
        document.getElementById('subjectName').value = '';
        document.getElementById('teacherName').value = '';
        document.getElementById('roomNumber').value = '';
        document.getElementById('subjectColor').value = 'blue';
    }

    validateForm() {
        const subjectName = document.getElementById('subjectName').value.trim();
        const addBtn = document.getElementById('addSubjectBtn');
        
        if (subjectName) {
            addBtn.disabled = false;
            addBtn.style.opacity = '1';
        } else {
            addBtn.disabled = true;
            addBtn.style.opacity = '0.6';
        }
    }

    addSubject() {
        const subject = document.getElementById('subjectName').value.trim();
        const teacher = document.getElementById('teacherName').value.trim();
        const room = document.getElementById('roomNumber').value.trim();
        const color = document.getElementById('subjectColor').value;

        if (!subject) {
            this.showAlert('Please enter a subject name!', 'error');
            document.getElementById('subjectName').focus();
            return;
        }

        const key = `${this.currentCell.day}-${this.currentCell.timeSlot.start}`;
        this.timetableData[key] = { subject, teacher, room, color };

        this.populateCell(this.currentCell, this.timetableData[key]);
        this.closeModal();
        
        const action = this.isEditing ? 'updated' : 'added';
        this.showAlert(`Subject ${action} successfully!`, 'success');
    }

    deleteSubject() {
        if (!this.isEditing) return;

        if (!confirm('Are you sure you want to delete this subject?')) {
            return;
        }

        const key = `${this.currentCell.day}-${this.currentCell.timeSlot.start}`;
        delete this.timetableData[key];

        // Reset cell to empty state
        this.currentCell.innerHTML = '<span>Click to add</span>';
        this.currentCell.className = 'empty-slot';
        
        this.closeModal();
        this.showAlert('Subject deleted successfully!', 'success');
    }

    populateCell(cell, data) {
        const { subject, teacher, room, color } = data;
        
        let cellContent = `<div class="subject-name">${subject}</div>`;
        
        const details = [];
        if (teacher) details.push(teacher);
        if (room) details.push(`Room: ${room}`);
        
        if (details.length > 0) {
            cellContent += `<div class="subject-details">${details.join('<br>')}</div>`;
        }

        cell.innerHTML = cellContent;
        cell.className = `subject-entry ${color}`;
        
        // Add entrance animation
        cell.style.animation = 'none';
        setTimeout(() => {
            cell.style.animation = 'pulse 0.6s ease';
        }, 10);
    }

    clearTimetable() {
        if (Object.keys(this.timetableData).length === 0) {
            this.showAlert('Timetable is already empty!', 'info');
            return;
        }

        if (!confirm('Are you sure you want to clear the entire timetable? This action cannot be undone.')) {
            return;
        }

        this.showLoading();
        
        // Clear data
        this.timetableData = {};
        
        // Reset all cells with animation
        const cells = document.querySelectorAll('.timetable td:not(.time-slot)');
        cells.forEach((cell, index) => {
            setTimeout(() => {
                cell.innerHTML = '<span>Click to add</span>';
                cell.className = 'empty-slot';
                cell.style.animation = 'fadeIn 0.3s ease';
            }, index * 20);
        });

        setTimeout(() => {
            this.hideLoading();
            this.showAlert('Timetable cleared successfully!', 'success');
        }, cells.length * 20 + 200);
    }

    exportTimetable() {
        const table = document.getElementById('timetable');
        
        if (!table.querySelector('tbody').children.length) {
            this.showAlert('Please generate a timetable first!', 'error');
            return;
        }

        this.showLoading();

        // Get current styles
        const styles = this.getStylesForExport();
        
        // Create export content
        const exportContent = this.createExportHTML(table.outerHTML, styles);

        // Create and download file
        setTimeout(() => {
            this.downloadFile(exportContent, 'my-timetable.html', 'text/html');
            this.hideLoading();
            this.showAlert('Timetable exported successfully!', 'success');
        }, 800);
    }

    getStylesForExport() {
        // Get the stylesheet content (simplified version for export)
        return `
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
            .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 40px; color: white; }
            .header h1 { font-size: 3rem; font-weight: 800; margin-bottom: 10px; }
            .timetable-container { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border-radius: 25px; padding: 35px; box-shadow: 0 25px 50px rgba(0,0,0,0.15); }
            .timetable { width: 100%; border-collapse: collapse; border-radius: 15px; overflow: hidden; }
            .timetable th, .timetable td { padding: 18px 15px; text-align: center; border: 1px solid #e2e8f0; }
            .timetable th { background: linear-gradient(135deg, #667eea, #764ba2); color: white; font-weight: 700; }
            .timetable td { background: white; }
            .time-slot { background: linear-gradient(135deg, #f7fafc, #edf2f7) !important; font-weight: 700; color: #4a5568; }
            .subject-entry { font-weight: 600; border-left: 4px solid transparent; }
            .subject-entry.blue { background: linear-gradient(135deg, #e6f3ff, #cce7ff) !important; border-left-color: #3182ce; color: #2c5282; }
            .subject-entry.green { background: linear-gradient(135deg, #e6fffa, #b2f5ea) !important; border-left-color: #38a169; color: #234e52; }
            .subject-entry.purple { background: linear-gradient(135deg, #f7e6ff, #e9d5ff) !important; border-left-color: #805ad5; color: #553c9a; }
            .subject-entry.orange { background: linear-gradient(135deg, #fff5e6, #fed7aa) !important; border-left-color: #dd6b20; color: #9c4221; }
            .subject-entry.red { background: linear-gradient(135deg, #ffe6e6, #feb2b2) !important; border-left-color: #e53e3e; color: #9b2c2c; }
            .subject-entry.teal { background: linear-gradient(135deg, #e6fffa, #b2f5ea) !important; border-left-color: #319795; color: #234e52; }
            .subject-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
            .subject-details { font-size: 0.85rem; opacity: 0.8; }
            .empty-slot { color: #a0aec0; font-style: italic; }
            @media print { body { background: white !important; } .timetable-container { box-shadow: none; border: 1px solid #ddd; } }
        </style>
        `;
    }

    createExportHTML(tableHTML, styles) {
        const currentDate = new Date().toLocaleDateString();
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Timetable - Generated on ${currentDate}</title>
    ${styles}
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 My Timetable</h1>
            <p>Generated on ${currentDate}</p>
        </div>
        <div class="timetable-container">
            ${tableHTML}
        </div>
    </div>
</body>
</html>`;
    }

    downloadFile(content, filename, type) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${this.getAlertIcon(type)}</span>
                <span class="alert-message">${message}</span>
            </div>
        `;

        // Add styles for alert
        this.addAlertStyles();

        // Add to document
        document.body.appendChild(alert);

        // Show alert
        setTimeout(() => alert.classList.add('show'), 100);

        // Auto remove after 4 seconds
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, 4000);
    }

    getAlertIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    addAlertStyles() {
        if (document.getElementById('alert-styles')) return;

        const style = document.createElement('style');
        style.id = 'alert-styles';
        style.textContent = `
            .alert {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                min-width: 300px;
                padding: 16px 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                backdrop-filter: blur(10px);
                transform: translateX(100%);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                font-weight: 500;
            }
            .alert.show { transform: translateX(0); }
            .alert-success { background: rgba(72, 187, 120, 0.95); color: white; }
            .alert-error { background: rgba(245, 101, 101, 0.95); color: white; }
            .alert-warning { background: rgba(237, 137, 54, 0.95); color: white; }
            .alert-info { background: rgba(66, 153, 225, 0.95); color: white; }
            .alert-content { display: flex; align-items: center; gap: 12px; }
            .alert-icon { font-size: 1.2rem; }
            .alert-message { flex: 1; }
            @media (max-width: 480px) {
                .alert { right: 10px; left: 10px; min-width: auto; }
            }
        `;
        document.head.appendChild(style);
    }

    // Utility method to get statistics
    getStatistics() {
        const totalSlots = Object.keys(this.timetableData).length;
        const subjects = new Set();
        const teachers = new Set();
        
        Object.values(this.timetableData).forEach(entry => {
            if (entry.subject) subjects.add(entry.subject);
            if (entry.teacher) teachers.add(entry.teacher);
        });

        return {
            totalSlots,
            uniqueSubjects: subjects.size,
            uniqueTeachers: teachers.size
        };
    }
}

// Custom CSS animations
const customAnimations = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.fadeIn { animation: fadeIn 0.5s ease forwards; }
.fadeInDown { animation: fadeInDown 0.6s ease forwards; }
`;

// Add custom animations to document
const styleSheet = document.createElement('style');
styleSheet.textContent = customAnimations;
document.head.appendChild(styleSheet);

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TimetableGenerator();
});