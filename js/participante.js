import { db } from "./firebase-config.js";

import {
    doc,
    getDoc,
    increment,
    onSnapshot,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const TEMPO_POR_PERGUNTA = 45;

let perguntas = [];
let perguntaAtual = -1;
let perguntaAnterior = -1;
let tempo = TEMPO_POR_PERGUNTA;
let intervalo = null;
let respondendo = false;

const salaEsperaElemento =
    document.getElementById("salaEspera");

const areaQuizElemento =
    document.getElementById("areaQuiz");

const nomeParticipanteElemento =
    document.getElementById("nomeParticipante");

const equipeParticipanteElemento =
    document.getElementById("equipeParticipante");

const perguntaElemento =
    document.getElementById("pergunta");

const alternativasElemento =
    document.getElementById("alternativas");

const timerElemento =
    document.getElementById("timer");

const barraElemento =
    document.getElementById("barra");

const mensagemElemento =
    document.getElementById("mensagemParticipante");

inicializarParticipante();

async function inicializarParticipante() {
    try {
        const participanteId =
            localStorage.getItem("participante");

        if (!participanteId) {
            window.location.href = "index.html";
            return;
        }

        mostrarSalaDeEspera();

        await Promise.all([
            carregarPerguntas(),
            carregarDadosParticipante(participanteId)
        ]);

        escutarControleDoJogo();
    } catch (erro) {
        console.error(
            "Erro ao iniciar participante:",
            erro
        );

        mostrarErro(
            "Não foi possível carregar o quiz."
        );
    }
}

async function carregarPerguntas() {
    const resposta =
        await fetch("./perguntas.json");

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível carregar perguntas.json."
        );
    }

    perguntas = await resposta.json();

    if (
        !Array.isArray(perguntas) ||
        perguntas.length === 0
    ) {
        throw new Error(
            "Nenhuma pergunta foi encontrada."
        );
    }
}

async function carregarDadosParticipante(
    participanteId
) {
    const participanteRef =
        doc(
            db,
            "participantes",
            participanteId
        );

    const participanteSnapshot =
        await getDoc(participanteRef);

    if (!participanteSnapshot.exists()) {
        localStorage.removeItem(
            "participante"
        );

        window.location.href =
            "index.html";

        return;
    }

    const participante =
        participanteSnapshot.data();

    nomeParticipanteElemento.textContent =
        participante.nome ?? "Participante";

    equipeParticipanteElemento.textContent =
        participante.equipe
            ? `Equipe: ${participante.equipe}`
            : "";
}

function escutarControleDoJogo() {
    const controleRef =
        doc(db, "controle", "jogo");

    onSnapshot(
        controleRef,

        snapshot => {
            if (!snapshot.exists()) {
                mostrarSalaDeEspera();
                return;
            }

            const dados =
                snapshot.data();

            const status =
                dados.status ?? "esperando";

            const novaPergunta =
                Number(
                    dados.perguntaAtual ?? 0
                );

            if (status === "esperando") {
                perguntaAtual = -1;
                perguntaAnterior = -1;

                mostrarSalaDeEspera();
                return;
            }

            if (status === "finalizado") {
                finalizarQuiz();
                return;
            }

            if (status !== "em_andamento") {
                mostrarSalaDeEspera();
                return;
            }

            if (
                novaPergunta >= perguntas.length
            ) {
                finalizarQuiz();
                return;
            }

            perguntaAtual = novaPergunta;

            mostrarAreaQuiz();

            if (
                perguntaAtual !==
                perguntaAnterior
            ) {
                perguntaAnterior =
                    perguntaAtual;

                carregarPergunta();
            }
        },

        erro => {
            console.error(
                "Erro ao acompanhar jogo:",
                erro
            );

            mostrarErro(
                "Não foi possível acompanhar o jogo."
            );
        }
    );
}

function mostrarSalaDeEspera() {
    clearInterval(intervalo);

    respondendo = false;

    salaEsperaElemento.classList.remove(
        "oculto"
    );

    areaQuizElemento.classList.add(
        "oculto"
    );
}

function mostrarAreaQuiz() {
    salaEsperaElemento.classList.add(
        "oculto"
    );

    areaQuizElemento.classList.remove(
        "oculto"
    );
}

async function carregarPergunta() {
    clearInterval(intervalo);

    respondendo = false;
    tempo = TEMPO_POR_PERGUNTA;

    mensagemElemento.textContent = "";
    mensagemElemento.classList.remove(
        "mensagem-erro"
    );

    timerElemento.style.display = "flex";
    timerElemento.textContent = tempo;

    const pergunta =
        perguntas[perguntaAtual];

    perguntaElemento.textContent =
        pergunta.pergunta;

    alternativasElemento.innerHTML = "";

    atualizarBarraDeProgresso();

    const jaRespondeu =
        await verificarRespostaExistente();

    pergunta.alternativas.forEach(
        (texto, indice) => {
            const botao =
                document.createElement("button");

            botao.type = "button";

            botao.classList.add(
                "alternativa"
            );

            botao.textContent =
                `${letraAlternativa(indice)}) ${texto}`;

            botao.disabled =
                jaRespondeu;

            botao.addEventListener(
                "click",
                () => responder(indice)
            );

            alternativasElemento.appendChild(
                botao
            );
        }
    );

    if (jaRespondeu) {
        mostrarAguardandoProximaPergunta();
        return;
    }

    iniciarCronometro();
}

