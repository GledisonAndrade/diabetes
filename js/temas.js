// js/temas.js - Gerenciamento de temas
document.addEventListener('DOMContentLoaded', function() {
    const btnTemas = document.getElementById('btn-temas');
    const menuTemas = document.getElementById('menu-temas');
    const temaAtual = localStorage.getItem('tema') || 'claro';
    
    // Aplicar tema salvo
    aplicarTema(temaAtual);
    
    // Alternar menu de temas
    btnTemas.addEventListener('click', function(e) {
        e.stopPropagation();
        menuTemas.classList.toggle('mostrar');
    });
    
    // Fechar menu ao clicar fora
    document.addEventListener('click', function(e) {
        if (!btnTemas.contains(e.target) && !menuTemas.contains(e.target)) {
            menuTemas.classList.remove('mostrar');
        }
    });
    
    // Selecionar tema
    menuTemas.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function() {
            const novoTema = this.getAttribute('data-tema');
            aplicarTema(novoTema);
            menuTemas.classList.remove('mostrar');
        });
    });
    
    function aplicarTema(tema) {
        // Remover todas as classes de tema
        document.body.classList.remove('tema-claro', 'tema-escuro', 'tema-verde', 'tema-azul');
        
        // Adicionar a classe do tema selecionado
        document.body.classList.add(`tema-${tema}`);
        
        // Salvar preferência
        localStorage.setItem('tema', tema);
        
        console.log(`Tema aplicado: ${tema}`);
        
        // Atualizar gráfico se existir
        if (window.graficoGlicemia) {
            setTimeout(() => {
                atualizarGrafico();
            }, 100);
        }
    }
});