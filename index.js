const express = require('express');
const cors = require('cors');


//importing the modules
const dbConnection = require('./config/dbConnection');

//Importing routes
const userRoute = require('./routes/userRoute');

//Configuring the middlewares
const app = express();
app.use(express.json());
app.use(cors());
app.use('/users', userRoute);

//Calling the external functions
dbConnection();


//Endpoints
app.get('/', (req, res) => {
        return res.status(200).json({message: "Server running..."});
})

app.listen(8080, () => {
        console.log("Server is Running at http://localhost:8080");
});