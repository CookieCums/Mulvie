from flask import Flask, render_template, request
import json
from database import get_all_media, init_db

app = Flask(__name__)

@app.route('/')
def index():
    videos = get_all_media()
    return render_template('index.html', videos=videos)

@app.route('/submit_request', methods=['POST'])
def handle_request():
    data = {
        'name': request.form['name'],
        'email': request.form['email'],
        'request': request.form['request']
    }
    
    try:
        with open('requests.json', 'a+') as f:
            f.seek(0)
            try:
                content = f.read()
                requests = json.loads(content) if content else []
            except json.decoder.JSONDecodeError:
                requests = []
            requests.append(data)
            f.seek(0)
            f.truncate()
            json.dump(requests, f, indent=2)
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.route('/seasons/<title>')
def show_seasons(title):
    videos = get_all_media()
    video = next((v for v in videos if v['title'] == title), None)
    if video:
        return render_template('seasons.html', video=video)
    return 'Video not found', 404

if __name__ == '__main__':
    init_db()  # Initialize database on startup
    app.run(debug=True, port=5000, host='0.0.0.0')