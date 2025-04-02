from flask import Flask, request,jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import json
import time
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage
from anti_spoofing_Snap import CHALLENGES, TIME_LIMIT, process_frame, check_challenge, calculate_sharpness, enhance_image, is_front_facing
from face_auth import check_face
from encoderGen import encode_and_store_images
from dotenv import load_dotenv
from firebase import firebase_config

load_dotenv()

app = Flask(__name__)
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")

cred = credentials.Certificate(firebase_config)  # Update with your Firebase credentials path
firebase_admin.initialize_app(cred, {
    'storageBucket': os.getenv("STORAGE_BUCKET")  # Update with your Firebase project details
})
db = firestore.client()
bucket = storage.bucket()

# Store client states
client_states = {}

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    if sid in client_states:
        del client_states[sid]
    print('Client disconnected')

@socketio.on("stop_streaming")
def handle_stop_streaming():
    sid = request.sid
    if sid in client_states:
        del client_states[sid]

@socketio.on("message")
def handle_message(data):
    sid = request.sid
    # print(f"Received message from sid: {sid}")
    
    if sid not in client_states:
        # print(f"Initializing state for sid: {sid}")
        client_states[sid] = {
            "current_challenge_index": 0,
            "challenges": CHALLENGES,
            "start_time": time.time(),
            "initial_positions": None,
            "best_sharpness": 0,
            "best_image": None
        }
        if len(CHALLENGES) > 0:
            emit("challenge", {"message": CHALLENGES[0]}, room=sid)
        else:
            # print("No challenges available.")
            emit("message", "Not_authenticated", room=sid)
            return
    
    try:
        data = json.loads(data)
        # print(data)
        frame = process_frame(data["frame"])
        card_number = data['cardNumber']
        # print(card_number)
        
        if isinstance(frame, str) and frame == "error":
            emit("message", "Not_authenticated", room=sid)
            return
        
        # print(f"Accessing state for sid: {sid}")
        state = client_states[sid]
        current_challenge = state["challenges"][state["current_challenge_index"]]
        
        if time.time() - state["start_time"] > TIME_LIMIT:
            emit("challenge_result", {"challenge": current_challenge, "result": "failed"}, room=sid)
            emit("message", "Not_authenticated", room=sid)
            # print(f"Deleting state for sid: {sid} due to timeout")
            del client_states[sid]
            return
        
        success, landmarks = check_challenge(frame, current_challenge, state)
        if success:
            emit("challenge_result", {"challenge": current_challenge, "result": "passed"}, room=sid)
            if landmarks and is_front_facing(landmarks, frame.shape[1]):
                sharpness = calculate_sharpness(frame)
                if sharpness > state["best_sharpness"]:
                    state["best_sharpness"] = sharpness
                    state["best_image"] = frame

            state["current_challenge_index"] += 1
            if state["current_challenge_index"] < len(state["challenges"]):
                next_challenge = state["challenges"][state["current_challenge_index"]]
                state["start_time"] = time.time()
                state["initial_positions"] = None
                emit("challenge", {"message": next_challenge}, room=sid)
            else:
                if state["best_image"] is not None:
                    best_image = enhance_image(state["best_image"])
                    res = check_face(best_image, card_number,db,bucket)
                    state["current_challenge_index"] = 0
                    if res:
                        # print(f"This is res {res}")
                        # print(f"this is sid {sid}")
                        emit("message", "authenticated", room=sid)
                        del client_states[sid]
                    else:
                        emit("message", "Not_authenticated", room=sid)
                else:
                    print("⚠ Liveness verification completed, but no suitable image was saved.")
    except Exception as e:
        print(f"Error in message handling: {type(e).__name__}: {e}")

@app.route("/")
def index():
    return jsonify("Hello, World!")

@app.route('/encode', methods=['POST'])
def encode():
    try:
        # Get the data from the frontend
        data = request.get_json()
        card_number = data.get('cardNo')
        image_url_list = data.get('imageUrlList')

        if not card_number or not image_url_list:
            return jsonify({"status": "failure", "message": "Missing cardNo or imageUrlList"}), 400

        res = encode_and_store_images(card_number, image_url_list, db, bucket)
        if res:
            return jsonify({"status": "success", "message": "Encoded successfully"})
        else:
            return jsonify({"status": "failure", "message": "Encoding failed"})
    except Exception as e:
        print(f"Error in encoding: {type(e).__name__}: {e}")
        return jsonify({"status": "failure", "message": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=6969, debug=True)