document.addEventListener('DOMContentLoaded', () => {
    // Referencias DOM
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const categoriesContainer = document.getElementById('categories-container');
    const badgesContainer = document.getElementById('badges-container');
    const noResults = document.getElementById('no-results');
    const searchTermHighlight = document.getElementById('search-term-highlight');
    
    const totalBadgesCount = document.getElementById('total-badges-count');
    const totalCategoriesCount = document.getElementById('total-categories-count');
    const currentCategoryName = document.getElementById('current-category-name');

    // Referencias DOM del Generador
    const genLabel = document.getElementById('gen-label');
    const genMessage = document.getElementById('gen-message');
    const genColor = document.getElementById('gen-color');
    const genColorPicker = document.getElementById('gen-color-picker');
    const genStyle = document.getElementById('gen-style');
    const genLogo = document.getElementById('gen-logo');
    const badgePreviewImg = document.getElementById('badge-preview-img');
    const copyCustomBtns = document.querySelectorAll('.copy-custom-btn');

    // Estado del Sistema
    let allBadges = [];
    let categoriesList = [];
    let selectedCategory = 'ALL';
    let searchQuery = '';

    // ==========================================
    // 1. CARGA Y PARSEO DINÁMICO DE README.MD
    // ==========================================
    async function loadBadgesData() {
        try {
            const response = await fetch('README.md');
            if (!response.ok) throw new Error('No se pudo leer el archivo README.md');
            
            const markdownText = await response.text();
            parseMarkdown(markdownText);
            
            // Inicializar interfaz
            renderCategories();
            filterAndRenderBadges();
            updateStats();
            
        } catch (error) {
            console.error('Error cargando los badges:', error);
            showToast('Error cargando el archivo de datos.');
            // Fallback en caso de que falle la carga (servidor local sin HTTP)
            loadFallbackData();
        }
    }

    function parseMarkdown(text) {
        const lines = text.split('\n');
        let currentCategory = '';
        allBadges = [];
        const categoriesSet = new Set();

        lines.forEach(line => {
            const trimmedLine = line.trim();
            
            // Detectar Categoría estilo ### (H3)
            if (trimmedLine.startsWith('###')) {
                // Limpiar ### y posibles links de retorno
                let cat = trimmedLine.replace('###', '').trim();
                cat = cat.replace(/\[\([^)]+\)\]/g, '').trim(); // remueve links del ToC
                // Solo asignar si no es un header irrelevante
                if (cat && !cat.toLowerCase().includes('back to top')) {
                    currentCategory = cat;
                }
            } 
            // Detectar Categoría estilo HTML <summary> (por ejemplo, Inteligencia Artificial)
            else if (trimmedLine.includes('<summary>')) {
                const match = trimmedLine.match(/<summary>(.*?)<\/summary>/i);
                if (match && match[1]) {
                    currentCategory = '🤖 ' + match[1].trim();
                }
            }
            // Detectar filas de tabla de badges
            else if (trimmedLine.startsWith('|') && !trimmedLine.includes('Name') && !trimmedLine.includes('Badge') && !trimmedLine.includes('---')) {
                const parts = trimmedLine.split('|').map(p => p.trim());
                // Asegurarse de que sea una fila completa
                if (parts.length >= 4 && currentCategory) {
                    const name = parts[1];
                    const badgeCell = parts[2];
                    const markdownCell = parts[3];

                    // Extraer URL de la imagen del badge del BadgeCell: ![Alt](url)
                    const urlMatch = badgeCell.match(/\((https?:\/\/[^)]+)\)/);
                    if (urlMatch && urlMatch[1]) {
                        const badgeUrl = urlMatch[1];
                        // Limpiar el código markdown removiendo las comillas invertidas (backticks)
                        const markdownCode = markdownCell.replace(/`/g, '').trim();
                        
                        // Ignorar filas de ejemplo
                        if (name && !name.includes('Example') && !name.includes('badge')) {
                            allBadges.push({
                                name: name,
                                category: currentCategory,
                                badgeUrl: badgeUrl,
                                markdownCode: markdownCode
                            });
                            categoriesSet.add(currentCategory);
                        }
                    }
                }
            }
        });

        categoriesList = Array.from(categoriesSet).sort((a, b) => {
            // Mantener IA al inicio por estética y luego orden alfabético
            if (a.includes('🤖')) return -1;
            if (b.includes('🤖')) return 1;
            return a.localeCompare(b);
        });
    }

    // Datos fallback por si se abre localmente sin un servidor web HTTP
    function loadFallbackData() {
        allBadges = [
            { name: 'HTML5', category: '💻 Lenguajes', badgeUrl: 'https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white', markdownCode: '![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)' },
            { name: 'CSS3', category: '💻 Lenguajes', badgeUrl: 'https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white', markdownCode: '![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)' },
            { name: 'JavaScript', category: '💻 Lenguajes', badgeUrl: 'https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E', markdownCode: '![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)' },
            { name: 'React', category: '📚 Frameworks & Librerías', badgeUrl: 'https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB', markdownCode: '![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)' },
            { name: 'Node.js', category: '📚 Frameworks & Librerías', badgeUrl: 'https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white', markdownCode: '![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)' },
            { name: 'MySQL', category: '💾 Bases de Datos', badgeUrl: 'https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white', markdownCode: '![MySQL](https://img.shields.io/badge/mysql-%2300f.svg?style=for-the-badge&logo=mysql&logoColor=white)' }
        ];
        categoriesList = ['💻 Lenguajes', '📚 Frameworks & Librerías', '💾 Bases de Datos'];
        renderCategories();
        filterAndRenderBadges();
        updateStats();
    }

    // ==========================================
    // 2. RENDERIZADO DE LA INTERFAZ
    // ==========================================
    function renderCategories() {
        categoriesContainer.innerHTML = '';
        
        // Elemento "Todas las Categorías"
        const allItem = document.createElement('button');
        allItem.className = `category-item ${selectedCategory === 'ALL' ? 'active' : ''}`;
        allItem.innerHTML = `
            <span>Todas las Categorías</span>
            <span class="category-count">${allBadges.length}</span>
        `;
        allItem.addEventListener('click', () => selectCategory('ALL'));
        categoriesContainer.appendChild(allItem);

        // Renderizar cada categoría dinámica parsed de README
        categoriesList.forEach(cat => {
            const count = allBadges.filter(b => b.category === cat).length;
            const catItem = document.createElement('button');
            catItem.className = `category-item ${selectedCategory === cat ? 'active' : ''}`;
            catItem.innerHTML = `
                <span>${cat}</span>
                <span class="category-count">${count}</span>
            `;
            catItem.addEventListener('click', () => selectCategory(cat));
            categoriesContainer.appendChild(catItem);
        });
    }

    function selectCategory(cat) {
        selectedCategory = cat;
        
        // Actualizar estados visuales de las categorías
        const items = categoriesContainer.querySelectorAll('.category-item');
        items.forEach((item, index) => {
            const isAll = index === 0;
            const currentCat = isAll ? 'ALL' : categoriesList[index - 1];
            if (currentCat === selectedCategory) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Filtrar y actualizar
        filterAndRenderBadges();
        updateStats();
    }

    function filterAndRenderBadges() {
        // Filtrar badges por categoría y por buscador
        const filtered = allBadges.filter(badge => {
            const matchesCat = (selectedCategory === 'ALL' || badge.category === selectedCategory);
            const matchesSearch = badge.name.toLowerCase().includes(searchQuery) ||
                                  badge.category.toLowerCase().includes(searchQuery);
            return matchesCat && matchesSearch;
        });

        // Limpiar grid de badges
        badgesContainer.innerHTML = '';

        if (filtered.length === 0) {
            noResults.classList.remove('hidden');
            searchTermHighlight.textContent = searchQuery;
            badgesContainer.classList.add('hidden');
        } else {
            noResults.classList.add('hidden');
            badgesContainer.classList.remove('hidden');

            // Renderizar tarjetas de badges
            filtered.forEach(badge => {
                const card = document.createElement('div');
                card.className = 'badge-card';
                card.innerHTML = `
                    <div class="badge-card-header">
                        <span class="badge-name">${badge.name}</span>
                        <span class="badge-category-tag">${badge.category.replace(/[^\w\s\u00C0-\u017F]/g, '').trim().substring(0, 15)}</span>
                    </div>
                    <div class="badge-display-box">
                        <img src="${badge.badgeUrl}" alt="${badge.name}" loading="lazy">
                    </div>
                    <div class="badge-actions">
                        <button class="btn-copy btn-md" data-type="markdown" title="Copiar código Markdown">
                            <i data-lucide="file-code"></i> MD
                        </button>
                        <button class="btn-copy" data-type="html" title="Copiar código HTML">
                            <i data-lucide="code"></i> HTML
                        </button>
                        <button class="btn-copy" data-type="url" title="Copiar URL directa">
                            <i data-lucide="link"></i> URL
                        </button>
                    </div>
                `;

                // Eventos de copiado dentro de la tarjeta
                const copyButtons = card.querySelectorAll('.btn-copy');
                copyButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        const type = btn.dataset.type;
                        let textToCopy = '';

                        if (type === 'markdown') {
                            textToCopy = badge.markdownCode;
                        } else if (type === 'html') {
                            textToCopy = `<img src="${badge.badgeUrl}" alt="${badge.name}" />`;
                        } else if (type === 'url') {
                            textToCopy = badge.badgeUrl;
                        }

                        copyToClipboard(textToCopy, `¡${badge.name} Badge copiado!`);
                    });
                });

                badgesContainer.appendChild(card);
            });

            // Re-instanciar Lucide Icons para que renderice los nuevos iconos
            lucide.createIcons();
        }
    }

    function updateStats() {
        totalBadgesCount.textContent = allBadges.length;
        totalCategoriesCount.textContent = categoriesList.length;
        currentCategoryName.textContent = selectedCategory === 'ALL' ? 'Todas las Categorías' : selectedCategory;
    }

    // ==========================================
    // 3. LÓGICA DE BÚSQUEDA
    // ==========================================
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        
        if (searchQuery.length > 0) {
            clearSearchBtn.style.display = 'flex';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        
        filterAndRenderBadges();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        filterAndRenderBadges();
        searchInput.focus();
    });

    // ==========================================
    // 4. LÓGICA DEL GENERADOR DE BADGES CUSTOM
    // ==========================================
    function updateCustomBadge() {
        const label = genLabel.value.trim() || 'Badge';
        const message = genMessage.value.trim() || 'Custom';
        let color = genColor.value.trim().replace('#', '') || '6366f1';
        const style = genStyle.value;
        const logo = genLogo.value.trim();

        // Encodear componentes para Shields.io
        // Shields.io escapa guiones con doble guión y espacios con %20 o guiones bajos
        const escapedLabel = encodeURIComponent(label.replace(/-/g, '--').replace(/_/g, '__'));
        const escapedMessage = encodeURIComponent(message.replace(/-/g, '--').replace(/_/g, '__'));

        let url = `https://img.shields.io/badge/${escapedLabel}-${escapedMessage}-${color}?style=${style}`;
        
        if (logo) {
            url += `&logo=${encodeURIComponent(logo.toLowerCase())}&logoColor=white`;
        }

        badgePreviewImg.src = url;
    }

    // Eventos del Generador para actualización en tiempo real
    genLabel.addEventListener('input', updateCustomBadge);
    genMessage.addEventListener('input', updateCustomBadge);
    genStyle.addEventListener('change', updateCustomBadge);
    genLogo.addEventListener('input', updateCustomBadge);

    genColor.addEventListener('input', (e) => {
        let val = e.target.value.trim();
        if (val.length === 6 && !val.startsWith('#')) {
            genColorPicker.value = '#' + val;
        } else if (val.startsWith('#') && val.length === 7) {
            genColorPicker.value = val;
        }
        updateCustomBadge();
    });

    genColorPicker.addEventListener('input', (e) => {
        const hex = e.target.value.substring(1); // Remueve '#'
        genColor.value = hex;
        updateCustomBadge();
    });

    // Acciones de copiado del badge Custom
    copyCustomBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const label = genLabel.value.trim() || 'Badge';
            const message = genMessage.value.trim() || 'Custom';
            const url = badgePreviewImg.src;
            let textToCopy = '';

            if (type === 'markdown') {
                textToCopy = `![${label}](${url})`;
            } else if (type === 'html') {
                textToCopy = `<img src="${url}" alt="${label} ${message}" />`;
            } else if (type === 'url') {
                textToCopy = url;
            }

            copyToClipboard(textToCopy, '¡Badge personalizado copiado!');
        });
    });

    // ==========================================
    // 5. UTILIDADES DE COPIADO AL PORTAPAPELES
    // ==========================================
    function copyToClipboard(text, successMessage) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => showToast(successMessage))
                .catch(err => {
                    console.error('Error copiando:', err);
                    fallbackCopyTextToClipboard(text, successMessage);
                });
        } else {
            fallbackCopyTextToClipboard(text, successMessage);
        }
    }

    function fallbackCopyTextToClipboard(text, successMessage) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Evitar scrolling
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) showToast(successMessage);
            else showToast('No se pudo copiar.');
        } catch (err) {
            console.error('Fallback falló:', err);
            showToast('Error al copiar.');
        }

        document.body.removeChild(textArea);
    }

    function showToast(message) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `
            <i data-lucide="check-circle-2"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        lucide.createIcons(); // Renderizar icono Lucide recién creado
        
        // Animación de salida automática
        setTimeout(() => {
            toast.classList.add('removing');
            toast.addEventListener('animationend', () => {
                toast.remove();
            });
        }, 2200);
    }

    // Inicializar carga de datos
    loadBadgesData();
});
