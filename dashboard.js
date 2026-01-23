// Dashboard script
let currentCalendarDate = new Date();
let attendanceData = {};
let marksLoaded = false; // Track if marks have been loaded
let selectedDate = null; // Track selected date for attendance marking

document.addEventListener('DOMContentLoaded', function() {
    // Initialize selected date to today
    const today = new Date();
    selectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Check if user is logged in
    checkAuth();

    // Load user information
    loadUserInfo();

    // Load attendance data
    loadAttendance();

    // Don't load marks initially - lazy load when tab is clicked
    // loadMarks();

    // Initialize calendar
    initializeCalendar();

    // Initialize footer date/time
    updateFooterDateTime();
    setInterval(updateFooterDateTime, 1000); // Update every second

    // User dropdown toggle
    const userNameClickable = document.getElementById('studentName');
    const userDropdown = document.getElementById('userDropdown');
    
    userNameClickable.addEventListener('click', function(e) {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userDropdown.contains(e.target) && e.target !== userNameClickable) {
            userDropdown.classList.remove('show');
        }
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        fetch('logout.php')
            .then(() => {
                window.location.href = 'index.html';
            });
    });

    // Calendar navigation
    document.getElementById('prevMonth').addEventListener('click', function() {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    document.getElementById('nextMonth').addEventListener('click', function() {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    // Modal close functionality
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('attendanceModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Tab switching functionality
    document.querySelectorAll('.tab-heading').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Remove active class from all tabs and sections
            document.querySelectorAll('.tab-heading').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding section
            this.classList.add('active');
            document.getElementById(tabName + '-section').classList.add('active');
            
            // Lazy load marks data when marks tab is clicked for the first time
            if (tabName === 'marks' && !marksLoaded) {
                loadMarks();
                marksLoaded = true;
            }
        });
    });
    
    // Calendar help toggle
    const calendarHelpToggle = document.getElementById('calendarHelpToggle');
    const calendarHelpContent = document.getElementById('calendarHelpContent');
    
    calendarHelpToggle.addEventListener('click', function() {
        calendarHelpContent.classList.toggle('show');
        this.classList.toggle('active');
    });
});

function checkAuth() {
    fetch('check_auth.php')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = 'index.html';
            }
        })
        .catch(() => {
            window.location.href = 'index.html';
        });
}

function loadUserInfo() {
    fetch('get_user_info.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const student = data.student;
                
                // Update header with user info
                document.getElementById('studentName').textContent = `${student.usn} - ${student.name}`;
                
                // Update dropdown with detailed info
                document.getElementById('dropdownName').textContent = student.name;
                document.getElementById('dropdownUSN').textContent = student.usn;
                document.getElementById('dropdownSemester').textContent = `${student.semester}th Semester`;
                
                // Format college name (abbreviate if needed)
                const collegeShort = student.college.includes('MVJ') ? 'CSE, MVJCE' : student.college;
                document.getElementById('dropdownCollege').textContent = collegeShort;
            }
        })
        .catch(error => {
            console.error('Error loading user info:', error);
        });
}

