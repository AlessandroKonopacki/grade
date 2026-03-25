// ===============================
// 📅 CONSTANTES
// ===============================
const DIAS_SEMANA = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const HORARIOS_POR_DIA = 6;

// ===============================
// 🔀 SHUFFLE
// ===============================
function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] =
            [array[randomIndex], array[currentIndex]];
    }

    return array;
}

// ===============================
// 📚 EXPANDIR AULAS
// ===============================
function expandirAulas(cargas) {
    const lista = [];

    cargas.forEach(c => {
        for (let i = 0; i < c.aulas; i++) {
            lista.push({ ...c });
        }
    });

    return lista;
}

// ===============================
// 👨‍🏫 MAPA PROFESSORES
// ===============================
function prepararMapas(professores) {
    const mapa = {};

    professores.forEach(p => {
        mapa[p.nome] = {
            ...p,
            disponibilidadeSet: new Set(
                p.disponibilidade.map(d => DIAS_SEMANA.indexOf(d))
            )
        };
    });

    return mapa;
}

// ===============================
// 🏫 CRIAR GRADE BASE
// ===============================
function criarGradeBase(cargas) {
    const grade = {};

    cargas.forEach(c => {
        if (!grade[c.turma]) {
            grade[c.turma] = Array.from({ length: DIAS_SEMANA.length }, () =>
                Array.from({ length: HORARIOS_POR_DIA }, () => null)
            );
        }
    });

    return grade;
}

// ===============================
// 🚫 CONFLITOS
// ===============================
function conflitoProfessor(grade, dia, hora, professor) {
    for (const turma in grade) {
        const aula = grade[turma][dia][hora];
        if (aula && aula.professor === professor) return true;
    }
    return false;
}

function conflitoLocal(grade, turma, dia, aula) {
    const aulasNoDia = grade[turma][dia]
        .filter(a => a && a.professor === aula.professor).length;

    return aulasNoDia >= aula.limite;
}

// ===============================
// 🧬 CRIAR INDIVÍDUO
// ===============================
function criarIndividuo(cargas, mapaProfessores) {
    const grade = criarGradeBase(cargas);
    const aulasNaoAlocadas = [];

    const aulasDisponiveis = shuffle(expandirAulas(cargas));

    for (const aula of aulasDisponiveis) {

        const professor = mapaProfessores[aula.professor];
        if (!professor) {
            aulasNaoAlocadas.push(aula);
            continue;
        }

        let alocada = false;
        const dias = shuffle([...professor.disponibilidadeSet]);

        for (const dia of dias) {
            const horarios = shuffle([...Array(HORARIOS_POR_DIA).keys()]);

            for (const hora of horarios) {

                if (grade[aula.turma][dia][hora] !== null) continue;
                if (conflitoProfessor(grade, dia, hora, aula.professor)) continue;
                if (conflitoLocal(grade, aula.turma, dia, aula)) continue;

                grade[aula.turma][dia][hora] = aula;
                alocada = true;
                break;
            }

            if (alocada) break;
        }

        if (!alocada) aulasNaoAlocadas.push(aula);
    }

    return { grade, aulasNaoAlocadas, fitness: 0 };
}

// ===============================
// 🧠 FITNESS
// ===============================
function calcularFitness(ind) {
    let fitness = 0;

    // penalidade pesada
    fitness -= ind.aulasNaoAlocadas.length * 100;

    for (const turma in ind.grade) {
        for (let d = 0; d < DIAS_SEMANA.length; d++) {

            const linha = ind.grade[turma][d];

            let aulasDia = 0;
            let janelas = 0;
            let teveAula = false;

            for (let h = 0; h < HORARIOS_POR_DIA; h++) {
                if (linha[h]) {
                    aulasDia++;
                    teveAula = true;
                } else if (teveAula) {
                    janelas++;
                }
            }

            fitness += aulasDia * 10;
            fitness -= janelas * 15;

            if (aulasDia < 5) {
                fitness -= (5 - aulasDia) * 25;
            }
        }
    }

    ind.fitness = fitness;
    return ind;
}

