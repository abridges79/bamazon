var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,

    // Your username
    user: "root",

    // Your password
    password: "root",
    database: "bamazon"
});

connection.connect(function(err) {
    if (err) throw err;
    menuOptions();

});

function menuOptions() {
    inquirer
        .prompt({
        name: "action",
        type: "list",
        message: "What would you like to do?",
        choices: [
            "View all products for sale",
            "View low inventory",
            "Add to current inventory",
            "Add a new product"
        ]
        })
        .then(function (answer) {
            switch (answer.action){
                case "View all products for sale":
                    viewProducts();
                    break;

                case "View low inventory":
                    lowInventory();
                    break;

                case "Add to current inventory":
                    addInventory();
                    break;

                case "Add a new product":
                    addProduct();
                    break;
            }
        });
}

function viewProducts() {
    connection.query("SELECT * FROM products", function(err, res) {
        for (var i = 0; i < res.length; i++) {
            console.log("item id: " + res[i].item_id + " | " + "Product Name: " + res[i].product_name + " | " + "Price: $"+ res[i].price );
        }
        console.log("-----------------------------------");
        menuOptions();
    });
}


function lowInventory() {
    var query = "SELECT * FROM products WHERE stock_quantity < 5";
    connection.query(query, function (err, res) {
        for (var i = 0; i < res.length; i++){
            console.log(res[i].product_name + " only has " + res[i].stock_quantity + " left in stock.");
        }
        menuOptions();

    })

}

function addInventory()
{ connection.query("SELECT * FROM products", function(err, results) {
    if (err) throw err;
    // once you have the items, prompt the user for which they'd like to bid on
    inquirer
        .prompt([
            {
                name: "choice",
                type: "rawlist",
                choices: function () {
                    var choiceArray = [];
                    for (var i = 0; i < results.length; i++) {
                        choiceArray.push(results[i].item_id);
                    }
                    return choiceArray;
                },
                message: "What item would you like to update inventory for?"
            },
            {
                name: "amount",
                type: "input",
                message: "How many would you like to add?"
            }
        ])
        .then(function (answer) {
            // get the information of the chosen item
            var chosenItem;
            for (var i = 0; i < results.length; i++) {
                if (results[i].item_id === answer.choice) {
                    chosenItem = results[i];
                    var restock = parseInt(answer.amount);
                }
            }

            connection.query(
                "UPDATE products SET ? WHERE ?",
                [
                    {
                        stock_quantity: (chosenItem.stock_quantity + restock)
                    },
                    {
                        item_id: chosenItem.item_id
                    }
                ],
                function (error) {
                    if (error) throw err;
                    console.log("Stock updated successfully!");
                    connection.end();
                }
            );
        });
});
}

function addProduct() {
    inquirer
        .prompt([
            {
            name: "product_name",
            type: "input",
            message: "What is the name of the product you would like to add?"
        },
            {
                name: "item_id",
                type: "input",
                message: "What is the item ID number?"
            },
            {
                name: "department_name",
                type: "input",
                message: "What department does it belong to?"
            },
            {
                name: "stock_quantity",
                type: "input",
                message: "Stock on hand?"
            },
            {
                name: "price",
                type: "input",
                message: "What is the price per each?",
                validate: function(value) {
                    if (isNaN(value) === false) {
                        return true;
                    }
                    return false;
                }
            }

        ])

        .then(function(answer) {
            // when finished prompting, insert a new item into the db with that info
            connection.query(
                "INSERT INTO products SET ?",
                {
                    product_name: answer.product_name,
                    item_id: answer.item_id,
                    department_name: answer.department_name,
                    stock_quantity: answer.stock_quantity,
                    price: answer.price

                },
                function(err) {
                    if (err) throw err;
                    console.log("Your item was created successfully!");
                    // re-prompt the user for if they want to bid or post
                    connection.end();
                }
            );
        });
}
