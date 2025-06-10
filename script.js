// Sound Analysis - Main JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const statusDiv = document.getElementById('status');
    const soundUrlsTextarea = document.getElementById('soundUrls');
    const creatorLimitSelect = document.getElementById('creatorLimit');
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
    
    // Manual data elements
    const manualDataSection = document.getElementById('manualDataSection');
    const addManualDataBtn = document.getElementById('addManualData');

    // Data storage
    let soundsData = {}; // { soundUrl: { title: "", usernames: [] } }
    let analysisResults = {}; // Creator overlap analysis
    let dataMode = 'simulated'; // 'simulated' or 'manual'
    
    // Check for extension data on page load
    checkForExtensionData();

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
                title = title.replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
                return title;
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
                    soundsData[url] = { title: title, usernames: [] };
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
            startAnalysisBtn.disabled = false;
        } else {
            message = 'No new sounds added. ';
            if (duplicates > 0) message += `${duplicates} were duplicates. `;
            if (invalid > 0) message += `${invalid} had invalid URLs.`;
            showStatus(message, 'error');
        }
    });
    
    // Handle data mode switching
    document.querySelectorAll('input[name="dataMode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            dataMode = this.value;
            manualDataSection.style.display = dataMode === 'manual' ? 'block' : 'none';
        });
    });
    
    // Manual data entry
    addManualDataBtn.addEventListener('click', function() {
        openManualDataModal();
    });
    
    function openManualDataModal() {
        // Create modal for manual data entry
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
        `;
        
        modalContent.innerHTML = `
            <h3 style="margin-bottom: 20px; color: #333;">📋 Manual Creator Data Entry</h3>
            <p style="color: #666; margin-bottom: 15px;">For each sound you've added, paste the creators you've found (one per line):</p>
            
            ${Object.entries(soundsData).map(([url, data]) => `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e1e8ed; border-radius: 8px;">
                    <h4 style="margin-bottom: 10px; color: #333;">${data.title}</h4>
                    <textarea 
                        id="creators-${simpleHash(url)}" 
                        placeholder="username1
username2  
@username3
creator_name_4
..."
                        style="width: 100%; height: 100px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; font-size: 12px;"
                    ></textarea>
                    <div style="font-size: 11px; color: #666; margin-top: 5px;">
                        You can include or exclude @ symbols - they'll be normalized automatically
                    </div>
                </div>
            `).join('')}
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="saveManualData" style="flex: 1; background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">
                    💾 Save Creator Data
                </button>
                <button id="cancelManualData" style="flex: 1; background: #ccc; color: #333; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">
                    ❌ Cancel
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Handle save
        document.getElementById('saveManualData').addEventListener('click', function() {
            let totalCreators = 0;
            
            Object.entries(soundsData).forEach(([url, data]) => {
                const textarea = document.getElementById(`creators-${simpleHash(url)}`);
                if (textarea) {
                    const creators = textarea.value
                        .split('\n')
                        .map(name => name.trim().replace('@', ''))
                        .filter(name => name.length > 0);
                    
                    soundsData[url].usernames = creators;
                    totalCreators += creators.length;
                }
            });
            
            updateSoundsDisplay();
            showStatus(`✅ Saved ${totalCreators} creators across ${Object.keys(soundsData).length} sounds!`, 'success');
            document.body.removeChild(modal);
            
            // Enable analysis if we have data
            if (totalCreators > 0) {
                startAnalysisBtn.disabled = false;
                startAnalysisBtn.textContent = `🎯 Analyze Manual Data`;
            }
        });
        
        // Handle cancel
        document.getElementById('cancelManualData').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    // Update sounds display
    function updateSoundsDisplay() {
        const soundCount = Object.keys(soundsData).length;
        
        if (soundCount > 0) {
            soundsAddedDiv.innerHTML = `
                <h4>📝 ${soundCount} Sound(s) Ready for Analysis:</h4>
                ${Object.entries(soundsData).map(([url, data]) => `
                    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 8px 0; border-left: 4px solid #667eea;">
                        <div style="font-weight: 600; color: #333; margin-bottom: 4px;">${escapeHtml(data.title)}</div>
                        <div style="font-size: 11px; color: #666; margin-bottom: 6px;">${escapeHtml(url)}</div>
                        <div style="font-size: 12px; color: #667eea;">
                            ${data.usernames.length > 0 ? `✅ ${data.usernames.length} creators collected` : '⏳ Pending analysis'}
                        </div>
                    </div>
                `).join('')}
            `;
            
            startAnalysisBtn.textContent = `🚀 Analyze ${soundCount} Sound(s)`;
        } else {
            soundsAddedDiv.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No sounds added yet</p>';
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Start Analysis';
        }
    }

    // Generate simulated creator data (for demo purposes)
    function generateSimulatedCreators(count, soundTitle) {
        const creators = [];
        const soundHash = simpleHash(soundTitle);
        
        // Create some common creators across sounds for realistic overlap
        const commonCreators = [
            'musiclover_2024', 'tiktok_dancer', 'viral_vibes', 'sound_creator', 'music_maven',
            'beat_drops', 'melody_maker', 'rhythm_king', 'audio_artist', 'track_master',
            'song_specialist', 'music_influencer', 'sound_sage', 'beat_builder', 'tune_titan'
        ];
        
        // Add some common creators (for overlap simulation)
        const numCommon = Math.min(15, Math.floor(count * 0.15)); // 15% overlap
        for (let i = 0; i < numCommon; i++) {
            creators.push(commonCreators[i % commonCreators.length]);
        }
        
        // Generate unique creators for this sound
        for (let i = numCommon; i < count; i++) {
            creators.push(`creator_${soundHash}_${i - numCommon}`);
        }
        
        // Shuffle the array to make it more realistic
        return shuffleArray(creators);
    }

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) % 1000;
    }

    function shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Simulate creator collection process
    async function simulateCreatorCollection(soundUrl, targetCount) {
        const soundTitle = soundsData[soundUrl].title;
        const baseCreators = generateSimulatedCreators(targetCount, soundTitle);
        
        // Simulate realistic processing time
        const processingTime = 1500 + Math.random() * 2000; // 1.5-3.5 seconds
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        return baseCreators;
    }

    // Start analysis process
    startAnalysisBtn.addEventListener('click', async function() {
        const soundUrls = Object.keys(soundsData);
        const targetCount = parseInt(creatorLimitSelect.value);
        
        if (soundUrls.length === 0) {
            showStatus('No sounds to analyze', 'error');
            return;
        }
        
        startAnalysisBtn.disabled = true;
        startAnalysisBtn.innerHTML = '<span class="spinner"></span>Analyzing...';
        analysisProgress.style.display = 'block';
        
        try {
            for (let i = 0; i < soundUrls.length; i++) {
                const url = soundUrls[i];
                const soundTitle = soundsData[url].title;
                
                // Update progress
                const progress = (i / soundUrls.length) * 100;
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `Processing "${soundTitle}" (${i + 1}/${soundUrls.length})...`;
                
                // Skip if we already have manual data
                if (dataMode === 'manual' && soundsData[url].usernames.length > 0) {
                    progressText.textContent = `✅ Using manual data for "${soundTitle}" (${soundsData[url].usernames.length} creators)`;
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                
                // Only simulate if in simulated mode and no existing data
                if (dataMode === 'simulated') {
                    const creators = await simulateCreatorCollection(url, targetCount);
                    soundsData[url].usernames = creators;
                    progressText.textContent = `✅ Collected ${creators.length} creators from "${soundTitle}"`;
                    updateSoundsDisplay();
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }
            
            // Complete progress
            progressFill.style.width = '100%';
            progressText.textContent = '🎯 Analyzing creator overlaps...';
            
            // Small delay for the final step
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Analyze overlaps
            analyzeCreatorOverlaps();
            
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
            startAnalysisBtn.textContent = '🚀 Start Analysis';
            setTimeout(() => {
                analysisProgress.style.display = 'none';
            }, 2000);
        }
    });

    // Analyze creator overlaps
    function analyzeCreatorOverlaps() {
        const creatorCounts = {};
        const creatorSounds = {};
        
        // Count appearances across sounds
        Object.entries(soundsData).forEach(([soundUrl, data]) => {
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
        
        analysisResults = {
            creatorCounts,
            creatorSounds,
            sortedCreators
        };
    }

    // Display analysis results
    function displayResults() {
        updateSoundsOverview();
        updateCreatorsTable();
        resultsSection.style.display = 'block';
        
        // Smooth scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);
    }

    function updateSoundsOverview() {
        soundsList.innerHTML = Object.entries(soundsData).map(([url, data]) => {
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
        
        const totalSounds = Object.keys(soundsData).length;
        
        creatorsTableBody.innerHTML = filteredCreators.slice(0, 100).map(([username, count], index) => {
            const sounds = analysisResults.creatorSounds[username] || [];
            const overlapPercent = Math.round((count / totalSounds) * 100);
            const badgeClass = count >= 4 ? 'high' : count >= 3 ? 'medium' : '';
            
            return `
                <tr>
                    <td><strong>${index + 1}</strong></td>
                    <td class="creator-name">@${escapeHtml(username)}</td>
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
        const totalSounds = Object.keys(soundsData).length;
        
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
        const totalSounds = Object.keys(soundsData).length;
        
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
    
    // Extension communication
    function checkForExtensionData() {
        // Check URL parameters for extension data
        const urlParams = new URLSearchParams(window.location.search);
        const extensionData = urlParams.get('extensionData');
        
        if (extensionData) {
            try {
                const data = JSON.parse(decodeURIComponent(extensionData));
                if (data.action === 'receiveCollectedData' && data.soundData) {
                    handleExtensionData(data.soundData);
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } catch (error) {
                console.error('Error parsing extension data:', error);
            }
        }
        
        // Listen for direct messages from extension
        window.addEventListener('message', function(event) {
            if (event.data && event.data.action === 'receiveCollectedData') {
                handleExtensionData(event.data.soundData);
            }
        });
    }
    
    function handleExtensionData(soundData) {
        // Switch to manual mode
        dataMode = 'manual';
        document.querySelector('input[name="dataMode"][value="manual"]').checked = true;
        manualDataSection.style.display = 'block';
        
        // Add the sound to our data
        soundsData[soundData.url] = {
            title: soundData.title,
            usernames: soundData.usernames
        };
        
        updateSoundsDisplay();
        startAnalysisBtn.disabled = false;
        startAnalysisBtn.textContent = `🎯 Analyze Extension Data (${soundData.actualCount} creators)`;
        
        // Show success message
        showStatus(`🚀 Received data from extension: ${soundData.actualCount} creators from "${soundData.title}"`, 'success');
        
        // Scroll to the analysis section
        document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
    }
    
    // Add some example data on page load for demo purposes
    setTimeout(() => {
        if (Object.keys(soundsData).length === 0) {
            soundUrlsTextarea.value = `https://www.tiktok.com/music/Dreams-2004-Remaster-6705099754369452034
https://www.tiktok.com/music/Stay-The-Kid-LAROI-Justin-Bieber-6977356686334073857
https://www.tiktok.com/music/Industry-Baby-6991331264001025794`;
        }
    }, 1000);
});
