let editMode = false;
let availableVoices = [];

// Load available TTS voices
function loadVoices() {
  if (!window.speechSynthesis) return;
  
  availableVoices = window.speechSynthesis.getVoices();
  
  const voiceSelect = document.getElementById('ttsVoice');
  if (voiceSelect) {
    voiceSelect.innerHTML = '<option value="">Default Voice</option>' +
      availableVoices.map(voice => 
        `<option value="${voice.name}">${voice.name} (${voice.lang})</option>`
      ).join('');
  }
}

// Load voices when they're ready
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function enableEditMode() {
  const userId = localStorage.getItem('userId');
  if (!userId || !stationData || parseInt(userId) !== stationData.user_id) {
    alert('You do not have permission to edit this station');
    return;
  }

  editMode = true;
  document.getElementById('builderControls').style.display = 'block';
  document.getElementById('editBtn').style.display = 'none';
  updateSegmentUIWithEdit();
}

function updateSegmentUIWithEdit() {
  const listEl = document.getElementById('segmentList');
  if (!listEl || !editMode) return;

  listEl.innerHTML = segments.map((segment, index) => {
    const config = segment.config;
    
    let title = '';
    let details = '';
    
    switch (segment.type) {
      case 'track':
        title = config.title || config.youtubeId;
        details = `${config.fadeIn}s fade-in, ${config.fadeOut}s fade-out`;
        break;
      case 'tts':
        title = config.text.substring(0, 50) + (config.text.length > 50 ? '...' : '');
        details = config.dipMusic ? `Music dip to ${config.dipVolume}%` : 'No music dip';
        break;
      case 'volume_dip':
        title = 'Volume Dip';
        details = `${config.volume}% for ${config.duration}s`;
        break;
    }

    return `
      <div class="segment-item ${segment.type}" id="segment-${segment.id}">
        <div class="segment-type">${segment.type}</div>
        <div class="segment-title">${title}</div>
        <div class="segment-details">${details}</div>
        <div class="segment-actions">
          ${index > 0 ? `<button onclick="moveSegmentUp(${segment.id}, ${index})">↑</button>` : ''}
          ${index < segments.length - 1 ? `<button onclick="moveSegmentDown(${segment.id}, ${index})">↓</button>` : ''}
          <button class="secondary" onclick="deleteSegment(${segment.id})">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

function showAddTrackForm() {
  document.getElementById('addTrackModal').classList.add('active');
  document.getElementById('addTrackError').textContent = '';
}

function showAddTTSForm() {
  loadVoices(); // Ensure voices are loaded
  document.getElementById('addTTSModal').classList.add('active');
  document.getElementById('addTTSError').textContent = '';
}

function showAddDipForm() {
  document.getElementById('addDipModal').classList.add('active');
  document.getElementById('addDipError').textContent = '';
}

async function addTrack() {
  const youtubeId = document.getElementById('trackYoutubeId').value.trim();
  const title = document.getElementById('trackTitle').value.trim();
  const startTime = parseFloat(document.getElementById('trackStartTime').value) || 0;
  const endTime = parseFloat(document.getElementById('trackEndTime').value) || 0;
  const fadeIn = parseFloat(document.getElementById('trackFadeIn').value) || 0;
  const fadeOut = parseFloat(document.getElementById('trackFadeOut').value) || 2;
  const errorEl = document.getElementById('addTrackError');

  if (!youtubeId) {
    errorEl.textContent = 'YouTube URL or ID is required';
    return;
  }

  try {
    const config = {
      youtubeId,
      title: title || youtubeId,
      startTime,
      endTime,
      fadeIn,
      fadeOut
    };

    const segment = await broadcastsAPI.addSegment(stationData.id, 'track', config);
    segments.push(segment);
    
    closeModal('addTrackModal');
    document.getElementById('trackYoutubeId').value = '';
    document.getElementById('trackTitle').value = '';
    document.getElementById('trackStartTime').value = '0';
    document.getElementById('trackEndTime').value = '0';
    document.getElementById('trackFadeIn').value = '0';
    document.getElementById('trackFadeOut').value = '2';
    
    updateSegmentUIWithEdit();
  } catch (error) {
    errorEl.textContent = error.message || 'Failed to add track';
  }
}

async function addTTS() {
  const text = document.getElementById('ttsText').value.trim();
  const voice = document.getElementById('ttsVoice').value;
  const dipMusic = document.getElementById('ttsDipMusic').checked;
  const dipVolume = parseInt(document.getElementById('ttsDipVolume').value) || 20;
  const errorEl = document.getElementById('addTTSError');

  if (!text) {
    errorEl.textContent = 'Text is required';
    return;
  }

  try {
    const config = {
      text,
      voice,
      dipMusic,
      dipVolume
    };

    const segment = await broadcastsAPI.addSegment(stationData.id, 'tts', config);
    segments.push(segment);
    
    closeModal('addTTSModal');
    document.getElementById('ttsText').value = '';
    document.getElementById('ttsVoice').value = '';
    document.getElementById('ttsDipMusic').checked = true;
    document.getElementById('ttsDipVolume').value = '20';
    
    updateSegmentUIWithEdit();
  } catch (error) {
    errorEl.textContent = error.message || 'Failed to add TTS';
  }
}

async function addVolumeDip() {
  const volume = parseInt(document.getElementById('dipVolume').value);
  const duration = parseFloat(document.getElementById('dipDuration').value);
  const errorEl = document.getElementById('addDipError');

  if (volume === undefined || duration === undefined) {
    errorEl.textContent = 'Volume and duration are required';
    return;
  }

  try {
    const config = {
      volume,
      duration
    };

    const segment = await broadcastsAPI.addSegment(stationData.id, 'volume_dip', config);
    segments.push(segment);
    
    closeModal('addDipModal');
    document.getElementById('dipVolume').value = '30';
    document.getElementById('dipDuration').value = '5';
    
    updateSegmentUIWithEdit();
  } catch (error) {
    errorEl.textContent = error.message || 'Failed to add volume dip';
  }
}

async function deleteSegment(segmentId) {
  if (!confirm('Are you sure you want to delete this segment?')) {
    return;
  }

  try {
    await broadcastsAPI.deleteSegment(stationData.id, segmentId);
    segments = segments.filter(s => s.id !== segmentId);
    updateSegmentUIWithEdit();
  } catch (error) {
    alert('Failed to delete segment: ' + error.message);
  }
}

async function moveSegmentUp(segmentId, currentIndex) {
  if (currentIndex === 0) return;

  const newSegments = [...segments];
  [newSegments[currentIndex], newSegments[currentIndex - 1]] = 
    [newSegments[currentIndex - 1], newSegments[currentIndex]];

  try {
    await broadcastsAPI.reorderSegments(
      stationData.id,
      newSegments.map(s => s.id)
    );
    segments = newSegments;
    updateSegmentUIWithEdit();
  } catch (error) {
    alert('Failed to reorder segments: ' + error.message);
  }
}

async function moveSegmentDown(segmentId, currentIndex) {
  if (currentIndex === segments.length - 1) return;

  const newSegments = [...segments];
  [newSegments[currentIndex], newSegments[currentIndex + 1]] = 
    [newSegments[currentIndex + 1], newSegments[currentIndex]];

  try {
    await broadcastsAPI.reorderSegments(
      stationData.id,
      newSegments.map(s => s.id)
    );
    segments = newSegments;
    updateSegmentUIWithEdit();
  } catch (error) {
    alert('Failed to reorder segments: ' + error.message);
  }
}
