const PATH_TO_BACKEND = process.env.PATH_TO_BACKEND;
let isLoggedIn = false;

// Function to check auth status and update UI
function checkAuthStatus() {
    const token = localStorage.getItem("token");
    if (token) {
        isLoggedIn = true;
        document.getElementById("auth-container").style.display = "none";
        document.getElementById("app-container").style.display = "block";
        fetchCapsules();
    } else {
        isLoggedIn = false;
        document.getElementById("auth-container").style.display = "block";
        document.getElementById("app-container").style.display = "none";
    }
}

// Function to fetch and display capsules
async function fetchCapsules() {
    const token = localStorage.getItem("token");
    if (!token) {
        checkAuthStatus();
        return;
    }

    try {
        const response = await axios.get(PATH_TO_BACKEND + "/api/capsules", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const capsules = response.data;
        renderCapsules(capsules);
        renderAvailableCapsules(capsules);
    } catch (error) {
        console.error("Error fetching capsules:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("token");
            checkAuthStatus();
            showNotification("Session expired. Please log in again.", "error");
        }
    }
}

// Function to render capsules to the UI
function renderCapsules(capsules) {
    const capsulesList = document.getElementById("capsules-list");

    // Clear existing content
    capsulesList.innerHTML = "";

    if (capsules.length === 0) {
        capsulesList.innerHTML = `<p class="empty-state">No time capsules yet. Create one above!</p>`;
        return;
    }

    capsules.forEach(capsule => {
        const unlockDate = new Date(capsule.unlockDate);
        const today = new Date();
        const isUnlocked = today >= unlockDate;

        const capsuleElement = document.createElement("div");
        capsuleElement.className = `capsule-item ${isUnlocked ? 'unlocked' : 'locked'}`;
        capsuleElement.dataset.id = capsule.id;
        capsuleElement.dataset.unlocked = isUnlocked;
        // Make the whole capsule clickable
        capsuleElement.addEventListener('click', handleCapsuleClick);

        const formattedDate = unlockDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Change how we display unlocked capsules to make them more accessible
        if (isUnlocked) {
            capsuleElement.innerHTML = `
                <div class="capsule-header">
                    <span class="capsule-date">${formattedDate}</span>
                    <span class="capsule-status accessible">
                        <i class="fas fa-unlock"></i> Unlocked
                    </span>
                </div>
                <div class="capsule-content unlocked-content">
                    <div class="message-container">
                        <h3>Message from your past self:</h3>
                        <p class="capsule-message">${capsule.message}</p>
                    </div>
                    <div class="capsule-creation-info">
                        <p><i class="fas fa-calendar-alt"></i> Created: ${new Date(capsule.createdAt || Date.now()).toLocaleDateString()}</p>
                        <p><i class="fas fa-unlock-alt"></i> Unlocked: ${formattedDate}</p>
                    </div>
                </div>
                <div class="capsule-actions expanded">
                    <button class="btn-share" data-id="${capsule.id}" aria-label="Share this capsule">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                    <button class="btn-copy" data-message="${encodeURIComponent(capsule.message)}" aria-label="Copy message to clipboard">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                    <button class="btn-delete" data-id="${capsule.id}" aria-label="Delete this capsule">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
        } else {
            capsuleElement.innerHTML = `
                <div class="capsule-header">
                    <span class="capsule-date">${formattedDate}</span>
                    <span class="capsule-status">
                        <i class="fas fa-lock"></i> Locked
                    </span>
                </div>
                <div class="capsule-content">
                    <p class="locked-message">This message will be available on ${formattedDate}</p>
                    
                </div>
                <div class="capsule-actions">
                    <button class="btn-countdown" disabled>
                        <i class="fas fa-hourglass-half"></i> Countdown: ${calculateCountdown(unlockDate)}
                    </button>
                </div>
            `;
        }

        capsulesList.appendChild(capsuleElement);
    });

    // Add event listeners to buttons
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', handleDeleteCapsule);
    });

    document.querySelectorAll('.btn-copy').forEach(button => {
        button.addEventListener('click', handleCopyMessage);
    });

    document.querySelectorAll('.btn-share').forEach(button => {
        button.addEventListener('click', handleShareCapsule);
    });
}

// Function to render only available (unlocked) capsules in the sidebar
function renderAvailableCapsules(capsules) {
    const availableCapsulesList = document.getElementById("available-capsules-list");

    // Filter for only unlocked capsules
    const availableCapsules = capsules.filter(capsule => {
        const unlockDate = new Date(capsule.unlockDate);
        const today = new Date();
        return today >= unlockDate;
    });

    // Clear existing content
    availableCapsulesList.innerHTML = "";

    if (availableCapsules.length === 0) {
        availableCapsulesList.innerHTML = `<p class="empty-state">No unlocked capsules yet</p>`;
        return;
    }

    availableCapsules.forEach(capsule => {
        const unlockDate = new Date(capsule.unlockDate);

        const capsuleElement = document.createElement("div");
        capsuleElement.className = "sidebar-capsule";
        capsuleElement.dataset.id = capsule.id;

        const formattedDate = unlockDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        capsuleElement.innerHTML = `
            <div class="sidebar-capsule-date">
                ${formattedDate}
            </div>
            <div class="sidebar-capsule-preview">
                ${capsule.message.substring(0, 40) + (capsule.message.length > 40 ? '...' : '')}
            </div>
        `;

        // Add click event to scroll to the capsule in the main list
        capsuleElement.addEventListener('click', () => {
            const mainCapsule = document.querySelector(`.capsule-item[data-id="${capsule.id}"]`);
            if (mainCapsule) {
                mainCapsule.scrollIntoView({ behavior: 'smooth' });
                // Highlight the capsule briefly
                mainCapsule.classList.add('highlight');
                setTimeout(() => {
                    mainCapsule.classList.remove('highlight');
                }, 1500);
            }
        });

        availableCapsulesList.appendChild(capsuleElement);
    });
}

// Handle capsule click
async function handleCapsuleClick(event) {
    // Prevent triggering if clicking on a button
    if (event.target.tagName === 'BUTTON' ||
        event.target.closest('button') ||
        event.target.tagName === 'I' && event.target.closest('button')) {
        return;
    }

    const capsuleElement = event.currentTarget;
    const capsuleId = capsuleElement.dataset.id;
   // console.log(capsuleId);
    const isUnlocked = capsuleElement.dataset.unlocked === 'true';

    // If it's already unlocked, no need to fetch again
    if (isUnlocked) {
        // Maybe expand/collapse the details instead
        const content = capsuleElement.querySelector('.capsule-content');
        content.classList.toggle('expanded');
        return;
    }

    // Try to unlock the capsule
    try {
        const token = localStorage.getItem("token");
        const response = await axios.get(PATH_TO_BACKEND + `/api/capsules/${capsuleId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const capsule = response.data;

        const unlockDate = new Date(capsule.unlockDate);
        const today = new Date();

        // Check if it can be unlocked today
        if (today >= unlockDate) {
            // Update the UI to show the unlocked capsule
            showUnlockedCapsule(capsuleElement, capsule);
            showNotification("Capsule unlocked! 🎉", "success");
        } else {
            // Cannot be unlocked yet
            const daysLeft = Math.ceil((unlockDate - today) / (1000 * 60 * 60 * 24));
            showNotification(`This capsule will unlock in ${daysLeft} days`, "info");

            // Add a shake animation to indicate it's still locked
            capsuleElement.classList.add('shake');
            setTimeout(() => {
                capsuleElement.classList.remove('shake');
            }, 500);
        }
    } catch (error) {
        console.error("Error checking capsule:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
         //   console.log(error.response?.data)
            localStorage.removeItem("token");
            checkAuthStatus();
        }
        showNotification("Could not check this capsule", "error");
    }
}

// Function to update UI for a newly unlocked capsule
function showUnlockedCapsule(capsuleElement, capsule) {
    // Update dataset
    capsuleElement.dataset.unlocked = 'true';
    capsuleElement.className = 'capsule-item unlocked';

    const unlockDate = new Date(capsule.unlockDate);
    const formattedDate = unlockDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    capsuleElement.innerHTML = `
        <div class="capsule-header">
            <span class="capsule-date">${formattedDate}</span>
            <span class="capsule-status accessible">
                <i class="fas fa-unlock"></i> Unlocked
            </span>
        </div>
        <div class="capsule-content unlocked-content">
            <div class="message-container">
                <h3>Message from your past self:</h3>
                <p class="capsule-message">${capsule.message}</p>
            </div>
            <div class="capsule-creation-info">
                <p><i class="fas fa-calendar-alt"></i> Created: ${new Date(capsule.createdAt || Date.now()).toLocaleDateString()}</p>
                <p><i class="fas fa-unlock-alt"></i> Unlocked: ${new Date().toLocaleDateString()}</p>
            </div>
        </div>
        <div class="capsule-actions expanded">
            <button class="btn-share" data-id="${capsule.id}" aria-label="Share this capsule">
                <i class="fas fa-share-alt"></i> Share
            </button>
            <button class="btn-copy" data-message="${encodeURIComponent(capsule.message)}" aria-label="Copy message to clipboard">
                <i class="fas fa-copy"></i> Copy
            </button>
            <button class="btn-delete" data-id="${capsule.id}" aria-label="Delete this capsule">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    // Re-add event listeners
    capsuleElement.querySelector('.btn-delete').addEventListener('click', handleDeleteCapsule);
    capsuleElement.querySelector('.btn-copy').addEventListener('click', handleCopyMessage);
    capsuleElement.querySelector('.btn-share').addEventListener('click', handleShareCapsule);
}

// Calculate countdown to unlock date
function calculateCountdown(unlockDate) {
    const now = new Date();
    const diff = unlockDate - now;

    // Return "Today" if it's happening today
    if (diff < 86400000 && diff > 0) { // less than 24 hours
        return "Today";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return `${days} days`;
}

// Handle delete capsule
async function handleDeleteCapsule(event) {
    const id = event.currentTarget.dataset.id;
    try {
        const token = localStorage.getItem("token");
        await axios.delete(PATH_TO_BACKEND + `/api/capsules/${id}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        fetchCapsules(); // Refresh the list
    } catch (error) {
        console.error("Error deleting capsule:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("token");
            checkAuthStatus();
        }
    }
}

// Handle copying message to clipboard
function handleCopyMessage(event) {
    const message = decodeURIComponent(event.currentTarget.dataset.message);
    navigator.clipboard.writeText(message)
        .then(() => {
            showNotification("Message copied to clipboard!", "success");
        })
        .catch(err => {
            console.error("Could not copy text: ", err);
            showNotification("Failed to copy message", "error");
        });
}

// Handle sharing capsule
function handleShareCapsule(event) {
    const id = event.currentTarget.dataset.id;
    const shareUrl = `${window.location.origin}?capsule=${id}`;

    if (navigator.share) {
        // Use Web Share API if available
        navigator.share({
            title: 'Time Capsule Message',
            text: 'Check out this message from the past!',
            url: shareUrl,
        })
            .then(() => showNotification("Shared successfully", "success"))
            .catch((error) => console.log('Error sharing:', error));
    } else {
        // Fallback to copying the URL
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                showNotification("Share link copied to clipboard!", "success");
            })
            .catch(err => {
                console.error("Could not copy link: ", err);
                showNotification("Failed to copy share link", "error");
            });
    }
}

// Update createCapsule to refresh the list
async function createCapsule(data) {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            showNotification("Please log in to create a capsule", "error");
            checkAuthStatus();
            return 0;
        }

        const response = await axios.post(PATH_TO_BACKEND + "/api/capsules", {
            message: data.message,
            unlockDate: data.unlockDate
        }, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        console.log("Success");
        fetchCapsules(); // Refresh the list
        document.getElementById("send").reset(); // Clear the form
        return 1;
    } catch (error) {
        data.message = await error.response?.data;
        console.log(data.message.message);
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("token");
            checkAuthStatus();
        }
        return 0;
    }
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    axios.post(PATH_TO_BACKEND + "/login", { username, password })
        .then(response => {
            localStorage.setItem("token", response.data.token);
            showNotification("Login successful!", "success");
            checkAuthStatus();
        })
        .catch(error => {
            console.error("Login error:", error);
            showNotification("Login failed: " + (error.response?.data?.message || "Invalid credentials"), "error");
        });
}

