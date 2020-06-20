'use strict';

// Model: Contains core business logic
const budgetController = (function() {
    let Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    }

    Expense.prototype.calcPercentages = function(totalInc) {
        if (totalInc > 0) {
            this.percentage = Math.round((this.value / totalInc) * 100);
        } else {
            this.percentage = -1;
        }
    }

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    let Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    }

    let data = {
        allItems: {
            exp: [],
            inc: [],
        },
        totals: {
            exp: 0,
            inc: 0,
        },
        budget: 0,
        percentage: -1
    }

    let calculateTotal = function(type) {
        let sum = 0;
        data.allItems[type].forEach(function(curr) {
            sum += curr.value;
        })
        data.totals[type] = sum;
    }

    return {
        addItem: function(type, des, val) {
            let newItem, ID;
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else {
                newItem = new Income(ID, des, val);
            }
            data.allItems[type].push(newItem);
            return newItem;
        },
        calculateBudget: function() {
            calculateTotal('exp');
            calculateTotal('inc');
            // Calculate the budget: total income - expense
            data.budget = data.totals.inc - data.totals.exp;
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            }
        },
        calculatePercentages: function() {
            data.allItems.exp.forEach(function(curr) {
                curr.calcPercentages(data.totals.inc)
            })
        },
        getPercentages: function() {
            let allPer = data.allItems.exp.map(function(curr) {
                return curr.getPercentage();
            })
            return allPer;
        },
        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },
        deleteItem: function(type, id) {
            let index, ids;
            ids = data.allItems[type].map(function(current) {
                return current.id;
            });
            index = ids.indexOf(id);
            if (index !== -1) {
                data.allItems[type].splice(index, 1);
            }

        },
        test: function() {
            console.log(data);
        }
    }

})();

// View: Contains UI related logic
const UIController = (function() {
    let DOMStrings = {
        inputType: ".add__type",
        inputDescription: ".add__description",
        inputValue: ".add__value",
        inputBtn: ".add__btn",
        incomeContainer: ".income__list",
        expenseContainer: ".expenses__list",
        budgetLabel: ".budget__value",
        incomeLabel: ".budget__income--value",
        expenseLabel: ".budget__expenses--value",
        percentageLabel: ".budget__expenses--percentage",
        container: ".container",
        expencePercLabel: ".item__percentage",
        dateLabel: ".budget__title--month",
    };

    let formatNumber = function(num, type) {
        let numSplit, int, dec, intLength;
        num = Math.abs(num);
        num = num.toFixed(2);
        numSplit = num.split(".");
        int = numSplit[0];
        intLength = int.length;
        if (intLength > 3) {
            int = int.substr(0, intLength - 3) + "," + int.substr(intLength - 3, intLength)
        }
        dec = numSplit[1];
        return (type === 'inc' ? "+" : "-") + " " + int + "." + dec;

    }

    let nodeListForEach = function(list, callback) {
        for (let i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMStrings.inputType).value,
                description: document.querySelector(DOMStrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMStrings.inputValue).value),
            };
        },
        addListItem: function(obj, type) {
            let html, newHtml, element;
            if (type === 'inc') {
                element = DOMStrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            } else {
                element = DOMStrings.expenseContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },
        deleteListItems: function(selectorID) {
            let el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },
        clearFields: function() {
            let fields, fieldsArr;
            fields = document.querySelectorAll(DOMStrings.inputDescription + "," + DOMStrings.inputValue);
            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(element => {
                element.value = ""
            });
            fieldsArr[0].focus();
        },
        displayBudget: function(obj) {
            let type;
            obj.budget > 0 ? type = "inc" : type = "exp";
            document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(obj.totalInc, "inc");
            document.querySelector(DOMStrings.expenseLabel).textContent = formatNumber(obj.totalExp, "exp");
            if (obj.totalInc > 0) {
                document.querySelector(DOMStrings.percentageLabel).textContent = obj.percentage + "%";
            } else {
                document.querySelector(DOMStrings.percentageLabel).textContent = "---";
            }
        },
        displayPercentages: function(percentages) {
            let fields = document.querySelectorAll(DOMStrings.expencePercLabel);

            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + "%";
                } else {
                    current.textContent = "---";
                }
            })
        },
        displayDate: function() {
            let now, month, year, months;
            now = new Date();
            year = now.getFullYear();
            //month = now.getMonth();
            month = now.toLocaleString('default', { month: 'long' });
            document.querySelector(DOMStrings.dateLabel).textContent = month + " " + year;
        },
        changedType: function() {
            let fields = document.querySelectorAll(
                DOMStrings.inputType + "," + DOMStrings.inputDescription + "," + DOMStrings.inputValue);
            nodeListForEach(fields, function(curr) {
                curr.classList.toggle("red-focus");
            })
            document.querySelector(DOMStrings.inputBtn).classList.toggle("red");
        },
        getDOMStrings: function() {
            return DOMStrings;
        },
    };
})();

// Controller: Acts as an interface between model and view.
const controller = (function(budgetCtrl, UICtrl) {

    // All the event listeners required for this project are defined here
    const setupEventListeners = () => {
        const DOM = UICtrl.getDOMStrings();
        document.querySelector(DOM.inputBtn).addEventListener("click", ctrlAddItem);
        document.addEventListener("keypress", (event) => {
            if (event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            }
        });
        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem)
        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    }

    let updateBudget = function() {
        budgetController.calculateBudget();
        let budget = budgetController.getBudget();
        UICtrl.displayBudget(budget);
    }

    const ctrlAddItem = function() {
        let input, newItem;
        input = UICtrl.getInput();
        if (input.description !== "" && !isNaN(input.value) && input.value > 0) {
            newItem = budgetController.addItem(input.type, input.description, input.value);
            UICtrl.addListItem(newItem, input.type);
            UICtrl.clearFields();
            updateBudget();
            updatePercentages();
        }
    }

    const updatePercentages = function() {

        // Calculate the percentages
        budgetCtrl.calculatePercentages();

        // Read the percentages from the budget controller
        let percentages = budgetCtrl.getPercentages();

        // Update the UI with the new percentages 
        UICtrl.displayPercentages(percentages);
    }

    const ctrlDeleteItem = function(event) {
        let itemID, splitID, ID, type;
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if (itemID) {
            splitID = itemID.split("-");
            type = splitID[0];
            ID = parseInt(splitID[1]);
            budgetCtrl.deleteItem(type, ID);
            UICtrl.deleteListItems(itemID);
            updateBudget();
            updatePercentages();
        }
    }

    return {
        init() {
            console.log('Service has been initialized..')
            UICtrl.displayDate();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
            setupEventListeners();
        }
    }
})(budgetController, UIController);

controller.init();