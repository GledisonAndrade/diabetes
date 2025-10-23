// js/relatorios.js - Funcionalidades de relatórios
document.addEventListener('DOMContentLoaded', function() {
    const btnBaixarPDF = document.getElementById('baixar-relatorio-pdf');
    
    btnBaixarPDF.addEventListener('click', function() {
        baixarRelatorioPDF();
    });
});

function gerarRelatorio(inicio, fim, tipo) {
    const glicemiasPeriodo = obterGlicemiasPeriodo(inicio, fim);
    const alimentosPeriodo = window.dados.alimentos.filter(a => a.data >= inicio && a.data <= fim);
    const metasPeriodo = window.dados.metas.filter(m => {
        const dataCriacao = new Date(m.id).toISOString().split('T')[0];
        return dataCriacao >= inicio && dataCriacao <= fim;
    });
    
    let conteudoRelatorio = `
        <h3>📋 Relatório de Monitoramento de Diabetes</h3>
        <p><strong>Período:</strong> ${formatarData(inicio)} a ${formatarData(fim)}</p>
        <p><strong>Gerado em:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
        <p><strong>Tipo de relatório:</strong> ${formatarTipoRelatorio(tipo)}</p>
    `;
    
    // Estatísticas resumidas
    if (glicemiasPeriodo.length > 0) {
        const estatisticas = calcularEstatisticasGlicemia(glicemiasPeriodo);
        
        conteudoRelatorio += `
            <div class="resumo-estatisticas">
                <h4>📊 Resumo Estatístico</h4>
                <div class="estatisticas-grid">
                    <div class="estatistica">
                        <span class="valor">${estatisticas.media.toFixed(1)}</span>
                        <span class="label">Média Glicêmica</span>
                    </div>
                    <div class="estatistica">
                        <span class="valor">${estatisticas.minima}</span>
                        <span class="label">Mínima</span>
                    </div>
                    <div class="estatistica">
                        <span class="valor">${estatisticas.maxima}</span>
                        <span class="label">Máxima</span>
                    </div>
                    <div class="estatistica">
                        <span class="valor">${estatisticas.percentualNormais}%</span>
                        <span class="label">Dentro da Meta</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    if (tipo === 'completo' || tipo === 'glicemia') {
        conteudoRelatorio += gerarSecaoGlicemia(glicemiasPeriodo);
    }
    
    if (tipo === 'completo' || tipo === 'alimentos') {
        conteudoRelatorio += gerarSecaoAlimentos(alimentosPeriodo);
    }
    
    if (tipo === 'completo' || tipo === 'metas') {
        conteudoRelatorio += gerarSecaoMetas(metasPeriodo);
    }
    
    if (tipo === 'completo' || tipo === 'indice') {
        conteudoRelatorio += gerarSecaoIndice(glicemiasPeriodo);
    }
    
    // Adicionar recomendações
    if (glicemiasPeriodo.length > 0) {
        conteudoRelatorio += gerarRecomendacoes(glicemiasPeriodo);
    }
    
    document.getElementById('previa-relatorio').innerHTML = conteudoRelatorio;
    document.getElementById('baixar-relatorio-pdf').disabled = false;
    
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
}

function gerarSecaoGlicemia(glicemias) {
    if (glicemias.length === 0) {
        return '<h4>📈 Registros de Glicemia</h4><p>Nenhum registro de glicemia no período.</p>';
    }
    
    let html = `
        <h4>📈 Registros de Glicemia</h4>
        <div class="tabela-container">
            <table class="tabela-relatorio">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Glicemia (mg/dL)</th>
                        <th>Status</th>
                        <th>Observações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    glicemias.forEach(g => {
        const status = obterStatusGlicemia(g.glicemia);
        const classeStatus = obterClasseGlicemia(g.glicemia);
        
        html += `
            <tr>
                <td>${formatarData(g.data)}</td>
                <td>${g.hora}</td>
                <td>${g.glicemia}</td>
                <td class="status-${classeStatus}">${status}</td>
                <td>${g.observacao || '-'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    
    return html;
}

function gerarSecaoAlimentos(alimentos) {
    if (alimentos.length === 0) {
        return '<h4>🍎 Registros de Alimentos</h4><p>Nenhum registro de alimento no período.</p>';
    }
    
    let html = `
        <h4>🍎 Registros de Alimentos</h4>
        <div class="tabela-container">
            <table class="tabela-relatorio">
                <thead>
                    <tr>
                        <th>Alimento</th>
                        <th>Categoria</th>
                        <th>Efeito</th>
                        <th>Observações</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    alimentos.forEach(a => {
        html += `
            <tr>
                <td>${a.alimento}</td>
                <td>${formatarCategoria(a.categoria)}</td>
                <td>${formatarEfeito(a.efeito)}</td>
                <td>${a.observacao || '-'}</td>
                <td>${formatarData(a.data)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div>';
    
    return html;
}

function gerarSecaoMetas(metas) {
    if (metas.length === 0) {
        return '<h4>🎯 Metas</h4><p>Nenhuma meta criada no período.</p>';
    }
    
    const metasPendentes = metas.filter(m => !m.concluida);
    const metasConcluidas = metas.filter(m => m.concluida);
    
    let html = '<h4>🎯 Metas</h4>';
    
    if (metasPendentes.length > 0) {
        html += '<h5>📝 Metas Pendentes</h5><ul>';
        metasPendentes.forEach(m => {
            html += `<li>${m.descricao}${m.dataLimite ? ` (Até ${formatarData(m.dataLimite)})` : ''}</li>`;
        });
        html += '</ul>';
    }
    
    if (metasConcluidas.length > 0) {
        html += '<h5>✅ Metas Concluídas</h5><ul>';
        metasConcluidas.forEach(m => {
            html += `<li>${m.descricao}</li>`;
        });
        html += '</ul>';
    }
    
    return html;
}

function gerarSecaoIndice(glicemias) {
    if (glicemias.length === 0) {
        return '<h4>🧮 Índice Glicêmico</h4><p>Não há dados suficientes para calcular o índice glicêmico.</p>';
    }
    
    const estatisticas = calcularEstatisticasGlicemia(glicemias);
    
    return `
        <h4>🧮 Índice Glicêmico</h4>
        <p><strong>Média de glicemia:</strong> ${estatisticas.media.toFixed(1)} mg/dL</p>
        <p><strong>Classificação:</strong> ${classificarIndiceGlicemico(estatisticas.media)}</p>
        <p><strong>Distribuição:</strong></p>
        <ul>
            <li>Glicemias normais: ${estatisticas.normais} (${estatisticas.percentualNormais}%)</li>
            <li>Glicemias altas: ${estatisticas.altas} (${estatisticas.percentualAltas}%)</li>
            <li>Glicemias baixas: ${estatisticas.baixas} (${estatisticas.percentualBaixas}%)</li>
        </ul>
    `;
}

function gerarRecomendacoes(glicemias) {
    const estatisticas = calcularEstatisticasGlicemia(glicemias);
    
    let recomendacoes = '<h4>💡 Recomendações</h4><ul>';
    
    if (estatisticas.percentualAltas > 20) {
        recomendacoes += '<li>Considere ajustar a dieta ou medicação para reduzir as glicemias altas</li>';
    }
    
    if (estatisticas.percentualBaixas > 5) {
        recomendacoes += '<li>Fique atento aos sinais de hipoglicemia e ajuste a medicação se necessário</li>';
    }
    
    if (estatisticas.media < 130 && estatisticas.percentualAltas < 20 && estatisticas.percentualBaixas < 5) {
        recomendacoes += '<li>Continue com o bom trabalho! Seu controle glicêmico está adequado</li>';
    }
    
    if (estatisticas.maxima > 250) {
        recomendacoes += '<li>Procure orientação médica para ajuste do tratamento, pois foram registradas glicemias muito elevadas</li>';
    }
    
    if (estatisticas.minima < 60) {
        recomendacoes += '<li>Esteja preparado para tratar hipoglicemias e converse com seu médico sobre ajustes</li>';
    }
    
    recomendacoes += '</ul>';
    
    return recomendacoes;
}

function calcularEstatisticasGlicemia(glicemias) {
    if (glicemias.length === 0) {
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

function baixarRelatorioPDF() {
    if (!window.relatorioAtual) return;
    
    // Verificar se jsPDF está disponível
    if (typeof jspdf === 'undefined') {
        alert('Erro: Biblioteca de PDF não carregada. Verifique sua conexão com a internet.');
        return;
    }
    
    const { jsPDF } = window.jspdf;
    
    // Criar novo documento PDF
    const doc = new jsPDF();
    
    // Configurações do documento
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const lineHeight = 7;
    let yPosition = margin;
    
    // Função para adicionar texto e avançar a posição Y
    function addText(text, fontSize = 12, isBold = false, align = 'left') {
        doc.setFontSize(fontSize);
        doc.setFont(undefined, isBold ? 'bold' : 'normal');
        doc.text(text, margin, yPosition, { align: align, maxWidth: pageWidth - 2 * margin });
        yPosition += lineHeight * (fontSize / 10);
    }
    
    // Função para verificar se precisa de nova página
    function checkPageBreak(extraSpace = 0) {
        if (yPosition + extraSpace > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            yPosition = margin;
        }
    }
    
    // Título do relatório
    addText('RELATÓRIO DE MONITORAMENTO DE DIABETES', 16, true, 'center');
    addText('Cuidando de sua Diabetes', 14, false, 'center');
    yPosition += 10;
    
    // Informações do período
    addText(`Período: ${window.relatorioAtual.periodo}`, 12);
    addText(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 12);
    addText(`Tipo de relatório: ${formatarTipoRelatorio(window.relatorioAtual.tipo)}`, 12);
    yPosition += 10;
    
    // Seção de estatísticas (se houver dados de glicemia)
    if (window.relatorioAtual.dados.glicemias.length > 0) {
        checkPageBreak(20);
        addText('RESUMO ESTATÍSTICO', 14, true);
        yPosition += 5;
        
        const estatisticas = calcularEstatisticasGlicemia(window.relatorioAtual.dados.glicemias);
        
        addText(`Média de glicemia: ${estatisticas.media.toFixed(1)} mg/dL`);
        addText(`Glicemia mínima: ${estatisticas.minima} mg/dL`);
        addText(`Glicemia máxima: ${estatisticas.maxima} mg/dL`);
        addText(`Dentro da meta (70-180 mg/dL): ${estatisticas.percentualNormais}%`);
        addText(`Acima da meta (>180 mg/dL): ${estatisticas.percentualAltas}%`);
        addText(`Abaixo da meta (<70 mg/dL): ${estatisticas.percentualBaixas}%`);
        
        yPosition += 10;
    }
    
    // Salvar o PDF
    const nomeArquivo = `relatorio-diabetes-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(nomeArquivo);
}