// Handle register
function handleRegister(event) {
    event.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;

    axios.post(PATH_TO_BACKEND + "/register", { username, password })
        .then(response => {
            showNotification("Registration successful! Please log in.", "success");
            document.getElementById("login-tab").classList.add("active");
            document.getElementById("register-tab").classList.remove("active");
            document.getElementById("login-username").value = username;
        })
        .catch(error => {
            console.error("Registration error:", error);
            showNotification("Registration failed: " + (error.response?.data?.message || "Unknown error"), "error");
        });
}

// Handle logout
function handleLogout() {
    localStorage.removeItem("token");
    checkAuthStatus();
    showNotification("You have been logged out", "info");
}

// Switch tabs
function switchTab(event) {
    const tabId = event.target.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    event.target.classList.add('active');
    document.getElementById(`${tabId}-tab`).classList.add('active');
}

// Handle form submission
document.getElementById("send").addEventListener("submit", async function (event) {
    event.preventDefault();
    const formdata = new FormData(event.target);
    const data = Object.fromEntries(formdata.entries());

    // Validate form
    if (!data.message || !data.unlockDate) {
        showNotification("Please fill in all fields", "error");
        return;
    }

    data.unlockDate = new Date(data.unlockDate).toISOString();
    capsulecreate_status = await createCapsule(data);
    if (capsulecreate_status == 1) {
        showNotification("Capsule created successfully!", "success");
    }
    else {
        showNotification(`${data.message.message}`, "error");
    }

});

// Notification system
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' :
            type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    // Set minimum date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    document.getElementById("unlockDate").min = formattedDate;

    // Set up auth UI event listeners
    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("register-form").addEventListener("submit", handleRegister);
    document.getElementById("logout-btn").addEventListener("click", handleLogout);

    // Set up tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchTab);
    });

    // Check if user is already logged in
    checkAuthStatus();
});




