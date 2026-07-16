import { db } from "./firebase-config.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

/* =========================
   EQUIPES FIXAS
========================= */

const NOMES_EQUIPES = [
    "Segurança Viária",
    "Pista Dupla",
    "Faixa Expressa"
];

/* =========================
   ESTADO
========================= */

let participantes = [];
let visualizacaoAtual = "equipes";

/* =========================
   ELEMENTOS
========================= */

const rankingElemento =
    document.getElementById("ranking");

const quantidadeEquipesElemento =
    document.getElementById("quantidadeEquipes");

const quantidadeParticipantesElemento =
    document.getElementById("quantidadeParticipantes");

const mensagemRankingElemento =
    document.getElementById("mensagemRanking");

const botaoEquipes =
    document.getElementById("botaoEquipes");

const botaoPessoas =
    document.getElementById("botaoPessoas");

const rankingDescricao =
    document.getElementById("rankingDescricao");

/* =========================
   EVENTOS
========================= */

botaoEquipes.addEventListener(
    "click",
    () => {
        visualizacaoAtual = "equipes";
        atualizarVisualizacao();
    }
);

botaoPessoas.addEventListener(
    "click",
    () => {
        visualizacaoAtual = "pessoas";
        atualizarVisualizacao();
    }
);

/* =========================
   FIRESTORE EM TEMPO REAL
========================= */

onSnapshot(
    collection(db, "participantes"),

    snapshot => {
        participantes = [];

        snapshot.forEach(documento => {
            participantes.push({
                id: documento.id,
                ...documento.data()
            });
        });

        atualizarResumo();
        atualizarVisualizacao();
    },

    erro => {
        console.error(
            "Erro ao carregar ranking:",
            erro
        );

        rankingElemento.innerHTML = "";

        mensagemRankingElemento.textContent =
            "Não foi possível carregar o ranking.";

        mensagemRankingElemento.classList.add(
            "mensagem-erro"
        );
    }
);

/* =========================
   RESUMO FIXO
========================= */

function atualizarResumo() {
    quantidadeEquipesElemento.textContent =
        NOMES_EQUIPES.length;

    quantidadeParticipantesElemento.textContent =
        participantes.length;
}

/* =========================
   TROCA DE VISUALIZAÇÃO
========================= */

function atualizarVisualizacao() {
    limparMensagem();

    if (visualizacaoAtual === "equipes") {
        renderizarRankingEquipes();
    } else {
        renderizarRankingIndividual();
    }

    atualizarAbas();
}

/* =========================
   RANKING POR EQUIPES
========================= */

function renderizarRankingEquipes() {
    const equipes =
        calcularPontuacaoDasEquipes();

    rankingDescricao.textContent =
        "A pontuação representa a soma dos pontos de todos os integrantes.";

    rankingElemento.className =
        "ranking-equipes";

    rankingElemento.innerHTML = "";

    equipes.forEach(
        (equipe, indice) => {
            const posicao =
                indice + 1;

            const item =
                document.createElement("article");

            item.classList.add(
                "ranking-equipe-item",
                `ranking-posicao-${posicao}`
            );

            item.innerHTML = `
                <div class="ranking-posicao">
                    ${obterPosicao(posicao)}
                </div>

                <div class="ranking-equipe-dados">
                    <strong>
                        ${escaparHTML(equipe.nome)}
                    </strong>
                </div>

                <div class="ranking-equipe-pontos">
                    <strong>
                        ${formatarNumero(equipe.pontos)}
                    </strong>

                    <span>pontos</span>
                </div>
            `;

            rankingElemento.appendChild(item);
        }
    );
}

