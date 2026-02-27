const { createApp, ref, onMounted } = Vue;

const app = createApp({
    setup() {
        const agentStatus = ref('idle'); // idle, listening, processing
        const agentStatusText = ref('Assistant Ready');
        const activeTab = ref('dashboard'); // dashboard, microphone, context, tasks, logs
        const isRecording = ref(false);
        const recordingText = ref('Tap to speak to your assistant');
        const transcript = ref('');
        const liveTranscript = ref(''); // Added for true live streaming
        const contextFacts = ref([]);
        const tasks = ref([]);
        const activityLogs = ref([]);

        let mediaRecorder = null;
        let audioChunks = [];
        let speechRecognition = null;

        const addLog = (message, type = 'info') => {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            activityLogs.value.unshift({ time: timeString, message, type });
        };

        const setActiveTab = (tabName) => {
            activeTab.value = tabName;
        };

        const getLogColor = (type) => {
            switch (type) {
                case 'system': return 'text-blue-600';
                case 'agent': return 'text-emerald-600';
                case 'warning': return 'text-amber-600';
                case 'error': return 'text-red-600';
                default: return 'text-slate-600';
            }
        };

        const getStatusBadgeClass = (status) => {
            switch (status) {
                case 'pending': return 'bg-amber-100 text-amber-700 border border-amber-200';
                case 'in_progress': return 'bg-blue-100 text-blue-700 border border-blue-200';
                case 'completed': return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
                default: return 'bg-slate-100 text-slate-600 border border-slate-200';
            }
        };

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                    await processAudio(audioBlob);
                };

                // Initialize Live Speech Recognition
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (SpeechRecognition) {
                    speechRecognition = new SpeechRecognition();
                    speechRecognition.continuous = true;
                    speechRecognition.interimResults = true;

                    speechRecognition.onresult = (event) => {
                        let final = '';
                        let interim = '';
                        for (let i = event.resultIndex; i < event.results.length; ++i) {
                            if (event.results[i].isFinal) {
                                final += event.results[i][0].transcript;
                            } else {
                                interim += event.results[i][0].transcript;
                            }
                        }
                        // Update the text box live!
                        liveTranscript.value = final + interim;
                        transcript.value = liveTranscript.value;
                    };
                    speechRecognition.start();
                }

                mediaRecorder.start();
                isRecording.value = true;
                agentStatus.value = 'listening';
                agentStatusText.value = 'Listening...';
                recordingText.value = 'Recording... tap to stop';
                liveTranscript.value = ''; // Reset UI
                transcript.value = '';
                addLog('Started listening securely.', 'system');
            } catch (err) {
                console.error("Error accessing microphone:", err);
                addLog('Microphone access denied. Please allow it to speak with the assistant.', 'error');
                alert('Please allow microphone access to use the voice features.');
            }
        };

        const stopRecording = () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();

                if (speechRecognition) {
                    speechRecognition.stop();
                }

                isRecording.value = false;
                agentStatus.value = 'processing';
                agentStatusText.value = 'Thinking...';
                recordingText.value = 'Calling your assistant...';
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                addLog('Audio captured. Sending to your assistant...', 'system');
            }
        };

        const toggleRecording = () => {
            if (isRecording.value) {
                stopRecording();
            } else {
                startRecording();
            }
        };

        const BACKEND_URL = 'https://lifeops-agent.onrender.com'; // Updated to actual Render URL

        const processAudio = async (audioBlob) => {
            addLog('Uploading your request securely...', 'system');

            try {
                // 1. Transcribe
                addLog('Converting audio to text...', 'system');
                let transcribedText = "";

                try {
                    const formData = new FormData();
                    formData.append('file', audioBlob, 'real_audio.webm');
                    const transcribeRes = await fetch(`${BACKEND_URL}/transcribe`, { method: 'POST', body: formData });

                    if (!transcribeRes.ok) throw new Error("Transcription failed");

                    const transcribeData = await transcribeRes.json();
                    transcribedText = transcribeData.text;
                } catch (e) {
                    addLog('Audio processing temporarily unavailable. Using demo text...', 'warning');
                    transcribedText = "I moved here three months ago and just started working a new job in California. I don't know what forms I need.";
                }

                transcript.value = transcribedText;
                addLog(`You said: "${transcribedText}"`, 'agent');

                // 2. Process via Agent (Real API Call pointing to our FastAPI)
                addLog('Understanding your unique situation...', 'system');
                try {
                    // We attempt to hit the backend. If it's down (like during dev without python), we fallback.
                    const agentRes = await fetch(`${BACKEND_URL}/agent/process?text=${encodeURIComponent(transcribedText)}`, {
                        method: 'POST',
                        headers: { 'Accept': 'application/json' }
                    });

                    if (!agentRes.ok) throw new Error("Backend not reachable");

                    const agentData = await agentRes.json();

                    addLog('Updated your personal profile safely.', 'system');
                    contextFacts.value = agentData.context_facts;

                    agentStatusText.value = 'Finding Action Items...';

                    // Add reasoning logs based on tasks
                    agentData.inferred_tasks.forEach(t => {
                        addLog(`Found recommended action: ${t.title}`, 'agent');
                    });

                    tasks.value = agentData.inferred_tasks;

                } catch (apiError) {
                    addLog('Service unreachable. Falling back to demo mode...', 'warning');
                    // Fallback Mock Extraction
                    contextFacts.value = [
                        { entity: 'Arrival', value: '3 months ago' },
                        { entity: 'Employment', value: 'Recently Employed' },
                        { entity: 'Location', value: 'California' }
                    ];

                    tasks.value = [
                        { id: 1, title: 'Check SSN Status', description: 'Agent will verify if an SSN has been issued for your work permit.', status: 'pending', action: 'Simulate Call' },
                        { id: 2, title: 'Draft W-4 Form', description: 'Agent will auto-fill your federal tax withholding form based on your profile.', status: 'pending', action: 'View Draft' },
                        { id: 3, title: 'State ID Appointment', description: 'California DMV appointment needed within 90 days.', status: 'pending', action: 'Schedule' }
                    ];
                }

                agentStatus.value = 'idle';
                agentStatusText.value = 'Assistant Ready';
                recordingText.value = 'Tap to speak again';
                addLog('Finished processing. Ready for your next request.', 'system');

            } catch (err) {
                console.error(err);
                addLog('Sorry, something went wrong processing your request.', 'error');
                agentStatus.value = 'idle';
                agentStatusText.value = 'Assistant Ready';
                recordingText.value = 'Tap to speak again';
            }
        };

        onMounted(() => {
            addLog('Your assistant is ready securely.', 'system');
            addLog('Waiting for you to speak...', 'system');
        });

        return {
            agentStatus, agentStatusText, activeTab,
            isRecording, recordingText, transcript, liveTranscript,
            contextFacts, tasks, activityLogs,
            toggleRecording, getLogColor, getStatusBadgeClass, setActiveTab
        };
    }
});

app.mount('#app');
