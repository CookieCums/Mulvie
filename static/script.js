function isMobileDevice() {
    return window.innerWidth <= 800;
}

function showMobileNotice() {
    const notice = document.getElementById('mobileNotice');
    if (isMobileDevice()) {
        notice.style.display = 'block';
        console.log('Mobile device detected, showing notice');
    }
}

function dismissNotice() {
    const notice = document.getElementById('mobileNotice');
    notice.style.display = 'none';
    localStorage.setItem('noticeDismissed', 'true');
}

document.addEventListener('DOMContentLoaded', function() {
    showMobileNotice();
    const searchInput = document.getElementById('searchInput');
    const cards = document.querySelectorAll('.card');

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        
        cards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            if (title.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchInput.addEventListener('input', performSearch);
    document.querySelector('.search-btn').addEventListener('click', performSearch);
});

function openModal() {
    document.getElementById('modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('message').textContent = '';
}

function openAboutModal() {
    document.getElementById('aboutModal').style.display = 'flex';
}

function closeAboutModal() {
    document.getElementById('aboutModal').style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.id === 'aboutModal') {
        closeAboutModal();
    } else if (event.target.id === 'modal') {
        closeModal();
    }
}

document.getElementById('requestForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        request: formData.get('request')
    };

    try {
        const response = await fetch('/submit_request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(data)
        });

        const result = await response.json();
        const message = document.getElementById('message');
        
        if (result.success) {
            message.textContent = 'Request submitted successfully!';
            message.style.color = '#00ff88';
            e.target.reset();
            setTimeout(closeModal, 2000);
        } else {
            message.textContent = `Error: ${result.error}`;
            message.style.color = '#ff4444';
        }
    } catch (error) {
        document.getElementById('message').textContent = `Error: ${error.message}`;
        document.getElementById('message').style.color = '#ff4444';
    }
});

async function reportBrokenLink(title, links) {
    const timestamp = new Date().toISOString();
    const report = {
        title: title,
        links: links,
        reported_at: timestamp
    };

    try {
        const response = await fetch('/report_broken_link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(report)
        });

        const result = await response.json();
        if (result.success) {
            alert('Thank you! The broken link has been reported.');
        } else {
            alert('Failed to report broken link. Please try again.');
        }
    } catch (error) {
        alert('Error reporting broken link: ' + error.message);
    }
}