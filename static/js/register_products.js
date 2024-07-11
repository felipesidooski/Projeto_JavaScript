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
        var cellDelete = row.insertCell(11);

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
        //Delete Button
        var deleteButton = document.createElement("button");
        deleteButton.innerHTML = "-";
        deleteButton.classList.add("btn", "btn-danger");
        deleteButton.onclick = function() {
            removeProductFromTableAndLocalStorage(this);
        };
        cellDelete.appendChild(deleteButton);
    }
}


function saveProductToLocalStorage(product) {
    // Obter a lista atual de produtos do LocalStorage
    let products = JSON.parse(localStorage.getItem('products')) || [];
    
    // Adicionar o novo produto à lista
    products.push(product);
    
    // Salvar a lista atualizada de volta ao LocalStorage
    localStorage.setItem('products', JSON.stringify(products));
}


//Function to calculate the profit forecast and total cost
function calculateTotals() {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let totalUnitCost = 0;
    let totalProfit = 0;
    products.forEach(product => {
        // Calculated the total cost and profit forecast
        totalUnitCost += product.unit_cost;
        totalProfit += product.profit;
    });
    document.getElementById('budget').innerText = `Budget Forecast: $${totalUnitCost.toFixed(2)}`;
    document.getElementById('profit_forecast').innerText = `Profit Forecast: $${totalProfit.toFixed(2)}`;
}


// Function to remove product from LocalStorage
function removeProductFromLocalStorage(productValue) {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let productIndex = products.findIndex(p => p.product === productValue);
    if (productIndex !== -1) {
        products.splice(productIndex, 1); // Remove o produto encontrado
        localStorage.setItem('products', JSON.stringify(products)); // Atualiza o LocalStorage
    }
}

// Function to remove product from the table and LocalStorage
function removeProductFromTableAndLocalStorage(button) {
    var row = button.parentNode.parentNode;
    var productValue = row.cells[1].innerText; // Assume que o nome do produto está na segunda célula
    row.parentNode.removeChild(row); // Remove a linha da tabela
    removeProductFromLocalStorage(productValue); // Remove o produto do LocalStorage
    calculateTotals(); // Atualiza os totais
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

    // Check if the product is already registered
    var products = JSON.parse(localStorage.getItem('products')) || [];
    if (products.some(p => p.product === product)) {
        alert('This product is already registered!');
        return;
    }

    var table = document.getElementById('TableProducts');
    for (var i = 1; i < table.rows.length; i++) {
        if (table.rows[i].cells[1].innerHTML === product) {
            alert('This product is already registered!');
            return;
        }
    }
    // Save product on the table
    await newProduct.register();

    // Save new product to LocalStorage
    saveProductToLocalStorage({
        product: newProduct.product,
        unit_cost: newProduct.unit_cost,
        sale_price: newProduct.sale_price,
        classification: newProduct.classification,
        profit: newProduct.profit,
        profit_margin: newProduct.profit_margin,
        cepOrigin: newProduct.cepOrigin,
        state_taxes: newProduct.state_taxes,
        state: newProduct.state,
        dateTime: newProduct.getCurrentDateTime()
    });

    //Update the total cost and profit forecast
    calculateTotals();

    // Clear the form fields
    document.getElementById('product').value = '';
    document.getElementById('unitCost').value = '';
    document.getElementById('salePrice').value = '';
    document.getElementById('productClass').value = '';
    document.getElementById('cepOrigin').value = '';
}


//Function to load products from LocalStorage
function loadProductsFromLocalStorage() {
    let products = JSON.parse(localStorage.getItem('products')) || [];
    let totalUnitCost = 0;
    let totalProfit = 0;

    //Process to fill the table with the products
    products.forEach(p => {
        let product = new Product(p.product, p.unit_cost, p.sale_price, p.classification, p.cepOrigin);
        product.state = p.state; 
        product.state_taxes = p.state_taxes; 
        product.profit = p.profit; 
        product.profit_margin = p.profit_margin;
        product.register(); // add product to the table
        // Calculated the total cost and profit forecast
        totalUnitCost += product.unit_cost;
        totalProfit += product.profit;
    });

    // Atualiza os elementos h1 com os totais calculados
    document.getElementById('budget').innerText = `Budget Forecast: $${totalUnitCost.toFixed(2)}`;
    document.getElementById('profit_forecast').innerText = `Profit Forecast: $${totalProfit.toFixed(2)}`;
}


//Initial load of products from LocalStorage
window.onload = function() {
    loadProductsFromLocalStorage();
};
