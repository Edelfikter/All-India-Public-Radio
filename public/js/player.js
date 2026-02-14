let player;
let segments = [];
let currentSegmentIndex = 0;
let isPlaying = false;
let stationData = null;
let playerReady = false;
let fadeInterval = null;
let volumeBeforeDip = 100;

// YouTube IFrame API callback
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '360',
    width: '640',
    playerVars: {
      'playsinline': 1,
      'controls': 1,
      'rel': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady() {
  playerReady = true;
  console.log('YouTube player ready');
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.ENDED) {
    onTrackEnded();
  }
}

async function startPlayback() {
  if (!playerReady) {
    alert('Player not ready yet, please wait...');
    return;
  }

  if (segments.length === 0) {
    alert('No segments in broadcast timeline');
    return;
  }

  isPlaying = true;
  currentSegmentIndex = 0;
  document.getElementById('playBtn').style.display = 'none';
  document.getElementById('stopBtn').style.display = 'inline-block';
  document.getElementById('nowPlaying').style.display = 'block';

  playSegment(currentSegmentIndex);
}

function stopPlayback() {
  isPlaying = false;
  currentSegmentIndex = 0;
  
  if (player && player.stopVideo) {
    player.stopVideo();
  }
  
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }

  document.getElementById('playBtn').style.display = 'inline-block';
  document.getElementById('stopBtn').style.display = 'none';
  document.getElementById('nowPlaying').style.display = 'none';
  
  updateSegmentUI();
}

async function playSegment(index) {
  if (!isPlaying || index >= segments.length) {
    if (stationData && stationData.loop_broadcast && isPlaying) {
      currentSegmentIndex = 0;
      playSegment(0);
    } else {
      stopPlayback();
    }
    return;
  }

  const segment = segments[index];
  updateSegmentUI(index);

  switch (segment.type) {
    case 'track':
      await playTrack(segment);
      break;
    case 'tts':
      await playTTS(segment);
      break;
    case 'volume_dip':
      await playVolumeDip(segment);
      break;
  }
}

async function playTrack(segment) {
  const config = segment.config;
  
  // Extract video ID from URL if needed
  let videoId = config.youtubeId;
  if (videoId.includes('youtube.com') || videoId.includes('youtu.be')) {
    const match = videoId.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    if (match) videoId = match[1];
  }

  document.getElementById('nowPlayingInfo').innerHTML = `
    <strong>🎵 ${config.title || videoId}</strong>
  `;

  player.loadVideoById({
    videoId: videoId,
    startSeconds: config.startTime || 0,
    endSeconds: config.endTime || undefined
  });

  // Apply fade-in
  if (config.fadeIn > 0) {
    player.setVolume(0);
    await fadeVolume(0, 100, config.fadeIn * 1000);
  } else {
    player.setVolume(100);
  }

  // Wait for track to play
  await waitForTrack(segment);
}

async function waitForTrack(segment) {
  const config = segment.config;
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (!isPlaying) {
        clearInterval(checkInterval);
        resolve();
        return;
      }

      const currentTime = player.getCurrentTime();
      const duration = player.getDuration();
      const endTime = config.endTime || duration;
      const fadeOutStart = endTime - (config.fadeOut || 2);

      // Check if we need to start fade-out
      if (currentTime >= fadeOutStart && currentTime < endTime) {
        if (!fadeInterval) {
          fadeVolume(100, 0, (config.fadeOut || 2) * 1000).then(() => {
            clearInterval(checkInterval);
            moveToNextSegment();
            resolve();
          });
        }
      }

      // Check if track ended
      if (currentTime >= endTime || player.getPlayerState() === YT.PlayerState.ENDED) {
        clearInterval(checkInterval);
        moveToNextSegment();
        resolve();
      }
    }, 100);
  });
}

