require('dotenv').config();
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const app = express();

//middleware
app.use(cors());
app.use(express.json());



//Register New User
app.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await pool.query("INSERT INTO userdata (name, email, password) VALUES($1, $2, $3) RETURNING *",
            [name, email, hashedPassword]);

        const token = jwt.sign({
            userId: newUser.rows[0].id,
            name: newUser.rows[0].name,
            email: newUser.rows[0].email
        },
            process.env.JWT_SECRET
        );

        res.status(201).json({
            success: true,
            message: 'Registered AND logged in!',
            token: token, // Frontend will store this
            user: {
                userId: newUser.rows[0].id,
                name: newUser.rows[0].name,
                email: newUser.rows[0].email
            }
        });



    } catch (err) {
        console.log(err.message);
        res.status(500).json("Server error");
    }
});


//Login User
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {

        //get credentials 
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        //find user
        const user = await pool.query("SELECT * FROM userdata WHERE email = $1", [email]);

        //check if user exists
        if (user.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'E-mail or Password is Incorrect!'
            });
        }

        //compare passwords
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'E-mail or Password is Incorrect!'
            });
        }

        //create JWT token
        const token = jwt.sign({
            userId: user.rows[0].id,
            name: user.rows[0].name,
            email: user.rows[0].email
        },
            process.env.JWT_SECRET
        );

        //success response
        res.json({
            success: true,
            message: 'Logged in successfully!',
            token: token,
            user: {
                userId: user.rows[0].id,
                name: user.rows[0].name,
                email: user.rows[0].email
            }
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }

});



//////////////////////////MEETING REQUESTS//////////////////////////////////////
// const { title, date, startTime, endTime, description } = req.body;

// app.post("/meetings", async (req, res) => {
//     await db.query(
//         `INSERT INTO meetings (title, start_time, end_time, description)
//    VALUES ($1, $2, $3, $4)`,
//         [title, startTime, endTime, description]
//     );
// });




//////////////////////////SHHHHHH ITS LISTENING/////////////////////////////////
app.listen(5000, () => {
    console.log("Server Has Started on Port 5000")
}); 