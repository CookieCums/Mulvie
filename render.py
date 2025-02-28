from flask import Flask, render_template, request, jsonify
import requests
import sqlite3
from typing import Dict, List, Optional
import json

def init_db():
    conn = sqlite3.connect('mulvie.db')
    c = conn.cursor()
    
    # Create tables
    c.executescript('''
        CREATE TABLE IF NOT EXISTS media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            thumbnail_url TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS episodes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            media_id INTEGER,
            name TEXT NOT NULL,
            link TEXT NOT NULL,
            is_season BOOLEAN DEFAULT 0,
            season_number INTEGER DEFAULT NULL,
            FOREIGN KEY (media_id) REFERENCES media (id)
        );
    ''')
    
    conn.commit()
    conn.close()

def add_media(title: str, thumbnail_url: str, episodes: List[Dict[str, str]], is_season: bool = False) -> bool:
    try:
        conn = sqlite3.connect('mulvie.db')
        c = conn.cursor()
        
        # Insert media
        c.execute('INSERT INTO media (title, thumbnail_url) VALUES (?, ?)',
                 (title, thumbnail_url))
        media_id = c.lastrowid
        
        # Insert episodes
        season_number = 1
        for episode in episodes:
            name = episode['name']
            link = episode['link']
            
            if is_season and name.startswith('link'):
                c.execute('''
                    INSERT INTO episodes (media_id, name, link, is_season, season_number)
                    VALUES (?, ?, ?, ?, ?)
                ''', (media_id, f"Season {season_number}", link, True, season_number))
                season_number += 1
            else:
                c.execute('''
                    INSERT INTO episodes (media_id, name, link, is_season)
                    VALUES (?, ?, ?, ?)
                ''', (media_id, name, link, False))
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Error adding media: {e}")
        return False
    finally:
        conn.close()

def get_all_media() -> List[Dict]:
    conn = sqlite3.connect('mulvie.db')
    c = conn.cursor()
    
    media_list = []
    
    c.execute('''
        SELECT m.id, m.title, m.thumbnail_url, 
               GROUP_CONCAT(e.name), GROUP_CONCAT(e.link)
        FROM media m
        LEFT JOIN episodes e ON m.id = e.media_id
        GROUP BY m.id
    ''')
    
    for row in c.fetchall():
        media_id, title, thumbnail, names, links = row
        
        if names and links:
            names_list = names.split(',')
            links_list = links.split(',')
            
            if len(names_list) == 1:
                media_list.append({
                    'title': title,
                    'thumbnail': thumbnail,
                    'download_link': links_list[0],
                    'single_file': True
                })
            else:
                files = dict(zip(names_list, links_list))
                media_list.append({
                    'title': title,
                    'thumbnail': thumbnail,
                    'files': files,
                    'single_file': False,
                    'file_count': len(files)
                })
    
    conn.close()
    return media_list

def get_media_list() -> List[Dict]:
    conn = sqlite3.connect('mulvie.db')
    c = conn.cursor()
    
    c.execute('SELECT id, title FROM media ORDER BY title')
    media = [{'id': row[0], 'title': row[1]} for row in c.fetchall()]
    
    conn.close()
    return media

def delete_media(media_id: int) -> bool:
    try:
        conn = sqlite3.connect('mulvie.db')
        c = conn.cursor()
        
        # Delete episodes first due to foreign key constraint
        c.execute('DELETE FROM episodes WHERE media_id = ?', (media_id,))
        c.execute('DELETE FROM media WHERE id = ?', (media_id,))
        
        conn.commit()
        return True
    except Exception as e:
        print(f"Error deleting media: {e}")
        return False
    finally:
        conn.close()

def get_existing_media(title: str) -> Optional[Dict]:
    conn = sqlite3.connect('mulvie.db')
    c = conn.cursor()
    
    c.execute('''
        SELECT m.id, m.title, m.thumbnail_url, 
               GROUP_CONCAT(e.name), GROUP_CONCAT(e.link)
        FROM media m
        LEFT JOIN episodes e ON m.id = e.media_id
        WHERE m.title = ?
        GROUP BY m.id
    ''', (title,))
    
    row = c.fetchone()
    if row:
        media_id, title, thumbnail, names, links = row
        names_list = names.split(',') if names else []
        links_list = links.split(',') if links else []
        episodes = [{'name': n, 'link': l} for n, l in zip(names_list, links_list)]
        media = {
            'id': media_id,
            'title': title,
            'thumbnail': thumbnail,
            'episodes': episodes
        }
    else:
        media = None
    
    conn.close()
    return media


app = Flask(__name__)

ITEMS_PER_PAGE = 15

@app.route('/')
def index():
    videos = get_all_media()
    initial_videos = videos[:ITEMS_PER_PAGE]
    return render_template('index.html', videos=initial_videos, total_count=len(videos))

@app.route('/api/load_more')
def load_more():
    page = int(request.args.get('page', 1))
    videos = get_all_media()
    start_idx = page * ITEMS_PER_PAGE
    end_idx = start_idx + ITEMS_PER_PAGE
    next_batch = videos[start_idx:end_idx]
    
    return jsonify({
        'videos': next_batch,
        'hasMore': end_idx < len(videos)
    })

@app.route('/submit_request', methods=['POST'])
def handle_request():
    data = {
        'name': request.form['name'],
        'email': request.form['email'],
        'request': request.form['request']
    }
    
    try:
        content_message = (
            f"New File Request Submission:\n"
            f"Name: {data.get('name')}\n"
            f"Email: {data.get('email')}\n"
            f"Request: {data.get('request')}"
        )
        webhook_data = {"content": content_message}
        request_webhook_url = "https://discord.com/api/webhooks/1343568799609126995/no4HyubgIZCV39RJUf0dgApW6reAyLYaTXzy6gqhQX98iRha-RpFaNT93u3KIsskG_hN"
        webhook_response = requests.post(request_webhook_url, json=webhook_data)
        
        if webhook_response.status_code not in (200, 204):
            return {'success': False, 'error': f"Discord webhook error: {webhook_response.status_code}"}
        
        return {'success': True}
    except Exception as e:
        return {'success': False, 'error': str(e)}

@app.route('/report_broken_link', methods=['POST'])
def report_broken_link():
    try:
        report_data = request.json
        content_message = (
            f"Broken Link Report:\n"
            f"Title: {report_data.get('title')}\n"
            f"Links: {report_data.get('links')}\n"
            f"Reported at: {report_data.get('reported_at')}"
        )
        data = {"content": content_message}
        webhook_url = "https://discord.com/api/webhooks/1343567431020318812/bynzDGqLAm0Q9JyanSZdKFeVVnx7lUopaTFhAH_4RcH6a6dySLlhdoM6dRssBZTqRynP"
        
        response = requests.post(webhook_url, json=data)
        
        if response.status_code in (200, 204):
            return {'success': True}
        else:
            return {'success': False, 'error': f"Discord webhook error: {response.status_code}"}
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
    init_db()
    app.run(debug=True, port=5000, host='0.0.0.0')
