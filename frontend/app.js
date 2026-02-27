const { createApp, ref, onMounted } = Vue;

const app = createApp({
    setup() {
        const agentStatus = ref('idle'); // idle, listening, processing
        const agentStatusText = ref('System Idle');
        const isRecording = ref(false);
        const recordingText = ref('Tap to speak');
        const transcript = ref('');
        const contextFacts = ref([]);
        const tasks = ref([]);
        const activityLogs = ref([]);

        let mediaRecorder = null;
        let audioChunks = [];

        const addLog = (message, type = 'info') => {
            const now = new Date();
            const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            activityLogs.value.unshift({ time: timeString, message, type });
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

                mediaRecorder.start();
                isRecording.value = true;
                agentStatus.value = 'listening';
                agentStatusText.value = 'Listening...';
                recordingText.value = 'Recording... tap to stop';
                addLog('Microphone started.', 'system');
            } catch (err) {
                console.error("Error accessing microphone:", err);
                addLog('Microphone access denied or error.', 'error');
                alert('Please allow microphone access to use the voice features.');
            }
        };

        const stopRecording = () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                isRecording.value = false;
                agentStatus.value = 'processing';
                agentStatusText.value = 'Agent Reasoning...';
                recordingText.value = 'Processing audio...';
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                addLog('Audio capture stopped. Sending to agent...', 'system');
            }
        };

        const toggleRecording = () => {
            if (isRecording.value) {
                stopRecording();
            } else {
                startRecording();
            }
        };

        const BACKEND_URL = 'https://lifeops-backend.onrender.com'; // Change this if Render URL is different

        const processAudio = async (audioBlob) => {
            addLog('Uploading audio to orchestration service...', 'system');

            try {
                // 1. Transcribe (Mock API Call for now, would be formData in prod)
                addLog('Transcribing audio via Modulate API (simulated latency for hackathon)...', 'system');
                let transcribedText = "I moved here three months ago and just started working a new job in California. I don't know what forms I need.";

                // Example of how the real call would look:
                // const formData = new FormData();
                // formData.append('file', audioBlob, 'real_audio.webm');
                // const transcribeRes = await fetch(`${BACKEND_URL}/transcribe`, { method: 'POST', body: formData });
                // const transcribeData = await transcribeRes.json();
                // transcribedText = transcribeData.text;

                transcript.value = transcribedText;
                addLog(`Transcribed: "${transcribedText}"`, 'agent');

                // 2. Process via Agent (Real API Call pointing to our FastAPI)
                addLog('Sending text to Yutori LLM Agent for reasoning...', 'system');
                try {
                    // We attempt to hit the backend. If it's down (like during dev without python), we fallback.
                    const agentRes = await fetch(`${BACKEND_URL}/agent/process?text=${encodeURIComponent(transcribedText)}`, {
                        method: 'POST',
                        headers: { 'Accept': 'application/json' }
                    });

                    if (!agentRes.ok) throw new Error("Backend not reachable");

                    const agentData = await agentRes.json();

                    addLog('Graph Updated: User context persistent.', 'system');
                    contextFacts.value = agentData.context_facts;

                    agentStatusText.value = 'Inferring Tasks...';

                    // Add reasoning logs based on tasks
                    agentData.inferred_tasks.forEach(t => {
                        addLog(`Reasoning inferred task: ${t.title}`, 'agent');
                    });

                    tasks.value = agentData.inferred_tasks;

                } catch (apiError) {
                    addLog('Backend API unreachable. Falling back to frontend mock...', 'warning');
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
                agentStatusText.value = 'System Idle';
                recordingText.value = 'Tap to speak again';
                addLog('Autonomy Cycle Complete. Awaiting execution triggers.', 'system');

            } catch (err) {
                console.error(err);
                addLog('Error processing pipeline.', 'error');
                agentStatus.value = 'idle';
                agentStatusText.value = 'System Idle';
                recordingText.value = 'Tap to speak again';
            }
        };

        onMounted(() => {
            addLog('LifeOps Agent initialized.', 'system');
            addLog('Awaiting voice input...', 'system');
        });

        return {
            agentStatus, agentStatusText,
            isRecording, recordingText, transcript,
            contextFacts, tasks, activityLogs,
            toggleRecording, getLogColor, getStatusBadgeClass
        };
    }
});

app.mount('#app');
