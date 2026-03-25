// worker.js

// Constantes
const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const HORARIOS_POR_DIA = 6;

// Fisher–Yates shuffle (para randomização)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}

// Preparar mapas para acesso rápido
function prepararMapas(professores, turmas) {
    const mapaProfessores = {};
    const mapaTurmas = {};

    professores.forEach(p => {
        mapaProfessores[p.nome] = {
            ...p,
            disponibilidadeSet: new Set(
                p.disponibilidade.map(dia => DIAS_SEMANA.indexOf(dia))
            )
        };
    });

    turmas.forEach(t => {
        mapaTurmas[t.nome] = { ...t };
    });

    return { mapaProfessores, mapaTurmas };
}

// Criar um indivíduo da população (uma grade horária)
function criarIndividuo(cargasHorarias, mapaProfessores) {
    const grade = Array.from({ length: DIAS_SEMANA.length }, () =>
        Array.from({ length: HORARIOS_POR_DIA }, () => null)
    );
    const aulasNaoAlocadas = [];
    const aulasDisponiveis = shuffle([...cargasHorarias]);

    for (const aula of aulasDisponiveis) {
        const professor = mapaProfessores[aula.professor];
        if (!professor) {
            aulasNaoAlocadas.push(aula);
            continue;
        }

        let alocada = false;
        const diasDisponiveis = shuffle(Array.from(professor.disponibilidadeSet));

        for (const diaIndex of diasDisponiveis) {
            let horariosDisponiveis = [];
            for (let i = 0; i < HORARIOS_POR_DIA; i++) {
                horariosDisponiveis.push(i);
            }
            horariosDisponiveis = shuffle(horariosDisponiveis);

            // Tenta alocar aulas geminadas primeiro
            if (aula.aulasGeminadas && aula.aulasPorSemana >= 2) {
                for (let h = 0; h < HORARIOS_POR_DIA - 1; h++) {
                    if (grade[diaIndex][h] === null && grade[diaIndex][h + 1] === null) {
                        // Verifica conflito de professor e turma
                        if (!conflitoDeAlocacao(grade, diaIndex, h, aula) && !conflitoDeAlocacao(grade, diaIndex, h + 1, aula)) {
                            grade[diaIndex][h] = { ...aula, geminada: true, slot: 1 };
                            grade[diaIndex][h + 1] = { ...aula, geminada: true, slot: 2 };
                            alocada = true;
                            break;
                        }
                    }
                }
            } else { // Aloca aulas não geminadas ou se não houver pares
                for (const horaIndex of horariosDisponiveis) {
                    if (grade[diaIndex][horaIndex] === null) {
                        if (!conflitoDeAlocacao(grade, diaIndex, horaIndex, aula)) {
                            grade[diaIndex][horaIndex] = aula;
                            alocada = true;
                            break;
                        }
                    }
                }
            }
            if (alocada) break;
        }
        
        if (!alocada) {
            aulasNaoAlocadas.push(aula);
        }
    }

    return { grade, aulasNaoAlocadas };
}

// Verifica se há conflito de alocação em um slot específico
function conflitoDeAlocacao(grade, dia, hora, aula) {
    const slot = grade[dia][hora];
    if (slot) {
        if (slot.professor === aula.professor) return true;
        if (slot.turma === aula.turma) return true;
    }
    // Verifica limite de aulas por dia para o professor e turma
    const aulasNoDiaProfessor = grade[dia].filter(a => a && a.professor === aula.professor).length;
    if (aulasNoDiaProfessor >= aula.limiteAulas) return true;

    const aulasNoDiaTurma = grade[dia].filter(a => a && a.turma === aula.turma).length;
    // O limite de aulas é para o professor, a turma não tem um limite no cadastro.
    // Mas é uma boa prática verificar para a turma também.
    // if (aulasNoDiaTurma >= limiteAulasTurma) return true;

    return false;
}

// Função de fitness
function calcularFitness(individuo) {
    const { grade, aulasNaoAlocadas } = individuo;
    let fitness = 0;
    
    // Conflitos de horário para professores e turmas
    const conflitosProfessor = {};
    const conflitosTurma = {};

    for (let dia = 0; dia < DIAS_SEMANA.length; dia++) {
        for (let hora = 0; hora < HORARIOS_POR_DIA; hora++) {
            const aula = grade[dia][hora];
            if (aula) {
                // Professor
                if (!conflitosProfessor[aula.professor]) conflitosProfessor[aula.professor] = [];
                conflitosProfessor[aula.professor].push({ dia, hora });
                
                // Turma
                if (!conflitosTurma[aula.turma]) conflitosTurma[aula.turma] = [];
                conflitosTurma[aula.turma].push({ dia, hora });
            }
        }
    }
    
    // Penalização por conflitos
    for (const professor in conflitosProfessor) {
        if (new Set(conflitosProfessor[professor].map(pos => `${pos.dia}-${pos.hora}`)).size !== conflitosProfessor[professor].length) {
            fitness -= 100; // Penalidade alta para conflitos
        }
    }
    for (const turma in conflitosTurma) {
        if (new Set(conflitosTurma[turma].map(pos => `${pos.dia}-${pos.hora}`)).size !== conflitosTurma[turma].length) {
            fitness -= 100; // Penalidade alta para conflitos
        }
    }
    
    // Penalização por aulas não alocadas
    fitness -= aulasNaoAlocadas.length * 50;

    // Bônus para aulas alocadas
    const aulasAlocadas = grade.flat().filter(a => a !== null).length;
    fitness += aulasAlocadas * 10;
    
    individuo.fitness = fitness;
    return individuo;
}

