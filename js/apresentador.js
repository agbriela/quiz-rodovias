import { db } from "./firebase-config.js";

import {
    collection,
    doc,
    getDocs,
    onSnapshot,
    setDoc,
    updateDoc,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

let perguntas = [];
let perguntaAtual = 0;
let statusAtual = "esperando";

const statusElemento =
    document.getElementById("status");

const numeroPerguntaElemento =
    document.getElementById("numeroPergunta");

const quantidadeParticipantesElemento =
    document.getElementById("quantidadeParticipantes");

const textoPerguntaElemento =
    document.getElementById("textoPergunta");

const alternativasElemento =
    document.getElementById("alternativasApresentador");

const mensagemPainel =
    document.getElementById("mensagemPainel");

const botaoIniciar =
    document.getElementById("iniciar");

const botaoProxima =
    document.getElementById("proxima");

const botaoRanking =
    document.getElementById("mostrarRanking");

const botaoReiniciar =
    document.getElementById("reiniciar");

inicializarPainel();

async function inicializarPainel() {
    try {
        await carregarPerguntas();
        await garantirDocumentoControle();

        escutarControle();
        escutarParticipantes();
        configurarEventos();
    } catch (erro) {
        console.error("Erro ao iniciar painel:", erro);

        mostrarMensagem(
            "Não foi possível iniciar o painel.",
            true
        );
    }
}

async function carregarPerguntas() {
    const resposta = await fetch("./perguntas.json");

    if (!resposta.ok) {
        throw new Error(
            "Não foi possível carregar perguntas.json."
        );
    }

    perguntas = await resposta.json();

    if (!Array.isArray(perguntas) || perguntas.length === 0) {
        throw new Error(
            "O arquivo perguntas.json está vazio."
        );
    }
}

async function garantirDocumentoControle() {
    const controleRef =
        doc(db, "controle", "jogo");

    await setDoc(
        controleRef,
        {
            perguntaAtual: 0,
            status: "esperando"
        },
        {
            merge: true
        }
    );
}

function configurarEventos() {
    botaoIniciar.addEventListener(
        "click",
        iniciarQuiz
    );

    botaoProxima.addEventListener(
        "click",
        proximaPergunta
    );

    botaoRanking.addEventListener(
        "click",
        abrirRanking
    );

    botaoReiniciar.addEventListener(
        "click",
        reiniciarQuiz
    );
}

function escutarControle() {
    const controleRef =
        doc(db, "controle", "jogo");

    onSnapshot(
        controleRef,
        snapshot => {
            if (!snapshot.exists()) {
                return;
            }

            const dados = snapshot.data();

            perguntaAtual =
                Number(dados.perguntaAtual ?? 0);

            statusAtual =
                dados.status ?? "esperando";

            atualizarPainel();
        },
        erro => {
            console.error(
                "Erro ao acompanhar controle:",
                erro
            );

            mostrarMensagem(
                "Erro ao acompanhar o jogo.",
                true
            );
        }
    );
}

function escutarParticipantes() {
    const participantesRef =
        collection(db, "participantes");

    onSnapshot(
        participantesRef,
        snapshot => {
            quantidadeParticipantesElemento.textContent =
                snapshot.size;
        },
        erro => {
            console.error(
                "Erro ao carregar participantes:",
                erro
            );
        }
    );
}

function atualizarPainel() {
    statusElemento.textContent =
        formatarStatus(statusAtual);

    if (statusAtual === "esperando") {
        numeroPerguntaElemento.textContent = "-";

        textoPerguntaElemento.textContent =
            "Aguardando o início do jogo";

        alternativasElemento.innerHTML = "";

        botaoIniciar.disabled = false;
        botaoProxima.disabled = true;

        return;
    }

    if (
        statusAtual === "finalizado" ||
        perguntaAtual >= perguntas.length
    ) {
        numeroPerguntaElemento.textContent =
            `${perguntas.length}/${perguntas.length}`;

        textoPerguntaElemento.textContent =
            "🏆 Quiz finalizado!";

        alternativasElemento.innerHTML = "";

        botaoIniciar.disabled = true;
        botaoProxima.disabled = true;

        return;
    }

    const pergunta = perguntas[perguntaAtual];

    numeroPerguntaElemento.textContent =
        `${perguntaAtual + 1}/${perguntas.length}`;

    textoPerguntaElemento.textContent =
        pergunta.pergunta;

    alternativasElemento.innerHTML = "";

    pergunta.alternativas.forEach(
        (alternativa, indice) => {
            const item =
                document.createElement("div");

            item.classList.add(
                "alternativa-apresentador"
            );

            item.textContent =
                `${letraAlternativa(indice)}) ${alternativa}`;

            alternativasElemento.appendChild(item);
        }
    );

    botaoIniciar.disabled = true;
    botaoProxima.disabled = false;

    if (perguntaAtual === perguntas.length - 1) {
        botaoProxima.textContent =
            "Finalizar quiz";
    } else {
        botaoProxima.textContent =
            "Próxima pergunta";
    }
}

async function iniciarQuiz() {
    try {
        await atualizarControle({
            perguntaAtual: 0,
            status: "em_andamento"
        });

        mostrarMensagem(
            "Quiz iniciado."
        );
    } catch (erro) {
        console.error(
            "Erro ao iniciar quiz:",
            erro
        );

        mostrarMensagem(
            "Não foi possível iniciar o quiz.",
            true
        );
    }
}

async function proximaPergunta() {
    try {
        const proximoIndice =
            perguntaAtual + 1;

        if (proximoIndice >= perguntas.length) {
            await atualizarControle({
                perguntaAtual: perguntas.length,
                status: "finalizado"
            });

            mostrarMensagem(
                "Quiz finalizado."
            );

            return;
        }

        await atualizarControle({
            perguntaAtual: proximoIndice,
            status: "em_andamento"
        });

        mostrarMensagem(
            `Pergunta ${proximoIndice + 1} liberada.`
        );
    } catch (erro) {
        console.error(
            "Erro ao avançar pergunta:",
            erro
        );

        mostrarMensagem(
            "Não foi possível avançar.",
            true
        );
    }
}

async function atualizarControle(dados) {
    const controleRef =
        doc(db, "controle", "jogo");

    await updateDoc(
        controleRef,
        dados
    );
}

function abrirRanking() {
    window.open(
        "ranking.html",
        "_blank"
    );
}

async function reiniciarQuiz() {
    const confirmou = window.confirm(
        "Deseja reiniciar o quiz? As respostas e pontuações serão apagadas."
    );

    if (!confirmou) {
        return;
    }

    try {
        botaoReiniciar.disabled = true;

        mostrarMensagem(
            "Reiniciando o quiz..."
        );

        await zerarPontuacoes();
        await apagarRespostas();

        await atualizarControle({
            perguntaAtual: 0,
            status: "esperando"
        });

        mostrarMensagem(
            "Quiz reiniciado com sucesso."
        );
    } catch (erro) {
        console.error(
            "Erro ao reiniciar quiz:",
            erro
        );

        mostrarMensagem(
            "Não foi possível reiniciar o quiz.",
            true
        );
    } finally {
        botaoReiniciar.disabled = false;
    }
}

async function zerarPontuacoes() {
    const snapshot =
        await getDocs(
            collection(db, "participantes")
        );

    const batch =
        writeBatch(db);

    snapshot.forEach(
        participante => {
            batch.update(
                participante.ref,
                {
                    pontos: 0
                }
            );
        }
    );

    await batch.commit();
}

async function apagarRespostas() {
    const snapshot =
        await getDocs(
            collection(db, "respostas")
        );

    if (snapshot.empty) {
        return;
    }

    const batch =
        writeBatch(db);

    snapshot.forEach(
        resposta => {
            batch.delete(resposta.ref);
        }
    );

    await batch.commit();
}

function formatarStatus(status) {
    const nomes = {
        esperando: "Aguardando",
        em_andamento: "Em andamento",
        finalizado: "Finalizado"
    };

    return nomes[status] ?? status;
}

function letraAlternativa(indice) {
    return String.fromCharCode(
        65 + indice
    );
}

function mostrarMensagem(
    texto,
    erro = false
) {
    mensagemPainel.textContent = texto;

    mensagemPainel.classList.toggle(
        "mensagem-erro",
        erro
    );

    window.setTimeout(
        () => {
            if (
                mensagemPainel.textContent === texto
            ) {
                mensagemPainel.textContent = "";
            }
        },
        4000
    );
}
