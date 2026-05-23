let fatias = 20;
let camadas = 6;

let raioMax;

let operacao = "AND";

let entradaAtiva = "P";

let pontos = {};

let ordemCliques = [];

let historicoResultados = [];

let camadaObrigatoria = -1;

let negarGeral = false;

let modoNegacaoManual = false;

let previewMouseX = 0;

let previewMouseY = 0;

let cliqueParaAprenderAtivo = false;

const CAMADA_CENTRAL = 1;

/*
========================================================
CONFIGURAÇÕES MOBILE/TABLET
========================================================
*/

let ultimoTouchX = 0;
let ultimoTouchY = 0;

function calcularCanvasSize(){

    /*
    ========================================================
    MOBILE / TABLET / DESKTOP
    ========================================================
    */

    if(windowWidth <= 768){

        return min(
            windowWidth - 24,
            windowHeight * 0.72
        );
    }

    return min(
        windowWidth - 40,
        700
    );
}

function setup(){

    let canvasSize =
    calcularCanvasSize();

    let canvas =
    createCanvas(
        canvasSize,
        canvasSize
    );

    canvas.parent("canvas-container");

    textAlign(CENTER,CENTER);

    raioMax =
    (width / 2) * 0.82;

    /*
    ========================================================
    CORREÇÃO TOUCH MOBILE DEFINITIVA
    ========================================================
    */

    canvas.elt.style.touchAction = "none";

    canvas.elt.style.webkitUserSelect = "none";

    canvas.elt.style.userSelect = "none";

    canvas.elt.style.display = "block";

    /*
    ========================================================
    BLOQUEAR EVENTOS DUPLOS
    ========================================================
    */

    canvas.elt.addEventListener(
        "touchstart",
        function(e){

            e.preventDefault();

        },
        { passive:false }
    );

    canvas.elt.addEventListener(
        "touchmove",
        function(e){

            e.preventDefault();

        },
        { passive:false }
    );

    canvas.elt.addEventListener(
        "touchend",
        function(e){

            e.preventDefault();

        },
        { passive:false }
    );

    atualizarUI();
}

function draw(){

    background(8);

    translate(width / 2,height / 2);

    desenharResultado();

    desenharPreview();

    desenharPontos();

    desenharGrade();
}

function atualizarUI(){

    document
    .querySelectorAll("button")
    .forEach(btn=>{

        btn.classList.remove("active");
    });

    if(modoNegacaoManual){

        let btn =
        document.getElementById("btn¬");

        if(btn){

            btn.classList.add("active");
        }

    }else{

        let el =
        document.getElementById(
            "btn" + entradaAtiva
        );

        if(el){

            el.classList.add("active");
        }
    }

    let op =
    document.getElementById(operacao);

    if(op){

        op.classList.add("active");
    }

    document
    .getElementById("btnNegTudo")
    .classList.toggle(
        "active",
        negarGeral
    );

    atualizarTexto();
}

function atualizarTexto(){

    let box =
    document.getElementById(
        "expressao-dinamica"
    );

    if(ordemCliques.length === 0){

        box.innerText =
        "Nenhuma expressão ativa";

        return;
    }

    let resultado =
    calcularValorSemanticoExpressao()
    ?
    "V"
    :
    "F";

    box.innerText =
    `${obterStringExpressao()} = ${resultado}`;
}

function setEntrada(e){

    entradaAtiva = e;

    atualizarUI();
}

function setOp(op){

    operacao = op;

    atualizarUI();
}

function ativarModoNegacao(){

    modoNegacaoManual =
    !modoNegacaoManual;

    atualizarUI();
}

function limparDiagrama(){

    pontos = {};

    ordemCliques = [];

    camadaObrigatoria = -1;

    negarGeral = false;

    modoNegacaoManual = false;

    entradaAtiva = "P";

    operacao = "AND";

    atualizarUI();
}

function limparLogs(){

    historicoResultados = [];

    document
    .getElementById("log-area")
    .innerHTML =
    "<b>Histórico de Expressões:</b><br>";
}

function getValorLogicoFatia(f){

    let ang =
    (TWO_PI / fatias)
    *
    (f + 0.5);

    let x = cos(ang);

    let y = sin(ang);

    if(x >= 0 && y <= 0){

        return true;
    }

    if(x < 0 && y <= 0){

        return false;
    }

    if(x < 0 && y > 0){

        return true;
    }

    return false;
}

