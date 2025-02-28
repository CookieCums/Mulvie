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

let currentPage = 0;
const loadMoreBtn = document.getElementById('loadMoreBtn');
const loading = document.getElementById('loading');
const videoGrid = document.getElementById('videoGrid');

async function loadMoreVideos() {
    try {
        loadMoreBtn.style.display = 'none';
        loading.style.display = 'block';
        
        const response = await fetch(`/api/load_more?page=${currentPage + 1}`);
        const data = await response.json();
        
        if (data.videos.length) {
            currentPage++;
            
            data.videos.forEach(video => {
                const card = createVideoCard(video);
                videoGrid.appendChild(card);
            });
            
            if (!data.hasMore) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        } else {
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading more videos:', error);
    } finally {
        loading.style.display = 'none';
    }
}

function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'card';
    
    card.innerHTML = `
        <div class="card-image">
            <img src="${video.thumbnail}" loading="lazy" alt="${video.title}">
        </div>
        <div class="card-content">
            <h3>${video.title}</h3>
            <div class="button-container">
                ${video.single_file ? `
                    <a href="${video.download_link}" class="download-btn" target="_blank">
                        Download
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                        </svg>
                    </a>
                    <button class="report-btn" onclick="reportBrokenLink('${video.title}', '${video.download_link}')">
                        Report Broken Link
                    </button>
                ` : `
                    <div class="season-buttons">
                        <a href="/seasons/${encodeURIComponent(video.title)}" class="view-all-btn">
                            All Files (${video.file_count})
                        </a>
                        <button class="report-btn" onclick="reportBrokenLink('${video.title}', ${JSON.stringify(video.files)})">
                            Report Broken Link
                        </button>
                    </div>
                `}
            </div>
        </div>
    `;
    
    return card;
}

if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreVideos);
}