async function playTTS(segment) {
  const config = segment.config;
  
  document.getElementById('nowPlayingInfo').innerHTML = `
    <strong>📢 Announcement</strong><br>
    ${config.text.length > 100 ? config.text.substring(0, 100) + '...' : config.text}
  `;

  // Dip music if needed
  if (config.dipMusic && player && player.getPlayerState() === YT.PlayerState.PLAYING) {
    volumeBeforeDip = player.getVolume();
    await fadeVolume(volumeBeforeDip, config.dipVolume || 20, 500);
  }

  // Speak
  await speak(config.text, config.voice);

  // Restore music volume
  if (config.dipMusic && player && player.getPlayerState() === YT.PlayerState.PLAYING) {
    await fadeVolume(config.dipVolume || 20, volumeBeforeDip, 500);
  }

  moveToNextSegment();
}

async function speak(text, voiceName) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      resolve();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (voiceName) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === voiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

async function playVolumeDip(segment) {
  const config = segment.config;
  
  document.getElementById('nowPlayingInfo').innerHTML = `
    <strong>🔉 Volume Dip</strong>
  `;

  if (player && player.getPlayerState() === YT.PlayerState.PLAYING) {
    volumeBeforeDip = player.getVolume();
    await fadeVolume(volumeBeforeDip, config.volume, 500);
    await new Promise(resolve => setTimeout(resolve, config.duration * 1000));
    await fadeVolume(config.volume, volumeBeforeDip, 500);
  }

  moveToNextSegment();
}

async function fadeVolume(fromVolume, toVolume, duration) {
  return new Promise((resolve) => {
    if (!player || !player.setVolume) {
      resolve();
      return;
    }

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = (toVolume - fromVolume) / steps;
    let currentStep = 0;

    if (fadeInterval) {
      clearInterval(fadeInterval);
    }

    fadeInterval = setInterval(() => {
      currentStep++;
      const newVolume = fromVolume + (volumeStep * currentStep);
      player.setVolume(Math.max(0, Math.min(100, newVolume)));

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        fadeInterval = null;
        player.setVolume(toVolume);
        resolve();
      }
    }, stepDuration);
  });
}

function moveToNextSegment() {
  currentSegmentIndex++;
  playSegment(currentSegmentIndex);
}

function onTrackEnded() {
  if (isPlaying) {
    moveToNextSegment();
  }
}

function updateSegmentUI(playingIndex = -1) {
  const listEl = document.getElementById('segmentList');
  if (!listEl) return;

  listEl.innerHTML = segments.map((segment, index) => {
    const isPlaying = index === playingIndex;
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
      <div class="segment-item ${segment.type} ${isPlaying ? 'playing' : ''}" id="segment-${segment.id}">
        <div class="segment-type">${segment.type}</div>
        <div class="segment-title">${title}</div>
        <div class="segment-details">${details}</div>
      </div>
    `;
  }).join('');
}

// Load station data
async function loadStation() {
  const stationId = window.location.pathname.split('/').pop();
  
  try {
    stationData = await stationsAPI.getById(stationId);
    segments = await broadcastsAPI.getSegments(stationId);
    
    document.getElementById('stationName').textContent = stationData.name;
    document.getElementById('stationHost').textContent = `🎙️ Hosted by ${stationData.host}`;
    document.getElementById('stationDescription').textContent = stationData.description || 'No description';
    document.getElementById('stationGenre').textContent = `🎭 ${stationData.genre || 'Various'}`;
    
    // Show play button if there are segments
    if (segments.length > 0) {
      document.getElementById('playBtn').style.display = 'inline-block';
    }

    // Show edit button if user owns the station
    const userId = localStorage.getItem('userId');
    if (userId && parseInt(userId) === stationData.user_id) {
      document.getElementById('editBtn').style.display = 'inline-block';
    }

    updateSegmentUI();
  } catch (error) {
    console.error('Failed to load station:', error);
    alert('Failed to load station');
  }
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadStation);
} else {
  loadStation();
}
