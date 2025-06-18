// Sound Analysis - Main JavaScript functionality with Last.fm integration

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
    let soundsData = {}; // { soundUrl: { title: "", usernames: [], hashtags: [] } }
    let analysisResults = {}; // Creator overlap analysis

    // Last.fm API configuration
    const LASTFM_API_KEY = '08c0312974d651391752ca31baa83f4d';

    // Rate limiting for Last.fm API (5 requests per second max)
    const rateLimiter = {
        queue: [],
        processing: false,
        
        async add(fn) {
            return new Promise((resolve, reject) => {
                this.queue.push({ fn, resolve, reject });
                this.process();
            });
        },
        
        async process() {
            if (this.processing || this.queue.length === 0) return;
            
            this.processing = true;
            
            while (this.queue.length > 0) {
                const { fn, resolve, reject } = this.queue.shift();
                
                try {
                    const result = await fn();
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
                
                // Wait 250ms between requests (4 per second to be safe)
                await new Promise(resolve => setTimeout(resolve, 250));
            }
            
            this.processing = false;
        }
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
                    soundsData[url] = { title: title, usernames: [], hashtags: [] };
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

    // Update sounds display with clickable links and data input buttons
    function updateSoundsDisplay() {
        const soundCount = Object.keys(soundsData).length;
        
        if (soundCount > 0) {
            soundsAddedDiv.innerHTML = `
                <h4>📝 ${soundCount} Sound(s) Ready for Analysis:</h4>
                <div style="font-size: 12px; color: #666; margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                    💡 <strong>Instructions:</strong> Click each sound link to open in a new tab, use the extension to collect creators, then return here to add the data.
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

    // Global function for opening creator input modal
    window.openCreatorInputModal = function(soundUrl) {
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
            max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;
        
        // Format existing data for display
        const existingData = formatDataForModal(soundData);
        
        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="margin-bottom: 10px; color: #333; font-size: 20px;">📋 Add Creator Data</h3>
                <p style="color: #667eea; font-weight: 600; margin-bottom: 5px;">${escapeHtml(soundData.title)}</p>
                <p style="color: #666; font-size: 12px; word-break: break-all;">${escapeHtml(soundUrl)}</p>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">💡 Instructions:</h4>
                <ul style="color: #1976d2; font-size: 12px; margin-left: 15px; line-height: 1.5;">
                    <li><strong>Copy ALL data</strong> from the extension using "Copy All Data" button</li>
                    <li><strong>Paste below</strong> - the website will automatically parse song, creators, and hashtags</li>
                    <li>Format should be: SONG: Artist - Title, CREATORS: username1, username2, HASHTAGS: #tag1:count</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; font-weight: 600; color: #333; margin-bottom: 8px;">
                    Paste Extension Data (All in one):
                </label>
                <textarea 
                    id="allDataTextarea" 
                    placeholder="SONG: Artist - Song Title

CREATORS:
username1
username2
creator_name

HASHTAGS:
#hashtag1:5
#hashtag2:3"
                    style="width: 100%; height: 300px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: white;"
                >${existingData}</textarea>
                <div id="parseStatus" style="font-size: 11px; color: #999; margin-top: 8px; text-align: right;">
                    Paste data to see parse preview
                </div>
            </div>
            
            <div style="display: flex; gap: 15px;">
                <button id="saveCreatorData" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    💾 Parse & Save Data
                </button>
                <button id="cancelCreatorData" style="flex: 1; background: #f5f5f5; color: #333; border: 2px solid #ddd; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    ❌ Cancel
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add real-time parsing preview
        const textarea = document.getElementById('allDataTextarea');
        const parseStatus = document.getElementById('parseStatus');
        
        textarea.addEventListener('input', function() {
            const parsedData = parseExtensionData(this.value);
            parseStatus.innerHTML = `
                <div style="font-size: 10px; color: #333; background: #f0f0f0; padding: 5px; border-radius: 4px;">
                    Song: ${parsedData.song || 'Not found'}<br>
                    Artist: ${parsedData.artist || 'Not found'}<br>
                    Creators: ${parsedData.usernames.length}<br>
                    Hashtags: ${parsedData.hashtags.length}
                </div>
            `;
        });
        
        // Handle save
        document.getElementById('saveCreatorData').addEventListener('click', function() {
            const parsedData = parseExtensionData(textarea.value);
            
            // Update sound data
            if (parsedData.song && parsedData.artist) {
                soundsData[soundUrl].title = `${parsedData.artist} - ${parsedData.song}`;
            }
            soundsData[soundUrl].usernames = parsedData.usernames;
            soundsData[soundUrl].hashtags = parsedData.hashtags;
            
            updateSoundsDisplay();
            
            showStatus(`✅ Parsed and saved: ${parsedData.usernames.length} creators, ${parsedData.hashtags.length} hashtags!`, 'success');
            
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

    // Parse extension data from the unified format
    function parseExtensionData(data) {
        const result = {
            song: '',
            artist: '',
            usernames: [],
            hashtags: []
        };
        
        if (!data.trim()) return result;
        
        // Parse song information
        const songMatch = data.match(/SONG:\s*(.+?)(?:\n|$)/i);
        if (songMatch) {
            const songLine = songMatch[1].trim();
            // Try to parse "Artist - Song" format
            const artistSongMatch = songLine.match(/(.+?)\s*-\s*(.+)/);
            if (artistSongMatch) {
                result.artist = artistSongMatch[1].trim();
                result.song = artistSongMatch[2].trim();
            } else {
                result.song = songLine;
            }
        }
        
        // Parse creators section
        const creatorsMatch = data.match(/CREATORS:\s*([\s\S]*?)(?:\n\n|HASHTAGS:|$)/i);
        if (creatorsMatch) {
            const creatorsText = creatorsMatch[1];
            result.usernames = creatorsText
                .split('\n')
                .map(line => line.trim().replace('@', ''))
                .filter(username => username.length > 0 && !username.toLowerCase().includes('hashtag'));
        }
        
        // Parse hashtags section
        const hashtagsMatch = data.match(/HASHTAGS:\s*([\s\S]*?)$/i);
        if (hashtagsMatch) {
            const hashtagsText = hashtagsMatch[1];
            const hashtagLines = hashtagsText.split('\n').filter(line => line.trim());
            
            hashtagLines.forEach(line => {
                const hashtagMatch = line.match(/#([^:]+):(\d+)/);
                if (hashtagMatch) {
                    result.hashtags.push([hashtagMatch[1], parseInt(hashtagMatch[2])]);
                }
            });
        }
        
        return result;
    }

    // Format existing data for modal display
    function formatDataForModal(soundData) {
        if (!soundData.usernames.length && !soundData.hashtags.length) {
            return '';
        }
        
        let formatted = '';
        
        if (soundData.title) {
            formatted += `SONG: ${soundData.title}\n\n`;
        }
        
        if (soundData.usernames.length > 0) {
            formatted += `CREATORS:\n${soundData.usernames.join('\n')}\n\n`;
        }
        
        if (soundData.hashtags.length > 0) {
            formatted += `HASHTAGS:\n${soundData.hashtags.map(([tag, count]) => `#${tag}:${count}`).join('\n')}`;
        }
        
        return formatted;
    }

    // Start analysis process
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
            progressFill.style.width = '30%';
            progressText.textContent = `🎯 Analyzing ${soundsWithData.length} sounds with creator data...`;
            
            // Small delay for visual feedback
            await new Promise(resolve => setTimeout(resolve, 500));
            
            progressFill.style.width = '70%';
            progressText.textContent = '🔍 Finding creator overlaps...';
            
            // Analyze overlaps
            analyzeCreatorOverlaps();
            
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
                if (countB !== countA) return countB - countA; // Sort by count descending
                return a.localeCompare(b); // Then alphabetically
            })
            .filter(([,count]) => count >= 2); // Only show creators appearing in multiple sounds
        
        // Analyze hashtags across all sounds
        const globalHashtags = {};
        soundsWithData.forEach(([soundUrl, data]) => {
            if (data.hashtags && Array.isArray(data.hashtags)) {
                data.hashtags.forEach(([hashtag, count]) => {
                    if (!globalHashtags[hashtag]) {
                        globalHashtags[hashtag] = 0;
                    }
                    globalHashtags[hashtag] += count;
                });
            }
        });
        
        // Sort hashtags by frequency
        const sortedHashtags = Object.entries(globalHashtags)
            .sort(([a, countA], [b, countB]) => countB - countA)
            .slice(0, 20); // Top 20 hashtags
        
        analysisResults = {
            creatorCounts,
            creatorSounds,
            sortedCreators,
            globalHashtags: sortedHashtags,
            totalSoundsAnalyzed: soundsWithData.length
        };
    }

    // Display analysis results
    function displayResults() {
        updateSoundsOverview();
        displayHashtagAnalysis();
        displayGenreAnalysis();
        updateCreatorsTable();
        resultsSection.style.display = 'block';
        
        // Smooth scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }

    // Display hashtag analysis (consolidated with bubble style)
    function displayHashtagAnalysis() {
        const hashtagsSection = document.getElementById('hashtagsSection');
        if (!hashtagsSection) return;
        
        const { globalHashtags } = analysisResults;
        
        if (!globalHashtags || globalHashtags.length === 0) {
            hashtagsSection.innerHTML = `
                <h3>📊 Top Global Hashtags</h3>
                <p style="color: #666; text-align: center; padding: 20px;">No hashtags found in the analyzed sounds</p>
            `;
            return;
        }
        
        hashtagsSection.innerHTML = `
            <h3>📊 Top Global Hashtags (${globalHashtags.length} found)</h3>
            <div class="hashtags-bubble-container" style="
                display: flex; 
                flex-wrap: wrap; 
                gap: 8px; 
                padding: 20px; 
                background: #f8f9fa; 
                border-radius: 12px; 
                margin-top: 15px;
                max-height: 200px;
                overflow-y: auto;
            ">
                ${globalHashtags.map(([hashtag, count], index) => {
                    // Create size based on frequency (largest gets size 1.4em, smallest gets 0.9em)
                    const maxCount = Math.max(...globalHashtags.map(([,c]) => c));
                    const minCount = Math.min(...globalHashtags.map(([,c]) => c));
                    const sizeRange = maxCount - minCount;
                    const normalizedSize = sizeRange > 0 ? (count - minCount) / sizeRange : 0.5;
                    const fontSize = 0.9 + (normalizedSize * 0.5); // 0.9em to 1.4em
                    
                    // Color intensity based on frequency
                    const intensity = Math.round(100 + (normalizedSize * 155)); // 100 to 255
                    const bgColor = `rgba(102, 126, 234, ${0.1 + (normalizedSize * 0.2)})`; // 0.1 to 0.3 opacity
                    
                    return `
                        <span class="hashtag-bubble" style="
                            display: inline-block;
                            background: ${bgColor};
                            color: #667eea;
                            padding: 6px 12px;
                            border-radius: 20px;
                            font-size: ${fontSize}em;
                            font-weight: 600;
                            border: 2px solid rgba(102, 126, 234, ${0.2 + (normalizedSize * 0.3)});
                            transition: transform 0.2s ease, box-shadow 0.2s ease;
                            cursor: default;
                            white-space: nowrap;
                        " 
                        onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'" 
                        onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'"
                        title="Used ${count} times across sounds"
                        >
                            #${escapeHtml(hashtag)} <span style="
                                background: rgba(102, 126, 234, 0.2); 
                                padding: 2px 6px; 
                                border-radius: 10px; 
                                font-size: 0.8em; 
                                margin-left: 4px;
                            ">${count}</span>
                        </span>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Display genre analysis
    function displayGenreAnalysis() {
        const genreSection = document.getElementById('genreSection');
        if (!genreSection) return;
        
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => data.usernames.length > 0);
        
        if (soundsWithData.length === 0) {
            genreSection.innerHTML = `
                <h3>🎵 Genre Analysis</h3>
                <p style="color: #666; text-align: center; padding: 20px;">No sounds to analyze</p>
            `;
            return;
        }
        
        genreSection.innerHTML = `
            <h3>🎵 Genre Analysis</h3>
            <div id="genreAnalysisContent">
                <div style="text-align: center; padding: 20px;">
                    <div class="spinner" style="margin: 0 auto 10px;"></div>
                    <p>Analyzing genres using Last.fm API...</p>
                </div>
            </div>
        `;
        
        // Start genre analysis
        analyzeGenres(soundsWithData);
    }

    // Parse song title to extract artist and track
    function parseSongTitle(title) {
        // Try different patterns
        const patterns = [
            /(.+?) - (.+)/, // Artist - Track
            /(.+?) by (.+)/, // Track by Artist (reverse)
            /(.+?) \| (.+)/, // Artist | Track
            /(.+?) · (.+)/, // Artist · Track
        ];
        
        for (const pattern of patterns) {
            const match = title.match(pattern);
            if (match) {
                return {
                    artist: match[1].trim(),
                    track: match[2].trim()
                };
            }
        }
        
        // If no pattern matches, assume it's just the track name
        return {
            artist: '',
            track: title.trim()
        };
    }

    // Get genre from Last.fm API with better error handling
    async function getGenreFromLastFM(artist, track) {
        if (!LASTFM_API_KEY) {
            throw new Error('Last.fm API key not configured');
        }
        
        console.log(`Looking up genre for: "${track}" by "${artist}"`);
        
        try {
            // First try to get track info
            const trackUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&format=json`;
            
            console.log('Track URL:', trackUrl);
            
            const trackResponse = await fetch(trackUrl);
            const trackData = await trackResponse.json();
            
            console.log('Track response:', trackData);
            
            if (trackData.error) {
                console.log('Track API error:', trackData.message);
            } else if (trackData.track && trackData.track.toptags && trackData.track.toptags.tag && trackData.track.toptags.tag.length > 0) {
                // Get top 3 tags from track
                const tags = trackData.track.toptags.tag.slice(0, 3).map(tag => tag.name);
                console.log('Found track tags:', tags);
                return tags.join(', ');
            }
            
            // Fallback to artist info if track tags not available
            console.log('No track tags found, trying artist...');
            const artistUrl = `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(artist)}&format=json`;
            
            console.log('Artist URL:', artistUrl);
            
            const artistResponse = await fetch(artistUrl);
            const artistData = await artistResponse.json();
            
            console.log('Artist response:', artistData);
            
            if (artistData.error) {
                console.log('Artist API error:', artistData.message);
            } else if (artistData.artist && artistData.artist.tags && artistData.artist.tags.tag && artistData.artist.tags.tag.length > 0) {
                const tags = artistData.artist.tags.tag.slice(0, 3).map(tag => tag.name);
                console.log('Found artist tags:', tags);
                return tags.join(', ');
            }
            
            // Try alternative search method
            console.log('No artist tags found, trying search...');
            const searchUrl = `https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;
            
            const searchResponse = await fetch(searchUrl);
            const searchData = await searchResponse.json();
            
            console.log('Search response:', searchData);
            
            if (searchData.results && searchData.results.trackmatches && searchData.results.trackmatches.track && searchData.results.trackmatches.track.length > 0) {
                const foundTrack = searchData.results.trackmatches.track[0];
                console.log('Found track via search:', foundTrack);
                
                // Try to get info for the found track
                const foundTrackUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(foundTrack.artist)}&track=${encodeURIComponent(foundTrack.name)}&format=json`;
                
                const foundTrackResponse = await fetch(foundTrackUrl);
                const foundTrackData = await foundTrackResponse.json();
                
                if (foundTrackData.track && foundTrackData.track.toptags && foundTrackData.track.toptags.tag && foundTrackData.track.toptags.tag.length > 0) {
                    const tags = foundTrackData.track.toptags.tag.slice(0, 3).map(tag => tag.name);
                    console.log('Found tags via search:', tags);
                    return tags.join(', ');
                }
            }
            
            console.log('No genres found for this track');
            return null;
            
        } catch (error) {
            console.error('Last.fm API error:', error);
            return null;
        }
    }

    // Analyze genres using Last.fm API
    async function analyzeGenres(soundsWithData) {
        const genreAnalysisContent = document.getElementById('genreAnalysisContent');
        const genres = {};
        const soundGenres = {};
        
        try {
            for (let i = 0; i < soundsWithData.length; i++) {
                const [url, data] = soundsWithData[i];
                
                // Update progress
                genreAnalysisContent.innerHTML = `
                    <div style="text-align: center; padding: 20px;">
                        <div class="spinner" style="margin: 0 auto 10px;"></div>
                        <p>Analyzing sound ${i + 1} of ${soundsWithData.length}...</p>
                        <div class="progress-bar" style="background: #e9ecef; border-radius: 10px; height: 8px; margin-top: 10px;">
                            <div class="progress-fill" style="background: linear-gradient(135deg, #667eea, #764ba2); height: 100%; width: ${((i + 1) / soundsWithData.length) * 100}%; border-radius: 10px; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                `;
                
                // Parse artist and track from title
                const { artist, track } = parseSongTitle(data.title);
                
                // Get genre from Last.fm using rate limiter
                const genre = await rateLimiter.add(() => getGenreFromLastFM(artist, track));
                
                if (genre) {
                    soundGenres[data.title] = genre;
                    genre.split(',').forEach(g => {
                        const cleanGenre = g.trim().toLowerCase();
                        genres[cleanGenre] = (genres[cleanGenre] || 0) + 1;
                    });
                }
            }
            
            // Display results
            displayGenreResults(genres, soundGenres);
            
        } catch (error) {
            console.error('Genre analysis error:', error);
            genreAnalysisContent.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #e74c3c;">
                    <p>⚠️ Genre analysis failed: ${error.message}</p>
                    <p style="font-size: 14px; margin-top: 10px;">This might be due to:</p>
                    <ul style="text-align: left; max-width: 400px; margin: 10px auto; font-size: 14px;">
                        <li>API rate limiting</li>
                        <li>Network connectivity issues</li>
                        <li>Last.fm service unavailable</li>
                    </ul>
                </div>
            `;
        }
    }

    // Display genre analysis results
    function displayGenreResults(genres, soundGenres) {
        const genreAnalysisContent = document.getElementById('genreAnalysisContent');
        
        const sortedGenres = Object.entries(genres)
            .sort(([a, countA], [b, countB]) => countB - countA)
            .slice(0, 10);
        
        if (sortedGenres.length === 0) {
            genreAnalysisContent.innerHTML = `
                <p style="color: #666; text-align: center; padding: 20px;">No genres identified from Last.fm</p>
            `;
            return;
        }
        
        genreAnalysisContent.innerHTML = `
            <div class="genre-overview" style="margin-bottom: 30px;">
                <h4>Top Genres Across All Sounds</h4>
                <div class="genre-bars">
                    ${sortedGenres.map(([genre, count]) => {
                        const percentage = Math.round((count / Object.values(genres).reduce((a, b) => a + b, 0)) * 100);
                        return `
                            <div class="genre-bar" style="margin-bottom: 10px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                    <span style="font-weight: 600; text-transform: capitalize;">${escapeHtml(genre)}</span>
                                    <span style="font-size: 14px; color: #666;">${count} songs (${percentage}%)</span>
                                </div>
                                <div style="background: #e9ecef; border-radius: 6px; height: 8px;">
                                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); height: 100%; width: ${percentage}%; border-radius: 6px; transition: width 0.3s ease;"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            
            <div class="sound-genres">
                <h4>Individual Sound Genres</h4>
                <div class="genre-list">
                    ${Object.entries(soundGenres).map(([title, genre]) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8f9fa; border-radius: 6px; margin-bottom: 8px;">
                            <span style="font-weight: 500;">${escapeHtml(title)}</span>
                            <span style="background: #28a745; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; text-transform: capitalize;">${escapeHtml(genre)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
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
                </div>
            `;
        }).join('');
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

    // Export functions
    exportCSVBtn.addEventListener('click', function() {
        if (!analysisResults.sortedCreators || analysisResults.sortedCreators.length === 0) {
            showStatus('No data to export. Please run analysis first.', 'error');
            return;
        }
        
        const headers = ['Rank', 'Username', 'Sound Count', 'Overlap Percentage', 'Sounds Appeared In'];
        const totalSounds = analysisResults.totalSoundsAnalyzed;
        
        const rows = analysisResults.sortedCreators.map(([username, count], index) => {
            const sounds = analysisResults.creatorSounds[username] || [];
            const overlapPercent = Math.round((count / totalSounds) * 100);
            
            return [
                index + 1,
                username,
                count,
                `${overlapPercent}%`,
                `"${sounds.join(', ')}"`
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        downloadFile(csvContent, 'sound-analysis-creators.csv', 'text/csv');
        showStatus('✅ CSV exported successfully!', 'success');
    });

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
                generatedBy: 'Sound Analysis Tool'
            },
            topCreators: top50.map(([username, count], index) => {
                const sounds = analysisResults.creatorSounds[username] || [];
                const overlapPercent = Math.round((count / totalSounds) * 100);
                
                return {
                    rank: index + 1,
                    username: username,
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
