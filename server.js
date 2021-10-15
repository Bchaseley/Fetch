const express = require("express");
const _ = require("lodash");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//instantiating our transactions array
let transactions = [
  { payer: "DANNON", points: "1000", timestamp: "2020-11-02T14:00:00Z" },
  { payer: "UNILEVER", points: "200", timestamp: "2020-10-31T11:00:00Z" },
  { payer: "DANNON", points: "-200", timestamp: "2020-10-31T15:00:00Z" },
  { payer: "MILLER COORS", points: "10000", timestamp: "2020-11-01T14:00:00Z" },
  { payer: "DANNON", points: "300", timestamp: "2020-10-31T10:00:00Z" },
];

//function to sort transaction in order by date
//used for spend route, points are spent based on timestamp, FIFO.
//call sort method, which can sort by date
const sortedTransactions = () => transactions.sort(function (a, b) {
  return new Date(a.timestamp) - new Date(b.timestamp);
});



/*
function to call to calculate point balance of transactions array
creates an object, and on each iteration adds the point value to the existing key
if key doesnt exist, it creates one and adds point value.
*/
const findBalances = transactions => {
  let balances = {};
  transactions.forEach((value) => {
    if (!balances[value.payer])
      balances[value.payer] = 0;
    balances[value.payer] += parseInt(value.points);
  });
  return balances;
}

/*
function to call to spend points, takes in parameters of points and array sorted by date
creates array to add points to subract
loops through each transaction in order, checking point balance of current against points to be spent
first checks if points are 0, which breaks loop iteration
if points ar greater than or equal, add keys and values to created object, and set points to 0 to keep track of account balance
pretty much same concept for less than or equal, with some minor changes
*/
const spendPoints = (pointsToSpend) => {

  const sorted = sortedTransactions();
  let offsettingTransactions = [];

  sorted.forEach((value) => {

    let subTransaction = {};

    if (pointsToSpend === 0) {
      return;
    }
    if (pointsToSpend >= parseInt(value.points)) {
      subTransaction.payer = value.payer;
      subTransaction.points = value.points * -1;
      pointsToSpend -= value.points;
      value.points = 0;
      offsettingTransactions.push(subTransaction);
    };
    if (pointsToSpend <= parseInt(value.points)) {
      subTransaction.payer = value.payer;
      subTransaction.points = pointsToSpend * -1;
      value.points -= pointsToSpend;
      offsettingTransactions.push(subTransaction);
      pointsToSpend -= pointsToSpend;
    }
  });


  let balances = {};
  offsettingTransactions.forEach((value) => {
    if (!balances[value.payer])
      balances[value.payer] = 0;

    balances[value.payer] += value.points;
  });

  let output = [];
  _.each(balances, (points, payer) => {
    output.push({ payer, points });
  });
  return output;
};

//default route for debugging
app.get("/api", (req, res) => {
  res.send("Hello from the default route!");
});

//route to post transactions from the body of request into our "database" 
app.post("/api/transactions", (req, res) => {
  transactions.push(req.body);
  res.json({ status: "ok" });
});

//route to return all transactions in sorted order
app.get("/api/transactions", (req, res) => {
  res.json(sortedTransactions());
});

//route for spending points
app.post("/api/points", (req, res) => {
  res.json(spendPoints(req.body.points));
})

//route to return total point balances
app.get("/api/balance", (req, res) => {
  res.json(findBalances(transactions));
});



const server = app.listen(8000, () =>
  console.log(`Server is running on port ${server.address().port}!`)
);
