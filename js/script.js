// js/script.js - Funcionalidades principais do sistema
document.addEventListener('DOMContentLoaded', function() {
    // Elementos DOM
    const btnMenu = document.getElementById('btn-menu');
    const menu = document.getElementById('menu');
    const secoes = document.querySelectorAll('.secao');
    const linksMenu = document.querySelectorAll('nav a');
    const formGlicemia = document.getElementById('form-glicemia');
    const formMeta = document.getElementById('form-meta');
    const formAlimento = document.getElementById('form-alimento');
    const formIndice = document.getElementById('form-indice');
    const formRelatorio = document.getElementById('form-relatorio');
    const btnTestarAlerta = document.getElementById('testar-alerta');
    const listaHistorico = document.getElementById('lista-historico');
    const listaMetasPendentes = document.getElementById('lista-metas-pendentes');
    const listaMetasConcluidas = document.getElementById('lista-metas-concluidas');
    const listaAlimentos = document.getElementById('lista-alimentos');
    const resultadoIndice = document.getElementById('resultado-indice');
    const previaRelatorio = document.getElementById('previa-relatorio');
    const filtroData = document.getElementById('filtro-data');
    const filtroStatus = document.getElementById('filtro-status');
    const btnLimparFiltro = document.getElementById('limpar-filtro');
    const btnBaixarPDF = document.getElementById('baixar-relatorio-pdf');
    
    // Dados da aplicação
    window.dados = {
        glicemias: JSON.parse(localStorage.getItem('glicemias')) || [],
        metas: JSON.parse(localStorage.getItem('metas')) || [],
        alimentos: JSON.parse(localStorage.getItem('alimentos')) || []
    };
    
    // Inicialização
    inicializarNavegacao();
    inicializarFormularios();
    inicializarDados();
    
    // Funções de inicialização
    function inicializarNavegacao() {
        // Menu mobile
        btnMenu.addEventListener('click', function() {
            menu.classList.toggle('mostrar');
        });
        
        // Navegação entre seções
        linksMenu.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const secaoAlvo = this.getAttribute('data-section');
                
                // Esconder todas as seções
                secoes.forEach(secao => {
                    secao.classList.remove('ativa');
                });
                
                // Mostrar a seção alvo
                document.getElementById(secaoAlvo).classList.add('ativa');
                
                // Fechar menu mobile se estiver aberto
                menu.classList.remove('mostrar');
                
                // Atualizar gráfico se necessário
                if (secaoAlvo === 'grafico') {
                    setTimeout(atualizarGrafico, 100);
                }
            });
        });
    }
    
    function inicializarFormularios() {
        // Formulário de glicemia
        formGlicemia.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const glicemia = parseInt(document.getElementById('glicemia').value);
            const data = document.getElementById('data').value;
            const hora = document.getElementById('hora').value;
            const observacao = document.getElementById('observacao').value;
            
            // Validar dados
            if (!glicemia || glicemia < 20 || glicemia > 600) {
                mostrarNotificacao('Por favor, insira um valor de glicemia válido (20-600 mg/dL).', 'erro');
                return;
            }
            
            if (!data) {
                mostrarNotificacao('Por favor, selecione uma data.', 'erro');
                return;
            }
            
            if (!hora) {
                mostrarNotificacao('Por favor, selecione um horário.', 'erro');
                return;
            }
            
            const registro = {
                id: Date.now(),
                glicemia: glicemia,
                data: data,
                hora: hora,
                observacao: observacao,
                timestamp: new Date(`${data}T${hora}`).getTime()
            };
            
            window.dados.glicemias.push(registro);
            salvarDados();
            atualizarHistorico();
            atualizarGrafico();
            verificarAlerta(glicemia);
            
            // Limpar formulário
            this.reset();
            document.getElementById('data').value = new Date().toISOString().split('T')[0];
            
            // Mostrar confirmação
            mostrarNotificacao('Glicemia registrada com sucesso!', 'sucesso');
        });
        
        // Formulário de metas
        formMeta.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const descricao = document.getElementById('descricao-meta').value;
            const dataLimite = document.getElementById('data-meta').value;
            const categoria = document.getElementById('categoria-meta').value;
            
            if (!descricao) {
                mostrarNotificacao('Por favor, insira uma descrição para a meta.', 'erro');
                return;
            }
            
            const meta = {
                id: Date.now(),
                descricao: descricao,
                dataLimite: dataLimite,
                categoria: categoria,
                concluida: false
            };
            
            window.dados.metas.push(meta);
            salvarDados();
            atualizarMetas();
            
            // Limpar formulário
            this.reset();
            
            // Mostrar confirmação
            mostrarNotificacao('Meta adicionada com sucesso!', 'sucesso');
        });
        
        // Formulário de alimentos
        formAlimento.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const alimento = document.getElementById('alimento').value;
            const categoria = document.getElementById('categoria-alimento').value;
            const efeito = document.getElementById('efeito-glicemia').value;
            const observacao = document.getElementById('observacao-alimento').value;
            
            if (!alimento) {
                mostrarNotificacao('Por favor, insira o nome do alimento.', 'erro');
                return;
            }
            
            const registroAlimento = {
                id: Date.now(),
                alimento: alimento,
                categoria: categoria,
                efeito: efeito,
                observacao: observacao,
                data: new Date().toISOString().split('T')[0]
            };
            
            window.dados.alimentos.push(registroAlimento);
            salvarDados();
            atualizarAlimentos();
            
            // Limpar formulário
            this.reset();
            
            // Mostrar confirmação
            mostrarNotificacao('Alimento registrado com sucesso!', 'sucesso');
        });
        
        // Formulário de índice glicêmico
        formIndice.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inicio = document.getElementById('periodo-inicio').value;
            const fim = document.getElementById('periodo-fim').value;
            
            if (!inicio || !fim) {
                mostrarNotificacao('Por favor, preencha ambas as datas.', 'erro');
                return;
            }
            
            if (new Date(inicio) > new Date(fim)) {
                mostrarNotificacao('A data inicial não pode ser maior que a data final.', 'erro');
                return;
            }
            
            calcularIndiceGlicemico(inicio, fim);
        });
        
        // Formulário de relatório
        formRelatorio.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const inicio = document.getElementById('relatorio-periodo-inicio').value;
            const fim = document.getElementById('relatorio-periodo-fim').value;
            const tipo = document.getElementById('tipo-relatorio').value;
            
            if (!inicio || !fim) {
                mostrarNotificacao('Por favor, preencha ambas as datas.', 'erro');
                return;
            }
            
            if (new Date(inicio) > new Date(fim)) {
                mostrarNotificacao('A data inicial não pode ser maior que a data final.', 'erro');
                return;
            }
            
            gerarRelatorio(inicio, fim, tipo);
        });
        
        // Botão de testar alerta
        btnTestarAlerta.addEventListener('click', function() {
            const limite = parseInt(document.getElementById('limite-baixo').value);
            const contato = document.getElementById('contato-emergencia').value;
            
            if (!contato) {
                mostrarNotificacao('Por favor, informe um contato de emergência primeiro.', 'erro');
                return;
            }
            
            mostrarNotificacao(`Alerta de teste: Glicemia abaixo de ${limite} mg/dL. Mensagem seria enviada para ${contato}`, 'info');
        });
        
        // Filtros no histórico
        filtroData.addEventListener('change', function() {
            atualizarHistorico();
        });
        
        filtroStatus.addEventListener('change', function() {
            atualizarHistorico();
        });
        
        btnLimparFiltro.addEventListener('click', function() {
            filtroData.value = '';
            filtroStatus.value = 'todos';
            atualizarHistorico();
        });
        
        // Botão de baixar PDF
        btnBaixarPDF.addEventListener('click', function() {
            baixarRelatorioPDF();
        });
    }
    
    function inicializarDados() {
        // Definir data atual como padrão nos formulários de data
        const dataAtual = new Date().toISOString().split('T')[0];
        document.getElementById('data').value = dataAtual;
        document.getElementById('data-meta').min = dataAtual;
        document.getElementById('periodo-inicio').value = dataAtual;
        document.getElementById('periodo-fim').value = dataAtual;
        document.getElementById('relatorio-periodo-inicio').value = dataAtual;
        document.getElementById('relatorio-periodo-fim').value = dataAtual;
        document.getElementById('grafico-inicio').value = dataAtual;
        document.getElementById('grafico-fim').value = dataAtual;
        
        atualizarHistorico();
        atualizarMetas();
        atualizarAlimentos();
    }
    
    // Funções de dados
    function salvarDados() {
        localStorage.setItem('glicemias', JSON.stringify(window.dados.glicemias));
        localStorage.setItem('metas', JSON.stringify(window.dados.metas));
        localStorage.setItem('alimentos', JSON.stringify(window.dados.alimentos));
    }
    
    function atualizarHistorico() {
        listaHistorico.innerHTML = '';
        
        let glicemiasFiltradas = window.dados.glicemias;
        
        // Aplicar filtro de data se existir
        if (filtroData.value) {
            glicemiasFiltradas = glicemiasFiltradas.filter(g => g.data === filtroData.value);
        }
        
        // Aplicar filtro de status se existir
        if (filtroStatus.value !== 'todos') {
            glicemiasFiltradas = glicemiasFiltradas.filter(g => {
                const status = obterClasseGlicemia(g.glicemia);
                return status === filtroStatus.value;
            });
        }
        
        // Ordenar por data/hora (mais recente primeiro)
        glicemiasFiltradas.sort((a, b) => b.timestamp - a.timestamp);
        
        if (glicemiasFiltradas.length === 0) {
            listaHistorico.innerHTML = '<p class="sem-registros">Nenhum registro encontrado.</p>';
            return;
        }
        
        glicemiasFiltradas.forEach(registro => {
            const item = document.createElement('div');
            
            const classeStatus = obterClasseGlicemia(registro.glicemia);
            const textoStatus = obterStatusGlicemia(registro.glicemia);
            
            item.className = `registro-item ${classeStatus}`;
            
            item.innerHTML = `
                <div class="registro-info">
                    <div class="registro-valor">
                        <strong>${registro.glicemia} mg/dL</strong>
                        <span class="status-indicador ${classeStatus}">${textoStatus}</span>
                    </div>
                    <div class="registro-data">${formatarData(registro.data)} às ${registro.hora}</div>
                    ${registro.observacao ? `<div class="registro-observacao">${registro.observacao}</div>` : ''}
                </div>
                <div class="acoes">
                    <button class="btn-acao btn-excluir" data-id="${registro.id}">Excluir</button>
                </div>
            `;
            
            listaHistorico.appendChild(item);
        });
        
        // Adicionar eventos aos botões de excluir
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                excluirRegistroGlicemia(id);
            });
        });
    }
    
    function atualizarMetas() {
        listaMetasPendentes.innerHTML = '';
        listaMetasConcluidas.innerHTML = '';
        
        const metasPendentes = window.dados.metas.filter(meta => !meta.concluida);
        const metasConcluidas = window.dados.metas.filter(meta => meta.concluida);
        
        // Atualizar estatísticas
        document.getElementById('total-metas').textContent = window.dados.metas.length;
        document.getElementById('metas-concluidas').textContent = metasConcluidas.length;
        document.getElementById('percentual-concluidas').textContent = 
            window.dados.metas.length > 0 ? 
            `${Math.round((metasConcluidas.length / window.dados.metas.length) * 100)}%` : '0%';
        
        if (metasPendentes.length === 0) {
            listaMetasPendentes.innerHTML = '<p class="sem-registros">Nenhuma meta pendente.</p>';
        } else {
            metasPendentes.forEach(meta => {
                const item = document.createElement('li');
                item.className = 'meta-item';
                item.innerHTML = `
                    <div>
                        <strong>${meta.descricao}</strong>
                        <div>Categoria: ${formatarCategoriaMeta(meta.categoria)}</div>
                        ${meta.dataLimite ? `<div>Data limite: ${formatarData(meta.dataLimite)}</div>` : ''}
                    </div>
                    <div class="acoes">
                        <button class="btn-acao btn-concluir" data-id="${meta.id}">Concluir</button>
                        <button class="btn-acao btn-excluir" data-id="${meta.id}">Excluir</button>
                    </div>
                `;
                listaMetasPendentes.appendChild(item);
            });
        }
        
        if (metasConcluidas.length === 0) {
            listaMetasConcluidas.innerHTML = '<p class="sem-registros">Nenhuma meta concluída.</p>';
        } else {
            metasConcluidas.forEach(meta => {
                const item = document.createElement('li');
                item.className = 'meta-item meta-concluida';
                item.innerHTML = `
                    <div>
                        <strong>${meta.descricao}</strong>
                        <div>Categoria: ${formatarCategoriaMeta(meta.categoria)}</div>
                        ${meta.dataLimite ? `<div>Data limite: ${formatarData(meta.dataLimite)}</div>` : ''}
                    </div>
                    <div class="acoes">
                        <button class="btn-acao btn-excluir" data-id="${meta.id}">Excluir</button>
                    </div>
                `;
                listaMetasConcluidas.appendChild(item);
            });
        }
        
        // Adicionar eventos aos botões
        document.querySelectorAll('.btn-concluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                concluirMeta(id);
            });
        });
        
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                excluirMeta(id);
            });
        });
    }
    
    function atualizarAlimentos() {
        listaAlimentos.innerHTML = '';
        
        if (window.dados.alimentos.length === 0) {
            listaAlimentos.innerHTML = '<p class="sem-registros">Nenhum alimento registrado.</p>';
            return;
        }
        
        // Ordenar por data (mais recente primeiro)
        const alimentosOrdenados = [...window.dados.alimentos].sort((a, b) => 
            new Date(b.data) - new Date(a.data)
        );
        
        alimentosOrdenados.forEach(alimento => {
            const item = document.createElement('div');
            item.className = 'alimento-item';
            
            const corEfeito = alimento.efeito === 'positivo' ? 'var(--cor-sucesso)' : 
                             alimento.efeito === 'negativo' ? 'var(--cor-perigo)' : 'gray';
            
            item.innerHTML = `
                <div>
                    <strong>${alimento.alimento}</strong>
                    <div>Categoria: ${formatarCategoria(alimento.categoria)}</div>
                    <div style="color: ${corEfeito}">Efeito: ${formatarEfeito(alimento.efeito)}</div>
                    ${alimento.observacao ? `<div>${alimento.observacao}</div>` : ''}
                    <div><small>Registrado em: ${formatarData(alimento.data)}</small></div>
                </div>
                <div class="acoes">
                    <button class="btn-acao btn-excluir" data-id="${alimento.id}">Excluir</button>
                </div>
            `;
            
            listaAlimentos.appendChild(item);
        });
        
        // Adicionar eventos aos botões de excluir
        document.querySelectorAll('.btn-excluir').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                excluirAlimento(id);
            });
        });
    }
    
    // Funções de cálculo
    function calcularIndiceGlicemico(inicio, fim) {
        const glicemiasPeriodo = obterGlicemiasPeriodo(inicio, fim);
        
        if (glicemiasPeriodo.length === 0) {
            resultadoIndice.innerHTML = '<p class="sem-registros">Não há registros de glicemia no período selecionado.</p>';
            return;
        }
        
        const estatisticas = calcularEstatisticasGlicemia(glicemiasPeriodo);
        
        let classificacao = classificarIndiceGlicemico(estatisticas.media);
        
        resultadoIndice.innerHTML = `
            <h3>Resultado do Índice Glicêmico</h3>
            <p><strong>Período:</strong> ${formatarData(inicio)} a ${formatarData(fim)}</p>
            <p><strong>Total de registros:</strong> ${glicemiasPeriodo.length}</p>
            <p><strong>Média de glicemia:</strong> ${estatisticas.media.toFixed(1)} mg/dL</p>
            <p><strong>Glicemia mínima:</strong> ${estatisticas.minima} mg/dL</p>
            <p><strong>Glicemia máxima:</strong> ${estatisticas.maxima} mg/dL</p>
            <p><strong>Classificação:</strong> ${classificacao}</p>
            <p><strong>Distribuição:</strong></p>
            <ul>
                <li>Glicemias normais (70-180 mg/dL): ${estatisticas.normais} (${estatisticas.percentualNormais}%)</li>
                <li>Glicemias altas (>180 mg/dL): ${estatisticas.altas} (${estatisticas.percentualAltas}%)</li>
                <li>Glicemias baixas (<70 mg/dL): ${estatisticas.baixas} (${estatisticas.percentualBaixas}%)</li>
            </ul>
            <p><strong>Recomendações:</strong></p>
            <ul>
                ${estatisticas.percentualAltas > 20 ? '<li>Considere ajustar a dieta ou medicação para reduzir as glicemias altas</li>' : ''}
                ${estatisticas.percentualBaixas > 5 ? '<li>Fique atento aos sinais de hipoglicemia e ajuste a medicação se necessário</li>' : ''}
                ${estatisticas.percentualNormais > 70 ? '<li>Continue com o bom trabalho!</li>' : ''}
                ${estatisticas.maxima > 250 ? '<li>Procure orientação médica para ajuste do tratamento</li>' : ''}
                ${estatisticas.minima < 60 ? '<li>Esteja preparado para tratar hipoglicemias</li>' : ''}
            </ul>
        `;
    }
    
    // Funções de alerta
    function verificarAlerta(glicemia) {
        const limite = parseInt(document.getElementById('limite-baixo').value);
        const contato = document.getElementById('contato-emergencia').value;
        
        if (glicemia < limite && contato) {
            mostrarNotificacao(`ALERTA: Glicemia baixa detectada (${glicemia} mg/dL). Será enviada uma mensagem para ${contato}`, 'alerta');
        }
    }
    
    // Funções de exclusão
    function excluirRegistroGlicemia(id) {
        if (confirm('Tem certeza que deseja excluir este registro?')) {
            window.dados.glicemias = window.dados.glicemias.filter(g => g.id !== id);
            salvarDados();
            atualizarHistorico();
            atualizarGrafico();
            mostrarNotificacao('Registro excluído com sucesso!', 'sucesso');
        }
    }
    
    function excluirMeta(id) {
        if (confirm('Tem certeza que deseja excluir esta meta?')) {
            window.dados.metas = window.dados.metas.filter(m => m.id !== id);
            salvarDados();
            atualizarMetas();
            mostrarNotificacao('Meta excluída com sucesso!', 'sucesso');
        }
    }
    
    function excluirAlimento(id) {
        if (confirm('Tem certeza que deseja excluir este alimento?')) {
            window.dados.alimentos = window.dados.alimentos.filter(a => a.id !== id);
            salvarDados();
            atualizarAlimentos();
            mostrarNotificacao('Alimento excluído com sucesso!', 'sucesso');
        }
    }
    
    function concluirMeta(id) {
        const meta = window.dados.metas.find(m => m.id === id);
        if (meta) {
            meta.concluida = true;
            salvarDados();
            atualizarMetas();
            mostrarNotificacao('Meta concluída com sucesso!', 'sucesso');
        }
    }
    
    // Funções auxiliares
    function obterClasseGlicemia(glicemia) {
        if (glicemia < 70) return 'baixa';
        if (glicemia <= 180) return 'normal';
        if (glicemia <= 250) return 'alta';
        return 'muito-alta';
    }
    
    function obterStatusGlicemia(glicemia) {
        if (glicemia < 70) return 'Baixa';
        if (glicemia <= 180) return 'Normal';
        if (glicemia <= 250) return 'Alta';
        return 'Muito Alta';
    }
    
    function formatarData(data) {
        if (!data) return '';
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
    
    function formatarCategoria(categoria) {
        const categorias = {
            'carboidrato': 'Carboidrato',
            'proteina': 'Proteína',
            'gordura': 'Gordura',
            'fibra': 'Fibra',
            'fruta': 'Fruta',
            'vegetal': 'Vegetal',
            'laticinio': 'Laticínio',
            'outro': 'Outro'
        };
        return categorias[categoria] || categoria;
    }
    
    function formatarCategoriaMeta(categoria) {
        const categorias = {
            'exercicio': 'Exercício',
            'alimentacao': 'Alimentação',
            'medicacao': 'Medicação',
            'controle': 'Controle Glicêmico',
            'outro': 'Outro'
        };
        return categorias[categoria] || categoria;
    }
    
    function formatarEfeito(efeito) {
        const efeitos = {
            'positivo': 'Positivo (Controla)',
            'negativo': 'Negativo (Aumenta)',
            'neutro': 'Neutro'
        };
        return efeitos[efeito] || efeito;
    }
    
    function formatarTipoRelatorio(tipo) {
        const tipos = {
            'completo': 'Completo',
            'glicemia': 'Apenas Glicemia',
            'alimentos': 'Apenas Alimentos',
            'metas': 'Apenas Metas',
            'indice': 'Índice Glicêmico'
        };
        return tipos[tipo] || tipo;
    }
    
    function classificarIndiceGlicemico(media) {
        if (media < 100) return 'Excelente controle glicêmico';
        if (media < 130) return 'Bom controle glicêmico';
        if (media < 150) return 'Controle glicêmico regular';
        return 'Controle glicêmico precisa de melhoria';
    }
    
    function mostrarNotificacao(mensagem, tipo) {
        // Criar elemento de notificação
        const notificacao = document.createElement('div');
        notificacao.className = `notificacao notificacao-${tipo}`;
        notificacao.textContent = mensagem;
        
        // Adicionar ao documento
        document.body.appendChild(notificacao);
        
        // Remover após 5 segundos
        setTimeout(() => {
            notificacao.style.opacity = '0';
            notificacao.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (notificacao.parentNode) {
                    notificacao.parentNode.removeChild(notificacao);
                }
            }, 500);
        }, 5000);
    }
});

// Estilo para mensagens de sem registros
const style = document.createElement('style');
style.textContent = `
    .sem-registros {
        text-align: center;
        padding: 2rem;
        color: var(--cor-texto);
        opacity: 0.7;
        font-style: italic;
    }
`;
document.head.appendChild(style);