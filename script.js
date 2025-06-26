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
                        videoCount: null
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

    // Update sounds display with clickable links and data input buttons
    function updateSoundsDisplay() {
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

    // Start analysis process
    startAnalysisBtn.addEventListener('click', async function() {
        const soundUrls = Object.keys(soundsData);
        const soundsWithData = soundUrls.filter(url => 
            soundsData[url].usernames.length > 0 || (soundsData[url].hashtags && soundsData[url].hashtags.length > 0)
        );
        
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
            progressText.textContent = '🔍 Finding creator overlaps and hashtag patterns...';
            
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
            const totalHashtags = analysisResults.sortedHashtags ? analysisResults.sortedHashtags.length : 0;
            
            showStatus(`🎉 Analysis complete! Found ${totalCreators} unique creators with ${overlappingCreators} appearing across multiple sounds and ${totalHashtags} hashtags.`, 'success');
            
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

    // Analyze creator overlaps and hashtag patterns
    function analyzeCreatorOverlaps() {
        const creatorCounts = {};
        const creatorSounds = {};
        const hashtagCounts = {};
        const hashtagSounds = {};
        
        // Only analyze sounds that have creator data
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => 
            data.usernames.length > 0 || (data.hashtags && data.hashtags.length > 0)
        );
        
        // Count creator appearances across sounds
        soundsWithData.forEach(([soundUrl, data]) => {
            data.usernames.forEach(username => {
                if (!creatorCounts[username]) {
                    creatorCounts[username] = 0;
                    creatorSounds[username] = [];
                }
                creatorCounts[username]++;
                creatorSounds[username].push(data.title);
            });
            
            // Count hashtag appearances across sounds
            if (data.hashtags) {
                data.hashtags.forEach(([hashtag, count]) => {
                    if (!hashtagCounts[hashtag]) {
                        hashtagCounts[hashtag] = 0;
                        hashtagSounds[hashtag] = [];
                    }
                    hashtagCounts[hashtag] += count;
                    if (!hashtagSounds[hashtag].includes(data.title)) {
                        hashtagSounds[hashtag].push(data.title);
                    }
                });
            }
        });
        
        // Sort by overlap count, then alphabetically
        const sortedCreators = Object.entries(creatorCounts)
            .sort(([a, countA], [b, countB]) => {
                if (countB !== countA) return countB - countA; // Sort by count descending
                return a.localeCompare(b); // Then alphabetically
            })
            .filter(([,count]) => count >= 2); // Only show creators appearing in multiple sounds
        
        // Sort hashtags by frequency
        const sortedHashtags = Object.entries(hashtagCounts)
            .sort(([a, countA], [b, countB]) => {
                if (countB !== countA) return countB - countA;
                return a.localeCompare(b);
            });
        
        // Generate genre insights
        const genreInsights = generateGenreInsights(soundsWithData, sortedHashtags);
        
        analysisResults = {
            creatorCounts,
            creatorSounds,
            sortedCreators,
            hashtagCounts,
            hashtagSounds,
            sortedHashtags,
            genreInsights,
            totalSoundsAnalyzed: soundsWithData.length
        };
    }

    // Generate insights about hashtag patterns and potential genres
    function generateGenreInsights(soundsWithData, sortedHashtags) {
        const insights = [];
        
        // Define genre-related hashtag patterns
        const genrePatterns = {
            'Dance/Movement': ['dance', 'dancing', 'choreography', 'moves', 'step', 'groove', 'rhythm', 'dancechallenge'],
            'Pop/Mainstream': ['pop', 'radio', 'mainstream', 'charts', 'hit', 'single', 'album'],
            'Hip-Hop/Rap': ['hiphop', 'rap', 'rapper', 'bars', 'flow', 'beats', 'cypher', 'freestyle'],
            'R&B/Soul': ['rnb', 'soul', 'smooth', 'vocals', 'harmony', 'groove'],
            'Electronic/EDM': ['edm', 'electronic', 'synth', 'bass', 'drop', 'festival', 'rave', 'techno', 'house'],
            'Rock/Alternative': ['rock', 'guitar', 'band', 'alternative', 'indie', 'grunge'],
            'Country': ['country', 'nashville', 'cowboy', 'rural', 'southern'],
            'Latin': ['latin', 'reggaeton', 'salsa', 'bachata', 'spanish', 'latino'],
            'Emotional/Mood': ['sad', 'happy', 'mood', 'feelings', 'emotional', 'heartbreak', 'love', 'depression', 'anxiety'],
            'Lifestyle/Aesthetic': ['aesthetic', 'vibe', 'mood', 'lifestyle', 'fashion', 'style', 'outfit', 'grwm'],
            'Comedy/Entertainment': ['funny', 'comedy', 'joke', 'humor', 'entertainment', 'meme', 'laugh'],
            'Fitness/Sports': ['workout', 'fitness', 'gym', 'sport', 'exercise', 'health', 'training'],
            'Gaming': ['gaming', 'gamer', 'game', 'twitch', 'streamer', 'esports'],
            'Food/Cooking': ['food', 'cooking', 'recipe', 'chef', 'kitchen', 'baking', 'foodie'],
            'Beauty/Fashion': ['beauty', 'makeup', 'skincare', 'fashion', 'style', 'outfit', 'glam'],
            'DIY/Creative': ['diy', 'craft', 'creative', 'art', 'handmade', 'tutorial', 'howto']
        };
        
        // Analyze hashtag patterns
        const categoryScores = {};
        
        sortedHashtags.forEach(([hashtag, count]) => {
            const lowerHashtag = hashtag.toLowerCase();
            
            Object.entries(genrePatterns).forEach(([category, keywords]) => {
                const matches = keywords.filter(keyword => 
                    lowerHashtag.includes(keyword) || keyword.includes(lowerHashtag)
                );
                
                if (matches.length > 0) {
                    if (!categoryScores[category]) categoryScores[category] = 0;
                    categoryScores[category] += count * matches.length;
                }
            });
        });
        
        // Sort categories by score
        const topCategories = Object.entries(categoryScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        if (topCategories.length > 0) {
            insights.push({
                type: 'genre_patterns',
                title: '🎭 Content Category Analysis',
                data: topCategories,
                description: 'Based on hashtag patterns, this sound appears to be popular in these content categories:'
            });
        }
        
        // Cross-sound hashtag analysis
        if (soundsWithData.length > 1) {
            const crossSoundHashtags = sortedHashtags.filter(([hashtag]) => {
                const soundsWithThisHashtag = Object.values(soundsData).filter(sound => 
                    sound.hashtags && sound.hashtags.some(([h]) => h === hashtag)
                ).length;
                return soundsWithThisHashtag > 1;
            }).slice(0, 10);
            
            if (crossSoundHashtags.length > 0) {
                insights.push({
                    type: 'cross_sound_hashtags',
                    title: '🔗 Cross-Sound Hashtag Trends',
                    data: crossSoundHashtags,
                    description: 'These hashtags appear across multiple sounds in your analysis:'
                });
            }
        }
        
        // Engagement patterns
        const highEngagementHashtags = sortedHashtags.filter(([,count]) => count > 50).slice(0, 8);
        if (highEngagementHashtags.length > 0) {
            insights.push({
                type: 'high_engagement',
                title: '🔥 High-Engagement Hashtags',
                data: highEngagementHashtags,
                description: 'These hashtags show particularly high usage counts:'
            });
        }
        
        return insights;
    }

    // Display analysis results
    function displayResults() {
        updateSoundsOverview();
        updateCreatorsTable();
        updateHashtagsDisplay();
        updateGenreInsights();
        resultsSection.style.display = 'block';
        
        // Show hashtags section if we have hashtag data
        if (analysisResults.sortedHashtags && analysisResults.sortedHashtags.length > 0) {
            hashtagsSection.style.display = 'block';
        }
        
        // Smooth scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }

    function updateSoundsOverview() {
        const soundsWithData = Object.entries(soundsData).filter(([url, data]) => 
            data.usernames.length > 0 || (data.hashtags && data.hashtags.length > 0)
        );
        
        soundsList.innerHTML = soundsWithData.map(([url, data]) => {
            const creatorCount = data.usernames.length;
            const hashtagCount = data.hashtags ? data.hashtags.length : 0;
            const totalHashtagUsage = data.hashtags ? data.hashtags.reduce((sum, [,count]) => sum + count, 0) : 0;
            
            return `
                <div class="sound-item">
                    <div class="sound-title">${escapeHtml(data.title)}</div>
                    ${data.videoCount ? `<div style="color: #666; font-size: 12px; margin-bottom: 5px;">📊 ${escapeHtml(data.videoCount)}</div>` : ''}
                    <div class="sound-url">${escapeHtml(url)}</div>
                    <div class="sound-stats">
                        <div>
                            <span><strong>${creatorCount.toLocaleString()}</strong> creators</span>
                            ${hashtagCount > 0 ? `<span style="margin-left: 10px;"><strong>${hashtagCount}</strong> hashtags (${totalHashtagUsage.toLocaleString()} uses)</span>` : ''}
                        </div>
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

    function updateHashtagsDisplay() {
        if (!analysisResults.sortedHashtags || analysisResults.sortedHashtags.length === 0) {
            hashtagsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">No hashtag data available</td></tr>';
            return;
        }
        
        const minCount = parseInt(minHashtagCountSelect.value);
        const filteredHashtags = analysisResults.sortedHashtags.filter(([hashtag, count]) => count >= minCount);
        
        if (filteredHashtags.length === 0) {
            hashtagsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #666;">No hashtags found matching the minimum usage requirement</td></tr>';
            return;
        }
        
        hashtagsTableBody.innerHTML = filteredHashtags.slice(0, 50).map(([hashtag, count], index) => {
            const sounds = analysisResults.hashtagSounds[hashtag] || [];
            const badgeClass = count >= 50 ? 'high' : count >= 20 ? 'medium' : '';
            
            return `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td>
                        <a href="https://www.tiktok.com/tag/${encodeURIComponent(hashtag)}" target="_blank" class="hashtag-link">
                            #${escapeHtml(hashtag)} ↗️
                        </a>
                    </td>
                    <td><span class="badge ${badgeClass}">${count.toLocaleString()}</span></td>
                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${sounds.map(s => escapeHtml(s)).join(', ')}">${sounds.map(s => escapeHtml(s)).join(', ')}</td>
                </tr>
            `;
        }).join('');
    }

    function updateGenreInsights() {
        if (!analysisResults.genreInsights || analysisResults.genreInsights.length === 0) {
            genreInsights.innerHTML = '';
            return;
        }
        
        genreInsights.innerHTML = analysisResults.genreInsights.map(insight => {
            let content = `
                <div class="genre-insight">
                    <h4>${insight.title}</h4>
                    <p>${insight.description}</p>
            `;
            
            if (insight.type === 'genre_patterns') {
                content += `
                    <div class="genre-tags">
                        ${insight.data.map(([category, score]) => `
                            <div class="genre-tag">
                                <span>${category}</span>
                                <span style="opacity: 0.8;">(${score})// Sound Analysis - Main JavaScript functionality

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
            formatted += 'HASHT
