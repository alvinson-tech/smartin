document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Check if registrations are closed
    if (document.querySelector('.registration-closed')) {
        return; // Prevent form submission
    }
    
    const errorMessage = document.getElementById('error-message');
    const successMessage = document.getElementById('success-message');
    errorMessage.textContent = '';
    successMessage.textContent = '';
    
    // Get form values
    const usn = document.getElementById('usn').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const name = document.getElementById('name').value.trim();
    const semester = document.getElementById('semester').value;
    const college = document.getElementById('college').value;
    const openElective = document.getElementById('openElective').value.trim();
    const openElectiveCode = document.getElementById('openElectiveCode').value.trim();
    const aecVertical = document.getElementById('aecVertical').value.trim();
    const aecVerticalCode = document.getElementById('aecVerticalCode').value.trim();
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Passwords do not match!';
        return;
    }
    
    // Validate password length
    if (password.length < 4) {
        errorMessage.textContent = 'Password must be at least 4 characters long!';
        return;
    }
    
    try {
        const formData = new FormData();
        formData.append('usn', usn);
        formData.append('password', password);
        formData.append('name', name);
        formData.append('semester', semester);
        formData.append('college', college);
        formData.append('openElective', openElective);
        formData.append('openElectiveCode', openElectiveCode);
        formData.append('aecVertical', aecVertical);
        formData.append('aecVerticalCode', aecVerticalCode);
        
        const response = await fetch('register.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            successMessage.textContent = data.message;
            errorMessage.textContent = '';
            
            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            errorMessage.textContent = data.message;
            successMessage.textContent = '';
        }
    } catch (error) {
        errorMessage.textContent = 'An error occurred. Please try again.';
        console.error('Error:', error);
    }
});