function getValorLogicoQuadrante(f){

    let ang =
    (TWO_PI / fatias)
    *
    (f + 0.5);

    let x = cos(ang);

    let y = sin(ang);

    if(x >= 0 && y <= 0){

        return "Q1";
    }

    if(x < 0 && y <= 0){

        return "Q2";
    }

    if(x < 0 && y > 0){

        return "Q3";
    }

    return "Q4";
}

function existeProposicaoNoQuadrante(fatia){

    let quadrante =
    getValorLogicoQuadrante(
        fatia
    );

    for(let id in pontos){

        let q =
        getValorLogicoQuadrante(
            pontos[id].f
        );

        if(q === quadrante){

            return true;
        }
    }

    return false;
}

function calcularOperacao(a,b,op){

    switch(op){

        case "AND":
        return a && b;

        case "OR":
        return a || b;

        case "IF":
        return (!a || b);

        case "IFF":
        return a === b;

        case "XOR":
        return a !== b;
    }

    return false;
}

/*
========================================================
CORREÇÃO DEFINITIVA DE:
(~p vs ~p)
(~q vs ~q)
========================================================
*/

function obterValoresUnarios(id1,fatiaBase){

    let pontoNegado =
    id1.startsWith("¬");

    let valorBase =
    getValorLogicoFatia(
        fatiaBase
    );

    let valorA;
    let valorB;

    if(
        !modoNegacaoManual
        &&
        !pontoNegado
    ){

        valorA = valorBase;
        valorB = valorBase;
    }

    else if(
        !modoNegacaoManual
        &&
        pontoNegado
    ){

        valorA = valorBase;
        valorB = valorBase;
    }

    else if(
        modoNegacaoManual
        &&
        !pontoNegado
    ){

        valorA = valorBase;
        valorB = !valorBase;
    }

    else{

        valorA = valorBase;
        valorB = !valorBase;
    }

    return {
        valorA,
        valorB
    };
}

function calcularValorSemanticoExpressao(){

    if(ordemCliques.length === 0){

        return false;
    }

    let id1 =
    ordemCliques[0];

    if(ordemCliques.length === 1){

        let valores =
        obterValoresUnarios(
            id1,
            pontos[id1].f
        );

        let r =
        calcularOperacao(
            valores.valorA,
            valores.valorB,
            operacao
        );

        if(negarGeral){

            r = !r;
        }

        return r;
    }

    let valorA =
    getValorLogicoFatia(
        pontos[id1].f
    );

    if(id1.startsWith("¬")){

        valorA = !valorA;
    }

    let id2 =
    ordemCliques[1];

    let valorB =
    getValorLogicoFatia(
        pontos[id2].f
    );

    if(id2.startsWith("¬")){

        valorB = !valorB;
    }

    let r =
    calcularOperacao(
        valorA,
        valorB,
        operacao
    );

    if(negarGeral){

        r = !r;
    }

    return r;
}

function desenharResultado(){

    if(ordemCliques.length < 1){

        return;
    }

    let camadaBase =
    pontos[ordemCliques[0]].c;

    desenharCamada(
        camadaBase,
        false
    );

    if(
        ordemCliques.length >= 2
        &&
        camadaBase > CAMADA_CENTRAL
    ){

        desenharCamada(
            camadaBase - 1,
            true
        );
    }
}

function desenharCamada(
    camada,
    inverterPrimeira
){

    if(camada <= 0){

        return;
    }

    for(let f = 0; f < fatias; f++){

        let r =
        calcularResultadoEstrutural(
            f,
            inverterPrimeira
        );

        fill(
            r
            ?
            color(46,204,113,220)
            :
            color(231,76,60,220)
        );

        noStroke();

        drawCasa(f,camada);
    }
}

