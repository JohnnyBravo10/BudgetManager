const express = require('express');
const fs = require('fs/promises');
const { MongoClient } = require('mongodb');
const session = require('express-session');
const uri = 'mongodb://mongo:27017';
const app = express();
const client = new MongoClient(uri);
let db = null;

app.use(express.static(`${__dirname}/public`));
app.use(express.json());
app.use(express.urlencoded());
app.use(session({
    secret: 'segreto',
    resave: false
}));

////////script per inserire user e spese iniziali nel database 
///(tutte le password sono "abc" e tutti gli username coincidono con il firstName)
await db.collection("users").insertOne({username: "Giovanni", password: "abc", firstName: "Giovanni", lastName: "Zanin"});
await db.collection("users").insertOne({username: "Giorgia", password: "abc", firstName: "Giorgia", lastName: "Rossi"});
await db.collection("users").insertOne({username: "Enrico", password: "abc", firstName: "Enrico", lastName: "Zanin"});
await db.collection("users").insertOne({username: "Giuseppe", password: "abc", firstName: "Giuseppe", lastName: "Verdi"});
await db.collection("users").insertOne({username: "Anna", password: "abc", firstName: "Anna", lastName: "Blu"});
await db.collection("users").insertOne({username: "Andrea", password: "abc", firstName: "Andrea", lastName: "Bianchi"});
await db.collection("users").insertOne({username: "Mauro", password: "abc", firstName: "Mauro", lastName: "Gialli"});
await db.collection("users").insertOne({username: "Serena", password: "abc", firstName: "Serena", lastName: "Arancio"});


/////////////////fine script di inizializzazione
app.post('/api/auth/signin', async (req, res) => {  	
    const db_user = await db.collection("users").findOne({username: req.body.username});
    if(db_user && db_user.password === req.body.password){
        req.session.username = req.body.username;
        res.status(200).send({ message: 'Autenticazione avvenuta con successo' });
    } else {
        res.status(401).send("Non autenticato!");
    }
});

app.post('/api/auth/signup', async (req, res) => {  	
    //const client = new MongoClient(uri);
    //await client.connect();
    //const users = client.db("users");
    const db_user = await db.collection("users").findOne({username: req.body.username});
    if(db_user){
        res.status(401).send("Username già esistente");
    }
    else{
        await db.collection("users").insertOne({username: req.body.username, password: req.body.password, firstName: req.body.firstName, lastName: req.body.lastName});
        req.session.username = req.body.username;
      
        res.status(200).send({ message: 'Registrazione avvenuta con successo' });
    }
});

function verify(req, res, next){
    if(req.session.username){
        next();
    } else {
        //res.status(401).send("Non autenticato");
        res.json({authenticated: false});////////////////////////
    }
}








app.get("/api/budget/:year/:month/:id", verify, async (req, res) => {
    let year = parseInt(req.params.year);
    let month = parseInt(req.params.month);
    let id = parseInt(req.params.id);
    let transition = await db.collection("transitions").findOne({$or: [
          { buyer: req.session.username },
          { "users": { $elemMatch: { username: req.session.username } } }
        ], year: year, month:month, id:id});
    res.json(transition);
});

app.post("/api/budget/:year/:month", verify, async (req, res) => {
    let date = req.body.date;
    let description= req.body.description;
    let category = req.body.category;
    let totalPrice = parseFloat(req.body.totalPrice);
    let buyer = req.session.username;
    
    let usernames = req.body.usernames.split(',');
    let amount = req.body.portions.split(',').map(parseFloat)

    let usernamePortionsMap = {};
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const portion = amount[i];    
      if (!usernamePortionsMap[username]) {
        usernamePortionsMap[username] = 0;
      }
      usernamePortionsMap[username] += portion;
    }
    let usernamesAndPortions = Object.keys(usernamePortionsMap).map(username => {
      return { username: username, amount: usernamePortionsMap[username] };
    });
    usernamesAndPortions = usernamesAndPortions.filter(item => item.username && item.amount !== 0 && item.amount);
    

    let transitions = await db.collection("transitions").find().sort({ "id": -1 }).limit(1).toArray();
    let id=0;
    if (transitions.length > 0) {
        id = transitions[0].id+1;
      }

    let new_expense = {
        id: id,
        buyer: buyer,
        date:date,
        description:description,
        category:category,
        totalPrice:totalPrice,
        users: usernamesAndPortions    
    };
    await db.collection("transitions").insertOne(new_expense);
    res.status(200).json(new_expense);
});

