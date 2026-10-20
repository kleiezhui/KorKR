from flask import Flask, request, jsonify, send_from_directory
import json
import os

app = Flask(__name__, static_folder='.')

USERS_FILE = 'users.json'

# Инициализация файла с пользователями, если его нет
def init_db():
    if not os.path.exists(USERS_FILE):
        users = {
            "admin": {"password": "Admin123", "role": "admin", "attempts": 0, "is_blocked": False},
            "user": {"password": "User123", "role": "user", "attempts": 0, "is_blocked": False}
        }
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users, f, ensure_ascii=False, indent=4)

def read_users():
    with open(USERS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def write_users(users):
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, ensure_ascii=False, indent=4)

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    captcha_solved = data.get('captcha_solved', False)

    users = read_users()

    if username not in users:
        return jsonify({"status": "error", "message": "Вы ввели неверный логин или пароль. Пожалуйста проверьте ещё раз введенные данные"}), 401

    user = users[username]

    if user['is_blocked']:
        return jsonify({"status": "blocked", "message": "Вы заблокированы. Обратитесь к администратору"}), 403

    # Проверка пароля и капчи
    if user['password'] != password or not captcha_solved:
        user['attempts'] += 1
        
        # Блокировка после 3 попыток
        if user['attempts'] >= 3:
            user['is_blocked'] = True
            write_users(users)
            return jsonify({"status": "blocked", "message": "Вы заблокированы. Обратитесь к администратору"}), 403
        
        write_users(users)
        return jsonify({
            "status": "error", 
            "message": f"Неверный логин, пароль или капча. Осталось попыток: {3 - user['attempts']}"
        }), 401

    # Успешный вход
    user['attempts'] = 0 # Сброс попыток
    write_users(users)
    return jsonify({"status": "success", "message": "Вы успешно авторизовались", "role": user['role']}), 200

# API для снятия блокировки (имитация панели администратора)
@app.route('/api/unblock', methods=['POST'])
def unblock_user():
    data = request.json
    target_user = data.get('target_user')
    users = read_users()
    if target_user in users:
        users[target_user]['is_blocked'] = False
        users[target_user]['attempts'] = 0
        write_users(users)
        return jsonify({"status": "success", "message": f"Пользователь {target_user} разблокирован"})
    return jsonify({"status": "error", "message": "Пользователь не найден"}), 404

if __name__ == '__main__':
    init_db()
    print("Сервер запущен. Откройте http://127.0.0.1:5000")
    app.run(debug=True)