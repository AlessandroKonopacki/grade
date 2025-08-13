// worker.js

let professores;
let cargasHorarias;
let params;
let diasDaSemana;
let todasTurmas;
let aulasPeriodoPadrao;
const numGeracoes = 10000;
const tamanhoPopulacao = 100;
const taxaMutacao = 0.1;

// FUNÇÕES AUXILIARES
function getAulasPeriodo(turma) {
    if (['6º ano', '7º ano', '8º ano', '9º ano'].includes(turma) && params.ativarFundamental) {
        return [2, 3, 4, 5, 6];
    }
    if (['1º EM', '2º EM', '3º EM'].includes(turma) && params.ativarMedio) {
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

function temAulaConsecutiva(grade, dia, aula, turma, professorNome) {
    const aulasPeriodoFinal = getAulasPeriodo(turma);
    const aulaAnterior = aulasPeriodoFinal.find(a => a === aula - 1);
    const aulaPosterior = aulasPeriodoFinal.find(a => a === aula + 1);

    if (aulaAnterior && grade[dia]?.[aulaAnterior]?.[turma]?.startsWith(professorNome)) {
        return true;
    }
    if (aulaPosterior && grade[dia]?.[aulaPosterior]?.[turma]?.startsWith(professorNome)) {
        return true;
    }
    return false;
}

function estaEmOutraTurma(grade, dia, aula, professorNome, turmaAtual) {
    return todasTurmas.some(turma =>
        turma !== turmaAtual &&
        grade[dia]?.[aula]?.[turma]?.startsWith(professorNome)
    );
}

// ALGORITMO GENÉTICO
function gerarIndividuo() {
    let grade = {};
    const aulasParaDistribuir = JSON.parse(JSON.stringify(cargasHorarias));
    const aulasPorDiaProfessor = {};
    let aulasAlocadas = 0;

    shuffleArray(aulasParaDistribuir);

    diasDaSemana.forEach(dia => {
        grade[dia] = {};
        todasTurmas.forEach(turma => {
            getAulasPeriodo(turma).forEach(aula => {
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
            let aulasPeriodo = getAulasPeriodo(turma);
            shuffleArray(aulasPeriodo);
            let aula = aulasPeriodo[0];

            if (!aulasPorDiaProfessor[professor.nome]) aulasPorDiaProfessor[professor.nome] = {};
            if (!aulasPorDiaProfessor[professor.nome][dia]) aulasPorDiaProfessor[professor.nome][dia] = 0;

            const podeAlocar = professor &&
                                professor.disponibilidade.includes(dia) &&
                                !estaEmOutraTurma(grade, dia, aula, professor.nome, turma) &&
                                !grade[dia][aula][turma] &&
                                aulasPorDiaProfessor[professor.nome][dia] < carga.limiteDiario &&
                                (carga.aulaGeminada || !temAulaConsecutiva(grade, dia, aula, turma, professor.nome));
            
            if (podeAlocar) {
                grade[dia][aula][turma] = `${professor.nome} (${carga.disciplina})`;
                aulasPorDiaProfessor[professor.nome][dia]++;
                aulasRestantes--;
                aulasAlocadas++;
            }
        }
        carga.aulas = aulasRestantes;
    });

    return { grade, aulasRestantes: aulasParaDistribuir, aulasAlocadas };
}

function calcularFitness(individuo) {
    let score = 0;
    let aulasAlocadas = individuo.aulasAlocadas;
    let conflitos = 0;

    diasDaSemana.forEach(dia => {
        const aulasPossiveis = [2, 3, 4, 5, 6];
        aulasPossiveis.forEach(aula => {
            const professoresPorPeriodo = [];
            todasTurmas.forEach(turma => {
                const professorDisciplina = individuo.grade[dia]?.[aula]?.[turma];
                if (professorDisciplina) {
                    const professorNome = professorDisciplina.split(' (')[0];
                    professoresPorPeriodo.push(professorNome);
                }
            });
            const uniqueProfessores = new Set(professoresPorPeriodo);
            conflitos += professoresPorPeriodo.length - uniqueProfessores.size;
        });
    });

    // Penalidade por conflitos
    score -= conflitos * 1000;

    // Pontuação por aulas alocadas
    score += aulasAlocadas;
    
    // Bônus por aulas geminadas (aqui não está implementado, mas é onde a lógica entraria)

    return score;
}

function crossover(pai1, pai2) {
    let filho = JSON.parse(JSON.stringify(pai1));
    const crossoverPoint = Math.floor(Math.random() * diasDaSemana.length);

    for (let i = 0; i < crossoverPoint; i++) {
        const dia = diasDaSemana[i];
        filho.grade[dia] = pai2.grade[dia];
    }
    return filho;
}

function mutarIndividuo(individuo) {
    let grade = individuo.grade;
    const dia = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
    const turma = todasTurmas[Math.floor(Math.random() * todasTurmas.length)];
    const aulasPeriodo = getAulasPeriodo(turma);
    const aula = aulasPeriodo[Math.floor(Math.random() * aulasPeriodo.length)];

    let celulaOriginal = grade[dia]?.[aula]?.[turma];

    if (celulaOriginal) {
        // Tenta mover a aula para outro slot
        const novoDia = diasDaSemana[Math.floor(Math.random() * diasDaSemana.length)];
        const novaAula = aulasPeriodo[Math.floor(Math.random() * aulasPeriodo.length)];
        
        // Verifica se a nova posição é válida
        const professorNome = celulaOriginal.split(' (')[0];
        const professorObj = professores.find(p => p.nome === professorNome);
        
        const podeMover = professorObj.disponibilidade.includes(novoDia) &&
                         !grade[novoDia]?.[novaAula]?.[turma] &&
                         !estaEmOutraTurma(grade, novoDia, novaAula, professorNome, turma);

        if (podeMover) {
            grade[novoDia][novaAula][turma] = celulaOriginal;
            grade[dia][aula][turma] = undefined;
        }
    }
    individuo.grade = grade;
    return individuo;
}

function algoritmoGenetico() {
    let populacao = [];
    for (let i = 0; i < tamanhoPopulacao; i++) {
        const individuo = gerarIndividuo();
        individuo.fitness = calcularFitness(individuo);
        populacao.push(individuo);
    }
    
    let melhorIndividuo = populacao.reduce((melhor, atual) => (atual.fitness > melhor.fitness) ? atual : melhor);

    for (let geracao = 0; geracao < numGeracoes; geracao++) {
        populacao.sort((a, b) => b.fitness - a.fitness);

        let novaPopulacao = populacao.slice(0, 10);

        while (novaPopulacao.length < tamanhoPopulacao) {
            const pai1 = populacao[Math.floor(Math.random() * 50)];
            const pai2 = populacao[Math.floor(Math.random() * 50)];

            let filho = crossover(pai1, pai2);
            if (Math.random() < taxaMutacao) {
                filho = mutarIndividuo(filho);
            }
            filho.fitness = calcularFitness(filho);
            novaPopulacao.push(filho);
        }
        populacao = novaPopulacao;

        const melhorDaGeracao = populacao[0];
        if (melhorDaGeracao.fitness > melhorIndividuo.fitness) {
            melhorIndividuo = melhorDaGeracao;
        }

        if (geracao % 100 === 0) {
            self.postMessage({
                type: 'progress',
                geracao: geracao,
                numGeracoes: numGeracoes,
                melhorFitness: melhorIndividuo.fitness
            });
        }
    }
    
    // Retorna a melhor grade encontrada
    const aulasRestantes = melhorIndividuo.aulasRestantes.filter(a => a.aulas > 0);
    self.postMessage({
        type: 'concluido',
        melhorGrade: melhorIndividuo.grade,
        aulasRestantes: aulasRestantes
    });
}


self.onmessage = (e) => {
    if (e.data.tipo === 'iniciar') {
        const data = e.data.data;
        professores = data.professores;
        cargasHorarias = data.cargasHorarias;
        params = data.params;

        diasDaSemana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
        const turmasFundamental = ['6º ano', '7º ano', '8º ano', '9º ano'];
        const turmasMedio = ['1º EM', '2º EM', '3º EM'];
        todasTurmas = [...turmasFundamental, ...turmasMedio];
        aulasPeriodoPadrao = [2, 3, 4, 5];

        algoritmoGenetico();
    }
};