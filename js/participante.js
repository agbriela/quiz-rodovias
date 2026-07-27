import { db } from "./firebase-config.js?v=20260727-3";

import {
    doc,
    getDoc,
    getDocFromServer,
    increment,
    onSnapshot,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const TEMPO_POR_PERGUNTA = 45;

let perguntas = [];
let perguntaAtual = -1;
let perguntaAnterior = -1;
let rodadaAnterior = null;
let tempo = TEMPO_POR_PERGUNTA;
let intervalo = null;
let respondendo = false;
let carregamentoPergunta = 0;

const salaEsperaElemento = document.getElementById("salaEspera");
const areaQuizElemento = document.getElementById("areaQuiz");
const nomeParticipanteElemento = document.getElementById("nomeParticipante");
const equipeParticipanteElemento = document.getElementById("equipeParticipante");
const perguntaElemento = document.getElementById("pergunta");
const alternativasElemento = document.getElementById("alternativas");
const timerElemento = document.getElementById("timer");
const barraElemento = document.getElementById("barra");
const mensagemElemento = document.getElementById("mensagemParticipante");

inicializarParticipante();

async function inicializarParticipante() {
    try {
        const participanteId = localStorage.getItem("participante");

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
        console.error("Erro ao iniciar participante:", erro);
        mostrarErro("Não foi possível carregar o quiz. Atualize a página.");
    }
}

async function carregarPerguntas() {
    const resposta = await fetch("./perguntas.json", {
        cache: "no-store"
    });

    if (!resposta.ok) {
        throw new Error("Não foi possível carregar perguntas.json.");
    }

    perguntas = await resposta.json();

    if (!Array.isArray(perguntas) || perguntas.length === 0) {
        throw new Error("Nenhuma pergunta foi encontrada.");
    }
}

async function carregarDadosParticipante(participanteId) {
    const participanteRef = doc(db, "participantes", participanteId);
    const participanteSnapshot = await getDoc(participanteRef);

    if (!participanteSnapshot.exists()) {
        localStorage.removeItem("participante");
        window.location.href = "index.html";
        return;
    }

    const participante = participanteSnapshot.data();

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

            processarControle(
                snapshot.data()
            );
        },
        erro => {
            console.error(
                "Erro ao acompanhar jogo:",
                erro
            );

            mostrarErro(
                "Conexão instável. Tentando reconectar..."
            );
        }
    );
}

function processarControle(dados) {
    const status =
        dados.status ?? "esperando";

    const novaPergunta =
        Number(
            dados.perguntaAtual ?? 0
        );

    const novaRodada =
        dados.rodadaId ??
        `${status}_${novaPergunta}`;

    console.log(
        "Controle atualizado:",
        {
            status,
            novaPergunta,
            novaRodada
        }
    );

    if (status === "esperando") {
        perguntaAtual = -1;
        perguntaAnterior = -1;
        rodadaAnterior = null;
        carregamentoPergunta++;

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
        !Number.isInteger(novaPergunta) ||
        novaPergunta < 0 ||
        novaPergunta >= perguntas.length
    ) {
        if (novaPergunta >= perguntas.length) {
            finalizarQuiz();
        } else {
            mostrarErro(
                "O painel enviou uma pergunta inválida."
            );
        }

        return;
    }

    perguntaAtual = novaPergunta;

    mostrarAreaQuiz();

    const mudouPergunta =
        perguntaAtual !== perguntaAnterior;

    const mudouRodada =
        novaRodada !== rodadaAnterior;

    if (mudouPergunta || mudouRodada) {
        perguntaAnterior =
            perguntaAtual;

        rodadaAnterior =
            novaRodada;

        carregarPergunta(
            perguntaAtual,
            novaRodada
        );
    }
}

async function sincronizarControleComServidor() {
    if (!navigator.onLine) {
        mostrarErro(
            "Sem conexão com a internet. Tentando reconectar..."
        );
        return;
    }

    try {
        const controleRef =
            doc(db, "controle", "jogo");

        const snapshot =
            await getDocFromServer(
                controleRef
            );

        if (!snapshot.exists()) {
            return;
        }

        processarControle(
            snapshot.data()
        );
    } catch (erro) {
        console.warn(
            "Não foi possível sincronizar com o servidor:",
            erro
        );

        mostrarErro(
            "Conexão instável. Tentando recuperar o jogo..."
        );
    }
}

document.addEventListener(
    "visibilitychange",
    () => {
        if (!document.hidden) {
            sincronizarControleComServidor();
        }
    }
);

