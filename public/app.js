document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENTLERİ SEÇ ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');
    const showLoginBtn = document.getElementById('show-login-btn');
    const backToWelcomeBtn = document.getElementById('back-to-welcome-btn');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const errorMessage = document.getElementById('error-message');
    const userInfo = document.getElementById('user-info');
    const welcomeText = document.getElementById('welcome-text');

    // --- VIEW ELEMENTLERİ ---
    const showMapViewBtn = document.getElementById('show-map-view-btn');
    const showChartsViewBtn = document.getElementById('show-charts-view-btn');
    const mapView = document.getElementById('map-view');
    const chartsView = document.getElementById('charts-view');
    
    // KARŞILAŞTIRMA EKRANI ELEMENTLERİ
    const showCompareViewBtn = document.getElementById('show-compare-view-btn');
    const compareView = document.getElementById('compare-view');
    const provinceListContainer = document.getElementById('province-list-for-compare');
    const metricListContainer = document.getElementById('metric-list-for-compare');
    const compareProvincesBtn = document.getElementById('compare-provinces-btn');
    const compareResultsTitle = document.getElementById('compare-results-title');
    const compareCardsContainer = document.getElementById('compare-cards-container');
    let compareRadarChartInstance;

    // KRİTER YÖNETİMİ / AKILLI ÖNERİ ELEMENTLERİ
    const showCriteriaViewBtn = document.getElementById('show-criteria-view-btn');
    const criteriaView = document.getElementById('criteria-view');
    const criteriaListContainer = document.getElementById('criteria-list-container');
    const saveCriteriaBtn = document.getElementById('save-criteria-btn');
    const criteriaSaveMessage = document.getElementById('criteria-save-message');
    
    // YENİ EKLENEN: SİMÜLASYON ELEMENTLERİ (Kritter view içinde)
    const smartSimForm = document.getElementById('smart-sim-form');
    const smartResultsDiv = document.getElementById('smart-recommendation-results');

    // --- YENİ EKLENEN: BENTO GRID (ANALIZ) ELEMENTLERİ ---
    const showAnalysisViewBtn = document.getElementById('show-analysis-view-btn');
    const analysisView = document.getElementById('analysis-view');
    let cityTrendChartInstance = null;
    let currentAnalysisTrendData = []; // Veriyi hafızada saklamak için yeni eklendi

    // --- YENİ EKLENEN: ZAMAN TÜNELİ (KRONOLOJİ) ELEMENTLERİ ---
    const showTimelineViewBtn = document.getElementById('show-timeline-view-btn');
    const timelineView = document.getElementById('timeline-view');
    const timelineListContainer = document.getElementById('timeline-list');

    let currentCriteriaData = []; 

    const menuButtons = document.querySelectorAll('.menu-btn');

    // --- UYGULAMA GENELİ DEĞİŞKENLER ---
    let allProvincesData = []; 
    let populationChartInstance, osbChartInstance, tesvikChartInstance; 
    let ihracatChartInstance, havalimaniChartInstance, gelirChartInstance; 
    let selectedProvincesForCompare = [];
    
    // YENİ EKLENEN: SEÇİLEBİLİR TÜM KRİTERLERİN LİSTESİ
    const AVAILABLE_METRICS = [
        { key: 'Toplam Nüfus', path: ['demografi', 'toplam_nufus'], higherIsBetter: true },
        { key: 'Üniversite Öğrenci Sayısı', path: ['insan_kaynaklari', 'universite_ogrenci_sayisi'], higherIsBetter: true },
        { key: 'Teknopark Sayısı', path: ['insan_kaynaklari', 'teknopark_sayisi'], higherIsBetter: true },
        { key: 'Beyin Göçü Endeksi', path: ['insan_kaynaklari', 'beyin_gocu_endeksi'], higherIsBetter: true },
        { key: 'Yol Kalite Skoru', path: ['lojistik_yasam_kalitesi', 'yol_kalite_skoru'], higherIsBetter: true },
        { key: 'OSB Sayısı', path: ['pazar_ve_maliyet', 'osb_sayisi'], higherIsBetter: true },
        { key: 'Startup Sayısı', path: ['pazar_ve_maliyet', 'startup_sayisi'], higherIsBetter: true },
        { key: 'İhracat Hacmi (Milyon $)', path: ['pazar_ve_maliyet', 'ihracat_hacmi_milyon_usd'], higherIsBetter: true },
        { key: 'Nüfus Artış Hızı (%)', path: ['demografi', 'nufus_artis_hizi'], higherIsBetter: true },
        { key: 'Ortalama Hane Geliri (dolar)', path: ['demografi', 'ortalama_hane_geliri'], higherIsBetter: true },
        { key: 'Ortalama Ofis Kirası (m²/TL)', path: ['pazar_ve_maliyet', 'ortalama_metrekare_kira'], higherIsBetter: false } // Düşük olması daha iyi
    ];

    // --- KULLANICI BİLGİLERİ (SİMÜLASYON) ---
    const users = {
        "verigirici1": { password: "user123", role: "data_entry" },
        "yonetici": { password: "admin123", role: "admin" }
    };
    
    // Harita elementlerine erişim için global değişkenler
    let element, info, legend;
    
    // YENİ EKLENEN: ÖNERİ MODAL ELEMENTLERİ
    const recommendationModal = document.getElementById('recommendation-modal');
    const recommendationForm = document.getElementById('recommendation-form');
    const recommendationResultsDiv = document.getElementById('recommendation-results');
    const closeRecommendationModalBtn = document.getElementById('close-recommendation-modal');
    const backToReportBtn = document.getElementById('back-to-report-btn');


    // --- HARİTA YARDIMCI FONKSİYONLARI ---
    
    function resetMapColors() {
        if(!element) return;
        element.querySelectorAll('path').forEach(path => {
            path.style.fill = '';
        });
        if (legend) legend.style.display = 'none';
        initAdminPanelButtons(true); 
    }
    
    function colorizeMap(reportData) {
        if(!element || !legend) return; 
        
        const validValues = reportData.map(d => d.value).filter(v => typeof v === 'number' && v > 0); 
        
        if (validValues.length === 0) {
            alert("Rapor oluşturmak için yeterli veri bulunamadı.");
            return;
        }
        
        const minValue = Math.min(...validValues);
        const maxValue = Math.max(...validValues);
        const isUniform = maxValue === minValue; 
        
        resetMapColors();
        if (legend) legend.style.display = 'block';

        const logMin = Math.log10(minValue > 1 ? minValue : 1);
        const logMax = Math.log10(maxValue);
        const logRange = logMax - logMin;

        reportData.forEach(item => {
            const provincePaths = element.querySelectorAll(`g[id="${item.id}"] path`);
            
            if (provincePaths.length > 0) {
                let fillColor = '#E0E0E0';
                
                if (item.value >= 1) { 
                    const colors = ['#d73027', '#f46d43', '#fdae61', '#ffffbf', '#a6d96a', '#66bd63', '#1a9850'];

                    if (isUniform) {
                        fillColor = colors[3]; 
                    } else {
                        let ratio;
                        const logValue = Math.log10(item.value > 1 ? item.value : 1);
                        
                        if (logRange <= 0.001) { 
                            ratio = (item.value - minValue) / (maxValue - minValue);
                        } else {
                            ratio = (logValue - logMin) / logRange;
                        }
                        
                        ratio = Math.max(0, Math.min(1, ratio));
                        const colorIndex = Math.min(6, Math.floor(ratio * (colors.length - 1)));
                        fillColor = colors[colorIndex];
                    }
                } else {
                    fillColor = '#d73027'; 
                }
                
                provincePaths.forEach(path => {
                    path.style.setProperty('fill', fillColor, 'important');
                });
            }
        });
    }
    
    function generateReport(category) {
        if(!element) return;
        const adminPanel = document.getElementById('admin-panel');
        adminPanel.innerHTML = `<h3>${category.replace('_', ' ').toUpperCase()} Raporu Hazırlanıyor...</h3><p style="color: #007bff;">Lütfen bekleyiniz.</p>`;
        
        fetch(`/api/report/${category}`)
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    colorizeMap(result.data);
                } else { alert("Rapor oluşturulurken bir hata oluştu."); }
                initAdminPanelButtons(false); 
            })
            .catch(err => { 
                console.error("Rapor hatası:", err); 
                alert("Rapor sunucusuna ulaşılamadı."); 
                initAdminPanelButtons(false); 
            });
    }
    
    function getSmartRecommendation() {
        if(!element) return;
        const adminPanel = document.getElementById('admin-panel');
        
        adminPanel.innerHTML = `
            <h3>⭐ Akıllı Öneri Sistemi</h3>
            <p style="color: #3498db; font-weight: bold;">Hesaplanıyor... Lütfen bekleyiniz.</p>
        `;
        
        fetch('/api/recommendation')
            .then(res => res.json())
            .then(result => {
                if (result.success && result.bestProvince) {
                    adminPanel.innerHTML = `
                        <h3>⭐ Akıllı Öneri Sonucu: ${result.bestProvince.ad}</h3>
                        <p class="recommendation-comment">
                            ${result.comment}
                        </p>
                        <div style="margin-top: 20px;" class="report-buttons">
                            <button data-report="reset" class="reset-btn">Haritayı Sıfırla</button>
                        </div>
                    `;
                    colorizeMap(result.allScores); 
                } else {
                    adminPanel.innerHTML = `
                        <h3>⭐ Akıllı Öneri Sistemi</h3>
                        <p style="color: #e74c3c; font-weight: bold;">Öneri oluşturulamadı: ${result.message || "Bilinmeyen Hata"}</p>
                        <div style="margin-top: 20px;" class="report-buttons">
                            <button data-report="reset" class="reset-btn">Sıfırla</button>
                        </div>
                    `;
                }
                document.querySelector('#admin-panel .reset-btn').addEventListener('click', resetMapColors);
            })
            .catch(err => {
                console.error("Akıllı Öneri hatası:", err);
                adminPanel.innerHTML = `
                    <p class="error-message" style="color: #e74c3c;">Sunucuyla iletişim hatası. Öneri sistemi ulaşılamıyor.</p>
                    <div style="margin-top: 20px;" class="report-buttons">
                        <button data-report="reset" class="reset-btn">Sıfırla</button>
                    </div>
                `;
                document.querySelector('#admin-panel .reset-btn').addEventListener('click', resetMapColors);
            });
    }

    // --- EKRAN YÖNETİMİ ---
    function showScreen(screenId) {
        welcomeScreen.classList.remove('active');
        loginScreen.classList.remove('active');
        appContainer.style.display = 'none';
        document.body.classList.add('no-scroll');

        if (screenId === 'welcome' || screenId === 'login') {
            if (screenId === 'welcome') welcomeScreen.classList.add('active');
            else loginScreen.classList.add('active');
        } else if (screenId === 'app') {
            appContainer.style.display = 'flex';
            document.body.classList.remove('no-scroll');
        }
    }

    // --- GÖRÜNÜM YÖNETİMİ ---
    function showView(viewIdToShow) {
        mapView.classList.remove('active');
        chartsView.classList.remove('active');
        compareView.classList.remove('active');
        criteriaView.classList.remove('active'); 
        analysisView.classList.remove('active'); 
        timelineView.classList.remove('active'); 
        menuButtons.forEach(btn => btn.classList.remove('active'));

        mapView.style.display = 'none';
        chartsView.style.display = 'none';
        compareView.style.display = 'none';
        criteriaView.style.display = 'none';
        analysisView.style.display = 'none'; 
        timelineView.style.display = 'none'; 
        
        const viewToShow = document.getElementById(viewIdToShow);
        if (viewToShow) {
            viewToShow.classList.add('active');
            viewToShow.style.display = 'block'; 
        }
        
        const activeBtn = document.getElementById(viewIdToShow.replace('-view', '-view-btn'));
        if(activeBtn) activeBtn.classList.add('active');

        if (viewIdToShow === 'charts-view' && allProvincesData.length > 0 && !populationChartInstance) {
            initCharts();
        } else if (viewIdToShow === 'compare-view' && allProvincesData.length > 0 && provinceListContainer.children.length === 0) {
            populateProvinceSelectionList();
            populateMetricSelectionList();
        } else if (viewIdToShow === 'timeline-view') {
            fetchTimelineData(); 
        }
    }

    // --- OLAY DİNLEYİCİLERİ ---
    showLoginBtn.addEventListener('click', () => showScreen('login'));
    backToWelcomeBtn.addEventListener('click', () => {
        showScreen('welcome');
        errorMessage.style.display = 'none';
        loginForm.reset();
    });

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (users[username] && users[username].password === password) {
            showScreen('app');
            userInfo.style.display = 'flex';
            welcomeText.textContent = `Hoş geldin, ${username}`;
            initApplication(users[username].role);
        } else {
            errorMessage.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        window.location.reload();
    });
    
    // --- ANA BAŞLATICI FONKSİYON ---
    function initApplication(userRole){
        showMapViewBtn.addEventListener('click', () => showView('map-view'));
        showChartsViewBtn.addEventListener('click', () => showView('charts-view'));
        showCompareViewBtn.addEventListener('click', () => showView('compare-view'));
        showCriteriaViewBtn.addEventListener('click', () => showView('criteria-view'));
        showAnalysisViewBtn.addEventListener('click', () => showView('analysis-view')); 
        showTimelineViewBtn.addEventListener('click', () => showView('timeline-view')); 

        fetch('/api/provinces')
            .then(res => res.json())
            .then(result => {
                if(result.success) {
                    allProvincesData = result.data.sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
                    initMap(userRole);
                    
                    const citySearchInput = document.getElementById('city-search-input');
                    if (citySearchInput) {
                        citySearchInput.addEventListener('input', (e) => {
                            const term = e.target.value.trim().toLocaleLowerCase('tr');
                            if (term.length > 0) {
                                const filtered = allProvincesData.filter(p => p.ad.toLocaleLowerCase('tr').includes(term));
                                renderSidebarCityList(filtered);
                            } else {
                                const listDiv = document.getElementById('sidebar-city-list');
                                if(listDiv) listDiv.innerHTML = '';
                            }
                        });
                    }
                }
            })
            .catch(err => console.error("Tüm il verileri çekilirken hata:", err));

        //  5'li Metrik Seçici Güncellemesi
        const metricSelect = document.getElementById('analysis-metric-select');
        if (metricSelect) {
            metricSelect.innerHTML = `
                <option value="ihracat_hacmi_milyon_usd">İhracat Trendi ($)</option>
                <option value="toplam_nufus">Nüfus Değişimi</option>
                <option value="ortalama_hane_geliri">Gelir Artışı (dolar)</option>
                <option value="yetenek_endeksi">Yetenek & İK Trendi</option>
                <option value="refah_skoru">Yaşam Kalitesi Trendi</option>
            `;
            metricSelect.addEventListener('change', (e) => {
                if (currentAnalysisTrendData.length > 0) {
                    renderCityTrendChart(currentAnalysisTrendData, e.target.value);
                }
            });
        }

        const allPrefSliders = document.querySelectorAll('.pref-slider');
        allPrefSliders.forEach(slider => {
            updateSliderLabels(slider);
            slider.addEventListener('input', (e) => {
                updateSliderLabels(e.target);
            });
        });

        const strategyButtons = document.querySelectorAll('.strategy-btn');
        strategyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                strategyButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    function updateSliderLabels(slider) {
        const val = parseInt(slider.value);
        const targetId = slider.id.replace('sim_', 'val_');
        const displaySpan = document.getElementById(targetId);
        if (!displaySpan) return;

        let text = "";
        let color = "";

        if (slider.id === 'sim_bonus') {
            if (val < 25) { text = "Yok / Zayıf"; color = "#6c757d"; }
            else if (val < 50) { text = "Standart"; color = "#28a745"; }
            else if (val < 75) { text = "Potansiyel Odaklı"; color = "#007bff"; }
            else { text = "Maksimum Fırsat"; color = "#6f42c1"; }
        } else {
            if (val < 20) { text = "Düşük Öncelik"; color = "#95a5a6"; }
            else if (val < 40) { text = "Orta-Düşük"; color = "#7f8c8d"; }
            else if (val < 60) { text = "Dengeli"; color = "#2ecc71"; }
            else if (val < 80) { text = "Önemli"; color = "#f39c12"; }
            else { text = "Kritik"; color = "#e74c3c"; }
        }

        displaySpan.innerText = text;
        displaySpan.style.color = color;
        displaySpan.style.borderColor = color;
    }


    // --- HARİTA YÖNETİCİ PANELİ BUTONLARINI BAŞLATMA ---
    function initAdminPanelButtons(clearPanel = false) {
        const adminPanel = document.getElementById('admin-panel');
        if (!adminPanel) return;

        if (clearPanel) {
            adminPanel.innerHTML = `
                <h3>Raporlama Seçenekleri</h3>
                <div class="report-buttons">
                    <button data-report="teknoloji_ofisi">Teknoloji Ofisi</button>
                    <button data-report="lojistik_depo">Lojistik Üs</button>
                    <button data-report="genel_cazibe">Genel Cazibe</button>
                    <button data-report="demografi_pazar">Demografi & Pazar</button> 
                    <button data-report="reset" class="reset-btn">Sıfırla</button>
                </div>
            `;
        }
        
        const reportButtons = adminPanel.querySelectorAll('button');
        reportButtons.forEach(button => {
            button.removeEventListener('click', handleReportButtonClick); 
            button.addEventListener('click', handleReportButtonClick);
        });
    }

    function handleReportButtonClick(event) {
        const reportType = event.currentTarget.dataset.report;
        if (reportType === 'reset') {
            resetMapColors();
        } else {
            generateReport(reportType);
        }
    }


    // --- HARİTA FONKSİYONU ---
    function initMap(userRole) {
        let activeProvinceId = null; 
        const mapPlaceholder = document.getElementById('map-container');

        if (mapPlaceholder.querySelector('svg')) {
             const adminPanelCheck = document.getElementById('admin-panel');
             if (userRole === 'admin') adminPanelCheck.style.display = 'block';
             else adminPanelCheck.style.display = 'none';
             return;
        }
        
        fetch('map.svg')
            .then(response => response.text())
            .then(svgData => {
                mapPlaceholder.innerHTML = svgData;
                
                element = document.querySelector('#svg-turkiye-haritasi');
                info = document.querySelector('.il-isimleri');
                const dataEntryModal = document.getElementById('data-entry-modal');
                const dataEntryTitle = document.getElementById('data-entry-title');
                const dataEntryForm = document.getElementById('data-entry-form');
                const closeDataEntryModalBtn = dataEntryModal.querySelector('.close-btn');
                const adminPanel = document.getElementById('admin-panel');
                legend = document.getElementById('legend');

                if (!element || !info || !legend) { return; }

                if (userRole === 'admin') {
                    adminPanel.style.display = 'block';
                    initAdminPanelButtons(true);
                }
                
                element.addEventListener('mouseover', function (event) { if (event.target.tagName === 'path' && event.target.parentNode.getAttribute('data-iladi')) { info.style.display = 'block'; info.innerHTML = `<div>${event.target.parentNode.getAttribute('data-iladi')}</div>`; } });
                element.addEventListener('mousemove', function (event) { info.style.top = (event.pageY + 25) + 'px'; info.style.left = event.pageX + 'px'; });
                element.addEventListener('mouseout', function (event) { info.style.display = 'none'; });

                element.addEventListener('click', function (event) {
                    if (event.target.tagName === 'path' && event.target.parentNode.getAttribute('data-iladi')) {
                        const parent = event.target.parentNode;
                        const ilAdi = parent.getAttribute('data-iladi');
                        const provinceIdSVG = parent.getAttribute('id');
                        
                        activeProvinceId = provinceIdSVG; 
                        
                        fetchCityAnalysisData(ilAdi);
                        showView('analysis-view');
                        
                        if (userRole === 'data_entry' && mapView.classList.contains('active')) {
                            dataEntryTitle.textContent = `${ilAdi} İçin Veri Gir`;
                            dataEntryForm.reset();
                            dataEntryModal.style.display = 'flex';
                            dataEntryForm.dataset.provinceName = ilAdi;
                        }
                    }
                });
                
                dataEntryForm.addEventListener('submit', function(event) {
                    event.preventDefault();
                    const ilAdi = dataEntryForm.dataset.provinceName;
                    if(!ilAdi) { alert("İl adı bulunamadı."); return; }

                    const dataToSend = {
                        provinceId: activeProvinceId,
                        provinceName: ilAdi,
                        data: {
                            insan_kaynaklari: {
                                muhendislik_fakulte_sayisi: parseInt(document.getElementById('muhendislik_fakulte_sayisi').value) || 0,
                                universite_ogrenci_sayisi: parseInt(document.getElementById('universite_ogrenci_sayisi').value) || 0,
                                teknopark_sayisi: parseInt(document.getElementById('teknopark_sayisi').value) || 0,
                                beyin_gocu_endeksi: parseInt(document.getElementById('beyin_gocu_endeksi').value) || 0,
                                yabanci_dil_orani: parseFloat(document.getElementById('yabanci_dil_orani').value) || 0
                            },
                            lojistik_yasam_kalitesi: {
                                havalimani_tipi: document.getElementById('havalimani_tipi').value,
                                liman_var_mi: document.getElementById('liman_var_mi').value === 'true',
                                yol_kalite_skoru: parseInt(document.getElementById('yol_kalite_skoru').value) || 0,
                                hastane_yatak_kapasitesi: parseFloat(document.getElementById('hastane_yatak_kapasitesi').value) || 0,
                                yesil_alan_orani: parseInt(document.getElementById('yesil_alan_orani').value) || 0
                            },
                            pazar_ve_maliyet: {
                                osb_sayisi: parseInt(document.getElementById('osb_sayisi').value) || 0,
                                tesvik_derecesi: parseInt(document.getElementById('tesvik_derecesi').value) || 0,
                                ortalama_metrekare_kira: parseInt(document.getElementById('ortalama_metrekare_kira').value) || 0,
                                startup_sayisi: parseInt(document.getElementById('startup_sayisi').value) || 0,
                                ihracat_hacmi_milyon_usd: parseInt(document.getElementById('ihracat_hacmi_milyon_usd').value) || 0
                            },
                            demografi: {
                                toplam_nufus: parseInt(document.getElementById('toplam_nufus').value) || 0,
                                nufus_artis_hizi: parseFloat(document.getElementById('nufus_artis_hizi').value) || 0,
                                ortalama_hane_geliri: parseInt(document.getElementById('ortalama_hane_geliri').value) || 0
                            }
                        }
                    };

                    fetch('/api/update-province', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dataToSend),
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            alert(`${ilAdi} için veriler başarıyla kaydedildi!`);
                            dataEntryModal.style.display = 'none';
                        } else { alert('Veriler kaydedilirken bir hata oluştu.'); }
                    })
                    .catch(error => { console.error('Kaydetme hatası:', error); });
                });

                closeDataEntryModalBtn.addEventListener('click', () => { dataEntryModal.style.display = 'none'; });
                dataEntryModal.addEventListener('click', (event) => { if (event.target === dataEntryModal) { dataEntryModal.style.display = 'none'; } });
            })
            .catch(error => console.error('Harita SVG hatası:', error));
    }

    // --- GRAFİK OLUŞTURMA FONKSİYONLARI ---
    function initCharts() {
        renderPopulationChart(allProvincesData);
        renderOsbChart(allProvincesData);
        renderTesvikChart(allProvincesData);
        renderIhracatChart(allProvincesData);
        renderHavalimaniChart(allProvincesData);
        renderGelirChart(allProvincesData);
    }

    function renderPopulationChart(provinces) {
        if (populationChartInstance) { populationChartInstance.destroy(); }
        const ctx = document.getElementById('population-chart').getContext('2d');
        const sortedData = [...provinces].sort((a, b) => b.demografi.toplam_nufus - a.demografi.toplam_nufus).slice(0, 10);
        const labels = sortedData.map(p => p.ad);
        const data = sortedData.map(p => p.demografi.toplam_nufus);
        populationChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Toplam Nüfus', data, backgroundColor: '#3498db' }] }, options: { responsive: true, plugins: { legend: { display: false } } }});
    }

    function renderOsbChart(provinces) {
        if (osbChartInstance) { osbChartInstance.destroy(); }
        const ctx = document.getElementById('osb-chart').getContext('2d');
        const sortedData = [...provinces].filter(p => p.pazar_ve_maliyet.osb_sayisi > 0).sort((a, b) => b.pazar_ve_maliyet.osb_sayisi - a.pazar_ve_maliyet.osb_sayisi).slice(0, 10);
        const labels = sortedData.map(p => p.ad);
        const data = sortedData.map(p => p.pazar_ve_maliyet.osb_sayisi);
        osbChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Organize Sanayi Bölgesi Sayısı', data, backgroundColor: '#2ecc71' }] }, options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }});
    }
    
    function renderTesvikChart(provinces) {
        if (tesvikChartInstance) { tesvikChartInstance.destroy(); }
        const ctx = document.getElementById('tesvik-chart').getContext('2d');
        const tesvikGruplari = provinces.reduce((acc, province) => {
            const derece = province.pazar_ve_maliyet.tesvik_derecesi;
            const key = `${derece}. Bölge`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
        const labels = Object.keys(tesvikGruplari).sort();
        const data = labels.map(label => tesvikGruplari[label]);
        tesvikChartInstance = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ label: 'İl Sayısı', data, backgroundColor: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6'] }] }, options: { responsive: true }});
    }
    
    function renderIhracatChart(provinces) {
        if (ihracatChartInstance) { ihracatChartInstance.destroy(); }
        const ctx = document.getElementById('ihracat-chart').getContext('2d');
        const sortedData = [...provinces]
            .filter(p => p.pazar_ve_maliyet.ihracat_hacmi_milyon_usd > 0)
            .sort((a, b) => b.pazar_ve_maliyet.ihracat_hacmi_milyon_usd - a.pazar_ve_maliyet.ihracat_hacmi_milyon_usd)
            .slice(0, 10);
        const labels = sortedData.map(p => p.ad);
        const data = sortedData.map(p => p.pazar_ve_maliyet.ihracat_hacmi_milyon_usd);
        ihracatChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'İhracat Hacmi (Milyon $)', data, backgroundColor: '#9b59b6' }] }, options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }});
    }

    function renderHavalimaniChart(provinces) {
        if (havalimaniChartInstance) { havalimaniChartInstance.destroy(); }
        const ctx = document.getElementById('havalimani-chart').getContext('2d');
        const havalimaniGruplari = provinces.reduce((acc, province) => {
            const tip = province.lojistik_yasam_kalitesi.havalimani_tipi || "Yok";
            acc[tip] = (acc[tip] || 0) + 1;
            return acc;
        }, {});
        const labels = Object.keys(havalimaniGruplari);
        const data = Object.values(havalimaniGruplari);
        havalimaniChartInstance = new Chart(ctx, { type: 'pie', data: { labels, datasets: [{ label: 'İl Sayısı', data, backgroundColor: ['#3498db', '#bdc3c7', '#e74c3c' ] }] }, options: { responsive: true }});
    }

    function renderGelirChart(provinces) {
        if (gelirChartInstance) { gelirChartInstance.destroy(); }
        const ctx = document.getElementById('gelir-chart').getContext('2d');
        const sortedData = [...provinces]
            .sort((a, b) => b.demografi.ortalama_hane_geliri - a.demografi.ortalama_hane_geliri)
            .slice(0, 10);
        const labels = sortedData.map(p => p.ad);
        const data = sortedData.map(p => p.demografi.ortalama_hane_geliri);
        gelirChartInstance = new Chart(ctx, { type: 'bar', data: { labels, datasets: [{ label: 'Ortalama Hane Geliri (dolar)', data, backgroundColor: '#e67e22' }] }, options: { responsive: true, indexAxis: 'y', plugins: { legend: { display: false } } }});
    }


    // --- İL KARŞILAŞTIRMA FONKSİYONLARI ---

    function populateProvinceSelectionList() {
        if (!provinceListContainer) return;
        let listHTML = '';
        allProvincesData.forEach(province => {
            listHTML += `<label class="province-list-item"><input type="checkbox" value="${province.ad}"> ${province.ad}</label>`;
        });
        provinceListContainer.innerHTML = listHTML;
        provinceListContainer.addEventListener('change', handleProvinceSelectionChange); 
        compareProvincesBtn.addEventListener('click', handleCompareButtonClick);
    }

    function populateMetricSelectionList() {
        if (!metricListContainer) return;
        let listHTML = '';
        AVAILABLE_METRICS.forEach((metric, index) => {
            const isChecked = index < 6 ? 'checked' : ''; 
            listHTML += `<label class="province-list-item"><input type="checkbox" value="${metric.key}" ${isChecked}> ${metric.key}</label>`;
        });
        metricListContainer.innerHTML = listHTML;
    }

    function handleProvinceSelectionChange(event) {
        selectedProvincesForCompare = Array.from(provinceListContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        if (selectedProvincesForCompare.length > 4) {
            alert('En fazla 4 il seçebilirsiniz.');
            event.target.checked = false;
            selectedProvincesForCompare = Array.from(provinceListContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        }
        compareProvincesBtn.disabled = !(selectedProvincesForCompare.length >= 2 && selectedProvincesForCompare.length <= 4);
    }

    function handleCompareButtonClick() {
        const selectedMetricsKeys = Array.from(metricListContainer.querySelectorAll('input:checked')).map(cb => cb.value);
        if(selectedMetricsKeys.length === 0) { alert('Lütfen kriter seçin.'); return; }

        const selectedMetrics = AVAILABLE_METRICS.filter(m => selectedMetricsKeys.includes(m.key));
        const provincesToCompare = allProvincesData.filter(p => selectedProvincesForCompare.includes(p.ad));
        
        displayCompareCards(provincesToCompare, selectedMetrics);
        displayCompareRadarChart(provincesToCompare, selectedMetrics);
        compareResultsTitle.textContent = `${provincesToCompare.map(p => p.ad).join(', ')} Karşılaştırması`;
    }

    function displayCompareCards(provinces, metrics) {
        compareCardsContainer.innerHTML = '';
        let cardsHTML = '';
        provinces.forEach(p => {
            cardsHTML += `<div class="compare-card"><h3>${p.ad}</h3><ul>`;
            metrics.forEach(m => {
                const value = m.path.reduce((obj, key) => obj && obj[key], p);
                const displayValue = typeof value === 'number' ? value.toLocaleString('tr-TR') : (value || 'N/A');
                cardsHTML += `<li><span>${m.key}:</span> <span>${displayValue}</span></li>`;
            });
            cardsHTML += `</ul></div>`;
        });
        compareCardsContainer.innerHTML = cardsHTML;
    }

    function displayCompareRadarChart(provinces, metrics) {
        if (compareRadarChartInstance) { compareRadarChartInstance.destroy(); }
        const ctx = document.getElementById('compare-radar-chart').getContext('2d');
        const minMax = {};
        metrics.forEach(m => {
            const values = allProvincesData.map(p => m.path.reduce((obj, key) => obj && obj[key], p)).filter(v => typeof v === 'number');
            minMax[m.key] = { min: Math.min(...values), max: Math.max(...values) };
        });

        const datasets = provinces.map((p, index) => {
            const colors = ['rgba(54, 162, 235, 0.5)', 'rgba(255, 99, 132, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(255, 206, 86, 0.5)'];
            const borderColors = ['rgb(54, 162, 235)', 'rgb(255, 99, 132)', 'rgb(75, 192, 192)', 'rgb(255, 206, 86)'];
            const data = metrics.map(m => {
                const value = m.path.reduce((obj, key) => obj && obj[key], p);
                const { min, max } = minMax[m.key];
                if (max === min) return 50;
                let normalized = ((value - min) / (max - min)) * 100;
                if (!m.higherIsBetter) { normalized = 100 - normalized; }
                return normalized.toFixed(2);
            });
            return { label: p.ad, data: data, backgroundColor: colors[index], borderColor: borderColors[index], borderWidth: 2 };
        });

        compareRadarChartInstance = new Chart(ctx, { type: 'radar', data: { labels: metrics.map(m => m.key), datasets: datasets }, options: { responsive: true, scales: { r: { suggestedMin: 0, suggestedMax: 100 }}}});
    }

    // --- BENTO GRID ANALIZ FONKSIYONLARI ---
    
    function fetchCityAnalysisData(cityName) {
        fetch(`/api/city-analysis?il_adi=${cityName}`)
            .then(res => res.json())
            .then(result => {
                if(result.success) {
                    currentAnalysisTrendData = result.trendData; 
                    updateBentoGrid(result.data, result.trendData);
                } else {
                    console.error("Analiz verisi alınamadı:", result.message);
                }
            })
            .catch(err => console.error("Analiz verisi çekilemedi:", err));
    }

    function updateBentoGrid(data, trendData) {
        const titleElem = document.getElementById('selected-city-title');
        if(titleElem) titleElem.innerText = `${data.il_adi} Ekonomi Karnesi`;
        
        const growthElem = document.getElementById('city-growth-rate');
        if(growthElem) {
            growthElem.innerText = `%${data.on_yillik_buyume_hizi}`;
            growthElem.style.color = data.on_yillik_buyume_hizi >= 0 ? '#10b981' : '#ef4444'; 
        }

        const logStatus = document.getElementById('city-logistics-status');
        const logBadge = document.getElementById('city-logistics-badge');
        if(logStatus && logBadge) {
            const hasPort = data.lojistik_yasam_kalitesi?.liman_var_mi || data.liman_var_mi;
            if(hasPort) {
                logStatus.innerText = "Liman Mevcut";
                logBadge.innerText = "Deniz Ticareti";
                logBadge.style.background = "#3b82f6";
            } else {
                logStatus.innerText = "Kara Yolu";
                logBadge.innerText = "Lojistik Üs";
                logBadge.style.background = "#64748b";
            }
        }

        const scoreElem = document.getElementById('city-attraction-score');
        const descElem = document.getElementById('city-attraction-desc');
        if(scoreElem) scoreElem.innerText = data.genel_cazibe_puani;
        if(descElem) descElem.innerText = data.cazibe_yorumu;

        const costEffElem = document.getElementById('city-cost-efficiency');
        if(costEffElem) {
            const kira = data.pazar_ve_maliyet?.ortalama_metrekare_kira || data.ortalama_metrekare_kira || 100;
            const tesvik = data.pazar_ve_maliyet?.tesvik_derecesi || data.tesvik_derecesi || 1;
            const ratio = (tesvik * 100) / kira; 
            costEffElem.innerText = ratio > 1.5 ? "YÜKSEK" : (ratio > 0.8 ? "ORTA" : "DÜŞÜK");
        }

        // ---  GRAFİKLERİ TETİKLE ---
        const currentMetric = document.getElementById('analysis-metric-select').value;
        renderCityTrendChart(trendData, currentMetric);
        // 
    }

    function renderCityTrendChart(trendData, metricKey) {
        const canvas = document.getElementById('city-export-trend-chart');
        if(!canvas) return;
        const ctx = canvas.getContext('2d');
        if (cityTrendChartInstance) { cityTrendChartInstance.destroy(); }

        //  Yetenek ve refah için dinamik hesaplama yolları (Trend verisi üzerinden)
        const dataSet = trendData.map(d => {
            if (metricKey === 'yetenek_endeksi') {
                return (d.muhendislik_fakulte_sayisi * 10) + (d.universite_ogrenci_sayisi / 1000);
            } else if (metricKey === 'refah_skoru') {
                return (d.hastane_yatak_kapasitesi * 5) + (d.yol_kalite_skoru * 5);
            }
            return d[metricKey];
        });

        const config = {
            ihracat_hacmi_milyon_usd: { label: 'İhracat (Milyon $)', color: '#3b82f6' },
            toplam_nufus: { label: 'Toplam Nüfus', color: '#10b981' },
            ortalama_hane_geliri: { label: 'Ortalama Gelir (TL)', color: '#f59e0b' },
            yetenek_endeksi: { label: 'Yetenek & İK Trendi', color: '#8b5cf6' },
            refah_skoru: { label: 'Yaşam Kalitesi Trendi', color: '#ec4899' }
        };

        const currentCfg = config[metricKey];
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, `${currentCfg.color}66`);
        gradient.addColorStop(1, `${currentCfg.color}00`);

        cityTrendChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: trendData.map(d => d.yil),
                datasets: [{
                    label: currentCfg.label,
                    data: dataSet,
                    borderColor: currentCfg.color,
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: currentCfg.color,
                    pointRadius: 5,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: gradient
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' }, beginAtZero: false } 
                }
            }
        });
    }

    // --- SIDEBAR İL LİSTESİ ---
    function renderSidebarCityList(provinces) {
        const listDiv = document.getElementById('sidebar-city-list');
        if(!listDiv) return;
        listDiv.innerHTML = ''; 
        provinces.forEach(province => {
            const item = document.createElement('div');
            item.className = 'sidebar-city-item';
            item.innerText = province.ad;
            item.onclick = () => {
                document.querySelectorAll('.sidebar-city-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                showView('analysis-view');
                fetchCityAnalysisData(province.ad);
            };
            listDiv.appendChild(item);
        });
    }

    // --- ZAMAN TÜNELİ ---
    let allTimelineData = []; 
    function fetchTimelineData() {
        if(!timelineListContainer) return;
        timelineListContainer.innerHTML = '<p style="text-align:center; padding:20px;">Kronoloji yükleniyor...</p>';
        fetch('/api/kronoloji')
            .then(res => res.json())
            .then(result => {
                if(result.success) {
                    allTimelineData = result.data;
                    renderTimeline(allTimelineData);
                } else {
                    timelineListContainer.innerHTML = '<p style="color:red; text-align:center;">Haberler yüklenemedi.</p>';
                }
            })
            .catch(err => {
                console.error("Timeline error:", err);
                timelineListContainer.innerHTML = '<p style="color:red; text-align:center;">Sunucu hatası.</p>';
            });
    }

    function renderTimeline(data) {
        if(!timelineListContainer) return;
        timelineListContainer.innerHTML = '';
        data.forEach(item => {
            const etkiClass = item.etki_yonu === 'Pozitif' ? 'etki-pozitif' : 
                             (item.etki_yonu === 'Negatif' ? 'etki-negatif' : 'etki-notr');
            const card = document.createElement('div');
            card.className = 'timeline-card';
            card.innerHTML = `
                <span class="timeline-year-label">${item.yil}</span>
                <span class="timeline-badge ${etkiClass}">${item.kategori} | ${item.etki_yonu} Etki</span>
                <h4 style="margin: 5px 0; color: #1e293b; font-size: 1.1rem;">${item.olay_adi}</h4>
                <p class="timeline-desc">${item.aciklama}</p>
            `;
            timelineListContainer.appendChild(card);
        });
    }

    const filterBtn = document.getElementById('btn-filter-timeline');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => {
            const selectedYear = document.getElementById('filter-year').value;
            const selectedCat = document.getElementById('filter-category').value;
            const filtered = allTimelineData.filter(item => {
                const yearMatch = (selectedYear === 'all' || item.yil.toString() === selectedYear);
                const catMatch = (selectedCat === 'all' || item.kategori === selectedCat);
                return yearMatch && catMatch;
            });
            if (filtered.length === 0) {
                timelineListContainer.innerHTML = '<p style="text-align:center; padding:50px; color:#64748b;">Haber bulunamadı.</p>';
            } else {
                renderTimeline(filtered);
            }
        });
    }

    // --- AKILLI ÖNERİ SİMÜLASYONU (STRATEJİK YATIRIM ROZETLERİ DAHİL) ---
    if (smartSimForm) {
        smartSimForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const activeStrategyBtn = document.querySelector('.strategy-btn.active');
            const selectedMode = activeStrategyBtn ? activeStrategyBtn.dataset.mode : 'ESTABLISHED_MARKET';

            const preferences = {
                investorMode: selectedMode,
                teknopark: parseInt(document.getElementById('sim_teknopark').value),
                muhendislik: parseInt(document.getElementById('sim_muhendislik').value),
                osb: parseInt(document.getElementById('sim_osb').value),
                ogrenci: parseInt(document.getElementById('sim_ogrenci').value),
                yol: parseInt(document.getElementById('sim_yol').value),
                tesvik: parseInt(document.getElementById('sim_tesvik').value),
                kira: parseInt(document.getElementById('sim_kira').value),
                ihracat: parseInt(document.getElementById('sim_ihracat').value),
                nufus: parseInt(document.getElementById('sim_nufus').value),
                goc: parseInt(document.getElementById('sim_goc').value)
            };
            
            smartResultsDiv.innerHTML = '<p style="text-align:center; width:100%; font-weight:bold; color:#0f172a;">Stratejik Veriler Analiz Ediliyor...</p>';

            fetch('/api/custom-recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preferences),
            })
            .then(res => res.json())
            .then(result => {
                if (result.success && result.topProvincesWithDetails) {
                    let html = '';
                    result.topProvincesWithDetails.slice(0, 3).forEach((p, index) => {
                        const colors = ['#0f172a', '#3b82f6', '#10b981'];
                        const sectorInfo = p.investmentSector;
                        
                        html += `
                            <div class="recommendation-card" style="border-top: 5px solid ${colors[index]}">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                    <h3 style="color: ${colors[index]}">#${index + 1} ${p.ad}</h3>
                                    <span style="font-size:1.5rem;" title="Sektörel Genetik">${sectorInfo.icon}</span>
                                </div>
                                <div style="margin: 10px 0;">
                                    <span class="score-badge" style="color:${colors[index]}; border-color:${colors[index]}; background: #f8fafc;">Skor: ${p.score.toLocaleString('tr-TR')}</span>
                                    <div style="margin-top:8px; font-size:0.75rem; font-weight:700; color:#475569; background:#e2e8f0; padding:4px 8px; border-radius:4px; display:inline-block;">
                                        🎯 TAVSİYE: ${sectorInfo.type} (%${sectorInfo.match})
                                    </div>
                                </div>
                                <p class="reason-text" style="font-size:0.85rem; line-height:1.4;"><strong>Analiz Notu:</strong><br>${p.comment}</p>
                            </div>`;
                    });
                    smartResultsDiv.innerHTML = html;
                }
            });
        });
    }

    // --- UYGULAMA BAŞLANGICI ---
    showScreen('welcome');
});