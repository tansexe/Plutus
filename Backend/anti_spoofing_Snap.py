import cv2
import numpy as np
import base64
import mediapipe as mp

# Initialize MediaPipe Face Mesh
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)

# Landmark Indexes
NOSE_TIP = 1
EYEBROW_LEFT = 52  # Top of left eyebrow
EYEBROW_RIGHT = 282  # Top of right eyebrow
FOREHEAD_TOP = 10
CHIN = 152

# Liveness Challenges
CHALLENGES = ["Move head LEFT", "Move head RIGHT", "Raise eyebrows"]
TIME_LIMIT = 5  # Time limit per challenge in seconds

def process_frame(frame):
    """Convert base64 frame to OpenCV image."""
    try:
        _, encoded_img = frame.split(',', 1)
        img_bytes = base64.b64decode(encoded_img)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img if img is not None else "error"
    except Exception as e:
        print(f"Error processing frame: {e}")
        return "error"
def is_front_facing(landmarks, frame_width):
    """Check if face is front-facing."""
    left_eye_x = landmarks[33].x * frame_width  
    right_eye_x = landmarks[263].x * frame_width  
    nose_x = landmarks[1].x * frame_width  
    eye_center = (left_eye_x + right_eye_x) / 2
    return abs(eye_center - nose_x) < (frame_width * 0.03)

def calculate_sharpness(image):
    """Calculate the sharpness of the image using Laplacian variance."""
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    return laplacian_var

def enhance_image(image):
    """Enhance the image using CLAHE on the LAB color space."""
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    limg = cv2.merge((cl, a, b))
    enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    return enhanced

def check_challenge(frame, challenge, state):
    """Check if the current challenge is completed and return success status and landmarks."""
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(frame_rgb)
    if not results.multi_face_landmarks:
        return False, None
    
    face_landmarks = results.multi_face_landmarks[0]
    h, w, _ = frame.shape
    landmarks = face_landmarks.landmark  # MediaPipe landmarks with normalized coordinates
    
    # Initialize positions if not set
    if state["initial_positions"] is None:
        if challenge in ["Move head LEFT", "Move head RIGHT"]:
            state["initial_positions"] = {"nose_x": landmarks[NOSE_TIP].x * w}
        elif challenge == "Raise eyebrows":
            eyebrow_left_y = landmarks[EYEBROW_LEFT].y * h
            eyebrow_right_y = landmarks[EYEBROW_RIGHT].y * h
            state["initial_positions"] = {"eyebrow_y": (eyebrow_left_y + eyebrow_right_y) / 2}
        return False, landmarks  # First frame, not completed yet
    
    # Calculate thresholds
    face_width = abs(landmarks[127].x * w - landmarks[356].x * w)
    face_height = abs(landmarks[FOREHEAD_TOP].y * h - landmarks[CHIN].y * h)
    
    if challenge == "Move head LEFT":
        current_nose_x = landmarks[NOSE_TIP].x * w
        initial_nose_x = state["initial_positions"]["nose_x"]
        threshold = face_width * 0.15
        return current_nose_x < initial_nose_x - threshold, landmarks
    elif challenge == "Move head RIGHT":
        current_nose_x = landmarks[NOSE_TIP].x * w
        initial_nose_x = state["initial_positions"]["nose_x"]
        threshold = face_width * 0.15
        return current_nose_x > initial_nose_x + threshold, landmarks
    elif challenge == "Raise eyebrows":
        current_eyebrow_left_y = landmarks[EYEBROW_LEFT].y * h
        current_eyebrow_right_y = landmarks[EYEBROW_RIGHT].y * h
        current_eyebrow_y = (current_eyebrow_left_y + current_eyebrow_right_y) / 2
        initial_eyebrow_y = state["initial_positions"]["eyebrow_y"]
        threshold = face_height * 0.05
        return current_eyebrow_y < initial_eyebrow_y - threshold, landmarks
    return False, landmarks