function loadAttendance() {
    fetch('get_attendance.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Store all subjects data globally for recalculation
                window.attendanceData = data;
                
                // Calculate and update overall attendance based on toggle states
                updateOverallAttendance();

                // Load subjects in categorized sections
                const subjectsGrid = document.getElementById('subjectsGrid');
                subjectsGrid.innerHTML = '';

                const categorized = data.categorized;

                // Section 1: Theory Subjects
                if (categorized.theory && categorized.theory.length > 0) {
                    categorized.theory.forEach(subject => {
                        const subjectCard = createSubjectCard(subject);
                        subjectsGrid.appendChild(subjectCard);
                    });
                    
                    // Add separator after theory subjects
                    subjectsGrid.appendChild(createSeparator());
                }

                // Section 2: Lab Subjects
                if (categorized.labs && categorized.labs.length > 0) {
                    categorized.labs.forEach(subject => {
                        const subjectCard = createSubjectCard(subject);
                        subjectsGrid.appendChild(subjectCard);
                    });
                    
                    // Add separator after lab subjects
                    subjectsGrid.appendChild(createSeparator());
                }

                // Section 3: Project & Electives
                if (categorized.projectElectives && categorized.projectElectives.length > 0) {
                    categorized.projectElectives.forEach(subject => {
                        const subjectCard = createSubjectCard(subject);
                        subjectsGrid.appendChild(subjectCard);
                    });
                    
                    // Add separator after project & electives
                    subjectsGrid.appendChild(createSeparator());
                }

                // Section 4: Library & PE (with toggle)
                if (categorized.libraryPE && categorized.libraryPE.length > 0) {
                    // Add toggle header
                    subjectsGrid.appendChild(createSectionToggle('libraryPE', 'Library & PE'));
                    
                    categorized.libraryPE.forEach(subject => {
                        const subjectCard = createSubjectCard(subject);
                        subjectsGrid.appendChild(subjectCard);
                    });
                    
                    // Add separator after library & PE
                    subjectsGrid.appendChild(createSeparator());
                }

                // Section 5: Remedial Classes (with toggle)
                if (categorized.remedial && categorized.remedial.length > 0) {
                    // Add toggle header
                    subjectsGrid.appendChild(createSectionToggle('remedial', 'Remedial Classes'));
                    
                    categorized.remedial.forEach(subject => {
                        const subjectCard = createSubjectCard(subject);
                        subjectsGrid.appendChild(subjectCard);
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error loading attendance:', error);
        });
}

// Get toggle state from localStorage (default: false - not included in overall)
function getToggleState(sectionId) {
    const state = localStorage.getItem(`toggle_${sectionId}`);
    return state === 'true'; // Returns true if enabled, false otherwise
}

// Set toggle state in localStorage
function setToggleState(sectionId, enabled) {
    localStorage.setItem(`toggle_${sectionId}`, enabled.toString());
}

// Create section toggle button
function createSectionToggle(sectionId, sectionName) {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'section-toggle-container';
    
    const isEnabled = getToggleState(sectionId);
    
    toggleContainer.innerHTML = `
        <div class="section-toggle-content">
            <span class="section-toggle-label">${sectionName}</span>
            <div class="toggle-wrapper">
                <span class="toggle-description">Include in Overall %</span>
                <label class="toggle-switch">
                    <input type="checkbox" id="toggle_${sectionId}" ${isEnabled ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>
    `;
    
    // Add event listener to toggle
    const checkbox = toggleContainer.querySelector(`#toggle_${sectionId}`);
    checkbox.addEventListener('change', function() {
        setToggleState(sectionId, this.checked);
        updateOverallAttendance();
    });
    
    return toggleContainer;
}

// Update overall attendance based on toggle states
function updateOverallAttendance() {
    if (!window.attendanceData) return;
    
    const categorized = window.attendanceData.categorized;
    let totalPresent = 0;
    let totalClasses = 0;
    
    // Always include: Theory, Labs, Project & Electives
    const alwaysInclude = [
        ...(categorized.theory || []),
        ...(categorized.labs || []),
        ...(categorized.projectElectives || [])
    ];
    
    alwaysInclude.forEach(subject => {
        totalPresent += subject.present_count;
        totalClasses += subject.total_count;
    });
    
    // Conditionally include Library & PE
    if (getToggleState('libraryPE') && categorized.libraryPE) {
        categorized.libraryPE.forEach(subject => {
            totalPresent += subject.present_count;
            totalClasses += subject.total_count;
        });
    }
    
    // Conditionally include Remedial
    if (getToggleState('remedial') && categorized.remedial) {
        categorized.remedial.forEach(subject => {
            totalPresent += subject.present_count;
            totalClasses += subject.total_count;
        });
    }
    
    // Calculate overall percentage
    const overall = totalClasses > 0 ? parseFloat(((totalPresent / totalClasses) * 100).toFixed(2)) : 0;
    
    // Update UI
    const overallElement = document.getElementById('overallPercentage');
    overallElement.textContent = overall + '%';
    overallElement.className = 'percentage ' + getPercentageClass(overall);
    
    // Update radial progress circle
    updateProgressCircle(overall);
}

function updateProgressCircle(percentage) {
    const circle = document.getElementById('progressCircle');
    const radius = 110;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = offset;
    
    // Update color based on percentage
    const colorClass = getPercentageClass(percentage);
    if (colorClass === 'high') {
        circle.setAttribute('stroke', '#10b981');
    } else if (colorClass === 'medium') {
        circle.setAttribute('stroke', '#f59e0b');
    } else {
        circle.setAttribute('stroke', '#ef4444');
    }
}

function getPercentageClass(percentage) {
    if (percentage > 85) {
        return 'high';
    } else if (percentage >= 75) {
        return 'medium';
    } else {
        return 'low';
    }
}

function createSeparator() {
    const separator = document.createElement('div');
    separator.className = 'subjects-separator';
    return separator;
}


function createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    
    const percentageClass = getPercentageClass(subject.percentage);
    
    // Calculate circle properties for radial progress
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (subject.percentage / 100) * circumference;
    
    // Determine color based on percentage
    let strokeColor = '#ef4444'; // red (low)
    if (subject.percentage > 85) {
        strokeColor = '#10b981'; // green (high)
    } else if (subject.percentage >= 75) {
        strokeColor = '#f59e0b'; // orange (medium)
    }
    
    card.innerHTML = `
        <div class="subject-info">
            <div class="subject-name">${subject.name}</div>
            <div class="subject-code">${subject.code}</div>
        </div>
        <div class="subject-stats">
            <div class="subject-radial-container">
                <svg class="subject-progress-ring" width="70" height="70" viewBox="0 0 70 70">
                    <circle class="subject-progress-ring-bg" stroke="#2d2d2d" stroke-width="4" fill="transparent" r="${radius}" cx="35" cy="35"/>
                    <circle class="subject-progress-ring-circle" stroke="${strokeColor}" stroke-width="4" fill="transparent" r="${radius}" cx="35" cy="35" 
                        style="stroke-dasharray: ${circumference} ${circumference}; stroke-dashoffset: ${offset}; transform: rotate(-90deg); transform-origin: 50% 50%;"/>
                </svg>
                <div class="subject-percentage-text ${percentageClass}">${subject.percentage}%</div>
            </div>
            <div class="subject-actions">
                <button class="btn-action btn-present" onclick="updateAttendance(${subject.id}, 'present')">P</button>
                <button class="btn-action btn-absent" onclick="updateAttendance(${subject.id}, 'absent')">A</button>
            </div>
        </div>
        <div class="class-count-bottom">TOTAL CLASS: ${subject.present_count}/${subject.total_count}</div>
    `;
    
    return card;
}

function updateAttendance(subjectId, status) {
    fetch('update_attendance.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `subject_id=${subjectId}&status=${status}&date=${selectedDate}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload attendance data and calendar
            loadAttendance();
            renderCalendar(); // Refresh calendar to show new attendance
        } else {
            alert('Error updating attendance: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating attendance');
    });
}

