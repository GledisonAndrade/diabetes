// js/graficos.js - Funcionalidades de gráficos
let graficoGlicemia = null;

document.addEventListener('DOMContentLoaded', function() {
    const periodoGrafico = document.getElementById('periodo-grafico');
    const periodoPersonalizado = document.getElementById('periodo-personalizado');
    
    // Inicializar gráfico
    inicializarGrafico();
    
    // Alternar visibilidade do período personalizado
    periodoGrafico.addEventListener('change', function() {
        if (this.value === 'personalizado') {
            periodoPersonalizado.classList.add('mostrar');
        } else {
            periodoPersonalizado.classList.remove('mostrar');
            atualizarGrafico();
        }
    });
    
    // Atualizar gráfico quando datas personalizadas forem alteradas
    document.getElementById('grafico-inicio').addEventListener('change', atualizarGrafico);
    document.getElementById('grafico-fim').addEventListener('change', atualizarGrafico);
});

function inicializarGrafico() {
    const ctx = document.getElementById('grafico-glicemia').getContext('2d');
    
    graficoGlicemia = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Glicemia (mg/dL)',
                data: [],
                borderColor: '#4a90e2',
                backgroundColor: 'rgba(74, 144, 226, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: [],
                pointBorderColor: [],
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    suggestedMin: 50,
                    suggestedMax: 300,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: 'var(--cor-texto)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: 'var(--cor-texto)',
                        maxTicksLimit: 8
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'var(--cor-texto)'
                    }
                },
                tooltip: {
                    backgroundColor: 'var(--cor-card)',
                    titleColor: 'var(--cor-texto)',
                    bodyColor: 'var(--cor-texto)',
                    borderColor: 'var(--cor-borda)',
                    borderWidth: 1
                }
            }
        }
    });
    
    // Atualizar gráfico com dados iniciais
    setTimeout(atualizarGrafico, 100);
}

function atualizarGrafico() {
    if (!graficoGlicemia || !window.dados) return;
    
    let glicemiasFiltradas = [...window.dados.glicemias];
    
    // Aplicar filtro de período
    const periodo = document.getElementById('periodo-grafico').value;
    
    if (periodo !== 'personalizado') {
        const dias = parseInt(periodo);
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - dias);
        
        glicemiasFiltradas = glicemiasFiltradas.filter(g => {
            const dataRegistro = new Date(g.data);
            return dataRegistro >= dataLimite;
        });
    } else {
        const inicio = document.getElementById('grafico-inicio').value;
        const fim = document.getElementById('grafico-fim').value;
        
        if (inicio && fim) {
            glicemiasFiltradas = glicemiasFiltradas.filter(g => {
                return g.data >= inicio && g.data <= fim;
            });
        }
    }
    
    // Ordenar por data (mais antigo primeiro)
    glicemiasFiltradas.sort((a, b) => a.timestamp - b.timestamp);
    
    const labels = glicemiasFiltradas.map(g => {
        const data = new Date(g.data);
        return `${data.getDate()}/${data.getMonth() + 1} ${g.hora}`;
    });
    
    const valores = glicemiasFiltradas.map(g => g.glicemia);
    
    // Definir cores dos pontos baseadas nos valores
    const coresPontos = valores.map(valor => {
        if (valor < 70) return getComputedStyle(document.body).getPropertyValue('--cor-info');
        if (valor <= 180) return getComputedStyle(document.body).getPropertyValue('--cor-sucesso');
        if (valor <= 250) return getComputedStyle(document.body).getPropertyValue('--cor-alerta');
        return getComputedStyle(document.body).getPropertyValue('--cor-perigo');
    });
    
    graficoGlicemia.data.labels = labels;
    graficoGlicemia.data.datasets[0].data = valores;
    graficoGlicemia.data.datasets[0].pointBackgroundColor = coresPontos;
    graficoGlicemia.data.datasets[0].pointBorderColor = coresPontos;
    
    graficoGlicemia.update();
}

function obterGlicemiasPeriodo(inicio, fim) {
    if (!window.dados) return [];
    
    return window.dados.glicemias.filter(g => {
        return g.data >= inicio && g.data <= fim;
    });
}