function calcularResultadoEstrutural(
    fatiaAtual,
    inverterPrimeira
){

    let id1 =
    ordemCliques[0];

    if(ordemCliques.length === 1){

        let valores =
        obterValoresUnarios(
            id1,
            fatiaAtual
        );

        let r =
        calcularOperacao(
            valores.valorA,
            valores.valorB,
            operacao
        );

        if(negarGeral){

            r = !r;
        }

        return r;
    }

    let id2 =
    ordemCliques[1];

    let valorA =
    getValorLogicoFatia(
        pontos[id1].f
    );

    let valorB =
    getValorLogicoFatia(
        fatiaAtual
    );

    if(id1.startsWith("¬")){

        valorA = !valorA;
    }

    if(id2.startsWith("¬")){

        valorB = !valorB;
    }

    if(inverterPrimeira){

        valorA = !valorA;
    }

    let r =
    calcularOperacao(
        valorA,
        valorB,
        operacao
    );

    if(negarGeral){

        r = !r;
    }

    return r;
}

function desenharPreview(){

    if(ordemCliques.length >= 2){

        return;
    }

    if(
        typeof entradaAtiva === "string"
    ){

        for(let id in pontos){

            let nomeBase =
            id.replace("¬","");

            if(nomeBase === entradaAtiva){

                return;
            }
        }
    }

    let mx =
    mouseX - width / 2;

    let my =
    mouseY - height / 2;

    let d =
    dist(mx,my,0,0);

    if(d > raioMax){

        return;
    }

    let camada;

    if(camadaObrigatoria === -1){

        camada =
        ceil(
            d /
            (raioMax / camadas)
        );

    }else{

        camada =
        camadaObrigatoria;
    }

    if(
        camada === CAMADA_CENTRAL
        &&
        ordemCliques.length === 0
    ){

        return;
    }

    let alpha =
    map(
        sin(frameCount * 0.12),
        -1,
        1,
        20,
        120
    );

    noStroke();

    fill(
        125,
        60,
        255,
        alpha
    );

    for(let f = 0; f < fatias; f++){

        if(
            existeProposicaoNoQuadrante(f)
        ){

            continue;
        }

        drawCasa(f,camada);
    }
}

function drawCasa(f,c){

    let ang =
    TWO_PI / fatias;

    let a1 =
    ang * f;

    let a2 =
    a1 + ang;

    let r1 =
    (raioMax / camadas)
    *
    (c - 1);

    let r2 =
    (raioMax / camadas)
    *
    c;

    beginShape();

    for(
        let a = a1;
        a <= a2;
        a += 0.01
    ){

        vertex(
            cos(a) * r2,
            sin(a) * r2
        );
    }

    for(
        let a = a2;
        a >= a1;
        a -= 0.01
    ){

        vertex(
            cos(a) * r1,
            sin(a) * r1
        );
    }

    endShape(CLOSE);
}

function desenharGrade(){

    stroke(50);

    strokeWeight(1);

    noFill();

    for(let i = 1; i <= camadas; i++){

        ellipse(
            0,
            0,
            (raioMax / camadas)
            *
            i
            *
            2
        );
    }

    for(let i = 0; i < fatias; i++){

        let a =
        TWO_PI / fatias * i;

        line(
            0,
            0,
            cos(a) * raioMax,
            sin(a) * raioMax
        );
    }

    stroke(120);

    strokeWeight(2);

    line(-raioMax,0,raioMax,0);

    line(0,-raioMax,0,raioMax);

    fill(255);

    noStroke();

    textStyle(BOLD);

    /*
    ========================================================
    TEXTO RESPONSIVO MOBILE
    ========================================================
    */

    let tamanhoTexto =
    width * 0.07;

    if(windowWidth <= 768){

        tamanhoTexto =
        width * 0.08;
    }

    textSize(tamanhoTexto);

    let off =
    raioMax * 0.8;

    text("V", off,-off);

    text("F",-off,-off);

    text("V",-off, off);

    text("F", off, off);
}

function desenharPontos(){

    for(let id in pontos){

        let p =
        pontos[id];

        let ang =
        (TWO_PI / fatias)
        *
        (p.f + 0.5);

        let r =
        (raioMax / camadas)
        *
        (p.c - 0.5);

        fill(255);

        noStroke();

        textStyle(BOLD);

        /*
        ========================================================
        TEXTO RESPONSIVO MOBILE
        ========================================================
        */

        let tamanho =
        width * 0.04;

        if(windowWidth <= 768){

            tamanho =
            width * 0.05;
        }

        textSize(tamanho);

        text(
            id,
            cos(ang) * r,
            sin(ang) * r
        );
    }
}

