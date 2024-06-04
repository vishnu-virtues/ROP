from flask import Flask, json, send_from_directory, session, request, jsonify
from flask_cors import CORS
import os
import time
import requests
import sounddevice as sd
import soundfile as sf
from io import BytesIO
import base64

app = Flask(__name__, static_folder='static', template_folder='templates')
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'
CORS(app)

@app.route('/')
def main():
    return send_from_directory('templates', 'main.html')


@app.route('/start_recording', methods=['POST'])
def start_recording():
    session['recording_started'] = time.time()
    return 'Recording started', 200

@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    recording_started = session.pop('recording_started', None)
    if recording_started is None:
        return 'Recording not started', 400
    
    recording_duration = time.time() - recording_started
    duration = int(recording_duration) + 1
    fs = 44100  # Sample rate
    seconds = duration  # Duration of recording
    myrecording = sd.rec(int(seconds * fs), samplerate=fs, channels=2)
    sd.wait()  # Wait until recording is finished

    # Convert the NumPy array to bytes
    audio_bytes = BytesIO()
    sf.write(audio_bytes, myrecording, fs, format='wav')
    audio_bytes.seek(0)

    # Create a data URI for the audio content
    audio_data_uri = "data:audio/wav;base64," + base64.b64encode(audio_bytes.read()).decode()

    return jsonify({"message": "Recording stopped", "audio_data_uri": audio_data_uri})

@app.route('/transcribe_audio', methods=['POST'])
def transcribe_audio():
    # Get the input from the request
    input_data = request.get_json()

    # Check if the required input is provided and has the correct data type
    if 'audioFile' not in input_data or not isinstance(input_data['audioFile'], str):
        return jsonify({'error': 'Missing or invalid audioFile input'}), 400

    # Dummy response for API - 1
    response = {
    "rawTranscription": "Good afternoon doctor. Good afternoon Mr. Boss. How are you doing? I'm doing good doctor but my daughter isn't doing well. Everywhere people are getting affected with COVID and I'm really worried about her. Please have a seat and tell me what happened. Last week my daughter came back from California as her college was closed on account of COVID. From the second day she has had high fever and has been coughing badly. I think that she has contracted the virus on her way home. Okay I understand your concern. Having a fever and cough doesn't necessarily mean someone has contracted the virus. These are symptoms common cold too. The change in the temperature of the atmosphere could have triggered these symptoms. Still to put your worries to rest I'm prescribing some medicines and an RTPCR test to the test by tomorrow and if the test results are positive make sure she is isolated. Another hand if the results are negative just give her that medicine and ask her to drink a lot of water. Also bring her in so I could examine her. Okay doctor I will bring her in the evening. Thank you. Welcome.",
    "speakerTranscription": [
        "Patient/Attendee :  Good afternoon doc.",
        "Provider : Good afternoon Mr. Boss. How are you doing?",
        "Patient/Attendee :  I'm doing good doctor, but my daughter isn't doing well. Everywhere people are getting affected with COVID and I'm really worried about her.",
        "Provider :  Please have a seat.",
        "Provider :  then tell me what happened.",
        "Patient/Attendee :  Last week, my daughter came back from California as her college was closed on account of COVID. From the second day, she has had high fever and has been coughing badly. I think that she has contracted the virus on her way home.",
        "Provider :  Okay, I understand your concern. Having a fever and cough doesn't necessarily mean someone has contracted the virus. These are the symptoms common cold too.",
        "Provider :  The change in the temperature of the atmosphere could have triggered these symptoms. Still, to put your worries to rest, I am prescribing some medicines and an RTPCR test to the test by tomorrow and if the test results are positive, make sure she is isolated. On the other hand, if the results are negative, just give her that medicine and ask her to drink a lot of water. Also bring her in so I could examine her.",
        "Patient/Attendee :  Okay doctor, I will bring her in the evening. Thank you. Welcome."
    ],
    "clinicalSummary": {
        "chiefComplaint": "Daughter's high fever and severe cough after returning from California",
        "medicalHistory": "N/A",
        "socialHistory": "N/A",
        "familyHistory": "N/A",
        "medications": "N/A",
        "reviewOfSystems": "N/A",
        "vitals": "Fever, cough",
        "physicalExam": "N/A",
        "results": "Pending RTPCR test",
        "assessment": "Possible COVID-19 or common cold",
        "plan": "Prescribe medications, RTPCR test, isolate if positive, continue care if negative"
    },
    "context": "The patient's daughter has been experiencing high fever and severe cough since returning from California. The patient is concerned that she may have contracted COVID-19 during her travels. The doctor has prescribed medications and an RTPCR test for the daughter, and if the test results are positive, she should be isolated. If the test results are negative, the daughter should take the prescribed medication and drink plenty of water. The doctor will examine the daughter in the evening.",
    "icdCodes": [
        "J069 Acute upper respiratory infection, unspecified"
    ]
}

    return jsonify(response)

    
@app.route('/matching',methods=['POST'])
def get_json_data1():
   # Get the input from the request
    input_data = request.get_json()

    # Check if the required inputs are provided and have the correct data types
    if 'speakerTranscription' not in input_data or not isinstance(input_data['speakerTranscription'], list):
        return jsonify({'error': 'Missing or invalid speakerTranscription input'}), 400
    if 'sentence' not in input_data or not isinstance(input_data['sentence'], str):
        return jsonify({'error': 'Missing or invalid sentence input'}), 400

    # Dummy response for API - 4
    response = {
        0: [[1, 2], [5, 6]],
        1: [[3, 4], [7, 8]],
        2: [[9, 10], [15, 18]]
    }
    return jsonify(response)

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory('static', filename)


if __name__ == '__main__':
    app.run(debug=True)
