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
        if (btnMenu) {
            btnMenu.addEventListener('click', function() {
                menu.classList.toggle('mostrar');
            });
        }
        
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
        if (formGlicemia) {
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
        }
        
        // Formulário de metas
        if (formMeta) {
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
        }
        
        // Formulário de alimentos
        if (formAlimento) {
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
        }
        
        // Formulário de índice glicêmico
        if (formIndice) {
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
        }
        
        // Formulário de relatório - APENAS RELATÓRIO COMPLETO
        if (formRelatorio) {
            // Remover opções de relatório de teste do select
            const tipoRelatorioSelect = document.getElementById('tipo-relatorio');
            if (tipoRelatorioSelect) {
                // Manter apenas a opção "completo"
                tipoRelatorioSelect.innerHTML = '<option value="completo">Relatório Completo</option>';
            }
            
            formRelatorio.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const inicio = document.getElementById('relatorio-periodo-inicio').value;
                const fim = document.getElementById('relatorio-periodo-fim').value;
                const tipo = 'completo'; // Forçar sempre relatório completo
                
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
        }
        
        // Botão de testar alerta
        if (btnTestarAlerta) {
            btnTestarAlerta.addEventListener('click', function() {
                const limite = parseInt(document.getElementById('limite-baixo').value);
                const contato = document.getElementById('contato-emergencia').value;
                
                if (!contato) {
                    mostrarNotificacao('Por favor, informe um contato de emergência primeiro.', 'erro');
                    return;
                }
                
                mostrarNotificacao(`Alerta de teste: Glicemia abaixo de ${limite} mg/dL. Mensagem seria enviada para ${contato}`, 'info');
            });
        }
        
        // Filtros no histórico
        if (filtroData) {
            filtroData.addEventListener('change', function() {
                atualizarHistorico();
            });
        }
        
        if (filtroStatus) {
            filtroStatus.addEventListener('change', function() {
                atualizarHistorico();
            });
        }
        
        if (btnLimparFiltro) {
            btnLimparFiltro.addEventListener('click', function() {
                filtroData.value = '';
                filtroStatus.value = 'todos';
                atualizarHistorico();
            });
        }
        
        // Botão de baixar PDF
        if (btnBaixarPDF) {
            btnBaixarPDF.addEventListener('click', function() {
                baixarRelatorioPDF();
            });
        }
    }
    
    function inicializarDados() {
        // Definir data atual como padrão nos formulários de data
        const dataAtual = new Date().toISOString().split('T')[0];
        const dataInput = document.getElementById('data');
        const dataMetaInput = document.getElementById('data-meta');
        const periodoInicioInput = document.getElementById('periodo-inicio');
        const periodoFimInput = document.getElementById('periodo-fim');
        const relatorioInicioInput = document.getElementById('relatorio-periodo-inicio');
        const relatorioFimInput = document.getElementById('relatorio-periodo-fim');
        const graficoInicioInput = document.getElementById('grafico-inicio');
        const graficoFimInput = document.getElementById('grafico-fim');
        
        if (dataInput) dataInput.value = dataAtual;
        if (dataMetaInput) dataMetaInput.min = dataAtual;
        if (periodoInicioInput) periodoInicioInput.value = dataAtual;
        if (periodoFimInput) periodoFimInput.value = dataAtual;
        if (relatorioInicioInput) relatorioInicioInput.value = dataAtual;
        if (relatorioFimInput) relatorioFimInput.value = dataAtual;
        if (graficoInicioInput) graficoInicioInput.value = dataAtual;
        if (graficoFimInput) graficoFimInput.value = dataAtual;
        
        atualizarHistorico();
        atualizarMetas();
        atualizarAlimentos();
        atualizarGrafico(); // Inicializar gráfico na carga da página
    }
    
    // Funções de dados
    function salvarDados() {
        localStorage.setItem('glicemias', JSON.stringify(window.dados.glicemias));
        localStorage.setItem('metas', JSON.stringify(window.dados.metas));
        localStorage.setItem('alimentos', JSON.stringify(window.dados.alimentos));
    }
    
    function atualizarHistorico() {
        if (!listaHistorico) return;
        
        listaHistorico.innerHTML = '';
        
        let glicemiasFiltradas = window.dados.glicemias;
        
        // Aplicar filtro de data se existir
        if (filtroData && filtroData.value) {
            glicemiasFiltradas = glicemiasFiltradas.filter(g => g.data === filtroData.value);
        }
        
        // Aplicar filtro de status se existir
        if (filtroStatus && filtroStatus.value !== 'todos') {
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
        if (!listaMetasPendentes || !listaMetasConcluidas) return;
        
        listaMetasPendentes.innerHTML = '';
        listaMetasConcluidas.innerHTML = '';
        
        const metasPendentes = window.dados.metas.filter(meta => !meta.concluida);
        const metasConcluidas = window.dados.metas.filter(meta => meta.concluida);
        
        // Atualizar estatísticas
        const totalMetasElement = document.getElementById('total-metas');
        const metasConcluidasElement = document.getElementById('metas-concluidas');
        const percentualConcluidasElement = document.getElementById('percentual-concluidas');
        
        if (totalMetasElement) totalMetasElement.textContent = window.dados.metas.length;
        if (metasConcluidasElement) metasConcluidasElement.textContent = metasConcluidas.length;
        if (percentualConcluidasElement) {
            percentualConcluidasElement.textContent = 
                window.dados.metas.length > 0 ? 
                `${Math.round((metasConcluidas.length / window.dados.metas.length) * 100)}%` : '0%';
        }
        
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
        if (!listaAlimentos) return;
        
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
        if (!resultadoIndice) return;
        
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
        const limiteInput = document.getElementById('limite-baixo');
        const contatoInput = document.getElementById('contato-emergencia');
        
        if (!limiteInput || !contatoInput) return;
        
        const limite = parseInt(limiteInput.value);
        const contato = contatoInput.value;
        
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
            'completo': 'Completo'
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
    
    // Função para calcular estatísticas de glicemia
    function calcularEstatisticasGlicemia(glicemias) {
        if (!glicemias || glicemias.length === 0) {
            return {
                media: 0,
                minima: 0,
                maxima: 0,
                normais: 0,
                altas: 0,
                baixas: 0,
                percentualNormais: 0,
                percentualAltas: 0,
                percentualBaixas: 0
            };
        }
        
        const soma = glicemias.reduce((acc, g) => acc + g.glicemia, 0);
        const media = soma / glicemias.length;
        const minima = Math.min(...glicemias.map(g => g.glicemia));
        const maxima = Math.max(...glicemias.map(g => g.glicemia));
        
        const normais = glicemias.filter(g => g.glicemia >= 70 && g.glicemia <= 180).length;
        const altas = glicemias.filter(g => g.glicemia > 180).length;
        const baixas = glicemias.filter(g => g.glicemia < 70).length;
        
        return {
            media: media,
            minima: minima,
            maxima: maxima,
            normais: normais,
            altas: altas,
            baixas: baixas,
            percentualNormais: (normais / glicemias.length * 100).toFixed(1),
            percentualAltas: (altas / glicemias.length * 100).toFixed(1),
            percentualBaixas: (baixas / glicemias.length * 100).toFixed(1)
        };
    }

    // Função para obter glicemias do período
    function obterGlicemiasPeriodo(inicio, fim) {
        if (!window.dados || !window.dados.glicemias) return [];
        
        return window.dados.glicemias.filter(g => {
            return g.data >= inicio && g.data <= fim;
        });
    }

    // Função para gerar relatório - APENAS RELATÓRIO COMPLETO
    function gerarRelatorio(inicio, fim, tipo) {
        if (!previaRelatorio) return;
        
        console.log('Gerando relatório completo:', { inicio, fim, tipo });
        
        const glicemiasPeriodo = obterGlicemiasPeriodo(inicio, fim);
        const alimentosPeriodo = window.dados.alimentos.filter(a => a.data >= inicio && a.data <= fim);
        const metasPeriodo = window.dados.metas.filter(m => {
            const dataCriacao = new Date(m.id).toISOString().split('T')[0];
            return dataCriacao >= inicio && dataCriacao <= fim;
        });
        
        let conteudoRelatorio = `
            <div class="cabecalho-relatorio">
                <h1>📋 Relatório de Monitoramento de Diabetes</h1>
                <div class="info-relatorio">
                    <p><strong>Período:</strong> ${formatarData(inicio)} a ${formatarData(fim)}</p>
                    <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                    <p><strong>Tipo de relatório:</strong> ${formatarTipoRelatorio(tipo)}</p>
                </div>
            </div>
        `;
        
        // Estatísticas resumidas
        if (glicemiasPeriodo.length > 0) {
            const estatisticas = calcularEstatisticasGlicemia(glicemiasPeriodo);
            
            conteudoRelatorio += `
                <div class="resumo-estatisticas">
                    <h2>📊 Resumo Estatístico</h2>
                    <div class="estatisticas-grid">
                        <div class="estatistica">
                            <span class="valor">${estatisticas.media.toFixed(1)}</span>
                            <span class="label">Média Glicêmica (mg/dL)</span>
                        </div>
                        <div class="estatistica">
                            <span class="valor">${estatisticas.minima}</span>
                            <span class="label">Mínima (mg/dL)</span>
                        </div>
                        <div class="estatistica">
                            <span class="valor">${estatisticas.maxima}</span>
                            <span class="label">Máxima (mg/dL)</span>
                        </div>
                        <div class="estatistica">
                            <span class="valor">${estatisticas.percentualNormais}%</span>
                            <span class="label">Dentro da Meta</span>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // SEMPRE incluir todas as seções para relatório completo
        if (glicemiasPeriodo.length > 0) {
            conteudoRelatorio += gerarSecaoGlicemia(glicemiasPeriodo);
        }
        
        if (alimentosPeriodo.length > 0) {
            conteudoRelatorio += gerarSecaoAlimentos(alimentosPeriodo);
        }
        
        if (metasPeriodo.length > 0) {
            conteudoRelatorio += gerarSecaoMetas(metasPeriodo);
        }
        
        if (glicemiasPeriodo.length > 0) {
            conteudoRelatorio += gerarSecaoIndice(glicemiasPeriodo);
        }
        
        // Adicionar recomendações
        if (glicemiasPeriodo.length > 0) {
            conteudoRelatorio += gerarRecomendacoes(glicemiasPeriodo);
        }
        
        // Adicionar rodapé
        conteudoRelatorio += `
            <div class="rodape-relatorio">
                <hr>
                <p><strong>Sistema:</strong> Cuidando de sua Diabetes</p>
                <p><strong>Desenvolvedor:</strong> Gledison Arruda Andrade</p>
                <p><em>Relatório gerado automaticamente pelo sistema de monitoramento de diabetes</em></p>
            </div>
        `;
        
        previaRelatorio.innerHTML = conteudoRelatorio;
        if (btnBaixarPDF) {
            btnBaixarPDF.disabled = false;
        }
        
        // Salvar dados do relatório atual para download
        window.relatorioAtual = {
            conteudo: conteudoRelatorio,
            periodo: `${formatarData(inicio)} a ${formatarData(fim)}`,
            tipo: tipo,
            dados: {
                glicemias: glicemiasPeriodo,
                alimentos: alimentosPeriodo,
                metas: metasPeriodo
            }
        };
        
        mostrarNotificacao('Relatório completo gerado com sucesso! Clique em "Baixar PDF" para salvar.', 'sucesso');
    }

    // Funções auxiliares para geração de relatório
    function gerarSecaoGlicemia(glicemiasPeriodo) {
        const estatisticas = calcularEstatisticasGlicemia(glicemiasPeriodo);
        
        return `
            <div class="secao-relatorio">
                <h2>📈 Dados de Glicemia</h2>
                <div class="tabela-relatorio">
                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Hora</th>
                                <th>Glicemia (mg/dL)</th>
                                <th>Status</th>
                                <th>Observação</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${glicemiasPeriodo.slice(0, 10).map(glicemia => `
                                <tr>
                                    <td>${formatarData(glicemia.data)}</td>
                                    <td>${glicemia.hora}</td>
                                    <td>${glicemia.glicemia}</td>
                                    <td><span class="status ${obterClasseGlicemia(glicemia.glicemia)}">${obterStatusGlicemia(glicemia.glicemia)}</span></td>
                                    <td>${glicemia.observacao || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${glicemiasPeriodo.length > 10 ? `<p class="info-tabela">Mostrando 10 de ${glicemiasPeriodo.length} registros</p>` : ''}
                </div>
            </div>
        `;
    }

    function gerarSecaoAlimentos(alimentosPeriodo) {
        return `
            <div class="secao-relatorio">
                <h2>🍎 Registro de Alimentos</h2>
                <div class="tabela-relatorio">
                    <table>
                        <thead>
                            <tr>
                                <th>Alimento</th>
                                <th>Categoria</th>
                                <th>Efeito na Glicemia</th>
                                <th>Observação</th>
                                <th>Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${alimentosPeriodo.slice(0, 10).map(alimento => `
                                <tr>
                                    <td>${alimento.alimento}</td>
                                    <td>${formatarCategoria(alimento.categoria)}</td>
                                    <td><span class="efeito ${alimento.efeito}">${formatarEfeito(alimento.efeito)}</span></td>
                                    <td>${alimento.observacao || '-'}</td>
                                    <td>${formatarData(alimento.data)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    ${alimentosPeriodo.length > 10 ? `<p class="info-tabela">Mostrando 10 de ${alimentosPeriodo.length} registros</p>` : ''}
                </div>
            </div>
        `;
    }

    function gerarSecaoMetas(metasPeriodo) {
        const metasConcluidas = metasPeriodo.filter(meta => meta.concluida);
        const metasPendentes = metasPeriodo.filter(meta => !meta.concluida);
        
        return `
            <div class="secao-relatorio">
                <h2>🎯 Metas de Tratamento</h2>
                <div class="estatisticas-metas">
                    <div class="estatistica-meta">
                        <span class="valor">${metasPeriodo.length}</span>
                        <span class="label">Total de Metas</span>
                    </div>
                    <div class="estatistica-meta">
                        <span class="valor">${metasConcluidas.length}</span>
                        <span class="label">Concluídas</span>
                    </div>
                    <div class="estatistica-meta">
                        <span class="valor">${metasPendentes.length}</span>
                        <span class="label">Pendentes</span>
                    </div>
                </div>
                
                ${metasPendentes.length > 0 ? `
                    <h3>Metas Pendentes</h3>
                    <ul class="lista-metas">
                        ${metasPendentes.map(meta => `
                            <li>
                                <strong>${meta.descricao}</strong>
                                <span class="categoria-meta">${formatarCategoriaMeta(meta.categoria)}</span>
                                ${meta.dataLimite ? `<span class="data-meta">Vence em: ${formatarData(meta.dataLimite)}</span>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                ` : ''}
            </div>
        `;
    }

    function gerarSecaoIndice(glicemiasPeriodo) {
        const estatisticas = calcularEstatisticasGlicemia(glicemiasPeriodo);
        const classificacao = classificarIndiceGlicemico(estatisticas.media);
        
        return `
            <div class="secao-relatorio">
                <h2>📊 Índice Glicêmico</h2>
                <div class="card-indice">
                    <div class="valor-indice">
                        <span class="media-glicemia">${estatisticas.media.toFixed(1)} mg/dL</span>
                        <span class="classificacao ${estatisticas.media < 130 ? 'boa' : 'regular'}">${classificacao}</span>
                    </div>
                    <div class="detalhes-indice">
                        <div class="detalhe">
                            <span class="label">Mínima:</span>
                            <span class="valor">${estatisticas.minima} mg/dL</span>
                        </div>
                        <div class="detalhe">
                            <span class="label">Máxima:</span>
                            <span class="valor">${estatisticas.maxima} mg/dL</span>
                        </div>
                        <div class="detalhe">
                            <span class="label">Dentro da meta:</span>
                            <span class="valor">${estatisticas.percentualNormais}%</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function gerarRecomendacoes(glicemiasPeriodo) {
        const estatisticas = calcularEstatisticasGlicemia(glicemiasPeriodo);
        let recomendacoes = [];
        
        if (estatisticas.percentualAltas > 20) {
            recomendacoes.push("Considere ajustar a dieta ou medicação para reduzir as glicemias altas");
        }
        
        if (estatisticas.percentualBaixas > 5) {
            recomendacoes.push("Fique atento aos sinais de hipoglicemia e ajuste a medicação se necessário");
        }
        
        if (estatisticas.maxima > 250) {
            recomendacoes.push("Procure orientação médica para ajuste do tratamento");
        }
        
        if (estatisticas.minima < 60) {
            recomendacoes.push("Esteja preparado para tratar hipoglicemias");
        }
        
        if (estatisticas.percentualNormais > 70) {
            recomendacoes.push("Continue com o bom trabalho! Controle glicêmico dentro dos parâmetros ideais");
        }
        
        if (recomendacoes.length === 0) {
            recomendacoes.push("Mantenha o acompanhamento regular e continue com os bons hábitos");
        }
        
        return `
            <div class="secao-relatorio">
                <h2>💡 Recomendações</h2>
                <div class="recomendacoes">
                    <ul>
                        ${recomendacoes.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    }

    // ===== FUNÇÃO ATUALIZADA - GRÁFICO MELHORADO =====
    function atualizarGrafico() {
        const canvas = document.getElementById('grafico-glicemia');
        if (!canvas || window.dados.glicemias.length === 0) {
            return;
        }

        const ctx = canvas.getContext('2d');
        
        // Limpar canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Ordenar glicemias por data
        const glicemiasOrdenadas = [...window.dados.glicemias].sort((a, b) => a.timestamp - b.timestamp);
        
        // Configurações do gráfico
        const padding = 60;
        const graphWidth = canvas.width - 2 * padding;
        const graphHeight = canvas.height - 2 * padding;
        
        // Encontrar valores mínimo e máximo
        const valores = glicemiasOrdenadas.map(g => g.glicemia);
        const minValor = Math.min(...valores);
        const maxValor = Math.max(...valores);
        const valorRange = Math.max(maxValor - minValor, 50); // Garantir um range mínimo
        
        // Desenhar área de fundo com zonas de cores
        const zonas = [
            { min: 0, max: 70, cor: 'rgba(52, 152, 219, 0.1)', borda: 'rgba(52, 152, 219, 0.3)' },    // Azul - Baixa
            { min: 70, max: 180, cor: 'rgba(46, 204, 113, 0.1)', borda: 'rgba(46, 204, 113, 0.3)' },  // Verde - Normal
            { min: 180, max: 250, cor: 'rgba(243, 156, 18, 0.1)', borda: 'rgba(243, 156, 18, 0.3)' }, // Laranja - Alta
            { min: 250, max: 400, cor: 'rgba(231, 76, 60, 0.1)', borda: 'rgba(231, 76, 60, 0.3)' }    // Vermelho - Muito Alta
        ];
        
        zonas.forEach(zona => {
            const yMin = canvas.height - padding - ((zona.min - (minValor - 20)) / (maxValor - minValor + 40)) * graphHeight;
            const yMax = canvas.height - padding - ((zona.max - (minValor - 20)) / (maxValor - minValor + 40)) * graphHeight;
            
            ctx.fillStyle = zona.cor;
            ctx.fillRect(padding, yMax, graphWidth, yMin - yMax);
            
            ctx.strokeStyle = zona.borda;
            ctx.setLineDash([5, 3]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(padding, yMax);
            ctx.lineTo(canvas.width - padding, yMax);
            ctx.stroke();
        });
        ctx.setLineDash([]);
        
        // Desenhar linha do gráfico
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.beginPath();
        
        glicemiasOrdenadas.forEach((glicemia, index) => {
            const x = padding + (index / (glicemiasOrdenadas.length - 1)) * graphWidth;
            const y = canvas.height - padding - ((glicemia.glicemia - (minValor - 20)) / (maxValor - minValor + 40)) * graphHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();
        
        // Desenhar pontos
        glicemiasOrdenadas.forEach((glicemia, index) => {
            const x = padding + (index / (glicemiasOrdenadas.length - 1)) * graphWidth;
            const y = canvas.height - padding - ((glicemia.glicemia - (minValor - 20)) / (maxValor - minValor + 40)) * graphHeight;
            
            let cor;
            if (glicemia.glicemia < 70) cor = '#3498db';
            else if (glicemia.glicemia <= 180) cor = '#2ecc71';
            else if (glicemia.glicemia <= 250) cor = '#f39c12';
            else cor = '#e74c3c';
            
            // Ponto com borda
            ctx.fillStyle = cor;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
        
        // Desenhar eixos
        ctx.strokeStyle = '#7f8c8d';
        ctx.lineWidth = 2;
        
        // Eixo Y
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.stroke();
        
        // Eixo X
        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // Marcadores e labels do eixo Y
        ctx.fillStyle = '#7f8c8d';
        ctx.font = '12px Arial';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        
        const marcadoresY = [70, 180, 250];
        if (minValor < 70) marcadoresY.unshift(minValor);
        if (maxValor > 250) marcadoresY.push(maxValor);
        
        marcadoresY.forEach(valor => {
            const y = canvas.height - padding - ((valor - (minValor - 20)) / (maxValor - minValor + 40)) * graphHeight;
            
            ctx.beginPath();
            ctx.moveTo(padding - 5, y);
            ctx.lineTo(padding, y);
            ctx.stroke();
            
            ctx.fillText(`${valor} mg/dL`, padding - 10, y);
        });
        
        // Marcadores e labels do eixo X (datas)
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        if (glicemiasOrdenadas.length > 0) {
            // Primeira data
            const primeiraData = new Date(glicemiasOrdenadas[0].timestamp);
            ctx.fillText(
                primeiraData.toLocaleDateString('pt-BR'), 
                padding, 
                canvas.height - padding + 10
            );
            
            // Data do meio (se houver pelo menos 3 pontos)
            if (glicemiasOrdenadas.length >= 3) {
                const meioIndex = Math.floor(glicemiasOrdenadas.length / 2);
                const meioData = new Date(glicemiasOrdenadas[meioIndex].timestamp);
                const xMeio = padding + (meioIndex / (glicemiasOrdenadas.length - 1)) * graphWidth;
                ctx.fillText(
                    meioData.toLocaleDateString('pt-BR'), 
                    xMeio, 
                    canvas.height - padding + 10
                );
            }
            
            // Última data
            const ultimaData = new Date(glicemiasOrdenadas[glicemiasOrdenadas.length - 1].timestamp);
            ctx.fillText(
                ultimaData.toLocaleDateString('pt-BR'), 
                canvas.width - padding, 
                canvas.height - padding + 10
            );
        }
        
        // Título do gráfico
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Evolução da Glicemia', canvas.width / 2, 20);
        
        // Legenda
        const legendas = [
            { cor: '#3498db', texto: 'Baixa (<70)' },
            { cor: '#2ecc71', texto: 'Normal (70-180)' },
            { cor: '#f39c12', texto: 'Alta (181-250)' },
            { cor: '#e74c3c', texto: 'Muito Alta (>250)' }
        ];
        
        const larguraLegenda = 100;
        const inicioLegenda = canvas.width - legendas.length * larguraLegenda - 20;
        
        legendas.forEach((legenda, index) => {
            const x = inicioLegenda + index * larguraLegenda;
            const y = 40;
            
            // Círculo da legenda
            ctx.fillStyle = legenda.cor;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Texto da legenda
            ctx.fillStyle = '#2c3e50';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(legenda.texto, x + 10, y - 6);
        });
    }

    // ===== FUNÇÃO ATUALIZADA - BAIXAR PDF APENAS RELATÓRIO COMPLETO =====
    function baixarRelatorioPDF() {
        if (!window.relatorioAtual) {
            mostrarNotificacao('Gere um relatório completo primeiro antes de baixar.', 'erro');
            return;
        }
        
        try {
            if (typeof jspdf === 'undefined') {
                mostrarNotificacao('Erro: Biblioteca de PDF não carregada.', 'erro');
                return;
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            let yPosition = 20;
            const margin = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // ===== CABEÇALHO PROFISSIONAL =====
            doc.setFillColor(58, 83, 155);
            doc.rect(0, 0, pageWidth, 80, 'F');
            
            // Logo/Ícone
            doc.setFontSize(24);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('❤️', margin, 35);
            
            // Título principal
            doc.setFontSize(18);
            doc.text('RELATÓRIO DE MONITORAMENTO', margin + 15, 30);
            doc.text('DE DIABETES', margin + 15, 40);
            
            // Subtítulo
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Sistema de Controle Glicêmico - Cuidando de sua Diabetes', margin + 15, 50);
            
            // Data de geração
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth - margin, 70, { align: 'right' });

            // ===== INFORMAÇÕES DO RELATÓRIO =====
            yPosition = 90;
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, yPosition, pageWidth - 2 * margin, 40, 'F');
            
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('INFORMAÇÕES DO RELATÓRIO', margin + 10, yPosition + 12);
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(`• Período Analisado: ${window.relatorioAtual.periodo}`, margin + 10, yPosition + 22);
            doc.text(`• Tipo de Relatório: ${formatarTipoRelatorio(window.relatorioAtual.tipo)}`, margin + 10, yPosition + 30);
            doc.text(`• Total de Registros: ${window.relatorioAtual.dados.glicemias.length} medições`, margin + 110, yPosition + 22);

            yPosition += 50;

            // ===== CARDS DE ESTATÍSTICAS =====
            if (window.relatorioAtual.dados.glicemias.length > 0) {
                const stats = calcularEstatisticasGlicemia(window.relatorioAtual.dados.glicemias);
                const classificacao = classificarIndiceGlicemico(stats.media);
                
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('ANÁLISE GLICÊMICA - RESUMO ESTATÍSTICO', margin, yPosition);
                yPosition += 15;

                // Container para cards
                const cardWidth = (pageWidth - 2 * margin - 10) / 2;
                const cardHeight = 45;

                // Card 1: Média e Classificação
                doc.setFillColor(74, 144, 226);
                doc.rect(margin, yPosition, cardWidth, cardHeight, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.text('MÉDIA GLICÊMICA', margin + 5, yPosition + 8);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(`${stats.media.toFixed(1)} mg/dL`, margin + 5, yPosition + 22);
                doc.setFontSize(8);
                doc.text(classificacao.toUpperCase(), margin + 5, yPosition + 32);

                // Card 2: Controle
                doc.setFillColor(46, 204, 113);
                doc.rect(margin + cardWidth + 5, yPosition, cardWidth, cardHeight, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.text('CONTROLE IDEAL', margin + cardWidth + 10, yPosition + 8);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text(`${stats.percentualNormais}%`, margin + cardWidth + 10, yPosition + 22);
                doc.setFontSize(8);
                doc.text('DENTRO DA META', margin + cardWidth + 10, yPosition + 32);

                yPosition += cardHeight + 10;

                // Cards da segunda linha
                // Card 3: Mínima e Máxima
                doc.setFillColor(52, 152, 219);
                doc.rect(margin, yPosition, cardWidth, 35, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.text('VARIABILIDADE', margin + 5, yPosition + 8);
                doc.setFontSize(11);
                doc.text(`Mín: ${stats.minima} mg/dL`, margin + 5, yPosition + 18);
                doc.text(`Máx: ${stats.maxima} mg/dL`, margin + 5, yPosition + 28);

                // Card 4: Distribuição
                doc.setFillColor(155, 89, 182);
                doc.rect(margin + cardWidth + 5, yPosition, cardWidth, 35, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(9);
                doc.text('DISTRIBUIÇÃO', margin + cardWidth + 10, yPosition + 8);
                doc.setFontSize(9);
                doc.text(`Altas: ${stats.percentualAltas}%`, margin + cardWidth + 10, yPosition + 18);
                doc.text(`Baixas: ${stats.percentualBaixas}%`, margin + cardWidth + 10, yPosition + 28);

                yPosition += 45;
            }

            // ===== RECOMENDAÇÕES MÉDICAS DETALHADAS =====
            if (window.relatorioAtual.dados.glicemias.length > 0) {
                const stats = calcularEstatisticasGlicemia(window.relatorioAtual.dados.glicemias);
                
                if (yPosition + 100 > pageHeight - 50) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('RECOMENDAÇÕES E OBSERVAÇÕES MÉDICAS', margin, yPosition);
                yPosition += 12;

                // Container das recomendações
                doc.setFillColor(249, 249, 249);
                doc.rect(margin, yPosition, pageWidth - 2 * margin, 80, 'F');
                doc.setDrawColor(220, 220, 220);
                doc.rect(margin, yPosition, pageWidth - 2 * margin, 80);

                let recY = yPosition + 10;
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');

                const recomendacoes = [];

                // Análise baseada nos dados
                if (stats.percentualNormais >= 70) {
                    recomendacoes.push('✅ EXCELENTE CONTROLE: Manter esquema terapêutico atual. Controle glicêmico dentro dos parâmetros ideais.');
                } else {
                    if (stats.percentualAltas > 20) {
                        recomendacoes.push('⚠️ GLICEMIAS ELEVADAS: Avaliar necessidade de ajuste de medicação. Revisar hábitos alimentares e atividade física.');
                    }
                    
                    if (stats.percentualBaixas > 5) {
                        recomendacoes.push('🔔 HIPOGLICEMIAS FREQUENTES: Revisar doses de insulinas/medicações. Orientar sobre reconhecimento e tratamento.');
                    }
                }

                if (stats.maxima > 250) {
                    recomendacoes.push('🚨 HIPERGLICEMIA SEVERA: Necessidade de ajuste urgente do tratamento. Monitorar sintomas de cetoacidose.');
                }

                if (stats.minima < 60) {
                    recomendacoes.push('💊 HIPOGLICEMIA SIGNIFICATIVA: Revisar esquema insulinoterápico. Orientar sobre kit de emergência.');
                }

                // Recomendação geral
                recomendacoes.push('📋 MANTER ACOMPANHAMENTO: Retorno em 3 meses ou conforme orientação médica. Manter registro contínuo.');

                // Adicionar recomendações
                recomendacoes.forEach((rec, index) => {
                    if (recY + 20 > yPosition + 75) {
                        return;
                    }

                    doc.setFontSize(8);
                    doc.setTextColor(0, 0, 0);
                    const lines = doc.splitTextToSize(rec, pageWidth - 2 * margin - 10);
                    doc.text(lines, margin + 5, recY);
                    
                    recY += lines.length * 4 + 8;
                });

                yPosition += 90;
            }

            // ===== REGISTROS RECENTES =====
            if (window.relatorioAtual.dados.glicemias.length > 0) {
                const glicemias = window.relatorioAtual.dados.glicemias
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .slice(0, 15);

                if (yPosition + 80 > pageHeight - 50) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(13);
                doc.setFont('helvetica', 'bold');
                doc.text('REGISTROS GLICÊMICOS RECENTES', margin, yPosition);
                yPosition += 10;

                // Cabeçalho da tabela
                doc.setFillColor(58, 83, 155);
                doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
                
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                const colWidth = (pageWidth - 2 * margin - 20) / 5;
                doc.text('DATA', margin + 5, yPosition + 5);
                doc.text('HORA', margin + 5 + colWidth, yPosition + 5);
                doc.text('GLICEMIA', margin + 5 + colWidth * 2, yPosition + 5);
                doc.text('STATUS', margin + 5 + colWidth * 3, yPosition + 5);
                doc.text('OBSERVAÇÃO', margin + 5 + colWidth * 4, yPosition + 5);
                
                yPosition += 8;
                doc.setTextColor(0, 0, 0);

                // Dados da tabela
                glicemias.forEach((glicemia, index) => {
                    if (yPosition + 8 > pageHeight - 30) {
                        doc.addPage();
                        yPosition = 20;
                        // Redesenhar cabeçalho
                        doc.setFillColor(58, 83, 155);
                        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.text('DATA', margin + 5, yPosition + 5);
                        doc.text('HORA', margin + 5 + colWidth, yPosition + 5);
                        doc.text('GLICEMIA', margin + 5 + colWidth * 2, yPosition + 5);
                        doc.text('STATUS', margin + 5 + colWidth * 3, yPosition + 5);
                        doc.text('OBSERVAÇÃO', margin + 5 + colWidth * 4, yPosition + 5);
                        yPosition += 8;
                        doc.setTextColor(0, 0, 0);
                    }

                    // Fundo alternado
                    if (index % 2 === 0) {
                        doc.setFillColor(248, 248, 248);
                        doc.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
                    }

                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    
                    // Data
                    doc.text(formatarData(glicemia.data), margin + 5, yPosition + 5);
                    
                    // Hora
                    doc.text(glicemia.hora, margin + 5 + colWidth, yPosition + 5);
                    
                    // Glicemia
                    doc.text(glicemia.glicemia.toString(), margin + 5 + colWidth * 2, yPosition + 5);
                    
                    // Status com cor
                    const status = obterStatusGlicemia(glicemia.glicemia);
                    if (status === 'Baixa') doc.setTextColor(52, 152, 219);
                    else if (status === 'Normal') doc.setTextColor(46, 204, 113);
                    else if (status === 'Alta') doc.setTextColor(243, 156, 18);
                    else doc.setTextColor(231, 76, 60);
                    
                    doc.text(status, margin + 5 + colWidth * 3, yPosition + 5);
                    doc.setTextColor(0, 0, 0);
                    
                    // Observação (truncada se necessário)
                    const observacao = glicemia.observacao || '-';
                    const obsTruncada = observacao.length > 20 ? observacao.substring(0, 17) + '...' : observacao;
                    doc.text(obsTruncada, margin + 5 + colWidth * 4, yPosition + 5);
                    
                    yPosition += 8;
                });

                yPosition += 10;
                
                // Resumo da tabela
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                doc.text(`Mostrando ${Math.min(glicemias.length, 15)} de ${window.relatorioAtual.dados.glicemias.length} registros totais`, margin, yPosition);
                
                yPosition += 15;
            }

            // ===== RODAPÉ PROFISSIONAL =====
            const footerY = pageHeight - 25;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, footerY, pageWidth - margin, footerY);
            
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Este relatório foi gerado automaticamente pelo Sistema de Monitoramento de Diabetes "Cuidando de sua Diabetes"', pageWidth / 2, footerY + 5, { align: 'center' });
            doc.text('Desenvolvido por Gledison Arruda Andrade | Para uso médico e de acompanhamento do paciente', pageWidth / 2, footerY + 12, { align: 'center' });

            // ===== NUMERAÇÃO DE PÁGINAS =====
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
            }

            // Salvar o PDF
            const nomeArquivo = `Relatorio_Diabetes_Completo_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nomeArquivo);

            mostrarNotificacao('Relatório PDF completo gerado com sucesso!', 'sucesso');

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarNotificacao('Erro ao gerar PDF. Tente novamente.', 'erro');
        }
    }

    // Adicionar estilos CSS para as notificações e relatório
    const style = document.createElement('style');
    style.textContent = `
        .notificacao {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: bold;
            z-index: 1000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: opacity 0.5s ease-in-out;
        }
        
        .notificacao-sucesso {
            background-color: #28a745;
        }
        
        .notificacao-erro {
            background-color: #dc3545;
        }
        
        .notificacao-info {
            background-color: #17a2b8;
        }
        
        .notificacao-alerta {
            background-color: #ffc107;
            color: #000;
        }
        
        .sem-registros {
            text-align: center;
            padding: 2rem;
            color: #666;
            opacity: 0.7;
            font-style: italic;
        }
        
        /* Estilos para o relatório */
        .cabecalho-relatorio {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
        }
        
        .resumo-estatisticas {
            background: #f8f9fa;
            padding: 1.5rem;
            border-radius: 10px;
            margin-bottom: 2rem;
        }
        
        .estatisticas-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .estatistica {
            text-align: center;
            padding: 1rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .estatistica .valor {
            display: block;
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .estatistica .label {
            font-size: 0.9rem;
            color: #666;
        }
        
        .secao-relatorio {
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .tabela-relatorio {
            overflow-x: auto;
        }
        
        .tabela-relatorio table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .tabela-relatorio th,
        .tabela-relatorio td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        
        .tabela-relatorio th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        
        .status {
            padding: 0.25rem 0.5rem;
            border-radius: 15px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .status.baixa { background: #d1ecf1; color: #0c5460; }
        .status.normal { background: #d4edda; color: #155724; }
        .status.alta { background: #fff3cd; color: #856404; }
        .status.muito-alta { background: #f8d7da; color: #721c24; }
        
        .efeito.positivo { color: #28a745; }
        .efeito.negativo { color: #dc3545; }
        .efeito.neutro { color: #6c757d; }
        
        .rodape-relatorio {
            margin-top: 2rem;
            padding-top: 1rem;
            border-top: 2px solid #dee2e6;
            text-align: center;
            color: #6c757d;
        }
        
        .estatisticas-metas {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .estatistica-meta {
            flex: 1;
            text-align: center;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .estatistica-meta .valor {
            display: block;
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }
        
        .estatistica-meta .label {
            font-size: 0.8rem;
            color: #666;
        }
        
        .lista-metas {
            list-style: none;
            padding: 0;
        }
        
        .lista-metas li {
            padding: 0.5rem;
            border-bottom: 1px solid #eee;
        }
        
        .categoria-meta {
            background: #e9ecef;
            padding: 0.2rem 0.5rem;
            border-radius: 15px;
            font-size: 0.8rem;
            margin-left: 0.5rem;
        }
        
        .data-meta {
            color: #6c757d;
            font-size: 0.8rem;
            margin-left: 0.5rem;
        }
        
        .card-indice {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            text-align: center;
        }
        
        .media-glicemia {
            font-size: 2.5rem;
            font-weight: bold;
            display: block;
        }
        
        .classificacao {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .classificacao.boa {
            color: #90EE90;
        }
        
        .classificacao.regular {
            color: #FFA500;
        }
        
        .detalhes-indice {
            display: flex;
            justify-content: space-around;
            margin-top: 1rem;
        }
        
        .detalhe {
            text-align: center;
        }
        
        .detalhe .label {
            display: block;
            font-size: 0.8rem;
            opacity: 0.8;
        }
        
        .detalhe .valor {
            display: block;
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .recomendacoes ul {
            padding-left: 1.5rem;
        }
        
        .recomendacoes li {
            margin-bottom: 0.5rem;
        }
        
        .info-tabela {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            margin-top: 0.5rem;
        }

        /* Estilos melhorados para o gráfico */
        #grafico-glicemia {
            background: #ffffff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #e0e0e0;
        }

        .grafico-container {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
        }
    `;
    document.head.appendChild(style);
});
