import cv2
import pickle
import face_recognition
import numpy as np
import io


def check_face(frame, card_number, db, bucket):
    print(f"Checking face for card number: {card_number}")
    
    # Default account number if none provided
    if card_number is None:
        account_number = "22052756"
    else:
        account_number = str(card_number)

    # Define the path to the encoding file in Firebase Storage
    encoder_file_path = f'encodings/{account_number}.p'
    print(f"Looking for encoding file at: {encoder_file_path}")

    try:
        # Download the encoding file from Firebase Storage
        blob = bucket.blob(encoder_file_path)
        if not blob.exists():
            print(f"No encoder file found for account number {account_number} at {encoder_file_path}")
            return False

        # Download the file into memory
        pickle_data = io.BytesIO()
        blob.download_to_file(pickle_data)
        pickle_data.seek(0)

        # Load the encodings from the downloaded file
        print("Loading Encode File from Firebase Storage")
        encode_list_known_with_ids = pickle.load(pickle_data)
        encode_list_known, person_ids = encode_list_known_with_ids['encodings'], encode_list_known_with_ids['cardnumber']
        print('Encodings Loaded')

    except Exception as e:
        print(f"Error loading encoding file from Firebase Storage: {e}")
        return False

    # Process the input frame
    img = frame
    if img is None:
        print("Image not found.")
        return False

    # Resize and convert the image for processing
    imgS = cv2.resize(img, (0, 0), None, 0.25, 0.25)
    imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)

    # Detect faces in the current frame
    face_cur_frame = face_recognition.face_locations(imgS)
    if len(face_cur_frame) == 0:
        print("Face not visible")
        return False

    # Encode the faces in the current frame
    encode_cur_frame = face_recognition.face_encodings(imgS, face_cur_frame)
    for encode_face, face_loc in zip(encode_cur_frame, face_cur_frame):
        # Compare the current face encoding with the known encodings
        matches = face_recognition.compare_faces(encode_list_known, encode_face)
        face_dis = face_recognition.face_distance(encode_list_known, encode_face)
        print("Matches:", matches)
        print("Face Distance:", face_dis)

        # Find the best match
        match_index = np.argmin(face_dis)
        if matches[match_index]:
            print("Match Found")
            return True
        else:
            print("No Match Found")
            return False

    return False