// ===============================
// 🔁 CROSSOVER
// ===============================
function crossover(p1, p2) {
    const c1 = JSON.parse(JSON.stringify(p1));
    const c2 = JSON.parse(JSON.stringify(p2));

    for (const turma in c1.grade) {
        for (let d = 0; d < DIAS_SEMANA.length; d++) {
            for (let h = 0; h < HORARIOS_POR_DIA; h++) {
                if (Math.random() < 0.5) {
                    [c1.grade[turma][d][h], c2.grade[turma][d][h]] =
                        [c2.grade[turma][d][h], c1.grade[turma][d][h]];
                }
            }
        }
    }

    return [c1, c2];
}

// ===============================
// 🔄 MUTAÇÃO INTELIGENTE
// ===============================
function mutacao(ind, taxa, mapaProfessores) {

    if (Math.random() > taxa) return ind;

    const turmas = Object.keys(ind.grade);
    const turma = turmas[Math.floor(Math.random() * turmas.length)];

    for (let tentativa = 0; tentativa < 10; tentativa++) {

        const d1 = Math.floor(Math.random() * DIAS_SEMANA.length);
        const h1 = Math.floor(Math.random() * HORARIOS_POR_DIA);

        const aula = ind.grade[turma][d1][h1];
        if (!aula) continue;

        const professor = mapaProfessores[aula.professor];
        const dias = shuffle([...professor.disponibilidadeSet]);

        for (const d2 of dias) {

            const h2 = Math.floor(Math.random() * HORARIOS_POR_DIA);

            if (ind.grade[turma][d2][h2] !== null) continue;
            if (conflitoProfessor(ind.grade, d2, h2, aula.professor)) continue;
            if (conflitoLocal(ind.grade, turma, d2, aula)) continue;

            ind.grade[turma][d1][h1] = null;
            ind.grade[turma][d2][h2] = aula;

            return ind;
        }
    }

    return ind;
}

// ===============================
// ♻️ REALOCAR SOBRAS
// ===============================
function tentarRealocarSobras(ind, mapaProfessores) {

    const novas = [];

    for (const aula of ind.aulasNaoAlocadas) {

        const professor = mapaProfessores[aula.professor];
        let alocada = false;

        for (const dia of professor.disponibilidadeSet) {
            for (let hora = 0; hora < HORARIOS_POR_DIA; hora++) {

                if (ind.grade[aula.turma][dia][hora] !== null) continue;
                if (conflitoProfessor(ind.grade, dia, hora, aula.professor)) continue;
                if (conflitoLocal(ind.grade, aula.turma, dia, aula)) continue;

                ind.grade[aula.turma][dia][hora] = aula;
                alocada = true;
                break;
            }
            if (alocada) break;
        }

        if (!alocada) novas.push(aula);
    }

    ind.aulasNaoAlocadas = novas;
    return ind;
}

// ===============================
// 🧬 WORKER
// ===============================
onmessage = function (e) {

    const { professores, cargasHorarias, parametros } = e.data;

    const mapaProf = prepararMapas(professores);

    let populacao = [];

    // população inicial
    for (let i = 0; i < parametros.tamanhoPopulacao; i++) {
        populacao.push(criarIndividuo(cargasHorarias, mapaProf));
    }

    let melhor = null;

    for (let g = 0; g < parametros.numGeracoes; g++) {

        populacao = populacao.map(calcularFitness);
        populacao.sort((a, b) => b.fitness - a.fitness);

        // 🏆 elitismo (mantém os melhores)
        const elite = populacao.slice(0, 2);

        if (!melhor || elite[0].fitness > melhor.fitness) {
            melhor = elite[0];
        }

        const nova = [...elite];

        // reprodução
        while (nova.length < parametros.tamanhoPopulacao) {

            const p1 = populacao[Math.floor(Math.random() * 10)];
            const p2 = populacao[Math.floor(Math.random() * 10)];

            const [c1, c2] = crossover(p1, p2);

            nova.push(c1, c2);
        }

        populacao = nova
            .slice(0, parametros.tamanhoPopulacao)
            .map(ind => {
                ind = mutacao(ind, parametros.taxaMutacao, mapaProf);
                ind = tentarRealocarSobras(ind, mapaProf);
                return ind;
            });

        postMessage({
            status: "progresso",
            progresso: Math.round((g / parametros.numGeracoes) * 100)
        });
    }

    populacao = populacao.map(calcularFitness);

    const melhorFinal = populacao.reduce((a, b) =>
        a.fitness > b.fitness ? a : b
    );

    postMessage({
        status: "completo",
        grade: melhorFinal.grade,
        aulasSobrantes: melhorFinal.aulasNaoAlocadas
    });
};