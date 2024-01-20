const { createApp } = Vue

const app = createApp({
    data() {
        return {
          authenticated: false,

          username: "",
          new_username:"",
          password:"",
          new_password:"",
          firstName:"",
          lastName:"",

          viewTransitionsTable: false,
          
          viewNewExpenseForm: false,
          viewFilterForm: false,
          viewSearchExpenseForm:false,
          
          viewExpenseDetail: false,  
          viewInfo: false,
          viewOtherUser: false,
          

          showAlert: false,
          alertMessage:"",

          transitions:[],

          date: new Date(),
          description:"",
          category:"",
          totalCost:0,
          parts: [{username:"", amount:0}],

          monthFilter: (new Date()).getMonth()+1,
          yearFilter: (new Date).getFullYear(),

          expenseQuery:"",

          expenseInDetail: null,

          modifyExpense:false,

          debts:[],

          usernameToFind:"",
          userToShow: null,
          balanceToShow: 0,

          usernameSuggestions:{},

        };
      },


      mounted() {
      /*
        fetch('/api/budget')
          .then(response => {
            if (!response.ok) {
              throw new Error('Errore di connessione al server');
            }
            return response.json();
          })
          .then(data => {
            this.authenticated = data.authenticated;
          })
          .catch(error => {
            console.error('Errore', error);
            this.authenticated = false;
          });*/
          
      },
      methods: {

        
        async login() {  

          const response= await fetch("/api/auth/signin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({username: this.username, password: this.password}),
          })

          if (response.ok){
            this.authenticated=true;
            this.getAllExpenses();
          }
          else{
            this.showAlert=true;
            this.alertMessage="Username o password errati";
          }
        
        },

        async signup() {  
          const response= await fetch("/api/auth/signup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify( {username: this.new_username, password: this.new_password, firstName:this.firstName, lastName:this.lastName}),
          })

          if (response.ok){
            this.authenticated=true;
            this.username= this.new_username;
            this.getAllExpenses();  
          }

          else{
            this.showAlert=true;
            this.alertMessage="Username già in uso";
          }
          
        },

        async getAllExpenses() {
          const response= await(await fetch("/api/budget")).json();
          this.authenticated= response.authenticated ;
          this.viewTransitionsTable=true;
          if (this.authenticated){
            this.transitions=response.transitions;
          }
    
        },

        async addExpense() {
          sumOfParts=0;
          this.parts.forEach(element => {
            sumOfParts+=element.amount
          })
          
          
          if (sumOfParts<=this.totalCost){
            remaining=  this.totalCost - sumOfParts
            if (remaining>0){
              this.parts.push({username: this.username, amount: remaining});
            }
            const selectedDateObject = new Date(this.date);
            const year = selectedDateObject.getFullYear();
            const month = selectedDateObject.getMonth() + 1; 
            names="";
            amounts=""
            this.parts.forEach(element => {
              names+=element.username;
              names+=',';
              amounts+=element.amount;
              amounts+=',';
            })
            const response= await fetch(`/api/budget/${year}/${month}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify( {date: selectedDateObject, description: this.description, category: this.category,
              totalPrice: this.totalCost, usernames: names, portions: amounts}),
            })
  
            if (response.ok){
              this.authenticated=true;
              this.viewTransitionsTable= true;
              this.viewNewExpenseForm= false;
              this.viewInfo= false; 
              this.getAllExpenses(); 
            }

          }
        

          else{
            this.showAlert=true;
            this.alertMessage="Ripartizione errata"
          }
          this.date=new Date();
          this.description="";
          this.category="";
          this.totalCost=0;
          this.parts= [{username:"", amount:0}];
         
        },
        addPart() {
          this.parts.push({ name: '', amount: 0 });
        },
        removePart(index) {
          this.parts.splice(index, 1);
        },

        addPartToDetail() {
          this.expenseInDetail.users.push({ username: '', amount: 0 });
        },
        removePartFromDetail(index) {
          this.expenseInDetail.users.splice(index, 1);
        },

        showNewExpenseForm() {
          this.viewNewExpenseForm=true;
          this.viewFilterForm=false;
          this.viewSearchExpenseForm=false;
        },

        showFilterForm() {
          this.viewFilterForm=true;
          this.viewNewExpenseForm=false;
          this.viewSearchExpenseForm=false;
        },

        hideFilterForm(){
        this.viewFilterForm=false;
        this.monthFilter= (new Date()).getMonth()+1;
        this.yearFilter= (new Date()).getFullYear();
        },

        showSearchExpenseForm(){
          this.viewSearchExpenseForm=true;
          this.viewFilterForm=false;
          this.viewNewExpenseForm=false;

        },

        async filterTransitions(){
          
          if (this.yearFilter==0){
            this.getAllExpenses();
          }
          else {
            if(this.monthFilter==0){
              year= this.yearFilter;
              const response= await(await fetch(`/api/budget/${year}`)).json();
              this.authenticated= response.authenticated ;
              this.transitions=response.transitions;
              this.viewTransitionsTable=true;
          }
          else{
            year= this.yearFilter;
            month = this.monthFilter;
            const response= await(await fetch(`/api/budget/${year}/${month}`)).json();
            this.authenticated= response.authenticated ;
            this.transitions=response.transitions;
            this.viewTransitionsTable=true;
          }

            }

        //this.monthFilter= (new Date()).getMonth()+1;
        //this.yearFilter= (new Date()).getFullYear();
          
        },

        async showExpenseDetails(transaction){
          this.expenseInDetail= transaction;
          this.viewTransitionsTable= false;
          this.viewExpenseDetail= true;
          this.modifyExpense=false;
          
        },

        closeAlert() {
          this.showAlert=false;
        },

        backToTransactionsFromDetails(){
          this.viewExpenseDetail=false;
          this.viewTransitionsTable= true;
          this.getAllExpenses();

        },

        formatDate(dateString) {
          const date = new Date(dateString);
          const day = date.getDate();
          const month = date.getMonth() + 1; // Aggiungi 1 al mese per ottenere il formato 1-12
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
      },

      async deleteExpense(){
        id= this.expenseInDetail.id;
        date= new Date(this.expenseInDetail.Date)
        year= date.getFullYear()
        month = date.getMonth
        const response= await(await fetch(`/api/budget/${year}/${month}/${id}`,{
        method: "DELETE",
        })).json();
        this.backToTransactionsFromDetails();
        this.getAllExpenses();

      },

      editExpense(){
        this.modifyExpense=true;
      },

      async confirmEdit(){
        sumOfParts=0;
        this.expenseInDetail.users.forEach(element => {
            sumOfParts+=element.amount
          })
          
          
          if (sumOfParts<=this.expenseInDetail.totalPrice){
            remaining=  this.expenseInDetail.totalPrice - sumOfParts;
            if (remaining>0){
              this.expenseInDetail.users.push({username: this.expenseInDetail.buyer, amount: remaining});
            }
            const selectedDateObject = new Date(this.expenseInDetail.date);
            const year = selectedDateObject.getFullYear();
            const month = selectedDateObject.getMonth() + 1; 
            const id = this.expenseInDetail.id
            names="";
            amounts=""
            this.expenseInDetail.users.forEach(element => {
              names+=element.username;
              names+=',';
              amounts+=element.amount;
              amounts+=',';
            })
            const response= await fetch(`/api/budget/${year}/${month}/${id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify( {description: this.expenseInDetail.description, category: this.expenseInDetail.category,
              totalPrice: this.expenseInDetail.totalPrice, usernames: names, portions: amounts, buyer: this.expenseInDetail.buyer}),
            })
  
            if (response.ok){
              this.authenticated=true;
              this.viewTransitionsTable = true;
              this.viewNewExpenseForm= false; 
              this.modifyExpense= false;
              this.viewFilterForm= false;
              this.viewExpenseDetail= false;
            }


      }
      else{
        this.showAlert=true;
        this.alertMessage="Ripartizione errata"
      }
      },

      async showInfo(){
        this.viewInfo=true;
        const response= await(await fetch("/api/budget/whoami",{
          method: "GET",
        }
        )).json();
        this.firstName= response.firstName;
        this.lastName= response.lastName;
        const response2 = await (await fetch("/api/balance")).json();
        this.debts= response2.debts;
        

      },

      async closeInfo(){
        this.viewInfo=false;
      },

      async logout() {
        const response= await(await fetch("logout")).json();
        this.authenticated= response.authenticated ;
        this.username= "";
        this.new_username="";
        this.password="";
        this.new_password="";
        this.firstName="";
        this.lastName="";

          
        this.viewNewExpenseForm= false;
        this.viewFilterForm= false;
        this.viewSearchExpenseForm=false;
          
        this.viewExpenseDetail= false;  
        this.viewInfo= false;
        this.viewOtherUser= false;
          

        this.showAlert= false;

        this.date= new Date();
        this.description="";
        this.category="";
        this.totalCost=0;
        this.parts= [{username:"", amount:0}];

        this.monthFilter= (new Date()).getMonth()+1;
        this.yearFilter= (new Date).getFullYear();

        this.expenseQuery="";

        this.expenseInDetail= null;

        this.modifyExpense=false;

        this.debts=[];

        this.usernameToFind="";
        this.userToShow= null;
        this.balanceToShow= 0;

        this.usernameSuggestions={};


      },

      async searchExpenses(){
        query = this.expenseQuery;
        const response= await(await fetch(`/api/budget/search?q=${query}`)).json();
        console.log("Server response for search category:", response)

        this.authenticated= response.authenticated ;
        this.transitions=response.transitions;
        this.viewTransitionsTable=true;
      },

      async searchUser(){
        username = this.usernameToFind;
        const response= await(await fetch(`/api/users/search?q=${username}`)).json();
        console.log("User trovato:", response)
        if (response.user== null){
          this.showAlert=true;
          this.alertMessage="Utente non trovato"
        }
        else{
        this.userToShow= response.user;
        let id = this.userToShow._id.toString();
        const response2 = await(await fetch(`/api/balance/${id}`)).json();
        this.balanceToShow= parseFloat(response2);
        this.viewOtherUser=true;
        }
      },

      async suggestUsernames(query, id){
        lowQuery= query.toLowerCase()
        if (lowQuery.length){
        const response= await(await fetch(`/api/users/startsWith?q=${lowQuery}`)).json();
        this.usernameSuggestions[id]=response.suggestions;
        
        }
        else{
          this.usernameSuggestions[id]=[];
        }
        console.log("suggerimenti:", this.usernameSuggestions[id])
      },

    },



}).mount("#app");