document.addEventListener('DOMContentLoaded', function() {
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