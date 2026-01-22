// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        
        // Remove active class from all tabs and contents
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        this.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
        
        // Load data for the active tab
        if (tabName === 'students') {
            loadStudents();
        } else if (tabName === 'subjects') {
            loadSubjectMappings();
        } else if (tabName === 'attendance') {
            loadAttendanceRecords();
        }
    });
});

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('admin-logout.php')
            .then(() => {
                window.location.href = 'admin-login.html';
            });
    }
}

// Load students data
let allStudents = [];
async function loadStudents() {
    try {
        const response = await fetch('admin-get-students.php');
        const data = await response.json();
        
        if (data.success) {
            allStudents = data.students;
            displayStudents(allStudents);
        } else {
            document.getElementById('students-tbody').innerHTML = 
                '<tr><td colspan="5" class="no-data">No students found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading students:', error);
        document.getElementById('students-tbody').innerHTML = 
            '<tr><td colspan="5" class="no-data">Error loading data</td></tr>';
    }
}

function displayStudents(students) {
    const tbody = document.getElementById('students-tbody');
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No students found</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(student => `
        <tr>
            <td>${escapeHtml(student.usn)}</td>
            <td>${escapeHtml(student.name)}</td>
            <td>${escapeHtml(student.semester)}</td>
            <td>${escapeHtml(student.college)}</td>
            <td>${formatDate(student.created_at)}</td>
        </tr>
    `).join('');
}

// Search students
document.getElementById('student-search').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allStudents.filter(student => 
        student.name.toLowerCase().includes(searchTerm) ||
        student.usn.toLowerCase().includes(searchTerm)
    );
    displayStudents(filtered);
});

// Load subject mappings
let allSubjects = [];
async function loadSubjectMappings() {
    try {
        const response = await fetch('admin-get-subjects.php');
        const data = await response.json();
        
        if (data.success) {
            allSubjects = data.subjects;
            displaySubjects(allSubjects);
        } else {
            document.getElementById('subjects-tbody').innerHTML = 
                '<tr><td colspan="4" class="no-data">No subject mappings found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        document.getElementById('subjects-tbody').innerHTML = 
            '<tr><td colspan="4" class="no-data">Error loading data</td></tr>';
    }
}

function displaySubjects(subjects) {
    const tbody = document.getElementById('subjects-tbody');
    
    if (subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No subject mappings found</td></tr>';
        return;
    }
    
    tbody.innerHTML = subjects.map(subject => `
        <tr>
            <td>${escapeHtml(subject.usn)}</td>
            <td>${escapeHtml(subject.student_name)}</td>
            <td>${escapeHtml(subject.subject_name)}</td>
            <td>${escapeHtml(subject.subject_code)}</td>
        </tr>
    `).join('');
}

// Search subjects
document.getElementById('subject-search').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = allSubjects.filter(subject => 
        subject.student_name.toLowerCase().includes(searchTerm) ||
        subject.usn.toLowerCase().includes(searchTerm)
    );
    displaySubjects(filtered);
});

// Load attendance records
let allAttendance = [];
let allSubjectsList = [];

async function loadAttendanceRecords() {
    try {
        const response = await fetch('admin-get-attendance.php');
        const data = await response.json();
        
        if (data.success) {
            allAttendance = data.attendance;
            allSubjectsList = data.subjects;
            
            // Populate subject filter
            const subjectFilter = document.getElementById('subject-filter');
            subjectFilter.innerHTML = '<option value="">All Subjects</option>' +
                allSubjectsList.map(subject => 
                    `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`
                ).join('');
            
            displayAttendance(allAttendance);
        } else {
            document.getElementById('attendance-tbody').innerHTML = 
                '<tr><td colspan="6" class="no-data">No attendance records found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading attendance:', error);
        document.getElementById('attendance-tbody').innerHTML = 
            '<tr><td colspan="6" class="no-data">Error loading data</td></tr>';
    }
}

function displayAttendance(attendance) {
    const tbody = document.getElementById('attendance-tbody');
    
    if (attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No attendance records found</td></tr>';
        return;
    }
    
    tbody.innerHTML = attendance.map(record => `
        <tr>
            <td>${escapeHtml(record.usn)}</td>
            <td>${escapeHtml(record.student_name)}</td>
            <td>${escapeHtml(record.subject_name)}</td>
            <td>${formatDate(record.date)}</td>
            <td><span class="status-badge ${record.status}">${record.status}</span></td>
            <td>
                <button class="btn-delete" onclick="deleteAttendance(${record.id}, '${escapeHtml(record.student_name)}', '${escapeHtml(record.subject_name)}', '${record.date}')">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter attendance
document.getElementById('attendance-search').addEventListener('input', filterAttendance);
document.getElementById('subject-filter').addEventListener('change', filterAttendance);

function filterAttendance() {
    const searchTerm = document.getElementById('attendance-search').value.toLowerCase();
    const subjectFilter = document.getElementById('subject-filter').value;
    
    let filtered = allAttendance.filter(record => {
        const matchesSearch = record.student_name.toLowerCase().includes(searchTerm) ||
                            record.usn.toLowerCase().includes(searchTerm);
        const matchesSubject = !subjectFilter || record.subject_name === subjectFilter;
        
        return matchesSearch && matchesSubject;
    });
    
    displayAttendance(filtered);
}

// Delete attendance record
async function deleteAttendance(id, studentName, subjectName, date) {
    if (!confirm(`Are you sure you want to delete this attendance record?\n\nStudent: ${studentName}\nSubject: ${subjectName}\nDate: ${formatDate(date)}`)) {
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('id', id);
        
        const response = await fetch('admin-delete-attendance.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Reload attendance records
            loadAttendanceRecords();
        } else {
            alert('Error deleting record: ' + data.message);
        }
    } catch (error) {
        console.error('Error deleting attendance:', error);
        alert('An error occurred while deleting the record');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Load initial data
loadStudents();