app.put("/api/budget/:year/:month/:id", verify, async (req, res) => {
    //let year = parseInt(req.params.year);
    //let month = parseInt(req.params.month);
    //let day = parseInt(req.body.day);
    let description= req.body.description;
    let category = req.body.category;
    let totalPrice = parseFloat(req.body.totalPrice);
    let id = parseInt(req.params.id)
    
    let usernames = req.body.usernames.split(',');
    let amount = req.body.portions.split(',').map(parseFloat)
    let usernamePortionsMap = {};
    for (let i = 0; i < usernames.length; i++) {
      const username = usernames[i];
      const portion = amount[i];    
      if (!usernamePortionsMap[username]) {
        usernamePortionsMap[username] = 0;
      }
      usernamePortionsMap[username] += portion;
    }
    let usernamesAndPortions = Object.keys(usernamePortionsMap).map(username => {
      return { username: username, amount: usernamePortionsMap[username] };
    });
    usernamesAndPortions = usernamesAndPortions.filter(item => item.username && item.amount !== 0  && item.amount);
    

    await db.collection("transitions").updateOne({$or: [
          { buyer: req.session.username },
          { "users": { $elemMatch: { username: req.session.username } } }
        ], id: id },
    {$set: {
        //year:year,
        //month:month,
        //day:day,
        description:description,
        category:category,
        totalPrice:totalPrice,
        users: usernamesAndPortions}
    });
    //const updatedExpense = await db.collection("transitions").findOne({ id: id });*/
    res.status(200).json("ciao");//////////
});

app.delete("/api/budget/:year/:month/:id", verify, async (req, res) => {
    let year = parseInt(req.params.year);
    let month = parseInt(req.params.month)-1;
    let id = parseInt(req.params.id);
    let transition = await db.collection("transitions").deleteOne({$or: [
          { buyer: req.session.username },
          { "users": { $elemMatch: { username: req.session.username } } }
        ], /*year: year, month: month*/ id:id});
    res.json(parseInt(req.params.id));
});

app.get("/api/balance/:id", verify, async (req, res) =>{
  const userId = req.params.id;
  const otherUsers = await db.collection("users").find().toArray();
  let otherUser =null;
  otherUsers.forEach((u) => {
    if (u._id.toString() === userId) {
      otherUser=u;
        }
      });

  let otherUsername = otherUser.username;
  let username = req.session.username
  let transitions = await db.collection("transitions").find({
      $or: [
        { buyer: username },
        { "users": { $elemMatch: { username: username } } }
      ],
      $or: [
        { buyer: otherUsername },
        { "users": { $elemMatch: { username: otherUsername } } }
      ],
    }).toArray();
  let debt=0

  transitions.forEach((expense) => {
  if (expense.buyer === username) {
    let parts = expense.users;
    parts.forEach((part) => {
      if ((part.username == otherUsername)) {
          debt-=part.amount;
      }
    });
  } 

  if (expense.buyer === otherUsername) {
    let parts = expense.users;
    parts.forEach((part) => {
      if ((part.username == username)) {
          debt+=part.amount;
      }
    });
  } 

    });
  
res.json(debt);
} )

