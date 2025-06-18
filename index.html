// Enhanced Sound Analysis - Main JavaScript with Last.fm and Hashtag Analysis

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
    const minSoundsSelect = document.getElementById('minSounds');
    const creatorsTableBody = document.getElementById('creatorsTableBody');
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportTop50Btn = document.getElementById('exportTop50');

    // Data storage
    let soundsData = {}; // { soundUrl: { title: "", usernames: [], hashtags: {}, genre: "" } }
    let analysisResults = {}; // Creator overlap analysis + hashtag analysis

    // Last.fm API configuration - Built-in API key
    const LASTFM_API_KEY = window.LASTFM_API_KEY || 'your_actual_lastfm_api_key_here'; // Replace with your API key from the genre fetcher
    
    // Rate limiting for Last.fm API
    const rateLimiter = {
        lastRequest: 0,
        minInterval: 250 // 4 requests per second max
    };

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
    async function rateLimitedFetch(url) {
        const now = Date.now();
        const timeSinceLastRequest = now - rateLimiter.lastRequest;
        
        if (timeSinceLastRequest < rateLimiter.minInterval) {
            await new Promise(resolve => setTimeout(resolve, rateLimiter.minInterval - timeSinceLastRequest));
        }
        
        rateLimiter.lastRequest = Date.now();
        return fetch(url);
    }

    async function searchLastFmTrack(trackName, artistName = '') {
        if (!LASTFM_API_KEY) return null;
        
        try {
            let searchUrl = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(trackName)}`;
            
            if (artistName) {
                searchUrl += `&artist=${encodeURIComponent(artistName)}`;
            }
            
            searchUrl += `&api_key=${LASTFM_API_KEY}&format=json`;
            
            const response = await rateLimitedFetch(searchUrl);
            const data = await response.json();
            
            if (data.results && data.results.trackmatches && data.results.trackmatches.track && 
                data.results.trackmatches.track.length > 0) {
                const topMatch = data.results.trackmatches.track[0];
                return {
                    found: true,
                    track: topMatch.name,
                    artist: topMatch.artist
                };
            }
            
            return { found: false };
        } catch (error) {
            console.error(`Error searching Last.fm: ${error.message}`);
            return { found: false };
        }
    }

    async function getLastFmGenre(track, artist) {
        if (!LASTFM_API_KEY) return '';
        
        try {
            // Try track tags first
            let url = `https://ws.audioscrobbler.com/2.0/?method=track.getTopTags&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${LASTFM_API_KEY}&format=json`;
            
            let response = await rateLimitedFetch(url);
            let data = await response.json();
            
            if (data.toptags && data.toptags.tag && data.toptags.tag.length > 0) {
                const validTags = data.toptags.tag.filter(tag => {
                    const name = tag.name.toLowerCase();
                    const nonGenreTags = ['seen live', 'favorite', 'favourites', 'awesome', 'love'];
                    return !nonGenreTags.includes(name);
                });
                
                if (validTags.length > 0) {
                    return validTags.slice(0, 3).map(tag => tag.name).join(', ');
                }
            }
            
            // Fall back to artist tags
            url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json`;
            
            response = await rateLimitedFetch(url);
            data = await response.json();
            
            if (data.toptags && data.toptags.tag && data.toptags.tag.length > 0) {
                const validTags = data.toptags.tag.filter(tag => {
                    const name = tag.name.toLowerCase();
                    const nonGenreTags = ['seen live', 'favorite', 'favourites', 'awesome', 'love'];
                    return !nonGenreTags.includes(name);
                });
                
                if (validTags.length > 0) {
                    return validTags.slice(0, 3).map(tag => tag.name).join(', ');
                }
            }
            
            return '';
        } catch (error) {
            console.error(`Error fetching Last.fm genre: ${error.message}`);
            return '';
        }
    }

    async function getGenreForSong(songTitle) {
        if (!songTitle || !LASTFM_API_KEY) return '';
        
        // Parse artist from title if format is "Artist - Song"
        let trackName = songTitle;
        let artistName = '';
        
        if (songTitle.includes(' - ')) {
            const parts = songTitle.split(' - ');
            artistName = parts[0].trim();
            trackName = parts[1].trim();
        }
        
        // Search for the track
        const searchResult = await searchLastFmTrack(trackName, artistName);
        
        if (searchResult.found) {
            return await getLastFmGenre(searchResult.track, searchResult.artist);
        } else if (artistName) {
            // Try just the artist if track search fails
            const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`;
            
            try {
                const response = await rateLimitedFetch(url);
                const data = await response.json();
                
                if (data.toptags && data.toptags.tag && data.toptags.tag.length > 0) {
                    return data.toptags.tag.slice(0, 3).map(tag => tag.name).join(', ');
                }
            } catch (error) {
                console.error('Error fetching artist genre:', error);
            }
        }
        
        return '';
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
                        hashtags: {},
                        genre: ''
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

    // Update sounds display with editable titles
    function updateSoundsDisplay() {
        const soundCount = Object.keys(soundsData).length;
        
        if (soundCount > 0) {
            soundsAddedDiv.innerHTML = `
                <h4>📝 ${soundCount} Sound(s) Ready for Analysis:</h4>
                <div style="font-size: 12px; color: #666; margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                    💡 <strong>Instructions:</strong> Click each sound link to open in a new tab, use the extension to collect creators, then return here to add the data. Click the pencil icon to edit song names.
                </div>
                ${Object.entries(soundsData).map(([url, data]) => `
                    <div class="sound-item-data ${data.usernames.length > 0 ? 'has-data' : ''}">
                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                            <a href="${escapeHtml(url)}" target="_blank" class="sound-link" style="flex: 1;">
                                🎵 <span class="editable-title" data-url="${escapeHtml(url)}">${escapeHtml(data.title)}</span> ↗️
                            </a>
                            <button class="edit-title-btn" onclick="editSoundTitle('${escapeHtml(url).replace(/'/g, "\\'")}')">
                                ✏️
                            </button>
                        </div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 10px; word-break: break-all;">
                            ${escapeHtml(url)}
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <button class="creator-input-btn" onclick="openCreatorInputModal('${escapeHtml(url).replace(/'/g, "\\'")}')">
                                ${data.usernames.length > 0 ? '✏️ Edit' : '➕ Add'} Creator Data
                            </button>
                            <div class="creator-count ${data.usernames.length > 0 ? 'has-data' : ''}">
                                ${data.usernames.length > 0 ? `✅ ${data.usernames.length} creators` : '⏳ No data yet'}
                            </div>
                        </div>
                    </div>
                `).join('')}
            `;
            
            updateAnalysisButton();
        } else {
            soundsAddedDiv.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No sounds added yet</p>';
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Add creator data for all sounds first';
        }
    }

    // Global function for editing sound titles
    window.editSoundTitle = function(soundUrl) {
        const soundData = soundsData[soundUrl];
        if (!soundData) return;
        
        const newTitle = prompt('Edit song title:', soundData.title);
        if (newTitle && newTitle.trim() && newTitle.trim() !== soundData.title) {
            soundData.title = newTitle.trim();
            updateSoundsDisplay();
            showStatus('Song title updated!', 'success');
        }
    };

    // Update analysis button based on data availability
    function updateAnalysisButton() {
        const totalSounds = Object.keys(soundsData).length;
        const soundsWithData = Object.values(soundsData).filter(sound => sound.usernames.length > 0).length;
        const totalCreators = Object.values(soundsData).reduce((sum, sound) => sum + sound.usernames.length, 0);
        
        if (soundsWithData === 0) {
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Add creator data for all sounds first';
        } else if (soundsWithData < totalSounds) {
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = `🎯 Analyze ${soundsWithData}/${totalSounds} sounds (${totalCreators} creators)`;
        } else {
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = `🚀 Analyze All ${totalSounds} Sounds (${totalCreators} creators)`;
        }
    }

    // Global function for opening creator input modal (enhanced for hashtags)
    window.openCreatorInputModal = function(soundUrl) {
        const soundData = soundsData[soundUrl];
        if (!soundData) {
            showStatus('Sound not found', 'error');
            return;
        }

        // Create modal with enhanced UI
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
            </div>
            
            <div style="background: #e3f2fd; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">💡 Instructions:</h4>
                <ul style="color: #1976d2; font-size: 12px; margin-left: 15px; line-height: 1.5;">
                    <li>Paste creator usernames from the extension (one per line)</li>
                    <li>You can include or exclude @ symbols</li>
                    <li>The enhanced extension now also collects hashtags automatically!</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">
                    Creator Usernames (one per line):
                </label>
                <textarea 
                    id="creatorTextarea" 
                    placeholder="Paste usernames here:

username1
@username2
creator_name
viral_creator"
                    style="width: 100%; height: 200px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: white;"
                >${soundData.usernames.join('\n')}</textarea>
                <div id="creatorCount" style="font-size: 11px; color: #999; margin-top: 8px; text-align: right;">
                    ${soundData.usernames.length} creators
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
            const creators = this.value
                .split('\n')
                .map(name => name.trim().replace('@', ''))
                .filter(name => name.length > 0);
            counter.textContent = `${creators.length} creators`;
            counter.style.color = creators.length > 0 ? '#4caf50' : '#999';
        });
        
        // Handle save
        document.getElementById('saveCreatorData').addEventListener('click', function() {
            const creators = textarea.value
                .split('\n')
                .map(name => name.trim().replace('@', ''))
                .filter(name => name.length > 0);
            
            soundsData[soundUrl].usernames = creators;
            updateSoundsDisplay();
            
            if (creators.length > 0) {
                showStatus(`✅ Saved ${creators.length} creators for "${soundData.title}"!`, 'success');
            } else {
                showStatus(`Cleared creator data for "${soundData.title}"`, 'info');
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

    // Start analysis process (enhanced with genre and hashtag analysis)
    startAnalysisBtn.addEventListener('click', async function() {
        const soundUrls = Object.keys(soundsData);
        const soundsWithData = soundUrls.filter(url => soundsData[url].usernames.length > 0);
        
        if (soundsWithData.length === 0) {
            showStatus('Please add creator data for at least one sound before analyzing', 'error');
            return;
        }
        
        startAnalysisBtn.disabled = true;
        startAnalysisBtn.innerHTML = '<span class="spinner"></span>Analyzing...';
        analysisProgress.style.display = 'block';
        
        try {
            progressFill.style.width = '20%';
            progressText.textContent = `🎯 Analyzing ${soundsWithData.length} sounds with creator data...`;
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            progressFill.style.width = '40%';
            progressText.textContent = '🔍 Finding creator overlaps...';
            
            // Analyze overlaps
            analyzeCreatorOverlaps();
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Fetch genres if Last.fm API key is available
            if (LASTFM_API_KEY) {
                progressFill.style.width = '60%';
                progressText.textContent = '🎵 Fetching genre information from Last.fm...';
                
                await fetchGenresForSounds();
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            progressFill.style.width = '80%';
            progressText.textContent = '📊 Analyzing hashtags...';
            
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

    // Fetch genres for all sounds
    async function fetchGenresForSounds() {
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => data.usernames.length > 0);
        
        for (const [url, data] of soundsWithData) {
            if (!data.genre) {
                try {
                    data.genre = await getGenreForSong(data.title);
                    if (data.genre) {
                        console.log(`Found genre for "${data.title}": ${data.genre}`);
                    }
                } catch (error) {
                    console.error(`Error fetching genre for "${data.title}":`, error);
                }
            }
        }
    }

    // Analyze creator overlaps (enhanced)
    function analyzeCreatorOverlaps() {
        const creatorCounts = {};
        const creatorSounds = {};
        
        // Only analyze sounds that have creator data
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => data.usernames.length > 0);
        
        // Count appearances across sounds
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
        
        // Sort by overlap count, then alphabetically
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

    // Analyze hashtags across all sounds
    function analyzeHashtags() {
        const hashtagFrequency = {};
        const hashtagBySoundCount = {};
        
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => data.usernames.length > 0);
        
        soundsWithData.forEach(([url, data]) => {
            const soundHashtags = new Set();
            
            // Collect hashtags from this sound
            Object.values(data.hashtags || {}).forEach(hashtags => {
                hashtags.forEach(hashtag => {
                    hashtagFrequency[hashtag] = (hashtagFrequency[hashtag] || 0) + 1;
                    soundHashtags.add(hashtag);
                });
            });
            
            // Count how many sounds each hashtag appears in
            soundHashtags.forEach(hashtag => {
                hashtagBySoundCount[hashtag] = (hashtagBySoundCount[hashtag] || 0) + 1;
            });
        });
        
        // Sort hashtags by frequency
        const sortedHashtags = Object.entries(hashtagFrequency)
            .sort(([a, countA], [b, countB]) => countB - countA)
            .slice(0, 50); // Top 50 hashtags
        
        analysisResults.hashtags = {
            frequency: hashtagFrequency,
            bySoundCount: hashtagBySoundCount,
            sorted: sortedHashtags
        };
    }

    // Display analysis results (enhanced)
    function displayResults() {
        updateSoundsOverview();
        updateCreatorsTable();
        updateHashtagsSection();
        resultsSection.style.display = 'block';
        
        // Smooth scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }

    function updateSoundsOverview() {
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => data.usernames.length > 0);
        
        soundsList.innerHTML = soundsWithData.map(([url, data]) => {
            const creatorCount = data.usernames.length;
            return `
                <div class="sound-item">
                    <div class="sound-title">${escapeHtml(data.title)}</div>
                    <div class="sound-url">${escapeHtml(url)}</div>
                    <div class="sound-stats">
                        <span><strong>${creatorCount.toLocaleString()}</strong> creators</span>
                        <span class="badge ${creatorCount > 150 ? 'high' : creatorCount > 50 ? 'medium' : ''}">${creatorCount > 150 ? 'High' : creatorCount > 50 ? 'Medium' : 'Low'} volume</span>
                    </div>
                    ${data.genre ? `<div style="margin-top: 8px; font-size: 12px; color: #666;">🎵 Genre: ${escapeHtml(data.genre)}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    function updateHashtagsSection() {
        if (!analysisResults.hashtags || analysisResults.hashtags.sorted.length === 0) return;
        
        // Add hashtags section to results if it doesn't exist
        if (!document.getElementById('hashtagsSection')) {
            const hashtagsHTML = `
                <div class="card" id="hashtagsSection" style="grid-column: 1 / -1; margin-top: 20px;">
                    <h2><span class="step-number">4</span>Most Common Hashtags</h2>
                    <div id="hashtagsList"></div>
                </div>
            `;
            resultsSection.insertAdjacentHTML('beforeend', hashtagsHTML);
        }
        
        const hashtagsList = document.getElementById('hashtagsList');
        const topHashtags = analysisResults.hashtags.sorted.slice(0, 20);
        
        hashtagsList.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 20px;">
                ${topHashtags.map(([hashtag, count]) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
                        <span style="font-weight: 500; color: #667eea;">#${escapeHtml(hashtag)}</span>
                        <span style="font-size: 12px; color: #666; background: white; padding: 2px 6px; border-radius: 10px;">${count}</span>
                    </div>
                `).join('')}
            </div>
            <div style="font-size: 12px; color: #666; text-align: center; margin-top: 15px;">
                💡 These hashtags appear most frequently across your analyzed sounds and may provide insights into trending themes
            </div>
        `;
    }

    function updateCreatorsTable() {
        const minSounds = parseInt(minSoundsSelect.value);
        const filteredCreators = analysisResults.sortedCreators.filter(([username, count]) => count >= minSounds);
        
        if (filteredCreators.length === 0) {
            creatorsTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #666;">No creators found matching the minimum sound requirement</td></tr>';
            return;
        }
        
        const totalSounds = analysisResults.totalSoundsAnalyzed;
        
        creatorsTableBody.innerHTML = filteredCreators.slice(0, 100).map(([username, count], index) => {
            const sounds = analysisResults.creatorSounds[username] || [];
            const overlapPercent = Math.round((count / totalSounds) * 100);
            const badgeClass = count >= 4 ? 'high' : count >= 3 ? 'medium' : '';
            
            return `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td class="creator-name">
                        <a href="https://www.tiktok.com/@${escapeHtml(username)}" target="_blank" style="color: #667eea; text-decoration: none; font-weight: 600;">
                            @${escapeHtml(username)} ↗️
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

    // Enhanced export functions
    exportCSVBtn.addEventListener('click', function() {
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
        
        downloadFile(csvContent, 'sound-analysis-overlapping-creators.csv', 'text/csv');
        showStatus('✅ Overlapping creators CSV exported successfully!', 'success');
    });

    // Add export all creators function
    window.exportAllCreators = function() {
        if (!soundsData || Object.keys(soundsData).length === 0) {
            showStatus('No data to export. Please run analysis first.', 'error');
            return;
        }
        
        const headers = ['Username', 'TikTok Link', 'Sound Title', 'Sound URL'];
        const rows = [];
        
        Object.entries(soundsData).forEach(([url, data]) => {
            if (data.usernames && data.usernames.length > 0) {
                data.usernames.forEach(username => {
                    rows.push([
                        username,
                        `https://www.tiktok.com/@${username}`,
                        data.title,
                        url
                    ]);
                });
            }
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        downloadFile(csvContent, 'sound-analysis-all-creators.csv', 'text/csv');
        showStatus('✅ All creators CSV exported successfully!', 'success');
    };

    exportTop50Btn.addEventListener('click', function() {
        if (!analysisResults.sortedCreators || analysisResults.sortedCreators.length === 0) {
            showStatus('No data to export. Please run analysis first.', 'error');
            return;
        }
        
        const top50 = analysisResults.sortedCreators.slice(0, 50);
        const totalSounds = analysisResults.totalSoundsAnalyzed;
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                description: 'Top 50 creators with highest sound overlap',
                totalSoundsAnalyzed: totalSounds,
                generatedBy: 'Sound Analysis Tool',
                genres: Object.fromEntries(
                    Object.entries(soundsData)
                        .filter(([url, data]) => data.genre)
                        .map(([url, data]) => [data.title, data.genre])
                ),
                topHashtags: analysisResults.hashtags ? analysisResults.hashtags.sorted.slice(0, 10) : []
            },
            topCreators: top50.map(([username, count], index) => {
                const sounds = analysisResults.creatorSounds[username] || [];
                const overlapPercent = Math.round((count / totalSounds) * 100);
                
                return {
                    rank: index + 1,
                    username: username,
                    tiktokLink: `https://www.tiktok.com/@${username}`,
                    soundCount: count,
                    overlapPercentage: overlapPercent,
                    reliabilityScore: calculateReliabilityScore(count, totalSounds),
                    soundsAppearedIn: sounds,
                    recommendedFor: count >= 4 ? 'High-priority campaigns' : count >= 3 ? 'Medium-priority campaigns' : 'Testing campaigns'
                };
            })
        };
        
        downloadFile(JSON.stringify(exportData, null, 2), 'top-50-creators.json', 'application/json');
        showStatus('✅ Top 50 creators exported as JSON!', 'success');
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
});
