// Enhanced Sound Analysis - Main JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
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
    const hashtagsSection = document.getElementById('hashtagsSection');
    const hashtagsGrid = document.getElementById('hashtagsGrid');
    const minSoundsSelect = document.getElementById('minSounds');
    const creatorsTableBody = document.getElementById('creatorsTableBody');
    const exportOverlappingBtn = document.getElementById('exportOverlapping');
    const exportAllCreatorsBtn = document.getElementById('exportAllCreators');
    const exportEnhancedJSONBtn = document.getElementById('exportEnhancedJSON');

    // Data storage
    let soundsData = {}; // { soundUrl: { title: "", usernames: [], hashtags: [], genre: "" } }
    let analysisResults = {}; // Creator overlap and hashtag analysis
    let hashtagAnalysis = {}; // Global hashtag analysis

    // Rate limiting for Last.fm API
    let lastApiCall = 0;
    const API_RATE_LIMIT = 250; // 250ms between calls (4 per second)

    // Utility functions
    function showStatus(message, type = 'info') {
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
                let title = decodeURIComponent(match[1]);
                title = title.replace(/-/g, ' ');
                title = title.replace(/\s+\d+$/, '');
                title = title.replace(/\b\w/g, l => l.toUpperCase());
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

    // Last.fm API functions
    async function searchLastFmTrack(trackName, artistName = '') {
        try {
            console.log(`Searching Last.fm for "${trackName}"${artistName ? ` by "${artistName}"` : ''}`);
            
            let searchUrl = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(trackName)}`;
            
            if (artistName) {
                searchUrl += `&artist=${encodeURIComponent(artistName)}`;
            }
            
            searchUrl += `&api_key=${window.LASTFM_API_KEY}&format=json`;
            
            const response = await fetch(searchUrl);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(`API error: ${data.message || 'Unknown error'}`);
            }
            
            if (data.results && data.results.trackmatches && data.results.trackmatches.track && 
                data.results.trackmatches.track.length > 0) {
                const topMatch = data.results.trackmatches.track[0];
                console.log(`Found match: "${topMatch.name}" by "${topMatch.artist}"`);
                
                return {
                    found: true,
                    track: topMatch.name,
                    artist: topMatch.artist
                };
            }
            
            console.log('No tracks found in search');
            return { found: false };
        } catch (error) {
            console.error(`Error searching for track: ${error.message}`);
            return { found: false };
        }
    }

    async function fetchLastFmGenre(track, artist) {
        try {
            // Apply rate limiting
            const now = Date.now();
            const timeSinceLastCall = now - lastApiCall;
            if (timeSinceLastCall < API_RATE_LIMIT) {
                await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT - timeSinceLastCall));
            }
            lastApiCall = Date.now();

            console.log(`Getting tags for "${track}" by "${artist}"`);
            
            // Get track tags first
            const trackUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getTopTags&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${window.LASTFM_API_KEY}&format=json`;
            
            const trackResponse = await fetch(trackUrl);
            const trackData = await trackResponse.json();
            
            if (trackData.toptags && trackData.toptags.tag && trackData.toptags.tag.length > 0) {
                const validTags = trackData.toptags.tag.filter(tag => {
                    const name = tag.name.toLowerCase();
                    const nonGenreTags = ['seen live', 'favorite', 'favourites', 'awesome', 'love', 'favourite'];
                    return !nonGenreTags.includes(name);
                });
                
                if (validTags.length > 0) {
                    const genres = validTags
                        .slice(0, 3)
                        .map(tag => tag.name)
                        .join(', ');
                    
                    console.log(`Found track tags: ${genres}`);
                    return genres;
                }
            }
            
            // Fallback to artist tags with rate limiting
            await new Promise(resolve => setTimeout(resolve, API_RATE_LIMIT));
            
            console.log('No track tags found, trying artist tags...');
            const artistUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artist)}&api_key=${window.LASTFM_API_KEY}&format=json`;
            
            const artistResponse = await fetch(artistUrl);
            const artistData = await artistResponse.json();
            
            if (artistData.toptags && artistData.toptags.tag && artistData.toptags.tag.length > 0) {
                const validTags = artistData.toptags.tag.filter(tag => {
                    const name = tag.name.toLowerCase();
                    const nonGenreTags = ['seen live', 'favorite', 'favourites', 'awesome', 'love', 'favourite'];
                    return !nonGenreTags.includes(name);
                });
                
                if (validTags.length > 0) {
                    const genres = validTags
                        .slice(0, 3)
                        .map(tag => tag.name)
                        .join(', ');
                    
                    console.log(`Found artist tags: ${genres}`);
                    return genres;
                }
            }
            
            console.log('No artist tags found');
            return '';
        } catch (error) {
            console.error(`Error fetching genre: ${error.message}`);
            return '';
        }
    }

    async function getGenreForSong(songTitle) {
        try {
            if (!songTitle || !window.LASTFM_API_KEY) return '';
            
            // Parse "Artist - Song" format
            let artist = '';
            let track = songTitle;
            
            if (songTitle.includes(' - ')) {
                const parts = songTitle.split(' - ');
                artist = parts[0].trim();
                track = parts[1].trim();
            }
            
            // Search for the track first
            const searchResult = await searchLastFmTrack(track, artist);
            
            if (searchResult.found) {
                return await fetchLastFmGenre(searchResult.track, searchResult.artist);
            } else if (artist) {
                // Fallback to artist-only search
                return await fetchLastFmGenre('', artist);
            }
            
            return '';
        } catch (error) {
            console.error(`Error getting genre for song: ${error.message}`);
            return '';
        }
    }

    // Data parsing functions
    function parseExtensionData(dataText) {
        const lines = dataText.trim().split('\n');
        let currentSection = '';
        const result = {
            song: 'Unknown Song',
            artist: 'Unknown Artist',
            usernames: [],
            hashtags: []
        };
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            if (trimmedLine.startsWith('SONG:')) {
                result.song = trimmedLine.replace('SONG:', '').trim();
                if (result.song.includes(' - ')) {
                    const parts = result.song.split(' - ');
                    result.artist = parts[0].trim();
                    result.song = parts[1].trim();
                }
                currentSection = 'song';
            } else if (trimmedLine === 'CREATORS:') {
                currentSection = 'creators';
            } else if (trimmedLine === 'HASHTAGS:') {
                currentSection = 'hashtags';
            } else if (currentSection === 'creators' && trimmedLine) {
                result.usernames.push(trimmedLine.replace('@', ''));
            } else if (currentSection === 'hashtags' && trimmedLine.startsWith('#')) {
                const hashtagMatch = trimmedLine.match(/#([^:]+):(\d+)/);
                if (hashtagMatch) {
                    result.hashtags.push([hashtagMatch[1], parseInt(hashtagMatch[2])]);
                }
            }
        }
        
        return result;
    }

    // Add sounds to analysis
    addSoundsBtn.addEventListener('click', function() {
        const urls = soundUrlsTextarea.value.trim().split('\n').filter(url => url.trim());
        
        if (urls.length === 0) {
            showStatus('Please enter at least one TikTok sound URL', 'error');
            return;
        }
        
        let added = 0;
        let invalid = 0;
        let duplicates = 0;
        
        urls.forEach(url => {
            url = url.trim();
            if (isValidTikTokSoundUrl(url)) {
                if (!soundsData[url]) {
                    const title = extractSoundTitle(url);
                    soundsData[url] = { 
                        title: title, 
                        usernames: [], 
                        hashtags: [],
                        genre: '',
                        originalTitle: title
                    };
                    added++;
                } else {
                    duplicates++;
                }
            } else if (url.length > 0) {
                invalid++;
            }
        });
        
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

    // Edit song title function
    window.editSoundTitle = function(soundUrl) {
        const soundData = soundsData[soundUrl];
        if (!soundData) return;
        
        const newTitle = prompt('Edit song title:', soundData.title);
        if (newTitle && newTitle.trim() && newTitle !== soundData.title) {
            soundData.title = newTitle.trim();
            updateSoundsDisplay();
            showStatus('Song title updated!', 'success');
        }
    };

    // Update sounds display
    function updateSoundsDisplay() {
        const soundCount = Object.keys(soundsData).length;
        
        if (soundCount > 0) {
            soundsAddedDiv.innerHTML = `
                <h4>📝 ${soundCount} Sound(s) Ready for Analysis:</h4>
                <div style="font-size: 12px; color: #666; margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                    💡 <strong>Instructions:</strong> Use the extension to collect data from each sound page, then paste the formatted data here.
                </div>
                ${Object.entries(soundsData).map(([url, data]) => `
                    <div class="sound-item-data ${data.usernames.length > 0 ? 'has-data' : ''}">
                        <a href="${escapeHtml(url)}" target="_blank" class="sound-link">
                            🎵 ${escapeHtml(data.title)} ↗️
                        </a>
                        <div style="font-size: 11px; color: #666; margin-bottom: 10px; word-break: break-all;">
                            ${escapeHtml(url)}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <button class="data-input-btn" onclick="openDataInputModal('${escapeHtml(url).replace(/'/g, "\\'")}')">
                                ${data.usernames.length > 0 ? '✏️ Edit' : '➕ Add'} Data
                            </button>
                            <div class="data-count ${data.usernames.length > 0 ? 'has-data' : ''}">
                                ${data.usernames.length > 0 ? 
                                    `✅ ${data.usernames.length} creators, ${data.hashtags.length} hashtags` : 
                                    '⏳ No data yet'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
            
            updateAnalysisButton();
        } else {
            soundsAddedDiv.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No sounds added yet</p>';
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Add data for all sounds first';
        }
    }

    // Update analysis button
    function updateAnalysisButton() {
        const totalSounds = Object.keys(soundsData).length;
        const soundsWithData = Object.values(soundsData).filter(sound => sound.usernames.length > 0).length;
        const totalCreators = Object.values(soundsData).reduce((sum, sound) => sum + sound.usernames.length, 0);
        
        if (soundsWithData === 0) {
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Add data for all sounds first';
        } else if (soundsWithData < totalSounds) {
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = `🎯 Analyze ${soundsWithData}/${totalSounds} sounds (${totalCreators} creators)`;
        } else {
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = `🚀 Analyze All ${totalSounds} Sounds (${totalCreators} creators)`;
        }
    }

    // Global function for opening data input modal
    window.openDataInputModal = function(soundUrl) {
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
        
        // Prepare current data for display
        let currentUsernames = soundData.usernames.join('\n');
        let currentHashtags = soundData.hashtags.map(([tag, count]) => `#${tag}:${count}`).join('\n');
        
        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="margin-bottom: 10px; color: #333; font-size: 20px;">📋 Add Sound Data</h3>
                <p style="color: #667eea; font-weight: 600; margin-bottom: 5px;">${escapeHtml(soundData.title)}</p>
                <p style="color: #666; font-size: 12px; word-break: break-all;">${escapeHtml(soundUrl)}</p>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">💡 How to Use:</h4>
                <ul style="color: #1976d2; font-size: 12px; margin-left: 15px; line-height: 1.5;">
                    <li>Use the Chrome extension on the TikTok sound page</li>
                    <li>Click "Copy All Data" in the extension</li>
                    <li>Paste the formatted data in the text area below</li>
                    <li>Or manually enter usernames (one per line) and hashtags (#tag:count)</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">
                    Paste Extension Data or Enter Manually:
                </label>
                <textarea 
                    id="dataTextarea" 
                    placeholder="Paste data from extension here, or enter manually:

SONG: Artist Name - Song Title

CREATORS:
username1
username2
username3

HASHTAGS:
#hashtag1:5
#hashtag2:3"
                    style="width: 100%; height: 200px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: white;"
                ></textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div>
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">
                        Creators (${soundData.usernames.length}):
                    </label>
                    <textarea 
                        id="creatorsTextarea" 
                        placeholder="username1
username2
username3"
                        style="width: 100%; height: 120px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 12px; resize: vertical;"
                    >${currentUsernames}</textarea>
                </div>
                <div>
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">
                        Hashtags (${soundData.hashtags.length}):
                    </label>
                    <textarea 
                        id="hashtagsTextarea" 
                        placeholder="#hashtag1:5
#hashtag2:3
#hashtag3:2"
                        style="width: 100%; height: 120px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 12px; resize: vertical;"
                    >${currentHashtags}</textarea>
                </div>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <button id="saveData" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    💾 Save Data
                </button>
                <button id="parseExtensionData" style="flex: 1; background: linear-gradient(135deg, #4caf50, #45a049); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    🔄 Parse Extension Data
                </button>
                <button id="cancelData" style="flex: 1; background: #f5f5f5; color: #333; border: 2px solid #ddd; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    ❌ Cancel
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        const dataTextarea = document.getElementById('dataTextarea');
        const creatorsTextarea = document.getElementById('creatorsTextarea');
        const hashtagsTextarea = document.getElementById('hashtagsTextarea');
        
        // Parse extension data button
        document.getElementById('parseExtensionData').addEventListener('click', function() {
            const extensionData = dataTextarea.value.trim();
            if (!extensionData) {
                alert('Please paste extension data first');
                return;
            }
            
            const parsed = parseExtensionData(extensionData);
            
            // Update title if we got a better one
            if (parsed.song !== 'Unknown Song') {
                soundData.title = `${parsed.artist} - ${parsed.song}`;
            }
            
            // Update textareas
            creatorsTextarea.value = parsed.usernames.join('\n');
            hashtagsTextarea.value = parsed.hashtags.map(([tag, count]) => `#${tag}:${count}`).join('\n');
            
            showStatus('Extension data parsed successfully!', 'success');
        });
        
        // Handle save
        document.getElementById('saveData').addEventListener('click', function() {
            // Parse creators
            const creators = creatorsTextarea.value
                .split('\n')
                .map(name => name.trim().replace('@', ''))
                .filter(name => name.length > 0);
            
            // Parse hashtags
            const hashtags = [];
            const hashtagLines = hashtagsTextarea.value.split('\n');
            hashtagLines.forEach(line => {
                const match = line.trim().match(/#([^:]+):(\d+)/);
                if (match) {
                    hashtags.push([match[1], parseInt(match[2])]);
                }
            });
            
            soundsData[soundUrl].usernames = creators;
            soundsData[soundUrl].hashtags = hashtags;
            
            updateSoundsDisplay();
            
            if (creators.length > 0 || hashtags.length > 0) {
                showStatus(`✅ Saved ${creators.length} creators and ${hashtags.length} hashtags for "${soundData.title}"!`, 'success');
            } else {
                showStatus(`Cleared data for "${soundData.title}"`, 'info');
            }
            
            document.body.removeChild(modal);
        });
        
        // Handle cancel
        document.getElementById('cancelData').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Focus on textarea
        setTimeout(() => dataTextarea.focus(), 100);
    };

    // Start analysis process
    startAnalysisBtn.addEventListener('click', async function() {
        const soundUrls = Object.keys(soundsData);
        const soundsWithData = soundUrls.filter(url => soundsData[url].usernames.length > 0);
        
        if (soundsWithData.length === 0) {
            showStatus('Please add data for at least one sound before analyzing', 'error');
            return;
        }
        
        startAnalysisBtn.disabled = true;
        startAnalysisBtn.innerHTML = '<span class="spinner"></span>Analyzing...';
        analysisProgress.style.display = 'block';
        
        try {
            progressFill.style.width = '20%';
            progressText.textContent = `🎯 Analyzing ${soundsWithData.length} sounds with data...`;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            progressFill.style.width = '40%';
            progressText.textContent = '🎼 Fetching genres from Last.fm...';
            
            // Fetch genres for all sounds
            for (const [url, data] of Object.entries(soundsData)) {
                if (data.usernames.length > 0 && !data.genre) {
                    data.genre = await getGenreForSong(data.title);
                    if (data.genre) {
                        console.log(`Got genre for ${data.title}: ${data.genre}`);
                    }
                }
            }
            
            progressFill.style.width = '70%';
            progressText.textContent = '🔍 Finding creator overlaps...';
            
            // Analyze overlaps
            analyzeCreatorOverlaps();
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            progressFill.style.width = '90%';
            progressText.textContent = '🏷️ Analyzing hashtags...';
            
            // Analyze hashtags
            analyzeHashtags();
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Complete progress
            progressFill.style.width = '100%';
            progressText.textContent = '✅ Analysis complete!';
            
            // Display results
            displayResults();
            
            const totalCreators = Object.keys(analysisResults.creatorCounts || {}).length;
            const overlappingCreators = analysisResults.sortedCreators.length;
            
            showStatus(`🎉 Analysis complete! Found ${totalCreators} unique creators with ${overlappingCreators} appearing across multiple sounds.`, 'success');
            
        } catch (error) {
            console.error('Analysis error:', error);
            showStatus(`❌ Analysis error: ${error.message}`, 'error');
        } finally {
            startAnalysisBtn.disabled = false;
            updateAnalysisButton();
            setTimeout(() => {
                analysisProgress.style.display = 'none';
            }, 2000);
        }
    });

    // Analyze creator overlaps
    function analyzeCreatorOverlaps() {
        const creatorCounts = {};
        const creatorSounds = {};
        
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => data.usernames.length > 0);
        
        soundsWithData.forEach(([soundUrl, data]) => {
            data.usernames.forEach(username => {
                if (!creatorCounts[username]) {
                    creatorCounts[username] = 0;
                    creatorSounds[username] = [];
                }
                creatorCounts[username]++;
                creatorSounds[username].push(data.title);
            });
        });
        
        const sortedCreators = Object.entries(creatorCounts)
            .sort(([a, countA], [b, countB]) => {
                if (countB !== countA) return countB - countA;
                return a.localeCompare(b);
            })
            .filter(([,count]) => count >= 2);
        
        analysisResults = {
            creatorCounts,
            creatorSounds,
            sortedCreators,
            totalSoundsAnalyzed: soundsWithData.length
        };
    }

    // Analyze hashtags
    function analyzeHashtags() {
        const globalHashtags = new Map();
        const soundHashtags = {};
        
        Object.entries(soundsData).forEach(([url, data]) => {
            if (data.hashtags.length > 0) {
                soundHashtags[data.title] = data.hashtags;
                
                data.hashtags.forEach(([hashtag, count]) => {
                    const existingCount = globalHashtags.get(hashtag) || 0;
                    globalHashtags.set(hashtag, existingCount + count);
                });
            }
        });
        
        const sortedGlobalHashtags = Array.from(globalHashtags.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 30);
        
        hashtagAnalysis = {
            globalHashtags: sortedGlobalHashtags,
            soundHashtags
        };
    }

    // Display analysis results
    function displayResults() {
        updateSoundsOverview();
        updateHashtagsSection();
        updateCreatorsTable();
        resultsSection.style.display = 'block';
        
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }

    function updateSoundsOverview() {
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => data.usernames.length > 0);
        
        soundsList.innerHTML = soundsWithData.map(([url, data]) => {
            const creatorCount = data.usernames.length;
            const hashtagCount = data.hashtags.length;
            return `
                <div class="sound-item">
                    <div class="sound-title">
                        ${escapeHtml(data.title)}
                        <button class="edit-title-btn" onclick="editSoundTitle('${escapeHtml(url).replace(/'/g, "\\'")}')">✏️</button>
                    </div>
                    <div class="sound-url">${escapeHtml(url)}</div>
                    <div class="sound-stats">
                        <span><strong>${creatorCount.toLocaleString()}</strong> creators</span>
                        <span class="badge ${creatorCount > 150 ? 'high' : creatorCount > 50 ? 'medium' : ''}">${creatorCount > 150 ? 'High' : creatorCount > 50 ? 'Medium' : 'Low'} volume</span>
                    </div>
                    <div class="sound-stats">
                        <span><strong>${hashtagCount.toLocaleString()}</strong> hashtags</span>
                    </div>
                    ${data.genre ? `<div class="sound-genre">🎼 ${escapeHtml(data.genre)}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    function updateHashtagsSection() {
        if (!hashtagAnalysis.globalHashtags || hashtagAnalysis.globalHashtags.length === 0) {
            hashtagsSection.style.display = 'none';
            return;
        }
        
        const topGlobalHashtags = hashtagAnalysis.globalHashtags.slice(0, 20);
        const trendingHashtags = hashtagAnalysis.globalHashtags.filter(([tag, count]) => count >= 5).slice(0, 15);
        
        hashtagsGrid.innerHTML = `
            <div class="hashtag-category">
                <h4>🔥 Top Global Hashtags</h4>
                <div class="hashtag-list">
                    ${topGlobalHashtags.map(([tag, count]) => 
                        `<span class="hashtag-tag">#${escapeHtml(tag)} (${count})</span>`
                    ).join('')}
                </div>
            </div>
            
            <div class="hashtag-category">
                <h4>📈 Trending Hashtags</h4>
                <div class="hashtag-list">
                    ${trendingHashtags.map(([tag, count]) => 
                        `<span class="hashtag-tag">#${escapeHtml(tag)} (${count})</span>`
                    ).join('')}
                </div>
            </div>
        `;
        
        hashtagsSection.style.display = 'block';
    }

    function updateCreatorsTable() {
        const minSounds = parseInt(minSoundsSelect.value);
        const filteredCreators = analysisResults.sortedCreators.filter(([username, count]) => count >= minSounds);
        
        if (filteredCreators.length === 0) {
            creatorsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #666;">No creators found matching the minimum sound requirement</td></tr>';
            return;
        }
        
        const totalSounds = analysisResults.totalSoundsAnalyzed;
        
        creatorsTableBody.innerHTML = filteredCreators.slice(0, 100).map(([username, count], index) => {
            const sounds = analysisResults.creatorSounds[username] || [];
            const overlapPercent = Math.round((count / totalSounds) * 100);
            const badgeClass = count >= 4 ? 'high' : count >= 3 ? 'medium' : '';
            const tiktokLink = `https://www.tiktok.com/@${username}`;
            
            return `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td class="creator-name">@${escapeHtml(username)}</td>
                    <td>
                        <a href="${tiktokLink}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600;">
                            🔗 View Profile ↗️
                        </a>
                    </td>
                    <td><span class="badge ${badgeClass}">${count}</span></td>
                    <td><strong>${overlapPercent}%</strong></td>
                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${sounds.map(s => escapeHtml(s)).join(', ')}">${sounds.map(s => escapeHtml(s)).join(', ')}</td>
                </tr>
            `;
        }).join('');
    }

    // Filter creators when selection changes
    minSoundsSelect.addEventListener('change', updateCreatorsTable);

    // Export functions
    exportOverlappingBtn.addEventListener('click', function() {
        if (!analysisResults.sortedCreators || analysisResults.sortedCreators.length === 0) {
            showStatus('No data to export. Please run analysis first.', 'error');
            return;
        }
        
        const headers = ['Rank', 'Username', 'TikTok Link', 'Sound Count', 'Overlap Percentage', 'Sounds Appeared In'];
        const totalSounds = analysisResults.totalSoundsAnalyzed;
        
        const rows = analysisResults.sortedCreators.map(([username, count], index) => {
            const sounds = analysisResults.creatorSounds[username] || [];
            const overlapPercent = Math.round((count / totalSounds) * 100);
            const tiktokLink = `https://www.tiktok.com/@${username}`;
            
            return [
                index + 1,
                username,
                tiktokLink,
                count,
                `${overlapPercent}%`,
                `"${sounds.join(', ')}"`
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        downloadFile(csvContent, 'overlapping-creators.csv', 'text/csv');
        showStatus('✅ Overlapping creators CSV exported successfully!', 'success');
    });

    exportAllCreatorsBtn.addEventListener('click', function() {
        if (!soundsData || Object.keys(soundsData).length === 0) {
            showStatus('No data to export. Please run analysis first.', 'error');
            return;
        }
        
        const headers = ['Username', 'TikTok Link', 'Sound Title', 'Sound URL'];
        const rows = [];
        
        Object.entries(soundsData).forEach(([url, data]) => {
            if (data.usernames.length > 0) {
                data.usernames.forEach(username => {
                    const tiktokLink = `https://www.tiktok.com/@${username}`;
                    rows.push([
                        username,
                        tiktokLink,
                        `"${data.title}"`,
                        url
                    ]);
                });
            }
        });
        
        if (rows.length === 0) {
            showStatus('No creators to export.', 'error');
            return;
        }
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        downloadFile(csvContent, 'all-creators.csv', 'text/csv');
        showStatus('✅ All creators CSV exported successfully!', 'success');
    });

    exportEnhancedJSONBtn.addEventListener('click', function() {
        if (!analysisResults.sortedCreators || analysisResults.sortedCreators.length === 0) {
            showStatus('No data to export. Please run analysis first.', 'error');
            return;
        }
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                description: 'Enhanced Sound Analysis with hashtags and genres',
                totalSoundsAnalyzed: analysisResults.totalSoundsAnalyzed,
                totalUniqueCreators: Object.keys(analysisResults.creatorCounts).length,
                overlappingCreators: analysisResults.sortedCreators.length,
                generatedBy: 'Enhanced Sound Analysis Tool',
                lastFmApiUsed: !!window.LASTFM_API_KEY
            },
            sounds: Object.entries(soundsData).map(([url, data]) => ({
                url: url,
                title: data.title,
                originalTitle: data.originalTitle,
                genre: data.genre || 'Unknown',
                creatorCount: data.usernames.length,
                hashtagCount: data.hashtags.length,
                creators: data.usernames,
                hashtags: data.hashtags
            })),
            creatorAnalysis: {
                overlappingCreators: analysisResults.sortedCreators.map(([username, count]) => ({
                    username: username,
                    tiktokLink: `https://www.tiktok.com/@${username}`,
                    soundCount: count,
                    overlapPercentage: Math.round((count / analysisResults.totalSoundsAnalyzed) * 100),
                    soundsAppearedIn: analysisResults.creatorSounds[username] || [],
                    reliabilityScore: calculateReliabilityScore(count, analysisResults.totalSoundsAnalyzed)
                }))
            },
            hashtagAnalysis: {
                globalHashtags: hashtagAnalysis.globalHashtags || [],
                soundSpecificHashtags: hashtagAnalysis.soundHashtags || {}
            }
        };
        
        downloadFile(JSON.stringify(exportData, null, 2), 'enhanced-sound-analysis.json', 'application/json');
        showStatus('✅ Enhanced JSON exported successfully!', 'success');
    });

    // Utility functions
    function calculateReliabilityScore(soundCount, totalSounds) {
        const baseScore = (soundCount / totalSounds) * 100;
        if (baseScore >= 80) return 'Excellent';
        if (baseScore >= 60) return 'Very Good';
        if (baseScore >= 40) return 'Good';
        if (baseScore >= 25) return 'Fair';
        return 'Low';
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize the application
    updateSoundsDisplay();
    
    // Check if Last.fm API key is available
    if (!window.LASTFM_API_KEY) {
        console.warn('Last.fm API key not found. Genre detection will be disabled.');
        showStatus('Genre detection disabled - API key not found', 'info');
    } else {
        console.log('Last.fm API key loaded successfully');
    }
});