app.get("/api/balance", verify, async (req, res) =>{
    let username = req.session.username
    let transitions = await db.collection("transitions").find({
        $or: [
          { buyer: username },
          { "users": { $elemMatch: { username: username } } }
        ]
      }).toArray();

    debts = [];

    transitions.forEach((expense) => {
        if (expense.buyer === username) {
            let parts = expense.users;
            parts.forEach((part) => {
                if (!(part.username == username)) {
                    let existingDebt = debts.find(debt => debt.debtor === part.username);

                    if (existingDebt) {
                        existingDebt.amount -= part.amount;
                    } else {
                        debts.push({ debtor: part.username, amount: -part.amount });
                    }
                }
            });
        } else {
            let buyer = expense.buyer;
            let parts = expense.users;
            parts.forEach((part) => {
                if (part.username === username) {
                    let existingDebt = debts.find(debt => debt.debtor === buyer);

                    if (existingDebt) {
                        existingDebt.amount += part.amount;
                    } else {
                        debts.push({ debtor: buyer, amount: part.amount });
                    }
                }
            });
        }
    });
  res.json({debts: debts, authenticated:true});
} )



app.get("/api/budget/search", verify, async (req, res) => {
  console.log("inoltrato a budget/search");
  const query = req.query.q;
  console.log("query arrivata:", query)
  let trans = await db.collection("transitions").find({
      $or: [
          { buyer: req.session.username },
          { "users": { $elemMatch: { username: req.session.username } } }
      ],      
  }).toArray();
  t=[]
  trans.forEach((element)=> {
    if (element.category.startsWith(query)){
    t.push(element)
  }})
  res.json({transitions: t, authenticated:true});
  });


app.get("/api/budget/whoami", verify, async (req,res) => {
    console.log("Richiesta arrivata a whoami");////////////
    const user = await db.collection("users").findOne({username: req.session.username});
    res.json({firstName: user.firstName, lastName: user.lastName});
});

app.get("/api/users/search", verify, async (req, res) => {
    const username = req.query.q;
    let user = await db.collection("users").findOne({username: username});
    res.json({user: user});
});

app.get("/api/users/startsWith", verify, async (req, res) => {
  console.log("fetch a users/startswith arrivata al server")
  const query = req.query.q.toLowerCase();
  let users = await db.collection("users").find().toArray();
  console.log("all users:",users)
  suggestions=[]
  users.forEach((element)=> {
    if (element.username.toLowerCase().startsWith(query)){
    suggestions.push(element.username)
  }})
  console.log("suggestions:", suggestions)
  res.json({suggestions: suggestions});
  
});

app.get("/api/budget/:year/:month", verify, async (req, res) => {
  let year = Number(req.params.year);
  let month = Number(req.params.month);
  let trans = await db.collection("transitions").find({
    $or: [
        { buyer: req.session.username },
        { "users": { $elemMatch: { username: req.session.username } } }
    ]
}).toArray();
t=[]
trans.forEach((element)=> {const d = new Date(element.date); 
  if (d.getFullYear()==year && d.getMonth()+1==month){
  t.push(element)
}})
res.json({transitions: t, authenticated:true});
});

app.get("/api/budget/:year", verify, async (req, res) => {
  let year = Number(req.params.year);
  let trans = await db.collection("transitions").find({
    $or: [
        { buyer: req.session.username },
        { "users": { $elemMatch: { username: req.session.username } } }
    ],      
}).toArray();
t=[]
trans.forEach((element)=> {const d = new Date(element.date); 
  if (d.getFullYear()==year){
  t.push(element)
}})
res.json({transitions: t, authenticated:true});
});

app.get("/api/budget", verify, async (req, res) => {
  let transitions = await db.collection("transitions").find({
      $or: [
        { buyer: req.session.username },
        { "users": { $elemMatch: { username: req.session.username } } }
      ]
    }).toArray();
  res.json({transitions:transitions, authenticated:true});
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Errore durante il logout:', err);
      res.status(500).send('Errore durante il logout');
    } else {
      res.json({authenticated:false});
    }
  });
});

app.listen(3000, async () => {
    console.log("adesso provo a connettermi...")
    await client.connect();
    console.log("connesso")
    db = client.db("expenses");
});