// Admin login functionality (admin/login.html)
document.getElementById('adminLoginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const enteredKey = document.getElementById('adminKey').value;
    console.log("Entered Key: ", enteredKey); // Log the entered key
    const correctKey = 'admin123';  // Predefined correct key
    const errorMessage = document.getElementById('errorMessage');

    if (enteredKey === correctKey) {
        console.log("Key matches! Redirecting to the dashboard...");  // Log successful match
        window.location.href = 'dashboard.html';  // Redirect to admin dashboard
    } else {
        console.log("Invalid key! Showing error message.");  // Log invalid key
        errorMessage.style.display = 'block';  // Show error message
    }
});





// CRUD functionality (admin/dashboard.html)
document.getElementById('addAchievementBtn').addEventListener('click', function() {
    alert('Open form to add Achievement');
});

document.getElementById('addProjectBtn').addEventListener('click', function() {
    alert('Open form to add Project');
});

document.getElementById('addBlogBtn').addEventListener('click', function() {
    alert('Open form to add Blog');
});
