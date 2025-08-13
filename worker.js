// worker.js

// Essas variáveis e funções são necessárias para o algoritmo genético funcionar
const diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const turmasFundamental = ['6º ano', '7º ano', '8º ano', '9º ano'];
const turmasMedio = ['1º EM', '2º EM', '3º EM'];
const todasTurmas = [...turmasFundamental, ...turmasMedio];
const aulasPeriodoPadrao = [2, 3, 4, 5];

let professores = [];
let cargasHorarias = [];

function getAulasPeriodo(turma, ativarFundamental, ativarMedio) {
    if (turmasFundamental.includes(turma) && ativarFundamental) {
        return [2, 3, 4, 5, 6];
    }
    if (turmasMedio.includes(turma) && ativarMedio) {
        return [2, 3, 4, 5, 6];
    }
    return aulasPeriodoPadrao;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function estaEmOutraTurma(grade, dia, aula, professorNome) {
    return todasTurmas.some(turma => grade[dia]?.[aula]?.[turma]?.includes(professorNome));
}

function temAulaConsecutiva(grade, dia, aula, turma, professorNome, ativarFundamental, ativarMedio) {
    const aulasPeriodoFinal = getAulasPeriodo(turma, ativarFundamental, ativarMedio);
    const aulaAnterior = aulasPeriodoFinal.find(a => a === aula - 1);
    const aulaPosterior = aulasPeriodoFinal.find(a => a === aula + 1);

    if (aulaAnterior && grade[dia]?.[aulaAnterior]?.[turma]?.includes(professorNome)) {
        return true;
    }
    if (aulaPosterior && grade[dia]?.[aulaPosterior]?.[turma]?.includes(professorNome)) {
        return true;
    }
    return false;
}

function gerarGradeInicial(ativarFundamental, ativarMedio) {
    let grade = {};
    const aulasParaDistribuir = JSON.parse(JSON.stringify(cargasHorarias)); // Clonar para não alterar o original
    const aulasPorDiaProfessor = {};

    shuffleArray(aulasParaDistribuir);

    diasDaSemana.forEach(dia => {
        grade[dia] = {};
        todasTurmas.forEach(turma => {
            getAulasPeriodo(turma, ativarFundamental, ativarMedio).forEach(aula => {
                grade[dia][aula] = {};
            });
        });
    });
    
    aulasParaDistribuir.forEach(carga => {
        let aulasRestantes = carga.aulas;
        const professor = professores.find(p => p.nome === carga.professorNome);
        
        while (aulasRestantes > 0) {
            let dia = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
            let turma = carga.turma;
            let aulasPeriodo = getAulasPeriodo(turma, ativarFundamental, ativarMedio);
            shuffleArray(aulasPeriodo);
            let aula = aulasPeriodo[0];
            
            if (!aulasPorDiaProfessor[professor.nome]) aulasPorDiaProfessor[professor.nome] = {};
            if (!aulasPorDiaProfessor[professor.nome][dia]) aulasPorDiaProfessor[professor.nome][dia] = 0;
            
            const podeAlocar = professor &&
                                professor.disponibilidade.includes(dia) &&
                                !estaEmOutraTurma(grade, dia, aula, professor.nome) &&
                                !grade[dia][aula][turma] &&
                                aulasPorDiaProfessor[professor.nome][dia] < carga.limiteDiario &&
                                (carga.aulaGeminada || !temAulaConsecutiva(grade, dia, aula, turma, professor.nome, ativarFundamental, ativarMedio));
                                
            if (podeAlocar) {
                grade[dia][aula][turma] = `${professor.nome} (${carga.disciplina})`;
                aulasPorDiaProfessor[professor.nome][dia]++;
                aulasRestantes--;
            }
        }
    });
    
    return { grade, aulasRestantes: aulasParaDistribuir.filter(a => a.aulas > 0) };
}

function calcularFitness(grade, ativarFundamental, ativarMedio) {
    let score = 0;
    let aulasAlocadas = 0;
    const aulasTotais = cargasHorarias.reduce((acc, curr) => acc + curr.aulas, 0);

    // Pontuação base: Aulas alocadas
    diasDaSemana.forEach(dia => {
        if (grade[dia]) {
            Object.values(grade[dia]).forEach(aulasPorTurma => {
                aulasAlocadas += Object.keys(aulasPorTurma).length;
            });
        }
    });
    score += aulasAlocadas * 100;
    
    const aulasRestantes = aulasTotais - aulasAlocadas;
    score -= aulasRestantes * 50;

    // Bônus: Aulas geminadas
    cargasHorarias.filter(c => c.aulaGeminada).forEach(carga => {
        diasDaSemana.forEach(dia => {
            const aulasDoDia = getAulasPeriodo(carga.turma, ativarFundamental, ativarMedio);
            for (let i = 0; i < aulasDoDia.length - 1; i++) {
                const aulaAtual = aulasDoDia[i];
                const aulaSeguinte = aulasDoDia[i + 1];
                const professorDisciplina1 = grade[dia]?.[aulaAtual]?.[carga.turma];
                const professorDisciplina2 = grade[dia]?.[aulaSeguinte]?.[carga.turma];
                
                if (professorDisciplina1 && professorDisciplina2 && professorDisciplina1 === professorDisciplina2) {
                    score += 20;
                }
            }
        });
    });

    // Bônus: Consolidação de horário
    professores.forEach(prof => {
        diasDaSemana.forEach(dia => {
            const aulasDoProfessorNoDia = [];
            todasTurmas.forEach(turma => {
                const aulasPeriodo = getAulasPeriodo(turma, ativarFundamental, ativarMedio);
                aulasPeriodo.forEach(aula => {
                    if (grade[dia]?.[aula]?.[turma]?.includes(prof.nome)) {
                        aulasDoProfessorNoDia.push(aula);
                    }
                });
            });

            if (aulasDoProfessorNoDia.length > 1) {
                const minAula = Math.min(...aulasDoProfessorNoDia);
                const maxAula = Math.max(...aulasDoProfessorNoDia);
                const totalPeriodo = maxAula - minAula + 1;
                const aulasReal = aulasDoProfessorNoDia.length;
                
                if (totalPeriodo === aulasReal) {
                    score += 10;
                }
            }
        });
    });

    return score;
}

function cruzar(grade1, grade2) {
    let novaGrade = {};
    diasDaSemana.forEach((dia, index) => {
        if (index < 3) {
            novaGrade[dia] = grade1[dia];
        } else {
            novaGrade[dia] = grade2[dia];
        }
    });
    return novaGrade;
}

function mutar(grade, ativarFundamental, ativarMedio) {
    const dia1 = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
    const turma1 = todasTurmas[Math.floor(Math.random() * todasTurmas.length)];
    const aulasTurma1 = getAulasPeriodo(turma1, ativarFundamental, ativarMedio);
    const aula1 = aulasTurma1[Math.floor(Math.random() * aulasTurma1.length)];
    
    const dia2 = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
    const turma2 = todasTurmas[Math.floor(Math.random() * todasTurmas.length)];
    const aulasTurma2 = getAulasPeriodo(turma2, ativarFundamental, ativarMedio);
    const aula2 = aulasTurma2[Math.floor(Math.random() * aulasTurma2.length)];
    
    if (grade[dia1]?.[aula1]?.[turma1] && grade[dia2]?.[aula2]?.[turma2]) {
        const temp = grade[dia1][aula1][turma1];
        grade[dia1][aula1][turma1] = grade[dia2][aula2][turma2];
        grade[dia2][aula2][turma2] = temp;
    }
    return grade;
}

function executarAlgoritmoGenetico(params) {
    const { ativarFundamental, ativarMedio } = params;
    
    // --- Novos Parâmetros Otimizados para Velocidade ---
    const NUM_GERACOES = 50; // Reduzimos de 200 para 100
    const TAMANHO_POPULACAO = 20; // Reduzimos de 50 para 30
    const POPULACAO_ELITE = 3; // Reduzimos de 10 para 5
    // --- Fim dos Novos Parâmetros ---

    let populacao = [];
    
    // Geração da população inicial
    for (let i = 0; i < TAMANHO_POPULACAO; i++) {
        populacao.push(gerarGradeInicial(ativarFundamental, ativarMedio));
    }

    for (let geracao = 0; geracao < NUM_GERACOES; geracao++) {
        // Calcula a aptidão de cada grade
        populacao.forEach(individuo => {
            individuo.fitness = calcularFitness(individuo.grade, ativarFundamental, ativarMedio);
        });
        
        // Ordena a população pelas melhores notas
        populacao.sort((a, b) => b.fitness - a.fitness);

        // Envia o progresso para o thread principal
        self.postMessage({
            type: 'progress',
            geracao: geracao + 1,
            melhorFitness: populacao[0].fitness,
            numGeracoes: NUM_GERACOES // Envia o número total de gerações
        });
        
        // Se a melhor grade já é perfeita (todas as aulas alocadas), para o algoritmo
        if (populacao[0].aulasRestantes.length === 0) {
            self.postMessage({
                type: 'concluido',
                melhorGrade: populacao[0].grade,
                aulasRestantes: populacao[0].aulasRestantes
            });
            return;
        }

        // Geração da próxima população
        const novaPopulacao = populacao.slice(0, POPULACAO_ELITE); // Mantém os melhores indivíduos
        while (novaPopulacao.length < TAMANHO_POPULACAO) {
            const pai1 = populacao[Math.floor(Math.random() * POPULACAO_ELITE)];
            const pai2 = populacao[Math.floor(Math.random() * POPULACAO_ELITE)];
            
            const filho = cruzar(pai1.grade, pai2.grade);
            
            const filhoMutado = mutar(filho, ativarFundamental, ativarMedio);
            
            novaPopulacao.push({ grade: filhoMutado, aulasRestantes: {} });
        }
        populacao = novaPopulacao;
    }

    // Após todas as gerações, usa a melhor grade encontrada
    populacao.sort((a, b) => b.fitness - a.fitness);
    self.postMessage({
        type: 'concluido',
        melhorGrade: populacao[0].grade,
        aulasRestantes: populacao[0].aulasRestantes
    });
}

// O worker recebe os dados do thread principal
self.onmessage = (e) => {
    const { tipo, data } = e.data;
    if (tipo === 'iniciar') {
        professores = data.professores;
        cargasHorarias = data.cargasHorarias;
        executarAlgoritmoGenetico(data.params);
    }
};