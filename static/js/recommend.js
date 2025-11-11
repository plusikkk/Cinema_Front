document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('recommend-form');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);

        fetch(form.action, {
            method: 'POST',
            headers: {
                'X-CSRFToken': formData.get('csrfmiddlewaretoken'),
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('recommend-content').innerHTML = data.result;
            document.getElementById('recommend-modal').style.display = 'block';
        })
        .catch(error => console.error('Error:', error));
    });
});

function closeModal() {
    document.getElementById('recommend-modal').style.display = 'none';
}



