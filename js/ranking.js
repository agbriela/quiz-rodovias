import { db } from "./firebase-config.js";

import {
    collection,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const rankingDiv =
    document.getElementById("ranking");

onSnapshot(

    collection(db, "participantes"),

    (snapshot) => {

        let participantes = [];

        snapshot.forEach((doc) => {

            participantes.push({

                id: doc.id,

                ...doc.data()

            });

        });

        participantes.sort(

            (a, b) => b.pontos - a.pontos

        );

        renderizarRanking(participantes);

    }

);

function renderizarRanking(lista) {

    rankingDiv.innerHTML = "";

    if (lista.length === 0) {

        rankingDiv.innerHTML =
            "<p>Nenhum participante conectado.</p>";

        return;
    }

    lista.forEach((p, indice) => {

        const item =
            document.createElement("div");

        item.classList.add("ranking-item");

        item.innerHTML = `

            <div>

                <strong>${indice + 1}º</strong>

            </div>

            <div>

                <strong>${p.nome}</strong>

                <br>

                <small>${p.equipe}</small>

            </div>

            <div>

                <strong>${p.pontos}</strong>

                pts

            </div>

        `;

        rankingDiv.appendChild(item);

    });

}
