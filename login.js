// Login functionality with WebAuthn fingerprint support
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const passwordGroup = document.getElementById('passwordGroup');
    const loginBtn = document.getElementById('loginBtn');
    const fingerprintLoginBtn = document.getElementById('fingerprintLoginBtn');
    const switchUserLink = document.getElementById('switchUserLink');
    const switchUserBtn = document.getElementById('switchUserBtn');
    const errorMessage = document.getElementById('error-message');

    let rememberedUser = null;
    let isWebAuthnSupported = false;
    let temporarilySwitched = false; // Track if user temporarily switched

    // Check WebAuthn support
    if (window.PublicKeyCredential) {
        isWebAuthnSupported = true;
    }

    // Check for remembered user
    function checkRememberedUser() {
        const savedUser = localStorage.getItem('smartin_remembered_user');
        if (savedUser) {
            try {
                rememberedUser = JSON.parse(savedUser);
                // Verify user and check if they have fingerprint
                verifyRememberedUser(rememberedUser.username);
            } catch (e) {
                localStorage.removeItem('smartin_remembered_user');
            }
        }
    }

    // Verify remembered user still exists and check fingerprint status
    async function verifyRememberedUser(username) {
        try {
            const response = await fetch('fingerprint_auth.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check_user', username: username })
            });
            const data = await response.json();

            if (data.success && data.user_found) {
                // Update remembered user with latest info
                rememberedUser.name = data.name;
                rememberedUser.has_fingerprint = data.has_fingerprint;
                
                if (data.has_fingerprint && isWebAuthnSupported) {
                    // User has fingerprint - show 1-Tap Login
                    setupFingerprintLogin(rememberedUser);
                } else {
                    // User exists but no fingerprint - pre-fill username, require password
                    setupRememberedUserLogin(rememberedUser);
                }
            } else {
                // User not found - clear storage
                localStorage.removeItem('smartin_remembered_user');
                rememberedUser = null;
            }
        } catch (e) {
            console.error('Error verifying user:', e);
            // On error, still try to pre-fill if we have data
            if (rememberedUser) {
                setupRememberedUserLogin(rememberedUser);
            }
        }
    }

    // Setup UI for remembered user without fingerprint (pre-filled username, password required)
    function setupRememberedUserLogin(user) {
        usernameInput.value = user.username;
        usernameInput.readOnly = true;
        usernameInput.classList.add('readonly-input');
        
        // Password still required
        passwordGroup.style.display = 'block';
        passwordInput.required = true;
        
        // Normal login button
        loginBtn.style.display = 'block';
        fingerprintLoginBtn.style.display = 'none';
        switchUserLink.style.display = 'block';
    }

    // Setup UI for fingerprint login (1-Tap)
    function setupFingerprintLogin(user) {
        usernameInput.value = user.username;
        usernameInput.readOnly = true;
        usernameInput.classList.add('readonly-input');
        
        passwordGroup.style.display = 'none';
        passwordInput.required = false;
        
        loginBtn.style.display = 'none';
        fingerprintLoginBtn.style.display = 'flex';
        switchUserLink.style.display = 'block';
    }

    // Reset to normal login (temporary switch)
    function resetToNormalLogin() {
        usernameInput.value = '';
        usernameInput.readOnly = false;
        usernameInput.classList.remove('readonly-input');
        
        passwordGroup.style.display = 'block';
        passwordInput.required = true;
        
        loginBtn.style.display = 'block';
        fingerprintLoginBtn.style.display = 'none';
        switchUserLink.style.display = 'none';
        
        // Mark as temporarily switched - don't clear localStorage yet
        // The new login will update the remembered user
        temporarilySwitched = true;
    }

    // Handle switch user click
    if (switchUserBtn) {
        switchUserBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resetToNormalLogin();
        });
    }

    // Handle fingerprint login button click
    if (fingerprintLoginBtn) {
        fingerprintLoginBtn.addEventListener('click', async function() {
            if (!isWebAuthnSupported) {
                showError('Fingerprint login is not supported on this browser');
                return;
            }

            const username = usernameInput.value;
            if (!username) {
                showError('Username is required');
                return;
            }

            fingerprintLoginBtn.disabled = true;
            fingerprintLoginBtn.innerHTML = '<span class="loading-spinner"></span><span>Authenticating...</span>';

            try {
                // Get authentication challenge
                const challengeResponse = await fetch('fingerprint_auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_auth_challenge', username: username })
                });
                const challengeData = await challengeResponse.json();

                if (!challengeData.success) {
                    showError(challengeData.message || 'Failed to start authentication');
                    resetFingerprintButton();
                    return;
                }

                // Convert challenge and credential IDs for WebAuthn
                const challenge = new Uint8Array(challengeData.challenge.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                
                const allowCredentials = challengeData.credential_ids.map(id => ({
                    id: base64ToArrayBuffer(id),
                    type: 'public-key',
                    transports: ['internal']
                }));

                // Start WebAuthn authentication
                const credential = await navigator.credentials.get({
                    publicKey: {
                        challenge: challenge,
                        timeout: 60000,
                        userVerification: 'required',
                        allowCredentials: allowCredentials
                    }
                });

                // Send credential for verification
                const authResponse = await fetch('fingerprint_auth.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'verify_auth',
                        credential_id: arrayBufferToBase64(credential.rawId),
                        authenticator_data: arrayBufferToBase64(credential.response.authenticatorData),
                        signature: arrayBufferToBase64(credential.response.signature)
                    })
                });
                const authData = await authResponse.json();

                if (authData.success) {
                    // Redirect to dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    showError(authData.message || 'Authentication failed');
                    resetFingerprintButton();
                }
            } catch (e) {
                console.error('Fingerprint auth error:', e);
                if (e.name === 'NotAllowedError') {
                    showError('Authentication was cancelled or timed out');
                } else {
                    showError('Fingerprint authentication failed. Try password login.');
                }
                resetFingerprintButton();
            }
        });
    }

    function resetFingerprintButton() {
        fingerprintLoginBtn.disabled = false;
        fingerprintLoginBtn.innerHTML = `
            <svg class="fingerprint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a7 7 0 0 0-7 7c0 2 .5 3.5 1.5 5"/>
                <path d="M19 9a7 7 0 0 0-7-7"/>
                <path d="M12 10a7 7 0 0 0-3 5.7"/>
                <path d="M17 14a7 7 0 0 0-.5-2.5"/>
                <path d="M12 6a4 4 0 0 1 4 4c0 1.5-.5 3-1.5 4.5"/>
                <path d="M12 6a4 4 0 0 0-4 4c0 1.5.5 3 1.5 4.5"/>
                <path d="M12 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="currentColor"/>
                <path d="M12 14v6"/>
            </svg>
            <span>1-Tap Login</span>
        `;
    }

    // Handle normal login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;

        if (!username) {
            showError('Username is required');
            return;
        }

        // If fingerprint mode is active and password is not shown, trigger fingerprint
        if (passwordGroup.style.display === 'none') {
            fingerprintLoginBtn.click();
            return;
        }

        if (!password) {
            showError('Password is required');
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch('login.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                // ALWAYS save the logged-in user for future 1-Tap Login
                // This ensures every successful login sets up the user for quick access
                const userToSave = {
                    username: data.usn || username,
                    name: data.name || username
                };
                localStorage.setItem('smartin_remembered_user', JSON.stringify(userToSave));
                
                window.location.href = 'dashboard.html';
            } else {
                showError(data.message || 'Login failed');
                loginBtn.disabled = false;
                loginBtn.textContent = 'Login';
            }
        } catch (error) {
            showError('Connection error. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // Helper functions for WebAuthn
    function arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Initialize
    checkRememberedUser();
});