window.addEventListener(
    "online",
    sincronizarControleComServidor
);

window.addEventListener(
    "focus",
    sincronizarControleComServidor
);

function mostrarSalaDeEspera() {
    clearInterval(intervalo);
    respondendo = false;

    salaEsperaElemento.classList.remove("oculto");
    areaQuizElemento.classList.add("oculto");
}

function mostrarAreaQuiz() {
    salaEsperaElemento.classList.add("oculto");
    areaQuizElemento.classList.remove("oculto");
}

async function carregarPergunta(indicePergunta, rodadaId) {
    clearInterval(intervalo);

    const idCarregamento = ++carregamentoPergunta;

    respondendo = false;
    tempo = TEMPO_POR_PERGUNTA;

    mensagemElemento.textContent = "";
    mensagemElemento.classList.remove("mensagem-erro");

    timerElemento.style.display = "flex";
    timerElemento.textContent = tempo;

    const pergunta = perguntas[indicePergunta];

    if (!pergunta) {
        mostrarErro("Não foi possível localizar esta pergunta.");
        return;
    }

    perguntaElemento.textContent = pergunta.pergunta;
    alternativasElemento.innerHTML = "";

    atualizarBarraDeProgresso(indicePergunta);

    let jaRespondeu = false;

    try {
        jaRespondeu = await verificarRespostaExistente(indicePergunta);
    } catch (erro) {
        console.error("Erro ao verificar resposta existente:", erro);
        mostrarErro(
            "Falha temporária ao verificar sua resposta. Tente novamente."
        );
    }

    if (
        idCarregamento !== carregamentoPergunta ||
        indicePergunta !== perguntaAtual ||
        rodadaId !== rodadaAnterior
    ) {
        return;
    }

    pergunta.alternativas.forEach((texto, indice) => {
        const botao = document.createElement("button");

        botao.type = "button";
        botao.classList.add("alternativa");
        botao.textContent = `${letraAlternativa(indice)}) ${texto}`;
        botao.disabled = jaRespondeu;

        botao.addEventListener(
            "click",
            () => responder(indice, indicePergunta, rodadaId)
        );

        alternativasElemento.appendChild(botao);
    });

    if (jaRespondeu) {
        mostrarAguardandoProximaPergunta();
        return;
    }

    iniciarCronometro(indicePergunta, rodadaId);
}

function iniciarCronometro(indicePergunta, rodadaId) {
    clearInterval(intervalo);

    intervalo = window.setInterval(() => {
        if (
            indicePergunta !== perguntaAtual ||
            rodadaId !== rodadaAnterior
        ) {
            clearInterval(intervalo);
            return;
        }

        tempo--;
        timerElemento.textContent = tempo;

        if (tempo <= 0) {
            clearInterval(intervalo);
            registrarTempoEsgotado(indicePergunta, rodadaId);
        }
    }, 1000);
}

async function registrarTempoEsgotado(indicePergunta, rodadaId) {
    if (
        respondendo ||
        indicePergunta !== perguntaAtual ||
        rodadaId !== rodadaAnterior
    ) {
        return;
    }

    respondendo = true;
    desabilitarAlternativas();

    const participanteId = localStorage.getItem("participante");

    if (!participanteId) {
        window.location.href = "index.html";
        return;
    }

    const respostaRef = criarReferenciaResposta(
        participanteId,
        indicePergunta
    );

    try {
        const respostaExistente = await getDoc(respostaRef);

        if (!respostaExistente.exists()) {
            await setDoc(respostaRef, {
                participanteId,
                pergunta: indicePergunta,
                rodadaId,
                resposta: null,
                correta: false,
                pontos: 0,
                tempoRestante: 0,
                respondidaEm: new Date().toISOString()
            });
        }
    } catch (erro) {
        console.error("Erro ao registrar tempo:", erro);
    }

    if (
        indicePergunta !== perguntaAtual ||
        rodadaId !== rodadaAnterior
    ) {
        return;
    }

    perguntaElemento.textContent = "⏰ Tempo esgotado!";
    mostrarAguardandoProximaPergunta();
}

