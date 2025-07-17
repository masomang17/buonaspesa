// --- URL DEL TUO SCRIPT GOOGLE ---
const GAS_URL = 'https://script.google.com/macros/s/AKfycbycz4m_IIyyu3xAIWSIqYfi7fj2Vj7nv60VVdZtTa4xibdho5axl6ayEyddbWGRFRx6Ww/exec';
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    tg.ready();

    // Applica i colori del tema di Telegram all'avvio
    applyTheme(tg.themeParams);
    
    // Ascolta i cambiamenti del tema in tempo reale
    tg.onEvent('themeChanged', () => applyTheme(tg.themeParams));

    fetchNegozi();

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

    // Funzione per caricare i negozi
    async function fetchNegozi() {
        try {
            const response = await fetch(GAS_URL);
            if (!response.ok) throw new Error('Errore di rete');
            const data = await response.json();
            renderNegozi(data);
        } catch (error) {
            document.getElementById('loading').innerText = 'Impossibile caricare i negozi. Riprova più tardi.';
            console.error('Errore nel fetch:', error);
        }
    }

    // Funzione per mostrare i negozi nell'HTML
    function renderNegozi(data) {
        const shopListContainer = document.getElementById('shop-list');
        const loadingDiv = document.getElementById('loading');
        shopListContainer.innerHTML = '';
        
        const sortedCategories = Object.keys(data).sort();

        if (sortedCategories.length === 0) {
             loadingDiv.innerText = 'Nessun negozio trovato.';
             return;
        }
        
        loadingDiv.style.display = 'none';

        for (const category of sortedCategories) {
            const categoryTitle = document.createElement('h2');
            categoryTitle.className = 'category-title';
            categoryTitle.textContent = category;
            shopListContainer.appendChild(categoryTitle);

            data[category].forEach(shop => {
                const shopLink = document.createElement('a');
                shopLink.className = 'shop-item';
                shopLink.href = shop.link;
                shopLink.textContent = shop.nome;
                
                shopLink.addEventListener('click', (event) => {
                    event.preventDefault();
                    logClickAndRedirect(shop.nome, shop.link);
                });
                
                shopListContainer.appendChild(shopLink);
            });
        }
    }

    // Funzione per registrare il click e reindirizzare l'utente
    async function logClickAndRedirect(shopName, shopLink) {
        tg.HapticFeedback.impactOccurred('light');

        const userData = tg.initDataUnsafe.user;
        if (!userData) {
            console.warn("Dati utente non disponibili. Reindirizzamento diretto.");
            tg.openLink(shopLink);
            return;
        }

        const payload = {
            user: {
                id: userData.id,
                username: userData.username,
                first_name: userData.first_name,
                last_name: userData.last_name
            },
            shopName: shopName
        };

        try {
            await fetch(GAS_URL, {
                method: 'POST',
                mode: 'no-cors',
                cache: 'no-cache',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        } catch (error) {
            console.error("Errore nel loggare il click:", error);
        } finally {
            tg.openLink(shopLink);
        }
    }
});