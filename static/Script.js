 // Function to call the API and highlight the sentence
 function callAPI(sentence, speakerSeparation) {
    // Prepare payload
    const payload = {
        "sentence": sentence,
        "speakerTranscription": speakerSeparation
    };

    // Make a POST request to the backend API
    fetch('/matching', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Handle response from API
            console.log('API Response:', data);

            // Iterate over each speaker separation index
            Object.keys(data).forEach(speakerIndex => {
                const highlights = data[speakerIndex];

                // Get the current speaker's transcription
                const speakerTranscriptionDiv = document.getElementById('speakerTranscription');
                const transcriptionElement = speakerTranscriptionDiv.children[speakerIndex];

                // Get the current speaker's transcription text content
                let transcriptionText = transcriptionElement.textContent;

                // Create a new string to hold the highlighted transcription
                let highlightedTranscription = '';

                let currentIndex = 0;

                // Apply highlighting to the relevant parts of the transcription
                highlights.forEach(highlight => {
                    const startIndex = highlight[0];
                    const endIndex = highlight[1];

                    // Append the text before the highlight
                    highlightedTranscription += transcriptionText.substring(currentIndex, startIndex);

                    // Append the highlighted text
                    highlightedTranscription += '<span style="background-color: yellow;">' +
                        transcriptionText.substring(startIndex, endIndex + 1) + '</span>';

                    // Update the current index
                    currentIndex = endIndex + 1;
                });

                // Append any remaining text after the last highlight
                highlightedTranscription += transcriptionText.substring(currentIndex);

                // Update the speaker's transcription with the highlighted version
                transcriptionElement.innerHTML = highlightedTranscription;
            });

            // Add event listener to remove highlighting when the mouse moves away from the transcription area
            const speakerTranscriptionDiv = document.getElementById('speakerTranscription');
            speakerTranscriptionDiv.addEventListener('mousemove', function (event) {
                const target = event.target;
                if (!target.closest('span')) { // If the mouse is not over a highlighted area
                    // Restore the default transcription for all speaker elements
                    Object.keys(data).forEach(speakerIndex => {
                        const transcriptionElement = speakerTranscriptionDiv.children[speakerIndex];
                        transcriptionElement.innerHTML = transcriptionElement.textContent;
                    });
                }
            });
        })
        .catch(error => {
            console.error('Error sending data to API:', error);
        });
}


$(document).ready(function () {
    var isAudioRecorded = false; // Flag to track if audio is recorded
    var isRecordingInProgress = false; // Flag to track if recording is in progress
    var isTranscriptionDone = false; // Flag to track if transcription is done for the current recording session

    $('#startBtn').click(function () {
        $.post('/start_recording', function (data) {
            showMessage(data);
            isAudioRecorded = true; // Set flag to true after successful recording
            isTranscriptionDone = false; // Reset transcription flag for new recording session
            $('#transcribeBtn').prop('disabled', false); // Enable transcription button
        });
    });

    $('#stopBtn').click(function () {
        if (isRecordingInProgress) {
            // Prevent multiple clicks until the recording process is complete
            return;
        }
        isRecordingInProgress = true; // Set flag to indicate recording is in progress
        $.post('/stop_recording', function (data) {
            showMessage(data.message);
            if (data.audio_data_uri) {
                $('#audioPlayer source').attr('src', data.audio_data_uri);
                $('#audioPlayer')[0].load();
                $('#audioPlayer')[0].play();
                $('#audioPlayer').show();

                var downloadBtn = $('<button>')
                .addClass('button')
                .text('Download Audio')
                .click(function () {
                    var link = document.createElement('a');
                    link.href = data.audio_data_uri;
                    link.download = 'recorded_audio.wav';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                });
            $('.button-container').append(downloadBtn);
            }
            isRecordingInProgress = false; // Reset flag after recording process is complete
        });
    });

    $('#transcribeBtn').click(function () {
        if (!isAudioRecorded) {
            showMessage("Please record audio first.");
            return;
        }
        if (isTranscriptionDone) {
            showMessage("Transcription already done for this recording.");
            return;
        }
        var audioFileURI = $('#audioPlayer source').attr('src');
        $.ajax({
            url: '/transcribe_audio',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 'audioFile': audioFileURI }),
            success: function (data) {
                const speakerTranscription = data.speakerTranscription;
                const speakerTranscriptionDiv = document.getElementById('speakerTranscription');
                speakerTranscription.forEach((transcription, index) => {
                    const p = document.createElement('p');
                    p.textContent = transcription;
                    speakerTranscriptionDiv.appendChild(p);
                });
                document.getElementById('json-display').innerHTML = generateHTML(data);

                // Mouseover event handling
                document.querySelectorAll('.hoverable').forEach(span => {
                    span.addEventListener('mouseover', function () {
                        console.log("Mouse over: " + this.textContent);
                        this.style.color = 'red'; // Change text color to red on hover
                        const index = $(this).index('.hoverable');
                        callAPI(this.textContent, data.speakerTranscription, index);
                    });

                    span.addEventListener('mouseout', function () {
                        this.style.color = 'black'; // Revert text color on mouse out
                    });
                });

                isTranscriptionDone = true; // Set transcription flag after transcription is done
            },
            error: function (xhr, status, error) {
                console.error(xhr.responseText);
                $('#messageArea').text("Error occurred during transcription.");
            }
        });
    });

    function showMessage(message) {
        $('#messageArea').text(message);
    }

    $(document).ready(function(){
        // Event listener for the redirect button
        $('#redirectBtn').click(function(){
            window.location.href = 'https://openemr.rap-ai.com/';
        })
    })
    // Function to show the button dynamically
    function showEMSbtn(){
        $('.button-right-corner').show();
    }

    // Function to generate HTML from JSON data
    function generateHTML(jsonData) {
        let html = '<ul>';
        for (const key in jsonData) {
            if (key === 'clinicalSummary') {
                html += `<li><strong>${key}</strong>: `;
                if (typeof jsonData[key] === 'object') {
                    html += '<ul>';
                    for (const subKey in jsonData[key]) {
                        html += `<li><strong>${subKey}</strong>:<span class="hoverable">${jsonData[key][subKey]}</span></li>`;
                    }
                    html += '</ul>';
                }
                else {
                    html += `${jsonData[key]}</li>`;
                }
            }
        }
        html += '</ul>';
        for (const key in jsonData) {
            if (key === 'icdCodes') {
                html += `<li><strong>${key}</strong>: `;
                if (typeof jsonData[key] === 'object') {
                    html += '<ul>';
                    for (const subKey in jsonData[key]) {
                        html += `<li> ${jsonData[key][subKey]}</li>`;
                    }
                    html += '</ul>';
                }
                else {
                    html += `${jsonData[key]}</li>`;
                }
            }
        }
        html += '</ul>';
        showEMSbtn();
        return html;
    }
});