function mouseMoved(){

    previewMouseX = mouseX;

    previewMouseY = mouseY;
}


function mousePressed(event){

    /*
    ========================================================
    IGNORA MOUSE FALSO GERADO PELO TOUCH
    ========================================================
    */

    if(touches.length > 0){

        return false;
    }

    if(event){

        event.preventDefault();
    }

    handleInteracao(
        mouseX,
        mouseY
    );

    return false;
}

function touchStarted(event){

    if(event){

        event.preventDefault();
    }

    if(touches.length === 0){

        return false;
    }

    /*
    ========================================================
    PEGA TOUCH REAL
    ========================================================
    */

    let t = touches[0];

    ultimoTouchX = t.x;

    ultimoTouchY = t.y;

    handleInteracao(
        t.x,
        t.y
    );

    return false;
}

function handleInteracao(xIn,yIn){

    /*
    ========================================================
    COORDENADAS REAIS DO CANVAS
    ========================================================
    */

    let mx =
    xIn - width / 2;

    let my =
    yIn - height / 2;

    let d =
    dist(mx,my,0,0);

    if(d > raioMax || d < 10){

        return;
    }

    let c =
    ceil(
        d /
        (raioMax / camadas)
    );

    if(
        c === CAMADA_CENTRAL
        &&
        ordemCliques.length === 0
    ){

        return;
    }

    let f =
    floor(
        (
            (
                atan2(my,mx)
                +
                TWO_PI
            )
            %
            TWO_PI
        )
        /
        (TWO_PI / fatias)
    );

    /*
    ========================================================
    MODO NEGAÇÃO
    ========================================================
    */

    if(modoNegacaoManual){

        for(let id in pontos){

            let p = pontos[id];

            if(
                p.f === f
                &&
                p.c === c
            ){

                inverterPonto(id);

                atualizarUI();

                return;
            }
        }

        return;
    }

    /*
    ========================================================
    IMPEDIR DUPLO CLIQUE MOBILE
    ========================================================
    */

    let jaExisteMesmoLugar = false;

    for(let id in pontos){

        let p = pontos[id];

        let nomeBase =
        id.replace("¬","");

        if(
            p.f === f
            &&
            p.c === c
            &&
            nomeBase === entradaAtiva
        ){

            jaExisteMesmoLugar = true;
        }
    }

    /*
    ========================================================
    NÃO REMOVE NO MOBILE
    ========================================================
    */

    if(jaExisteMesmoLugar){

        return;
    }

    /*
    ========================================================
    NÃO DUPLICAR LETRA
    ========================================================
    */

    for(let id in pontos){

        let nomeBase =
        id.replace("¬","");

        if(nomeBase === entradaAtiva){

            return;
        }
    }

    /*
    ========================================================
    PRIMEIRA CAMADA
    ========================================================
    */

    if(ordemCliques.length === 0){

        camadaObrigatoria = c;
    }

    /*
    ========================================================
    SEGUNDA PROPOSIÇÃO
    ========================================================
    */

    if(ordemCliques.length === 1){

        if(c !== camadaObrigatoria){

            return;
        }
    }

    /*
    ========================================================
    LIMITE
    ========================================================
    */

    if(ordemCliques.length >= 2){

        return;
    }

    /*
    ========================================================
    QUADRANTE
    ========================================================
    */

    if(
        existeProposicaoNoQuadrante(f)
    ){

        return;
    }

    /*
    ========================================================
    ADICIONAR
    ========================================================
    */

    let label =
    entradaAtiva;

    pontos[label] = {

        f:f,

        c:c
    };

    ordemCliques.push(label);

    atualizarUI();
}

