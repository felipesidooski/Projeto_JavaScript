class Product {
    constructor(product, unit_cost, sale_price, classification, cepOrigin) {
        this.product = product;
        this.unit_cost = this.convertToFloat(unit_cost);
        this.sale_price = this.convertToFloat(sale_price);
        this.classification = classification;
        this.profit = 0.0;
        this.profit_margin = 0.0;
        this.cepOrigin = cepOrigin;
        this.state_taxes = 0.0;
        this.state = "PR";
    }

    checkFields() {
        return this.product !== '' && this.unit_cost !== '' && this.sale_price !== '' && this.classification !== '' && this.cepOrigin !== '';
    }

    checkNumbers() {
        return !isNaN(this.unit_cost) && !isNaN(this.sale_price);
    }

    checkCEP() {
        var cep = this.cepOrigin;
        var cepPattern = /^[0-9]{5}-[0-9]{3}$/;
        if (!cepPattern.test(cep)) {
            alert('CEP inválido! Preencha o campo com o CEP no formato 00000-000.');
            return false;
        } else {
            return true;
        }
    }

    checkPrices() {
        return this.sale_price > this.unit_cost;
    }

    convertToFloat(value) {
        return parseFloat(value);
    }

    calculateProfit() {
        return (this.sale_price - this.unit_cost) - ((this.sale_price - this.unit_cost) * (this.getNacionalTaxes() + this.state_taxes));
    }

    calculateProfitMargin() {
        return (this.profit / this.sale_price) * 100;
    }

    async getStateTaxes() {
        const cepData = await getCEPData(this.cepOrigin);
        if (cepData.status === 200) {
            this.state_taxes = icmp_tax(cepData.data.uf);
            this.state = cepData.data.uf;
        } else {
            alert('CEP is not valid');
        }
    }

    getNacionalTaxes() {
        if (this.classification === 'Electronic') {
            return 0.05;
        } else if (this.classification === 'Furniture') {
            return 0.08;
        } else if (this.classification === 'Office supplies') {
            return 0.10;
        } else if (this.classification === 'Estationary') {
            return 0.15;
        } else {
            return 0.20;
        }
    }

    getCurrentDateTime() {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const formattedDateTime = `${day}/${month}/${year}-${hours}:${minutes}:${seconds}`;
        return formattedDateTime;
    }

    async register() {
        var table = document.getElementById('TableProducts');
        var row = table.insertRow(-1);

        var cellRow = row.insertCell(0);
        var cellProduct = row.insertCell(1);
        var cellUnitCost = row.insertCell(2);
        var cellClassification = row.insertCell(3);
        var cellSalePrice = row.insertCell(4);
        var cellState = row.insertCell(5);
        var cellTaxes = row.insertCell(6);
        var cellICMS = row.insertCell(7);
        var cellProfit = row.insertCell(8);
        var cellProfitMargin = row.insertCell(9);
        var cellDateTime = row.insertCell(10);

        cellRow.innerHTML = table.rows.length - 1;
        cellProduct.innerHTML = this.product;
        cellUnitCost.innerHTML = '$' + this.unit_cost.toFixed(2);
        cellClassification.innerHTML = this.classification;
        cellSalePrice.innerHTML = '$' + this.sale_price.toFixed(2);
        cellTaxes.innerHTML = (this.getNacionalTaxes() * 100) + '%';
        cellState.innerHTML = this.state;
        cellICMS.innerHTML = (this.state_taxes * 100) + '%';
        cellProfit.innerHTML = '$' + this.profit.toFixed(2);
        cellProfitMargin.innerHTML = this.profit_margin.toFixed(2) + '%';
        cellDateTime.innerHTML = this.getCurrentDateTime();
    }
}

async function addProduct() {
    var product = document.getElementById('product').value;
    var unit_cost = document.getElementById('unitCost').value;
    var sale_price = document.getElementById('salePrice').value;
    var selectElement = document.getElementById('productClass');
    var cepOrigin = document.getElementById('cepOrigin');
    var classification = selectElement.value;
    var newProduct = new Product(product, unit_cost, sale_price, classification, cepOrigin.value);

    if (!newProduct.checkFields()) {
        alert('Please fill all fields!');
        return;
    }

    if (!newProduct.checkNumbers()) {
        alert('Please fill the unit cost and sale price with numbers!');
        return;
    }

    if (!newProduct.checkPrices()) {
        alert('The sale price must be greater than the unit cost!');
        return;
    }

    if (!newProduct.checkCEP()) {
        alert('Please fill the CEP field with the correct format!');
        return;
    }

    await newProduct.getStateTaxes(); // Aguarda a atualização dos impostos estaduais e estado

    newProduct.profit = newProduct.calculateProfit();
    newProduct.profit_margin = newProduct.calculateProfitMargin();

    var table = document.getElementById('TableProducts');
    for (var i = 1; i < table.rows.length; i++) {
        if (table.rows[i].cells[1].innerHTML === product) {
            alert('This product is already registered!');
            return;
        }
    }

    await newProduct.register();

    document.getElementById('product').value = '';
    document.getElementById('unitCost').value = '';
    document.getElementById('salePrice').value = '';
    document.getElementById('productClass').value = '';
    document.getElementById('cepOrigin').value = '';
}
