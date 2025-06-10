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

    // Data storage
    let soundsData = {}; // { soundUrl: { title: "", usernames: [] } }
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
        console.log('Manual data button clicked'); // Debug log
        openManualDataModal();
    });
    
    function openManualDataModal() {
        console.log('Opening manual data modal...'); // Debug log
        console.log('Current sounds data:', soundsData); // Debug log
        
        // Check if we have sounds added first
        if (Object.keys(soundsData).length === 0) {
            showStatus('Please add TikTok sound URLs first before entering creator data', 'error');
            return;
        }
        
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
            max-width: 700px; width: 100%; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        `;
        
        modalContent.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <h3 style="margin-bottom: 10px; color: #333; font-size: 20px;">📋 Manual Creator Data Entry</h3>
                <p style="color: #666; font-size: 14px;">Enter the creators you've found for each sound below</p>
            </div>
            
            <div style="background: #e3f2fd; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                <h4 style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">💡 Instructions:</h4>
                <ul style="color: #1976d2; font-size: 12px; margin-left: 15px; line-height: 1.5;">
                    <li>Paste one creator username per line</li>
                    <li>You can include or exclude @ symbols (both "username" and "@username" work)</li>
                    <li>Leave empty if you haven't collected data for a sound yet</li>
                    <li>Example format:<br>
                        <code style="background: rgba(0,0,0,0.1); padding: 2px 4px; border-radius: 3px;">
                        musiclover2024<br>@creator_name<br>tiktok_user
                        </code>
                    </li>
                </ul>
            </div>
            
            ${Object.entries(soundsData).map(([url, data], index) => `
                <div style="margin-bottom: 25px; padding: 20px; border: 2px solid #e1e8ed; border-radius: 12px; background: #fafbfc;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                        <span style="background: #667eea; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; margin-right: 10px;">${index + 1}</span>
                        <h4 style="margin: 0; color: #333; font-size: 16px;">${escapeHtml(data.title)}</h4>
                    </div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 10px; word-break: break-all;">${escapeHtml(url)}</div>
                    <textarea 
                        id="creators-${simpleHash(url)}" 
                        placeholder="Paste creator usernames here (one per line):

musiclover2024
@viral_creator
tiktok_dancer
username_here"
                        style="width: 100%; height: 120px; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-family: monospace; font-size: 13px; resize: vertical; background: white;"
                    ></textarea>
                    <div style="font-size: 11px; color: #999; margin-top: 8px; display: flex; justify-content: space-between;">
                        <span>💡 Tip: Copy usernames from TikTok and paste them here</span>
                        <span id="count-${simpleHash(url)}" style="font-weight: 500;">0 creators</span>
                    </div>
                </div>
            `).join('')}
            
            <div style="display: flex; gap: 15px; margin-top: 25px;">
                <button id="saveManualData" style="flex: 1; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    💾 Save All Creator Data
                </button>
                <button id="cancelManualData" style="flex: 1; background: #f5f5f5; color: #333; border: 2px solid #ddd; padding: 15px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600;">
                    ❌ Cancel
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Add real-time counting
        Object.keys(soundsData).forEach(url => {
            const textarea = document.getElementById(`creators-${simpleHash(url)}`);
            const counter = document.getElementById(`count-${simpleHash(url)}`);
            
            if (textarea && counter) {
                textarea.addEventListener('input', function() {
                    const creators = this.value
                        .split('\n')
                        .map(name => name.trim().replace('@', ''))
                        .filter(name => name.length > 0);
                    counter.textContent = `${creators.length} creators`;
                    counter.style.color = creators.length > 0 ? '#4caf50' : '#999';
                });
            }
        });
        
        // Handle save
        document.getElementById('saveManualData').addEventListener('click', function() {
            let totalCreators = 0;
            let soundsWithData = 0;
            
            Object.entries(soundsData).forEach(([url, data]) => {
                const textarea = document.getElementById(`creators-${simpleHash(url)}`);
                if (textarea) {
                    const creators = textarea.value
                        .split('\n')
                        .map(name => name.trim().replace('@', ''))
                        .filter(name => name.length > 0);
                    
                    if (creators.length > 0) {
                        soundsData[url].usernames = creators;
                        totalCreators += creators.length;
                        soundsWithData++;
                    }
                }
            });
            
            if (totalCreators === 0) {
                showStatus('Please enter at least some creator data before saving', 'error');
                return;
            }
            
            updateSoundsDisplay();
            showStatus(`✅ Saved ${totalCreators} creators across ${soundsWithData} sound(s)!`, 'success');
            document.body.removeChild(modal);
            
            // Enable analysis if we have data
            startAnalysisBtn.disabled = false;
            startAnalysisBtn.textContent = `🎯 Analyze Creator Data (${totalCreators} creators)`;
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
            addManualDataBtn.disabled = true;
            startAnalysisBtn.disabled = true;
            startAnalysisBtn.textContent = '🚀 Start Analysis';
        }
    }

    // Start analysis process
    startAnalysisBtn.addEventListener('click', async function() {
        const soundUrls = Object.keys(soundsData);
        
        if (soundUrls.length === 0) {
            showStatus('No sounds to analyze', 'error');
            return;
        }
        
        // Check if all sounds have creator data
        const soundsWithoutData = soundUrls.filter(url => !soundsData[url].usernames || soundsData[url].usernames.length === 0);
        if (soundsWithoutData.length > 0) {
            showStatus('Please add creator data for all sounds before analyzing', 'error');
            return;
        }
        
        startAnalysisBtn.disabled = true;
        startAnalysisBtn.innerHTML = '<span class="spinner"></span>Analyzing...';
        analysisProgress.style.display = 'block';
        
        try {
            progressFill.style.width = '50%';
            progressText.textContent = '🎯 Analyzing creator overlaps...';
            
            // Small delay for visual feedback
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Analyze overlaps
            analyzeCreatorOverlaps();
            
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

    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash) % 1000;
    }

    // Initialize the application
    updateSoundsDisplay();
});
