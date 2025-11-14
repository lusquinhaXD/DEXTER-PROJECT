/* * Adiciona um "ouvinte de eventos" que espera o documento HTML 
 * estar completamente carregado e analisado antes de executar o código.
 * Isso garante que todos os elementos HTML (como 'product-grid') existam.
 */
document.addEventListener('DOMContentLoaded', () => {

    // ---------------------------------------------------------------------
    // ESTADO DA APLICAÇÃO (STATE)
    // ---------------------------------------------------------------------
    /*
     * O 'state' é um objeto que guarda todos os dados importantes da 
     * aplicação. É a "fonte única da verdade". Quando algo muda 
     * (ex: adiciona ao carrinho), nós atualizamos o 'state' e
     * depois "redesenhamos" a página com base nesses novos dados.
     */
    let state = {
        products: [], // Lista de todos os produtos da loja
        cart: [],     // Lista de produtos no carrinho
    };

    // ---------------------------------------------------------------------
    // MAPEAMENTO DOS ELEMENTOS DO DOM (HTML)
    // ---------------------------------------------------------------------
    /*
     * Guardamos referências aos elementos HTML mais usados em um objeto.
     * Isso melhora a performance (não precisamos buscar o mesmo elemento 
     * várias vezes) e organiza o código.
     */
    const DOMElements = {
        pages: document.querySelectorAll('.page'), // Todas as seções que funcionam como "páginas"
        navLinks: document.querySelectorAll('.nav-link'), // Todos os links de navegação
        productGrid: document.getElementById('product-grid'), // Onde os produtos aparecem na home
        cartCount: document.getElementById('cart-count'), // O número no ícone do carrinho
        cartItemsContainer: document.getElementById('cart-items-container'), // A lista de itens no carrinho
        cartTotal: document.getElementById('cart-total'), // O valor total do carrinho
        productDetailContent: document.getElementById('product-detail-content'), // Onde o detalhe do produto é mostrado
        adminProductList: document.getElementById('admin-product-list'), // Lista de produtos no painel admin
        toast: document.getElementById('toast'), // A notificação (popup)
        
        // Formulários
        loginForm: document.getElementById('login-form'),
        registerForm: document.getElementById('register-form'),
        addProductForm: document.getElementById('add-product-form'),
    };

    
    // ---------------------------------------------------------------------
    // FUNÇÃO DE INICIALIZAÇÃO
    // ---------------------------------------------------------------------
    /*
     * A função 'init' (iniciar) é o ponto de partida. Ela organiza o que 
     * deve acontecer assim que a página carrega.
     */
    function init() {
        
        // 1. Carrega dados salvos do LocalStorage (carrinho, produtos)
        loadStateFromLocalStorage();
        
        // 2. "Desenha" os produtos, o carrinho e a lista de admin na tela
        renderProductGrid();
        renderCart();
        renderAdminProductList();
        
        // 3. Configura todos os "ouvintes de evento" (cliques em botões, envios de formulário, etc.)
        setupEventListeners();
    }

    
    // ---------------------------------------------------------------------
    // CONFIGURAÇÃO DOS EVENT LISTENERS (OUVINTES DE EVENTO)
    // ---------------------------------------------------------------------
    /*
     * Esta função centraliza toda a interatividade da página.
     * Ela "escuta" por ações do usuário (cliques, envios).
     */
    function setupEventListeners() {
        
        // --- Ouvintes da Navegação (Links) ---
        // Itera (passa por) sobre cada link de navegação
        DOMElements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault(); // Impede o link de recarregar a página (comportamento padrão de <a>)
                const pageId = link.dataset.page; // Pega o 'data-page' (ex: "page-home") do HTML
                showPage(pageId); // Chama a função para mostrar a página clicada
            });
        });

        
        // --- Ouvintes dos Formulários ---
        DOMElements.loginForm.addEventListener('submit', handleLogin);
        DOMElements.registerForm.addEventListener('submit', handleRegister);
        DOMElements.addProductForm.addEventListener('submit', handleAddProduct);

        
        // --- Ouvinte da Grade de Produtos (Delegação de Evento) ---
        /*
         * Usamos "Delegação de Evento" aqui. Em vez de adicionar um "ouvinte"
         * em CADA botão, adicionamos um único "ouvinte" no 'productGrid' (o "pai").
         * Quando um clique acontece, verificamos se o alvo foi um botão de interesse.
         * Isso é muito mais eficiente.
         */
        DOMElements.productGrid.addEventListener('click', e => {
            
            // Verifica se o clique foi em um botão "Adicionar ao Carrinho" ou em um filho dele
            if (e.target.closest('.btn-add-to-cart')) {
                const id = e.target.closest('.btn-add-to-cart').dataset.id; // Pega o ID do produto
                addToCart(id);
            }
            
            // Verifica se o clique foi em um link "Ver Detalhes"
            if (e.target.closest('.btn-view-detail')) {
                e.preventDefault(); // Impede o link <a> de navegar
                const id = e.target.closest('.btn-view-detail').dataset.id;
                showProductDetail(id);
            }
        });

        
        // --- Ouvinte do Container do Carrinho (Delegação de Evento) ---
        DOMElements.cartItemsContainer.addEventListener('click', e => {
            
            // Verifica se o clique foi no botão "Remover"
            if (e.target.closest('.btn-remove-from-cart')) {
                const id = e.target.closest('.btn-remove-from-cart').dataset.id;
                removeFromCart(id);
            }
        });
        
        
        // --- Ouvinte da Página de Detalhe do Produto ---
        DOMElements.productDetailContent.addEventListener('click', e => {
            // Verifica se o clique foi no botão "Adicionar ao Carrinho" da página de detalhe
            if (e.target.closest('.btn-add-to-cart-detail')) {
                const id = e.target.closest('.btn-add-to-cart-detail').dataset.id;
                addToCart(id);
            }
        });

        
        // --- Ouvinte da Lista de Admin (Delegação de Evento) ---
        DOMElements.adminProductList.addEventListener('click', e => {
            
            // Verifica se o clique foi no botão "Remover" (deletar produto)
            if (e.target.closest('.btn-delete-product')) {
                const id = e.target.closest('.btn-delete-product').dataset.id;
                deleteProduct(id);
            }
        });
    }

    
    // ---------------------------------------------------------------------
    // FUNÇÕES DE NAVEGAÇÃO E UI (USER INTERFACE)
    // ---------------------------------------------------------------------

    /**
     * Mostra uma página (seção) específica e esconde todas as outras.
     * Isso cria a ilusão de um site de "várias páginas" (SPA - Single Page Application).
     * @param {string} pageId - O ID da seção HTML para mostrar (ex: 'page-home').
     */
    function showPage(pageId) {
        if (!pageId) return; // Se o ID for nulo ou indefinido, não faz nada
        
        // Itera sobre todas as seções com a classe '.page'
        DOMElements.pages.forEach(page => {
            // Se o ID da página for o ID que queremos mostrar...
            if (page.id === pageId) {
                page.style.display = 'block'; // Mostra
            } else {
                page.style.display = 'none'; // Esconde
            }
        });
        
        // Rola a janela para o topo sempre que trocar de página
        window.scrollTo(0, 0);
    }

    /**
     * Mostra uma notificação (toast) no canto da tela.
     * @param {string} message - A mensagem para exibir.
     * @param {boolean} [isError=false] - Se true, mostra a notificação com fundo vermelho (erro).
     */
    function showToast(message, isError = false) {
        DOMElements.toast.textContent = message; // Define o texto
        
        // Define a classe CSS (verde para sucesso, vermelho para erro)
        DOMElements.toast.className = isError 
            ? 'show bg-red-600' // Classe de erro (vermelho)
            : 'show bg-green-500'; // Classe de sucesso (verde)
        
        // Define um "timer" para esconder a notificação após 3 segundos (3000ms)
        setTimeout(() => {
            DOMElements.toast.className = DOMElements.toast.className.replace('show', '');
        }, 3000);
    }

    // ---------------------------------------------------------------------
    // FUNÇÕES DE DADOS (LOCALSTORAGE)
    // ---------------------------------------------------------------------
    
    /**
     * Carrega os dados de produtos e carrinho do LocalStorage (memória do navegador).
     * Isso faz com que os dados persistam mesmo se o usuário fechar a aba.
     */
    function loadStateFromLocalStorage() {
        // Tenta carregar os produtos salvos
        const storedProducts = localStorage.getItem('techshop_products');
        // Tenta carregar o carrinho salvo
        const storedCart = localStorage.getItem('techshop_cart');

        if (storedProducts) {
            // Se achou produtos, converte o texto (JSON) de volta para um array
            state.products = JSON.parse(storedProducts);
        } else {
            // Se não houver produtos, carrega os dados iniciais (mock)
            state.products = getInitialProducts();
            saveProductsToLocalStorage(); // E salva esses dados iniciais no LocalStorage
        }

        if (storedCart) {
            // Se achou um carrinho salvo, carrega
            state.cart = JSON.parse(storedCart);
        }
        // Se não achou, 'state.cart' continua como o array vazio [] que definimos no início.
    }

    
    /** Salva a lista de PRODUTOS ATUAL no LocalStorage */
    function saveProductsToLocalStorage() {
        // Converte o array de produtos para uma string JSON e salva
        localStorage.setItem('techshop_products', JSON.stringify(state.products));
    }

    
    /** Salva o CARRINHO ATUAL no LocalStorage */
    function saveCartToLocalStorage() {
        localStorage.setItem('techshop_cart', JSON.stringify(state.cart));
    }

    // ---------------------------------------------------------------------
    // FUNÇÕES DE RENDERIZAÇÃO (Desenhar na tela)
    // ---------------------------------------------------------------------

    /**
     * "Renderiza" (desenha) a grade de produtos na página inicial.
     * Ele lê o 'state.products' e cria o HTML para cada produto.
     */
    function renderProductGrid() {
        DOMElements.productGrid.innerHTML = ''; // Limpa a grade antes de adicionar novos
        
        // Se não houver produtos, mostra uma mensagem
        if (state.products.length === 0) {
            DOMElements.productGrid.innerHTML = '<p class="text-gray-600 col-span-3">Nenhum produto cadastrado. Adicione produtos no painel Admin.</p>';
            return; // Encerra a função
        }

        // Itera sobre cada produto no 'state'
        state.products.forEach(product => {
            // Cria o "card" do produto usando Template Literals (crases ``)
            const productCard = `
                <div class="bg-white rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105">
                    <img src="${product.img}" alt="${product.name}" class="product-image">
                    <div class="p-6">
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">${product.name}</h3>
                        <p class="text-2xl font-bold text-indigo-600 mb-4">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                        <div class="flex flex-col sm:flex-row sm:justify-between gap-3">
                            <a href="#" class="btn-view-detail w-full sm:w-auto text-center text-indigo-600 border border-indigo-600 py-2 px-4 rounded-lg hover:bg-indigo-50" data-id="${product.id}">Ver Detalhes</a>
                            <button class="btn-add-to-cart w-full sm:w-auto bg-indigo-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors" data-id="${product.id}">
                                Adicionar ao Carrinho
                            </button>
                        </div>
                    </div>
                </div>
            `;
            // Adiciona o card criado ao HTML da grade de produtos
            DOMElements.productGrid.innerHTML += productCard;
        });
    }
    
    
    /**
     * Mostra a página de detalhe de um produto específico.
     * @param {string} productId - O ID do produto a ser exibido.
     */
    function showProductDetail(productId) {
        // Encontra o produto no 'state' usando o ID
        const product = state.products.find(p => p.id === productId);
        if (!product) return; // Se não encontrar o produto, não faz nada
        
        // Cria o HTML para a página de detalhes
        DOMElements.productDetailContent.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <img src="${product.img}" alt="${product.name}" class="w-full h-auto object-cover rounded-lg shadow-md">
                <div>
                    <h1 class="text-4xl font-bold mb-3">${product.name}</h1>
                    <p class="text-3xl text-indigo-600 font-semibold mb-6">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                    <p class="text-gray-700 text-lg mb-8">${product.description}</p>
                    <button class="btn-add-to-cart-detail w-full md:w-auto bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-lg" data-id="${product.id}">
                        Adicionar ao Carrinho
                    </button>
                </div>
            </div>
        `;
        // Mostra a página de detalhes
        showPage('page-product-detail');
    }

    
    /**
     * Renderiza (desenha) os itens do carrinho na página do carrinho.
     * Lê o 'state.cart' e cria o HTML.
     */
    function renderCart() {
        DOMElements.cartItemsContainer.innerHTML = ''; // Limpa o container
        let total = 0; // Variável para somar o total

        // Se o carrinho estiver vazio, mostra mensagem
        if (state.cart.length === 0) {
            DOMElements.cartItemsContainer.innerHTML = '<p class="text-gray-600">Seu carrinho está vazio.</p>';
            DOMElements.cartTotal.textContent = 'R$ 0,00';
            DOMElements.cartCount.textContent = '0';
            return; // Encerra a função
        }

        // Itera sobre cada item no 'state.cart'
        state.cart.forEach(item => {
            const itemTotal = item.price * item.quantity; // Calcula o subtotal do item
            total += itemTotal; // Adiciona ao total geral
            
            // Cria o HTML para o item do carrinho
            const cartItem = `
                <div class="flex justify-between items-center py-4 border-b border-gray-200">
                    <div class="flex items-center">
                        <img src="${item.img}" alt="${item.name}" class="h-16 w-16 object-cover rounded-lg mr-4">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800">${item.name}</h4>
                            <p class="text-gray-600">Qtd: ${item.quantity}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-lg font-semibold text-gray-800">R$ ${itemTotal.toFixed(2).replace('.', ',')}</p>
                        <button class="btn-remove-from-cart text-red-500 hover:text-red-700 text-sm" data-id="${item.id}">
                            Remover
                        </button>
                    </div>
                </div>
            `;
            DOMElements.cartItemsContainer.innerHTML += cartItem;
        });

        // Atualiza o texto do total geral
        DOMElements.cartTotal.textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
        
        // Calcula a quantidade total de itens (somando as quantidades de CADA item)
        // 'reduce' é um método de array que "reduz" o array a um único valor.
        // Começa com 'sum' = 0, e para cada 'item', adiciona 'item.quantity' ao 'sum'.
        const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Atualiza o contador no ícone do carrinho
        DOMElements.cartCount.textContent = totalItems;
    }

    
    /**
     * Renderiza a lista de produtos na página de Admin.
     */
    function renderAdminProductList() {
        DOMElements.adminProductList.innerHTML = ''; // Limpa a lista
        
        // Se não houver produtos, mostra mensagem
        if (state.products.length === 0) {
            DOMElements.adminProductList.innerHTML = '<p class="text-gray-600">Nenhum produto cadastrado.</p>';
            return;
        }

        // Itera sobre os produtos e cria o HTML para a lista de admin
        state.products.forEach(product => {
            const productItem = `
                <div class="flex justify-between items-center p-4 border rounded-lg">
                    <div class="flex items-center">
                        <img src="${product.img}" alt="${product.name}" class="h-12 w-12 object-cover rounded-lg mr-4">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800">${product.name}</h4>
                            <p class="text-gray-600">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                    <button class="btn-delete-product bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors" data-id="${product.id}">
                        Remover
                    </button>
                </div>
            `;
            DOMElements.adminProductList.innerHTML += productItem;
        });
    }

    // ---------------------------------------------------------------------
    // FUNÇÕES DE LÓGICA DE NEGÓCIO
    // ---------------------------------------------------------------------

    /**
     * Adiciona um produto ao carrinho (state.cart).
     * @param {string} productId - O ID do produto a ser adicionado.
     */
    function addToCart(productId) {
        // 1. Encontra o produto na lista GERAL de produtos
        const product = state.products.find(p => p.id === productId);
        if (!product) return; // Se não achar, encerra

        // 2. Verifica se o item JÁ ESTÁ no carrinho
        const cartItem = state.cart.find(item => item.id === productId);

        if (cartItem) {
            // 3a. Se JÁ ESTÁ, apenas aumenta a quantidade
            cartItem.quantity++;
        } else {
            // 3b. Se NÃO ESTÁ, adiciona o produto ao carrinho com quantidade 1
            state.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                img: product.img,
                quantity: 1
            });
        }
        
        // 4. Salva o carrinho atualizado no LocalStorage
        saveCartToLocalStorage();
        // 5. Redesenha o carrinho na tela
        renderCart();
        // 6. Mostra uma notificação de sucesso
        showToast(`${product.name} adicionado ao carrinho!`);
    }

    /**
     * Remove um item do carrinho.
     * @param {string} productId - O ID do produto a ser removido.
     */
    function removeFromCart(productId) {
        // Encontra a POSIÇÃO (índice) do item no array do carrinho
        const itemIndex = state.cart.findIndex(item => item.id === productId);
        if (itemIndex === -1) return; // Se não achar (índice -1), encerra

        const itemName = state.cart[itemIndex].name; // Pega o nome para a notificação
        
        // Remove o item do array 'state.cart' usando seu índice
        state.cart.splice(itemIndex, 1); 
        
        // Salva e redesenha
        saveCartToLocalStorage();
        renderCart();
        showToast(`${itemName} removido do carrinho.`, true); // true = notificação de erro (vermelha)
    }

    /**
     * Lida com o envio do formulário de Adicionar Produto (Admin).
     * @param {Event} e - O objeto do evento de 'submit'.
     */
    function handleAddProduct(e) {
        e.preventDefault(); // Impede o formulário de recarregar a página
        
        // Pega os valores dos campos do formulário
        const name = document.getElementById('prod-name').value;
        const price = parseFloat(document.getElementById('prod-price').value); // Converte para número
        const img = document.getElementById('prod-img').value;
        const description = document.getElementById('prod-desc').value;

        // Validação simples
        if (!name || !price || !img || !description) {
            showToast('Por favor, preencha todos os campos.', true);
            return;
        }

        // Cria o objeto do novo produto
        const newProduct = {
            id: Date.now().toString(), // ID único baseado no timestamp atual
            name,
            price,
            img,
            description
        };

        // Adiciona o novo produto ao 'state.products'
        state.products.push(newProduct);
        
        // Salva a nova lista de produtos no LocalStorage
        saveProductsToLocalStorage();
        
        // Redesenha a grade de produtos na Home E a lista de produtos no Admin
        renderProductGrid();
        renderAdminProductList();
        
        // Limpa os campos do formulário
        DOMElements.addProductForm.reset();
        // Mostra notificação de sucesso
        showToast('Produto adicionado com sucesso!');
    }

    /**
     * Deleta um produto da loja (state.products).
     * @param {string} productId - O ID do produto a ser deletado.
     */
    function deleteProduct(productId) {
        // Encontra o ÍNDICE do produto na lista
        const productIndex = state.products.findIndex(p => p.id === productId);
        if (productIndex === -1) return;

        const productName = state.products[productIndex].name;
        
        // Remove o produto da lista 'state.products'
        state.products.splice(productIndex, 1);
        
        // Salva a lista atualizada
        saveProductsToLocalStorage();
        
        // Redesenha a grade da Home e a lista do Admin
        renderProductGrid();
        renderAdminProductList();
        
        // Mostra notificação
        showToast(`${productName} removido da loja.`, true);
        
        // TODO: Idealmente, também deveria remover o produto do carrinho de todos os usuários,
        // mas com o LocalStorage, só conseguimos remover do 'state.cart' atual.
        // Fica como uma melhoria futura.
    }

    // ---------------------------------------------------------------------
    // FUNÇÕES DE AUTENTICAÇÃO (Login/Registro)
    // ---------------------------------------------------------------------
    // ATENÇÃO: Este é um sistema de "login" FALSO. Ele salva apenas UM
    // usuário no LocalStorage. Não é seguro e serve apenas para fins de
    // demonstração de um app front-end.
    // ---------------------------------------------------------------------

    /** Lida com o envio do formulário de Login */
    function handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        // Tenta carregar o usuário salvo no LocalStorage
        const storedUser = localStorage.getItem('techshop_user');
        
        if (storedUser) {
            const user = JSON.parse(storedUser); // Converte o texto para objeto
            
            // Verifica se o email e a senha batem
            if (user.email === email && user.pass === pass) {
                showToast(`Bem-vindo de volta, ${user.name}!`);
                showPage('page-home'); // Redireciona para a Home
                DOMElements.loginForm.reset(); // Limpa o formulário
            } else {
                showToast('Email ou senha incorretos.', true);
            }
        } else {
            // Se 'storedUser' é nulo, ninguém se cadastrou ainda
            showToast('Nenhum usuário cadastrado.', true);
        }
    }

    /** Lida com o envio do formulário de Registro */
    function handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;

        // Cria o objeto do novo usuário
        const newUser = { name, email, pass };
        
        // Salva o usuário no LocalStorage (sobrescrevendo qualquer usuário anterior)
        localStorage.setItem('techshop_user', JSON.stringify(newUser));
        
        showToast('Cadastro realizado com sucesso! Faça o login.');
        DOMElements.registerForm.reset();
        
        // Não redireciona, o usuário agora pode fazer login
        // showPage('page-login'); // Esta linha já estava comentada, mas é uma opção
    }


    // ---------------------------------------------------------------------
    // INICIALIZAÇÃO
    // ---------------------------------------------------------------------
    // Chama a função 'init' para dar o "pontapé inicial" na aplicação.
    init();

});
