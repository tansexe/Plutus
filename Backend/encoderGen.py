import cv2
import face_recognition
import pickle
import urllib.request
import numpy as np
import io

def encode_and_store_images(account_number, image_url_list, db, bucket):
    try:
        if not image_url_list:
            print(f"No images provided for account number {account_number}")
            return False

        print(f"Processing {len(image_url_list)} images for account number {account_number}")

        # Download images from URLs and store in a list
        img_list = []
        for url in image_url_list:
            try:
                resp = urllib.request.urlopen(url)
                img_array = np.asarray(bytearray(resp.read()), dtype=np.uint8)
                img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
                if img is not None:
                    img_list.append(img)
                else:
                    print(f"Failed to download or decode image from {url}")
            except Exception as e:
                print(f"Error downloading image from {url}: {e}")

        if not img_list:
            print(f"No valid images found for account number {account_number}")
            return False

        print(f"Number of images downloaded: {len(img_list)}")

        # Encode the images
        def find_encoding(images_list):
            encode_list = []
            for img in images_list:
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                try:
                    encode = face_recognition.face_encodings(img)[0]
                    encode_list.append(encode)
                except IndexError:
                    print("No face found in one of the images, skipping that image.")
            return encode_list

        print("Encoding started...")
        encode_list_known = find_encoding(img_list)
        if not encode_list_known:
            print("No valid encodings found.")
            return False

        # Prepare the encoding data
        encode_list_known_with_ids = {
            'encodings': encode_list_known,
            'cardnumber': account_number
        }

        # Define the path to save the new encoded file
        encoded_file_path = f'encodings/{account_number}.p'
        blob = bucket.blob(encoded_file_path)

        # Save the encoding in an in-memory buffer
        pickle_data = io.BytesIO()
        pickle.dump(encode_list_known_with_ids, pickle_data)
        pickle_data.seek(0)  # Reset position to beginning

        # Upload to Firebase Storage (this will overwrite if file exists)
        blob.upload_from_file(pickle_data, content_type='application/octet-stream')
        print("Encoding uploaded to storage successfully.")

        # Update Firestore record (will create if doesn't exist)
        encoding_ref = db.collection('encoding').document(account_number)
        encoding_ref.set({
            'cardnumber': account_number,
            'encodingUrl': encoded_file_path
        }, merge=True)  # merge=True updates existing doc or creates new one

        print(f"Encoding {'updated' if encoding_ref.get().exists else 'created'} for account number {account_number}")
        return True

    except Exception as e:
        print(f"An error occurred: {e}")
        return False