// Calendar Functions
function initializeCalendar() {
    renderCalendar();
}

function renderCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;
    
    // Fetch attendance data for this month
    fetch(`get_calendar_data.php?year=${year}&month=${month + 1}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                attendanceData = data.attendance_data;
                generateCalendarDays(year, month);
            }
        })
        .catch(error => {
            console.error('Error loading calendar data:', error);
            generateCalendarDays(year, month);
        });
}

function generateCalendarDays(year, month) {
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const todayDate = today.getDate();
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, true, false, null);
        calendarDays.appendChild(dayElement);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayAttendance = attendanceData[dateString] || null;
        const isToday = isCurrentMonth && day === todayDate;
        const dayElement = createDayElement(day, false, isToday, dayAttendance, dateString);
        calendarDays.appendChild(dayElement);
    }
    
    // Next month days to fill the grid
    const totalCells = calendarDays.children.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, true, false, null);
        calendarDays.appendChild(dayElement);
    }
}

function createDayElement(day, isOtherMonth, isToday, attendanceInfo, dateString) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    if (isToday) {
        dayDiv.classList.add('today');
    }
    
    // Check if this date is in the future
    let isFutureDate = false;
    if (dateString && !isOtherMonth) {
        const clickedDate = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        isFutureDate = clickedDate > today;
        
        if (isFutureDate) {
            dayDiv.classList.add('future-date');
        }
    }
    
    // Check if this date is selected
    if (dateString && dateString === selectedDate) {
        dayDiv.classList.add('selected-date');
    }
    
    const dayNumber = document.createElement('div');
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);
    
    // Add attendance indicator
    if (attendanceInfo && !isOtherMonth) {
        const presentCount = attendanceInfo.present || 0;
        const absentCount = attendanceInfo.absent || 0;
        
        if (presentCount > 0 || absentCount > 0) {
            dayDiv.classList.add('has-attendance');
            
            const indicator = document.createElement('div');
            indicator.className = 'attendance-indicator';
            
            // Show present indicator if there are any present attendances
            if (presentCount > 0) {
                const presentDot = document.createElement('div');
                presentDot.className = 'attendance-dot present';
                indicator.appendChild(presentDot);
                
                if (presentCount > 1) {
                    const presentPlus = document.createElement('span');
                    presentPlus.className = 'attendance-plus present';
                    presentPlus.textContent = '+';
                    indicator.appendChild(presentPlus);
                }
            }
            
            // Show absent indicator if there are any absent attendances
            if (absentCount > 0) {
                const absentDot = document.createElement('div');
                absentDot.className = 'attendance-dot absent';
                indicator.appendChild(absentDot);
                
                if (absentCount > 1) {
                    const absentPlus = document.createElement('span');
                    absentPlus.className = 'attendance-plus absent';
                    absentPlus.textContent = '+';
                    indicator.appendChild(absentPlus);
                }
            }
            
            dayDiv.appendChild(indicator);
        }
    }
    
    // Add click event for date selection and viewing attendance (only for non-future dates)
    if (!isOtherMonth && dateString && !isFutureDate) {
        dayDiv.addEventListener('click', () => handleDateClick(dateString));
    }
    
    return dayDiv;
}

// Handle date click - select date or show attendance details
function handleDateClick(dateString) {
    // Check if the date is in the future
    const clickedDate = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate comparison
    
    // Prevent selecting future dates
    if (clickedDate > today) {
        return; // Do nothing for future dates
    }
    
    // If clicking the already selected date, show attendance details
    if (dateString === selectedDate) {
        // Check if there's attendance data for this date
        if (attendanceData[dateString]) {
            showAttendanceDetails(dateString);
        }
    } else {
        // Select this date for marking attendance
        selectedDate = dateString;
        // Re-render calendar to update selected date styling
        renderCalendar();
    }
}

function showAttendanceDetails(dateString) {
    fetch(`get_attendance_by_date.php?date=${dateString}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const modal = document.getElementById('attendanceModal');
                const modalTitle = document.getElementById('modalTitle');
                const modalBody = document.getElementById('modalBody');
                
                // Format date for display
                const date = new Date(dateString + 'T00:00:00');
                const dateFormatted = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                });
                
                modalTitle.textContent = `Attendance - ${dateFormatted}`;
                
                if (data.attendance.length === 0) {
                    modalBody.innerHTML = '<div class="no-attendance">No attendance marked for this date</div>';
                } else {
                    let html = '';
                    data.attendance.forEach(item => {
                        html += `
                            <div class="attendance-item">
                                <div class="subject-info-modal">
                                    <div class="subject-name-modal">${item.subject_name}</div>
                                    <div class="subject-code-modal">${item.subject_code}</div>
                                </div>
                                <div class="attendance-item-actions">
                                    <div class="attendance-status ${item.status}">${item.status.toUpperCase()}</div>
                                    <button class="btn-delete-attendance" onclick="deleteStudentAttendance(${item.attendance_id}, '${item.subject_name}', '${dateString}')" title="Delete this attendance">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        `;
                    });
                    modalBody.innerHTML = html;
                }
                
                modal.classList.add('show');
            }
        })
        .catch(error => {
            console.error('Error loading attendance details:', error);
        });
}