async function responder(indice, indicePergunta, rodadaId) {
    if (
        respondendo ||
        indicePergunta !== perguntaAtual ||
        rodadaId !== rodadaAnterior
    ) {
        return;
    }

    respondendo = true;

    clearInterval(intervalo);
    desabilitarAlternativas();

    const participanteId = localStorage.getItem("participante");

    if (!participanteId) {
        window.location.href = "index.html";
        return;
    }

    const respostaRef = criarReferenciaResposta(
        participanteId,
        indicePergunta
    );

    try {
        const respostaExistente = await getDoc(respostaRef);

        if (respostaExistente.exists()) {
            mostrarAguardandoProximaPergunta();
            return;
        }

        const pergunta = perguntas[indicePergunta];
        const acertou = indice === pergunta.correta;
        const pontos = acertou ? 100 + tempo * 5 : 0;

        await setDoc(respostaRef, {
            participanteId,
            pergunta: indicePergunta,
            rodadaId,
            resposta: indice,
            correta: acertou,
            pontos,
            tempoRestante: tempo,
            respondidaEm: new Date().toISOString()
        });

        if (acertou) {
            await updateDoc(
                doc(db, "participantes", participanteId),
                {
                    pontos: increment(pontos)
                }
            );
        }

        if (
            indicePergunta !== perguntaAtual ||
            rodadaId !== rodadaAnterior
        ) {
            return;
        }

        if (acertou) {
            perguntaElemento.textContent = "✅ Resposta correta!";
            mensagemElemento.textContent =
                `Você ganhou ${pontos} pontos.`;
        } else {
            perguntaElemento.textContent = "❌ Resposta incorreta!";
            mensagemElemento.textContent = "Não foi dessa vez.";
        }

        destacarAlternativa(indice, acertou);

        window.setTimeout(() => {
            if (
                indicePergunta === perguntaAtual &&
                rodadaId === rodadaAnterior
            ) {
                mostrarAguardandoProximaPergunta();
            }
        }, 1500);
    } catch (erro) {
        console.error("Erro ao salvar resposta:", erro);

        respondendo = false;
        habilitarAlternativas();

        mostrarErro(
            "Não foi possível salvar sua resposta. Tente novamente."
        );
    }
}

function criarReferenciaResposta(participanteId, indicePergunta) {
    const respostaId =
        `${participanteId}_pergunta_${indicePergunta}`;

    return doc(db, "respostas", respostaId);
}

async function verificarRespostaExistente(indicePergunta) {
    const participanteId = localStorage.getItem("participante");

    if (!participanteId) {
        return false;
    }

    const respostaRef = criarReferenciaResposta(
        participanteId,
        indicePergunta
    );

    const resposta = await getDoc(respostaRef);

    return resposta.exists();
}

function mostrarAguardandoProximaPergunta() {
    clearInterval(intervalo);

    timerElemento.textContent = "✓";
    desabilitarAlternativas();

    mensagemElemento.classList.remove("mensagem-erro");
    mensagemElemento.textContent =
        "Aguardando o apresentador liberar a próxima pergunta...";
}

function finalizarQuiz() {
    clearInterval(intervalo);

    carregamentoPergunta++;
    respondendo = true;

    mostrarAreaQuiz();

    perguntaElemento.textContent = "🏆 Quiz finalizado!";
    alternativasElemento.innerHTML = "";
    timerElemento.style.display = "none";

    mensagemElemento.classList.remove("mensagem-erro");
    mensagemElemento.textContent =
        "Confira sua posição no ranking.";
}

function desabilitarAlternativas() {
    const botoes =
        alternativasElemento.querySelectorAll(".alternativa");

    botoes.forEach(botao => {
        botao.disabled = true;
    });
}

function habilitarAlternativas() {
    const botoes =
        alternativasElemento.querySelectorAll(".alternativa");

    botoes.forEach(botao => {
        botao.disabled = false;
    });
}

function destacarAlternativa(indiceSelecionado, acertou) {
    const botoes =
        alternativasElemento.querySelectorAll(".alternativa");

    const botaoSelecionado = botoes[indiceSelecionado];

    if (!botaoSelecionado) {
        return;
    }

    botaoSelecionado.classList.add(
        acertou
            ? "alternativa-correta"
            : "alternativa-incorreta"
    );
}

function atualizarBarraDeProgresso(indicePergunta) {
    if (!barraElemento) {
        return;
    }

    const porcentagem =
        ((indicePergunta + 1) / perguntas.length) * 100;

    barraElemento.style.width = `${porcentagem}%`;
}

function letraAlternativa(indice) {
    return String.fromCharCode(65 + indice);
}

function mostrarErro(texto) {
    mensagemElemento.textContent = texto;
    mensagemElemento.classList.add("mensagem-erro");
}