function iniciarCronometro() {
    clearInterval(intervalo);

    intervalo = window.setInterval(
        () => {
            tempo--;

            timerElemento.textContent =
                tempo;

            if (tempo <= 0) {
                clearInterval(intervalo);

                registrarTempoEsgotado();
            }
        },
        1000
    );
}

async function registrarTempoEsgotado() {
    if (respondendo) {
        return;
    }

    respondendo = true;

    desabilitarAlternativas();

    const participanteId =
        localStorage.getItem(
            "participante"
        );

    const respostaRef =
        criarReferenciaResposta(
            participanteId
        );

    try {
        const respostaExistente =
            await getDoc(respostaRef);

        if (!respostaExistente.exists()) {
            await setDoc(
                respostaRef,
                {
                    participanteId,
                    pergunta:
                        perguntaAtual,
                    resposta: null,
                    correta: false,
                    pontos: 0,
                    tempoRestante: 0,
                    respondidaEm:
                        new Date().toISOString()
                }
            );
        }
    } catch (erro) {
        console.error(
            "Erro ao registrar tempo:",
            erro
        );
    }

    perguntaElemento.textContent =
        "⏰ Tempo esgotado!";

    mostrarAguardandoProximaPergunta();
}

async function responder(indice) {
    if (respondendo) {
        return;
    }

    respondendo = true;

    clearInterval(intervalo);
    desabilitarAlternativas();

    const participanteId =
        localStorage.getItem(
            "participante"
        );

    if (!participanteId) {
        window.location.href =
            "index.html";

        return;
    }

    const respostaRef =
        criarReferenciaResposta(
            participanteId
        );

    try {
        const respostaExistente =
            await getDoc(respostaRef);

        if (respostaExistente.exists()) {
            mostrarAguardandoProximaPergunta();
            return;
        }

        const pergunta =
            perguntas[perguntaAtual];

        const acertou =
            indice === pergunta.correta;

        const pontos =
            acertou
                ? 100 + tempo * 5
                : 0;

        await setDoc(
            respostaRef,
            {
                participanteId,
                pergunta:
                    perguntaAtual,
                resposta: indice,
                correta: acertou,
                pontos,
                tempoRestante: tempo,
                respondidaEm:
                    new Date().toISOString()
            }
        );

        if (acertou) {
            await updateDoc(
                doc(
                    db,
                    "participantes",
                    participanteId
                ),
                {
                    pontos:
                        increment(pontos)
                }
            );

            perguntaElemento.textContent =
                "✅ Resposta correta!";

            mensagemElemento.textContent =
                `Você ganhou ${pontos} pontos.`;
        } else {
            perguntaElemento.textContent =
                "❌ Resposta incorreta!";

            mensagemElemento.textContent =
                "Não foi dessa vez.";
        }

        destacarAlternativa(
            indice,
            acertou
        );

        window.setTimeout(
            mostrarAguardandoProximaPergunta,
            1500
        );
    } catch (erro) {
        console.error(
            "Erro ao salvar resposta:",
            erro
        );

        respondendo = false;

        mostrarErro(
            "Não foi possível salvar sua resposta."
        );
    }
}

function criarReferenciaResposta(
    participanteId
) {
    const respostaId =
        `${participanteId}_pergunta_${perguntaAtual}`;

    return doc(
        db,
        "respostas",
        respostaId
    );
}

async function verificarRespostaExistente() {
    const participanteId =
        localStorage.getItem(
            "participante"
        );

    if (!participanteId) {
        return false;
    }

    const respostaRef =
        criarReferenciaResposta(
            participanteId
        );

    const resposta =
        await getDoc(respostaRef);

    return resposta.exists();
}

function mostrarAguardandoProximaPergunta() {
    clearInterval(intervalo);

    timerElemento.textContent = "✓";

    desabilitarAlternativas();

    mensagemElemento.textContent =
        "Aguardando o apresentador liberar a próxima pergunta...";
}

function finalizarQuiz() {
    clearInterval(intervalo);

    mostrarAreaQuiz();

    perguntaElemento.textContent =
        "🏆 Quiz finalizado!";

    alternativasElemento.innerHTML = "";

    timerElemento.style.display =
        "none";

    mensagemElemento.textContent =
        "Confira sua posição no ranking.";
}

function desabilitarAlternativas() {
    const botoes =
        document.querySelectorAll(
            ".alternativa"
        );

    botoes.forEach(
        botao => {
            botao.disabled = true;
        }
    );
}

function destacarAlternativa(
    indiceSelecionado,
    acertou
) {
    const botoes =
        document.querySelectorAll(
            ".alternativa"
        );

    const botaoSelecionado =
        botoes[indiceSelecionado];

    if (!botaoSelecionado) {
        return;
    }

    botaoSelecionado.classList.add(
        acertou
            ? "alternativa-correta"
            : "alternativa-incorreta"
    );
}

function atualizarBarraDeProgresso() {
    if (!barraElemento) {
        return;
    }

    const porcentagem =
        ((perguntaAtual + 1) /
            perguntas.length) *
        100;

    barraElemento.style.width =
        `${porcentagem}%`;
}

function letraAlternativa(indice) {
    return String.fromCharCode(
        65 + indice
    );
}

function mostrarErro(texto) {
    mensagemElemento.textContent =
        texto;

    mensagemElemento.classList.add(
        "mensagem-erro"
    );
}
