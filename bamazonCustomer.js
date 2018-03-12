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
    displayAll();

});

function displayAll() {
    connection.query("SELECT * FROM products", function(err, res) {
        for (var i = 0; i < res.length; i++) {
            console.log("item id: " + res[i].item_id + " | " + "Product Name: " + res[i].product_name + " | " + "Price: $"+ res[i].price );
        }
        console.log("-----------------------------------");
        purchaseItem();
    });
}


function purchaseItem() {
    // query the database for all items being auctioned
    connection.query("SELECT * FROM products", function(err, results) {
        if (err) throw err;
        // once you have the items, prompt the user for which they'd like to bid on
        inquirer
            .prompt([
                {
                    name: "choice",
                    type: "rawlist",
                    choices: function() {
                        var choiceArray = [];
                        for (var i = 0; i < results.length; i++) {
                            choiceArray.push(results[i].item_id);
                        }
                        return choiceArray;
                    },
                    message: "What item would you like purchase?"
                },
                {
                    name: "amount",
                    type: "input",
                    message: "How many would you like to purchase?"
                }
            ])
            .then(function(answer) {
                // get the information of the chosen item
                var chosenItem;
                for (var i = 0; i < results.length; i++) {
                    if (results[i].item_id === answer.choice) {
                        chosenItem = results[i];
                    }
                }

                // determine if bid was high enough
                if (chosenItem.stock_quantity > parseInt(answer.amount)) {
                    // bid was high enough, so update db, let the user know, and start over
                    connection.query(
                        "UPDATE products SET ? WHERE ?",
                        [
                            {
                                stock_quantity: (chosenItem.stock_quantity - answer.amount)
                            },
                            {
                                item_id: chosenItem.item_id
                            }
                        ],
                        function(error) {
                            if (error) throw err;
                            console.log("Order placed successfully!  Your total is $" + chosenItem.price * answer.amount);
                            connection.end();
                        }
                    );
                }
                else {
                    // bid wasn't high enough, so apologize and start over
                    console.log("Our apologies but we don't have enough stock to cover this order, please try a smaller quantity.");
                    displayAll();
                }
            });
    });
}