function closeModal() {
    const modal = document.getElementById('attendanceModal');
    modal.classList.remove('show');
}

// Footer Date/Time Update (IST)
function updateFooterDateTime() {
    const now = new Date();
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000; // IST offset in milliseconds
    const istTime = new Date(now.getTime() + istOffset);
    
    // Format date
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        timeZone: 'UTC'
    };
    const dateString = istTime.toLocaleDateString('en-US', options);
    
    // Format time
    const hours = istTime.getUTCHours();
    const minutes = String(istTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(istTime.getUTCSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeString = `${displayHours}:${minutes}:${seconds} ${ampm}`;
    
    document.getElementById('footerDateTime').textContent = `${dateString} | ${timeString} IST`;
}

// Marks Functions
function loadMarks() {
    fetch('get_marks.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const marksGrid = document.getElementById('marksGrid');
                marksGrid.innerHTML = '';

                data.marks.forEach(subject => {
                    const marksCard = createMarksCard(subject);
                    marksGrid.appendChild(marksCard);
                });
            }
        })
        .catch(error => {
            console.error('Error loading marks:', error);
        });
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function createMarksCard(subject) {
    const card = document.createElement('div');
    card.className = 'marks-card';
    
    // Calculate average and target
    const ia1 = subject.ia1 ? parseFloat(subject.ia1.obtained) : null;
    const ia2 = subject.ia2 ? parseFloat(subject.ia2.obtained) : null;
    const ia3 = subject.ia3 ? parseFloat(subject.ia3.obtained) : null;
    
    const { average, targetMessage, targetClass } = calculateMarksStats(ia1, ia2, ia3);
    
    card.innerHTML = `
        <div class="marks-card-header">
            <div class="marks-subject-name">${subject.subject_name}</div>
            <div class="marks-subject-code">${subject.subject_code}</div>
        </div>
        
        <div class="ia-list">
            <div class="ia-item">
                <span class="ia-label">IA - 1</span>
                <div class="ia-input-group">
                    <input type="number" 
                           class="ia-input" 
                           data-subject-id="${subject.subject_id}" 
                           data-ia-number="1"
                           value="${ia1 !== null ? ia1 : ''}"
                           placeholder="--"
                           min="0" 
                           max="50" 
                           step="0.5">
                    <span class="ia-max-marks">/ 50</span>
                </div>
            </div>
            
            <div class="ia-item">
                <span class="ia-label">IA - 2</span>
                <div class="ia-input-group">
                    <input type="number" 
                           class="ia-input" 
                           data-subject-id="${subject.subject_id}" 
                           data-ia-number="2"
                           value="${ia2 !== null ? ia2 : ''}"
                           placeholder="--"
                           min="0" 
                           max="50" 
                           step="0.5">
                    <span class="ia-max-marks">/ 50</span>
                </div>
            </div>
            
            <div class="ia-item">
                <span class="ia-label">IA - 3</span>
                <div class="ia-input-group">
                    <input type="number" 
                           class="ia-input" 
                           data-subject-id="${subject.subject_id}" 
                           data-ia-number="3"
                           value="${ia3 !== null ? ia3 : ''}"
                           placeholder="--"
                           min="0" 
                           max="50" 
                           step="0.5">
                    <span class="ia-max-marks">/ 50</span>
                </div>
            </div>
        </div>
        
        <div class="marks-summary">
            <div class="marks-average">
                <span class="average-label">Average</span>
                <span class="average-value">${average}</span>
            </div>
            <div class="marks-target ${targetClass}">${targetMessage}</div>
        </div>
    `;
    
    // Create debounced update function
    const debouncedUpdate = debounce(updateMarks, 800);
    
    // Add event listeners to inputs with debouncing
    const inputs = card.querySelectorAll('.ia-input');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            // Use debounced function for input event
            debouncedUpdate(this);
        });
        
        input.addEventListener('blur', function() {
            // Immediate update on blur (when user leaves the field)
            updateMarks(this);
        });
    });
    
    return card;
}