// Crossover (recombinação)
function crossover(parent1, parent2) {
    const child1 = JSON.parse(JSON.stringify(parent1));
    const child2 = JSON.parse(JSON.stringify(parent2));

    const crossoverPoint = Math.floor(Math.random() * (DIAS_SEMANA.length * HORARIOS_POR_DIA));
    let count = 0;
    for (let dia = 0; dia < DIAS_SEMANA.length; dia++) {
        for (let hora = 0; hora < HORARIOS_POR_DIA; hora++) {
            if (count >= crossoverPoint) {
                [child1.grade[dia][hora], child2.grade[dia][hora]] = [child2.grade[dia][hora], child1.grade[dia][hora]];
            }
            count++;
        }
    }
    return [child1, child2];
}

// Mutação
function mutacao(individuo, taxaMutacao, cargasHorarias, mapaProfessores) {
    if (Math.random() < taxaMutacao) {
        const dia1 = Math.floor(Math.random() * DIAS_SEMANA.length);
        const hora1 = Math.floor(Math.random() * HORARIOS_POR_DIA);
        
        // Tenta encontrar um novo slot para mutação
        let dia2, hora2;
        do {
            dia2 = Math.floor(Math.random() * DIAS_SEMANA.length);
            hora2 = Math.floor(Math.random() * HORARIOS_POR_DIA);
        } while (dia1 === dia2 && hora1 === hora2);
        
        // Troca aulas
        const temp = individuo.grade[dia1][hora1];
        individuo.grade[dia1][hora1] = individuo.grade[dia2][hora2];
        individuo.grade[dia2][hora2] = temp;
    }
    return individuo;
}

// Lógica principal do worker
onmessage = function(e) {
    const { turmas, professores, cargasHorarias, parametros } = e.data;
    
    const mapas = prepararMapas(professores, turmas);

    // Criar população inicial
    let populacao = [];
    for (let i = 0; i < parametros.tamanhoPopulacao; i++) {
        populacao.push(criarIndividuo(cargasHorarias, mapas.mapaProfessores));
    }

    let melhorIndividuo = null;

    for (let geracao = 0; geracao < parametros.numGeracoes; geracao++) {
        // Avaliar
        populacao = populacao.map(ind => calcularFitness(ind));
        
        // Seleção (torneio)
        const novaPopulacao = [];
        for (let i = 0; i < parametros.tamanhoPopulacao; i++) {
            const competidor1 = populacao[Math.floor(Math.random() * populacao.length)];
            const competidor2 = populacao[Math.floor(Math.random() * populacao.length)];
            novaPopulacao.push(competidor1.fitness > competidor2.fitness ? competidor1 : competidor2);
        }
        populacao = novaPopulacao;
        
        // Encontra o melhor indivíduo da geração
        const melhorDaGeracao = populacao.reduce((melhor, atual) => (atual.fitness > melhor.fitness ? atual : melhor), populacao[0]);
        if (!melhorIndividuo || melhorDaGeracao.fitness > melhorIndividuo.fitness) {
            melhorIndividuo = melhorDaGeracao;
        }

        // Crossover
        const descendentes = [];
        for (let i = 0; i < populacao.length; i += 2) {
            if (i + 1 < populacao.length) {
                const [child1, child2] = crossover(populacao[i], populacao[i + 1]);
                descendentes.push(child1, child2);
            }
        }
        populacao = descendentes;

        // Mutação
        populacao = populacao.map(ind => mutacao(ind, parametros.taxaMutacao, cargasHorarias, mapas.mapaProfessores));

        // Enviar progresso para o main thread
        const progresso = Math.round((geracao / parametros.numGeracoes) * 100);
        postMessage({ status: 'progresso', progresso });
    }
    
    // Encontrar o melhor indivíduo final
    populacao = populacao.map(ind => calcularFitness(ind));
    const melhorIndividuoFinal = populacao.reduce((melhor, atual) => (atual.fitness > melhor.fitness ? atual : melhor), melhorIndividuo);
    
    postMessage({
        status: 'completo',
        grade: melhorIndividuoFinal.grade,
        aulasSobrantes: melhorIndividuoFinal.aulasNaoAlocadas
    });
};