function calcularPontuacaoDasEquipes() {
    const equipes =
        NOMES_EQUIPES.map(
            nome => ({
                nome,
                pontos: 0
            })
        );

    participantes.forEach(
        participante => {
            const equipeEncontrada =
                equipes.find(
                    equipe =>
                        equipe.nome ===
                        participante.equipe
                );

            if (!equipeEncontrada) {
                return;
            }

            equipeEncontrada.pontos +=
                obterPontosParticipante(
                    participante
                );
        }
    );

    return equipes.sort(
        (equipeA, equipeB) => {
            if (
                equipeB.pontos !==
                equipeA.pontos
            ) {
                return (
                    equipeB.pontos -
                    equipeA.pontos
                );
            }

            return (
                NOMES_EQUIPES.indexOf(
                    equipeA.nome
                ) -
                NOMES_EQUIPES.indexOf(
                    equipeB.nome
                )
            );
        }
    );
}

/* =========================
   RANKING INDIVIDUAL
========================= */

function renderizarRankingIndividual() {
    const pessoas =
        [...participantes].sort(
            (pessoaA, pessoaB) => {
                const pontosA =
                    obterPontosParticipante(
                        pessoaA
                    );

                const pontosB =
                    obterPontosParticipante(
                        pessoaB
                    );

                if (pontosB !== pontosA) {
                    return pontosB - pontosA;
                }

                return String(
                    pessoaA.nome ?? ""
                ).localeCompare(
                    String(
                        pessoaB.nome ?? ""
                    ),
                    "pt-BR"
                );
            }
        );

    rankingDescricao.textContent =
        "A classificação considera a pontuação individual de cada participante.";

    rankingElemento.className =
        "ranking-pessoas";

    rankingElemento.innerHTML = "";

    if (pessoas.length === 0) {
        rankingElemento.innerHTML = `
            <div class="ranking-vazio">
                <span>🚧</span>

                <p>
                    Nenhum participante conectado.
                </p>
            </div>
        `;

        return;
    }

    pessoas.forEach(
        (pessoa, indice) => {
            const posicao =
                indice + 1;

            const pontos =
                obterPontosParticipante(
                    pessoa
                );

            const item =
                document.createElement("article");

            item.classList.add(
                "ranking-pessoa-item"
            );

            if (posicao <= 3) {
                item.classList.add(
                    `ranking-posicao-${posicao}`
                );
            }

            item.innerHTML = `
                <div class="ranking-posicao">
                    ${obterPosicao(posicao)}
                </div>

                <div class="ranking-pessoa-dados">
                    <strong>
                        ${escaparHTML(
                            pessoa.nome ??
                            "Participante"
                        )}
                    </strong>

                    <span>
                        ${escaparHTML(
                            pessoa.equipe ??
                            "Sem equipe"
                        )}
                    </span>
                </div>

                <div class="ranking-pessoa-pontos">
                    <strong>
                        ${formatarNumero(pontos)}
                    </strong>

                    <span>pontos</span>
                </div>
            `;

            rankingElemento.appendChild(item);
        }
    );
}

/* =========================
   LEITURA DOS PONTOS
========================= */

function obterPontosParticipante(
    participante
) {
    /*
     * O campo criado pelo participante.js
     * é chamado "pontos".
     */
    const pontos =
        Number(
            participante.pontos ?? 0
        );

    return Number.isFinite(pontos)
        ? pontos
        : 0;
}

/* =========================
   ABAS
========================= */

function atualizarAbas() {
    const equipesAtiva =
        visualizacaoAtual === "equipes";

    botaoEquipes.classList.toggle(
        "ativa",
        equipesAtiva
    );

    botaoPessoas.classList.toggle(
        "ativa",
        !equipesAtiva
    );
}

/* =========================
   AUXILIARES
========================= */

function obterPosicao(posicao) {
    const medalhas = {
        1: "🥇",
        2: "🥈",
        3: "🥉"
    };

    return (
        medalhas[posicao] ??
        `${posicao}º`
    );
}

function formatarNumero(valor) {
    return new Intl.NumberFormat(
        "pt-BR",
        {
            maximumFractionDigits: 0
        }
    ).format(valor);
}

function escaparHTML(texto) {
    const elemento =
        document.createElement("div");

    elemento.textContent =
        String(texto);

    return elemento.innerHTML;
}

function limparMensagem() {
    mensagemRankingElemento.textContent = "";

    mensagemRankingElemento.classList.remove(
        "mensagem-erro"
    );
}