function calculateMarksStats(ia1, ia2, ia3) {
    const marks = [ia1, ia2, ia3].filter(m => m !== null);
    
    // Base case: No marks entered
    if (marks.length === 0) {
        return {
            average: '--',
            targetMessage: 'Enter marks to see statistics',
            targetClass: 'info'
        };
    }
    
    const total = marks.reduce((sum, m) => sum + m, 0);
    const average = total / marks.length;
    const targetAverage = 20; // Target is 20/50
    const targetTotal = 60; // 20 * 3 IAs
    
    let targetMessage = '';
    let targetClass = '';
    
    const remaining = 3 - marks.length;
    
    if (remaining === 0) {
        // All 3 IAs completed - just show if average achieved
        if (average >= targetAverage) {
            targetMessage = `✓ Average achieved!`;
            targetClass = 'success';
        } else {
            targetMessage = `Average not achieved (${average.toFixed(2)}/20)`;
            targetClass = 'warning';
        }
    } else {
        // Calculate minimum needed in remaining IAs
        const totalNeeded = targetTotal - total;
        const minPerRemainingIA = totalNeeded / remaining;
        
        if (minPerRemainingIA > 50) {
            targetMessage = `Target of 20 avg not achievable`;
            targetClass = 'warning';
        } else if (minPerRemainingIA <= 0) {
            targetMessage = `✓ Already safe for 20+ average!`;
            targetClass = 'success';
        } else {
            if (remaining === 2) {
                // After IA-1: Show min needed in both IA-2 and IA-3
                targetMessage = `Min ${minPerRemainingIA.toFixed(1)} in IA-2 & IA-3 for 20 avg`;
                targetClass = 'info';
            } else {
                // After IA-2: Show min needed in IA-3
                targetMessage = `Min ${minPerRemainingIA.toFixed(1)} in IA-3 for 20 avg`;
                targetClass = 'info';
            }
        }
    }
    
    return {
        average: average.toFixed(2),
        targetMessage,
        targetClass
    };
}