function inverterPonto(id){

    let p =
    pontos[id];

    delete pontos[id];

    let valorAtual =
    getValorLogicoFatia(
        p.f
    );

    let alvo =
    !valorAtual;

    let novaFatia =
    p.f;

    let encontrou = false;

    for(let i = 1; i <= fatias; i++){

        let direita =
        (p.f + i) % fatias;

        if(
            getValorLogicoFatia(
                direita
            ) === alvo
        ){

            if(
                !existeProposicaoNoQuadrante(
                    direita
                )
            ){

                novaFatia = direita;

                encontrou = true;

                break;
            }
        }

        let esquerda =
        (
            p.f - i + fatias
        )
        %
        fatias;

        if(
            getValorLogicoFatia(
                esquerda
            ) === alvo
        ){

            if(
                !existeProposicaoNoQuadrante(
                    esquerda
                )
            ){

                novaFatia = esquerda;

                encontrou = true;

                break;
            }
        }
    }

    if(!encontrou){

        pontos[id] = p;

        return;
    }

    let novoID =
    id.startsWith("¬")
    ?
    id.substring(1)
    :
    "¬" + id;

    pontos[novoID] = {

        f:novaFatia,

        c:p.c
    };

    let idx =
    ordemCliques.indexOf(id);

    if(idx !== -1){

        ordemCliques[idx] =
        novoID;
    }
}

function negarExpressaoInteira(){

    let distribuiuNegacao = false;

    if(operacao === "AND"){

        operacao = "OR";

        [...ordemCliques]
        .forEach(id=>{

            inverterPonto(id);
        });

        distribuiuNegacao = true;
    }

    else if(operacao === "OR"){

        operacao = "AND";

        [...ordemCliques]
        .forEach(id=>{

            inverterPonto(id);
        });

        distribuiuNegacao = true;
    }

    else if(operacao === "IF"){

        operacao = "AND";

        if(ordemCliques[1]){

            inverterPonto(
                ordemCliques[1]
            );
        }

        distribuiuNegacao = true;
    }

    else if(operacao === "IFF"){

        operacao = "XOR";

        distribuiuNegacao = true;
    }

    else if(operacao === "XOR"){

        operacao = "IFF";

        distribuiuNegacao = true;
    }

    if(!distribuiuNegacao){

        negarGeral = !negarGeral;
    }

    atualizarUI();
}

function obterStringExpressao(){

    if(ordemCliques.length === 0){

        return "";
    }

    let mapa = {

        AND:"∧",

        OR:"∨",

        IF:"→",

        IFF:"↔",

        XOR:"⊻"
    };

    let p = "";

    let q = "";

    if(ordemCliques.length === 1){

        let id1 =
        ordemCliques[0];

        let pontoNegado =
        id1.startsWith("¬");

        let base =
        pontoNegado
        ?
        id1.substring(1).toLowerCase()
        :
        id1.toLowerCase();

        if(
            !modoNegacaoManual
            &&
            !pontoNegado
        ){

            p = base;
            q = base;
        }

        else if(
            !modoNegacaoManual
            &&
            pontoNegado
        ){

            p = "¬" + base;
            q = "¬" + base;
        }

        else if(
            modoNegacaoManual
            &&
            !pontoNegado
        ){

            p = base;
            q = "¬" + base;
        }

        else{

            p = "¬" + base;
            q = base;
        }

    }else{

        p =
        ordemCliques[0]
        .toLowerCase();

        q =
        ordemCliques[1]
        .toLowerCase();
    }

    let expr =
    `(${p} ${mapa[operacao]} ${q})`;

    if(negarGeral){

        expr = `¬${expr}`;
    }

    return expr;
}

function registrarExpressao(){

    if(ordemCliques.length < 1){

        alert(
            "Nenhuma expressão ativa."
        );

        return;
    }

    let expr =
    obterStringExpressao();

    let resultado =
    calcularValorSemanticoExpressao()
    ?
    "V"
    :
    "F";

    let novo = {

        numero:
        historicoResultados.length + 1,

        texto:expr,

        classificacao:resultado
    };

    historicoResultados.push(novo);

    let item =
    document.createElement("div");

    item.className =
    "log-item";

    let cor =
    resultado === "V"
    ?
    "#2ecc71"
    :
    "#e74c3c";

    item.innerHTML =
    `<b>${novo.numero}.</b>
    ${expr}
    =
    <span style="
    color:${cor};
    font-weight:bold;
    ">
    ${resultado}
    </span>`;

    document
    .getElementById("log-area")
    .appendChild(item);
}

function windowResized(){

    let canvasSize =
    calcularCanvasSize();

    resizeCanvas(
        canvasSize,
        canvasSize
    );

    raioMax =
    (width / 2) * 0.82;
}
