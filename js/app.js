let rates = {};

/**
 * Carga los datos desde JSON de forma asíncrona
 */
async function loadRates() {
    const response = await fetch("data/rates.json");
    rates = await response.json();
}

/**
 * Genera el HTML del simulador
 */
function renderConverter() {
    const container = document.getElementById("converter");

    container.innerHTML = `
        <div class="card">
            <div class="field">
                <label>Monto</label>
                <input type="number" id="amount" value="1" min="0">
            </div>

            <div class="field">
                <label>Desde</label>
                <select id="from"></select>
            </div>

            <div class="field">
                <label>Hacia</label>
                <select id="to"></select>
            </div>

            <button id="convertBtn">Convertir</button>
        </div>

        <div class="result" id="result">
            Resultado aparecerá aquí
        </div>
    `;
}

/**
 * Rellena los selects dinámicamente
 */
function populateCurrencies() {
    const from = document.getElementById("from");
    const to = document.getElementById("to");

    Object.keys(rates).forEach(currency => {
        from.innerHTML += `<option value="${currency}">${currency}</option>`;
        to.innerHTML += `<option value="${currency}">${currency}</option>`;
    });

    to.value = "PEN";
}

/**
 * Lógica de conversión
 */
function convertCurrency() {
    const amount = Number(document.getElementById("amount").value);
    const from = document.getElementById("from").value;
    const to = document.getElementById("to").value;

    if (amount <= 0) {
        Swal.fire("Error", "Ingrese un monto válido", "error");
        return;
    }

    const result = (amount / rates[from]) * rates[to];

    document.getElementById("result").innerHTML = `
        ${amount} ${from} = <strong>${result.toFixed(6)} ${to}</strong>
    `;
}

/**
 * Inicializa la app
 */
async function init() {
    await loadRates();
    renderConverter();
    populateCurrencies();

    document
        .getElementById("convertBtn")
        .addEventListener("click", convertCurrency);
}

init();