function updateMarks(inputElement) {
    const subjectId = inputElement.dataset.subjectId;
    const iaNumber = inputElement.dataset.iaNumber;
    const marksObtained = inputElement.value;
    
    // Validate input
    if (marksObtained !== '' && (parseFloat(marksObtained) < 0 || parseFloat(marksObtained) > 50)) {
        alert('Marks should be between 0 and 50');
        inputElement.value = '';
        return;
    }
    
    fetch('update_marks.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `subject_id=${subjectId}&ia_number=${iaNumber}&marks_obtained=${marksObtained}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload marks to update average and target
            loadMarks();
        } else {
            alert('Error updating marks: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while updating marks');
    });
}

// Delete student's own attendance record
function deleteStudentAttendance(attendanceId, subjectName, dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const dateFormatted = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    if (!confirm(`Are you sure you want to delete this attendance record?\n\nSubject: ${subjectName}\nDate: ${dateFormatted}`)) {
        return;
    }
    
    fetch('delete_student_attendance.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `attendance_id=${attendanceId}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Close modal
            closeModal();
            
            // Reload attendance data to update counts and percentages
            loadAttendance();
            
            // Refresh calendar to update indicators
            renderCalendar();
        } else {
            alert('Error deleting attendance: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while deleting attendance');
    });
}
