// --- URL DEL TUO SCRIPT GOOGLE ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbycz4m_IIyyu3xAIWSIqYfi7fj2Vj7nv60VVdZtTa4xibdho5axl6ayEyddbWGRFRx6Ww/exec';
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    const searchBox = document.getElementById('search-box');
    let allShopsData = {}; // Variabile per conservare tutti i dati dei negozi

    applyTheme(tg.themeParams);
    tg.onEvent('themeChanged', () => applyTheme(tg.themeParams));

    fetchNegozi();

    // Aggiungi l'evento per la ricerca
    searchBox.addEventListener('input', (e) => {
        filterNegozi(e.target.value);
    });

    function applyTheme(themeParams) {
        const root = document.documentElement;
        root.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
        root.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
        root.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#007bff');
        root.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        root.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999');
        root.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#007bff');
        root.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#f0f0f0');
    }
    
    // ✅ Funzione helper per creare nomi di classe CSS sicuri
    function slugify(text) {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Sostituisce gli spazi con -
            .replace(/&/g, '-and-')         // Sostituisce & con 'and'
            .replace(/[^\w\-]+/g, '')       // Rimuove tutti i caratteri non-parola
            .replace(/\-\-+/g, '-');        // Sostituisce multipli - con uno solo
    }

    async function fetchNegozi() {
        try {
            const response = await fetch(GAS_URL);
            if (!response.ok) throw new Error('Errore di rete');
            allShopsData = await response.json();
            renderNegozi(allShopsData);
        } catch (error) {
            document.getElementById('loading').innerText = 'Impossibile caricare i negozi. Riprova più tardi.';
            console.error('Errore nel fetch:', error);
        }
    }

    function renderNegozi(data) {
        const shopListContainer = document.getElementById('shop-list');
        const loadingDiv = document.getElementById('loading');
        const noResultsP = document.getElementById('no-results');
        shopListContainer.innerHTML = '';
        
        const sortedCategories = Object.keys(data); // I dati arrivano già ordinati dallo script Google

        if (sortedCategories.length === 0 && document.getElementById('search-box').value === "") {
             loadingDiv.classList.add('hidden');
             noResultsP.classList.remove('hidden');
             noResultsP.innerText = 'Nessun negozio disponibile.';
             return;
        }
        
        loadingDiv.classList.add('hidden');
        noResultsP.classList.add('hidden');

        let totalShopsRendered = 0;
        for (const category of sortedCategories) {
            const shopsInCategory = data[category];
            if (shopsInCategory.length > 0) {
                totalShopsRendered += shopsInCategory.length;
                const categoryTitle = document.createElement('h2');
                categoryTitle.className = 'category-title';
                categoryTitle.textContent = category;
                shopListContainer.appendChild(categoryTitle);

                shopsInCategory.forEach(shop => {
                    const shopLink = document.createElement('a');
                    shopLink.href = shop.link;

                    // ✅ Aggiunta della classe per lo stile della categoria
                    shopLink.className = `shop-item category-${slugify(category)}`;

                    const logo = document.createElement('img');
                    logo.className = 'shop-logo';
                    logo.src = `media/${shop.nome}.png`; 
                    logo.alt = `Logo ${shop.nome}`;
                    logo.onerror = () => { logo.style.display = 'none'; };

                    const name = document.createElement('span');
                    name.className = 'shop-name';
                    name.textContent = shop.nome;
                    
                    shopLink.appendChild(logo);
                    shopLink.appendChild(name);
                    
                    shopLink.addEventListener('click', (event) => {
                        event.preventDefault();
                        logClickAndRedirect(shop.nome, shop.link);
                    });
                    
                    shopListContainer.appendChild(shopLink);
                });
            }
        }
        if (totalShopsRendered === 0) {
            noResultsP.innerText = 'Nessun negozio trovato per la tua ricerca.';
            noResultsP.classList.remove('hidden');
        }
    }
    
    function filterNegozi(query) {
        const lowerCaseQuery = query.toLowerCase().trim();
        if (!lowerCaseQuery) {
            renderNegozi(allShopsData);
            return;
        }
        
        const filteredData = {};

        for (const category in allShopsData) {
            const matchingShops = allShopsData[category].filter(shop => 
                shop.nome.toLowerCase().includes(lowerCaseQuery)
            );
            
            if (matchingShops.length > 0) {
                filteredData[category] = matchingShops;
            }
        }
        
        renderNegozi(filteredData);
    }

    async function logClickAndRedirect(shopName, shopLink) {
        tg.HapticFeedback.impactOccurred('light');
        const userData = tg.initDataUnsafe.user;
        if (!userData) {
            tg.openLink(shopLink);
            return;
        }
        const payload = {
            user: { id: userData.id, username: userData.username, first_name: userData.first_name, last_name: userData.last_name },
            shopName: shopName
        };
        try {
            await fetch(GAS_URL, {
                method: 'POST', mode: 'no-cors', cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error("Errore nel loggare il click:", error);
        } finally {
            tg.openLink(shopLink);
        }
    }
});
