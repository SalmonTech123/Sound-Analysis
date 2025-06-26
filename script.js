// Sound Analysis - Main JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log('Sound Analysis script loaded');
    
    // DOM elements
    const statusDiv = document.getElementById('status');
    const soundUrlsTextarea = document.getElementById('soundUrls');
    const addSoundsBtn = document.getElementById('addSounds');
    const soundsAddedDiv = document.getElementById('soundsAdded');
    const startAnalysisBtn = document.getElementById('startAnalysis');
    const analysisProgress = document.getElementById('analysisProgress');
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    const resultsSection = document.getElementById('resultsSection');
    const soundsList = document.getElementById('soundsList');
    const minSoundsSelect = document.getElementById('minSounds');
    const creatorsTableBody = document.getElementById('creatorsTableBody');
    const hashtagsSection = document.getElementById('hashtagsSection');
    const genreInsights = document.getElementById('genreInsights');
    const minHashtagCountSelect = document.getElementById('minHashtagCount');
    const hashtagsTableBody = document.getElementById('hashtagsTableBody');
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportTop50Btn = document.getElementById('exportTop50');
    const exportHashtagsBtn = document.getElementById('exportHashtags');

    // Data storage
    let soundsData = {}; // { soundUrl: { title: "", usernames: [], hashtags: [], videoCount: "" } }
    let analysisResults = {}; // Creator overlap analysis

    // Utility functions
    function showStatus(message, type = 'info') {
        console.log('Status:', message, type);
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        if (type !== 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 4000);
        }
    }

    function extractSoundTitle(url) {
        try {
            const match = url.match(/\/music\/([^?]+)/);
            if (match) {
                // Decode and clean up the title
                let title = decodeURIComponent(match[1]);
                title = title.replace(/-/g, ' '); // Replace hyphens with spaces
                title = title.replace(/\s+\d+$/, ''); // Remove trailing numbers (like song IDs)
                title = title.replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
                return title.trim();
            }
        } catch (error) {
            console.error('Error extracting sound title:', error);
        }
        return 'Unknown Sound';
    }

    function isValidTikTokSoundUrl(url) {
        return url.includes('tiktok.com/music/') && url.includes('-');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Parse data from extension format
    function parseExtensionData(text) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const usernames = [];
        const hashtags = [];
        let songInfo = { song: 'Unknown Song', artist: 'Unknown Artist', videoCount: 'Unknown', combined: 'Unknown Song' };
        
        let currentSection = '';
        
        for (const line of lines) {
            if (line.startsWith('SONG:')) {
                const songData = line.replace('SONG:', '').trim();
                const parts = songData.split(' - ');
                if (parts.length >= 2) {
                    songInfo.artist = parts[0].trim();
                    songInfo.song = parts[1].trim();
                    songInfo.combined = songData;
                }
                continue;
            }
            
            if (line === 'CREATORS:') {
                currentSection = 'creators';
                continue;
            }
            
            if (line === 'HASHTAGS:') {
                currentSection = 'hashtags';
                continue;
            }
            
            if (currentSection === 'creators') {
                const username = line.replace('@', '').trim();
                if (username && !username.includes(':')) {
                    usernames.push(username);
                }
            }
            
            if (currentSection === 'hashtags') {
                if (line.startsWith('#')) {
                    const match = line.match(/#([^:]+):?(\d+)?/);
                    if (match) {
                        const hashtag = match[1];
                        const count = match[2] ? parseInt(match[2]) : 1;
                        hashtags.push([hashtag, count]);
                    }
                }
            }
            
            // Also handle simple format (just usernames)
            if (!currentSection && line.startsWith('@')) {
                const username = line.replace('@', '').trim();
                if (username) usernames.push(username);
            }
        }
        
        return { usernames, hashtags, songInfo };
    }

    // Format data for display in modal
    function formatDataForDisplay(soundData) {
        let formatted = '';
        
        if (soundData.title && soundData.title !== 'Unknown Song') {
            formatted += `SONG: ${soundData.title}\n\n`;
        }
        
        if (soundData.usernames && soundData.usernames.length > 0) {
            formatted += 'CREATORS:\n';
            soundData.usernames.forEach(username => {
                formatted += `${username}\n`;
            });
            formatted += '\n';
        }
        
        if (soundData.hashtags && soundData.hashtags.length > 0) {
            formatted += 'HASHTAGS:\n';
            soundData.hashtags.forEach(([hashtag, count]) => {
                formatted += `#${hashtag}:${count}\n`;
            });
        }
        
        return formatted.trim();
    }

    // Add sounds to analysis
    addSoundsBtn.addEventListener('click', function() {
        console.log('Add sounds button clicked');
        const urls = soundUrlsTextarea.value.trim().split('\n').filter(url => url.trim());
        
        console.log('URLs to process:', urls);
        
        if (urls.length === 0) {
            showStatus('Please enter at least one TikTok sound URL', 'error');
            return;
        }
        
        let added = 0;
        let invalid = 0;
        let duplicates = 0;
        
        urls.forEach(url => {
            url = url.trim();
            console.log('Processing URL:', url);
            
            if (isValidTikTokSoundUrl(url)) {
                if (!soundsData[url]) {
                    const title = extractSoundTitle(url);
                    soundsData[url] = { 
                        title: title, 
                        usernames: [], 
                        hashtags: [],
                        videoCount: null
                    };
                    added++;
                    console.log('Added sound:', title);
                } else {
                    duplicates++;
                    console.log('Duplicate URL:', url);
                }
            } else if (url.length > 0) {
                invalid++;
                console.log('Invalid URL:', url);
            }
        });
        
        console.log('Processing complete. Added:', added, 'Invalid:', invalid, 'Duplicates:', duplicates);
        
        let message = '';
        if (added > 0) {
            message += `Added ${added} new sound(s)`;
            if (duplicates > 0) message += `, ${duplicates} duplicate(s) skipped`;
            if (invalid > 0) message += `, ${invalid} invalid URL(s) skipped`;
            
            updateSoundsDisplay();
            showStatus(message, 'success');
            soundUrlsTextarea.value = '';
        } else {
            message = 'No new sounds added. ';
            if (duplicates > 0) message += `${duplicates} were duplicates. `;
            if (invalid > 0) message += `${invalid} had invalid URLs.`;
            showStatus(message, 'error');
        }
    });

    // Update sounds display
    function updateSoundsDisplay() {
        console.log('Updating sounds display. Current sounds:', Object.keys(soundsData));
        const soundCount = Object.keys(soundsData).length;
        
        if (soundCount > 0) {
            soundsAddedDiv.innerHTML = `
                <h4>📝 ${soundCount} Sound(s) Ready for Analysis:</h4>
                <div style="font-size: 12px; color: #666; margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                    💡 <strong>Instructions:</strong> Click each sound link to open in a new tab, use the extension to collect creators, then return here to add the data.
                </div>
                ${Object.entries(soundsData).map(([url, data]) => {
                    const hasCreators = data.usernames.length > 0;
                    const hasHashtags = data.hashtags && data.hashtags.length > 0;
                    const hasData = hasCreators || hasHashtags;
                    
                    return `
                        <div class="sound-item-data ${hasData ? 'has-data' : ''}">
                            <a href="${escapeHtml(url)}" target="_blank" class="sound-link">
                                🎵 ${escapeHtml(data.title)} ↗️
                            </a>
                            <div style="font-size: 11px; color: #666; margin-bottom: 5px; word-break: break-all;">
                                ${escapeHtml(url)}
                            </div>
                            ${data.videoCount ? `<div style="font-size: 11px; color: #666; margin-bottom: 10px;">📊 ${escapeHtml(data.videoCount)}</div>` : ''}
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <button class="creator-input-btn" onclick="openCreatorInputModal('${escapeHtml(url).replace(/'/g, "\\'")}')">
                                    ${hasData ? '✏️ Edit' : '➕ Add'} Creator Data
                                </button>
                                <div class="creator-count ${hasData ? 'has-data' : ''}">
                                    ${hasCreators ? `✅ ${data.usernames.length} creators` : '⏳ No creators'}
                                    ${hasHashtags ? `, ${data.hashtags.length} hashtags` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            `;
            
            updateAnalysisButton();
        } else {
            soundsAddedDiv.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No sounds added yet</p>';
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Add creator data for all sounds first';
        }
    }

    // Update analysis button based on data availability
    function updateAnalysisButton() {
        const totalSounds = Object.keys(soundsData).length;
        const soundsWithData = Object.values(soundsData).filter(sound => 
            sound.usernames.length > 0 || (sound.hashtags && sound.hashtags.length > 0)
        ).length;
        const totalCreators = Object.values(soundsData).reduce((sum, sound) => sum + sound.usernames.length, 0);
        const totalHashtags = Object.values(soundsData).reduce((sum, sound) => sum + (sound.hashtags?.length || 0), 0);
        
        if (soundsWithData === 0) {
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Add creator data for all sounds first';
        } else if (soundsWithData < totalSounds) {
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = `🎯 Analyze ${soundsWithData}/${totalSounds} sounds (${totalCreators} creators, ${totalHashtags} hashtags)`;
        } else {
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = `🚀 Analyze All ${totalSounds} Sounds (${totalCreators} creators, ${totalHashtags} hashtags)`;
        }
    }

    // Global function for opening creator input modal
    window.openCreatorInputModal = function(soundUrl) {
        console.log('Opening modal for:', soundUrl);
        const soundData = soundsData[soundUrl];
        if (!soundData) {
            showStatus('Sound not found', 'error');
            return;
        }

        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
            background: rgba(0,0,0,0.5); z-index: 1000; display: flex; 
            align-items: center; justify-content: center; padding: 20px;
        `;
        
        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white; border-radius: 20px; padding: 30px; 
            max-width: 700px; width: 100%; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;
        
        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="margin-bottom: 10px; color: #333; font-size: 20px;">📋 Add Creator Data</h3>
                <p style="color: #667eea; font-weight: 600; margin-bottom: 5px;">${escapeHtml(soundData.title)}</p>
                <p style="color: #666; font-size: 12px; word-break: break-all;">${escapeHtml(soundUrl)}</p>
                ${soundData.videoCount ? `<p style="color: #666; font-size: 12px; margin-top: 5px;">📊 ${soundData.videoCount}</p>` : ''}
            </div>
            
            <div style="background: #e3f2fd; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">💡 Instructions:</h4>
                <ul style="color: #1976d2; font-size: 12px; margin-left: 15px; line-height: 1.5;">
                    <li>Use the browser extension to collect data automatically</li>
                    <li>Or paste creator usernames manually (one per line)</li>
                    <li>Include hashtags if available (format: #hashtag:count)</li>
                    <li>Example: username1, @username2, #dance:45</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">
                    Creator Data (one per line):
                </label>
                <textarea 
                    id="creatorTextarea" 
                    placeholder="Paste your collected data here:

SONG: Artist - Song Title

CREATORS:
username1
@username2
creator_name

HASHTAGS:
#dance:45
#viral:23
#trending:18"
                    style="width: 100%; height: 250px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: white;"
                >${formatDataForDisplay(soundData)}</textarea>
                <div id="creatorCount" style="font-size: 11px; color: #999; margin-top: 8px; text-align: right;">
                    ${soundData.usernames.length} creators, ${soundData.hashtags?.length || 0} hashtags
                </div>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <button id="saveCreatorData" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    💾 Save Creator Data
                </button>
                <button id="cancelCreatorData" style="flex: 1; background: #f5f5f5; color: #333; border: 2px solid #ddd; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    ❌ Cancel
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add real-time counting
        const textarea = document.getElementById('creatorTextarea');
        const counter = document.getElementById('creatorCount');
        
        textarea.addEventListener('input', function() {
            const parsed = parseExtensionData(this.value);
            counter.textContent = `${parsed.usernames.length} creators, ${parsed.hashtags.length} hashtags`;
            counter.style.color = (parsed.usernames.length > 0 || parsed.hashtags.length > 0) ? '#4caf50' : '#999';
        });
        
        // Handle save
        document.getElementById('saveCreatorData').addEventListener('click', function() {
            const parsed = parseExtensionData(textarea.value);
            
            // Update sound data
            soundsData[soundUrl].usernames = parsed.usernames;
            soundsData[soundUrl].hashtags = parsed.hashtags;
            
            // Update song info if provided
            if (parsed.songInfo.song && parsed.songInfo.song !== 'Unknown Song') {
                soundsData[soundUrl].title = parsed.songInfo.combined;
            }
            if (parsed.songInfo.videoCount && parsed.songInfo.videoCount !== 'Unknown') {
                soundsData[soundUrl].videoCount = parsed.songInfo.videoCount;
            }
            
            updateSoundsDisplay();
            
            if (parsed.usernames.length > 0 || parsed.hashtags.length > 0) {
                showStatus(`✅ Saved ${parsed.usernames.length} creators and ${parsed.hashtags.length} hashtags!`, 'success');
            } else {
                showStatus(`Cleared data for "${soundData.title}"`, 'info');
            }
            
            document.body.removeChild(modal);
        });
        
        // Handle cancel
        document.getElementById('cancelCreatorData').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Focus on textarea
        setTimeout(() => textarea.focus(), 100);
    };

    // Initialize the application
    console.log('Initializing application...');
    updateSoundsDisplay();
    
    // Test that the button is properly connected
    console.log('Add sounds button:', addSoundsBtn);
    console.log('Sound URLs textarea:', soundUrlsTextarea);
});
