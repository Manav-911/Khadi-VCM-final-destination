const express = require('express')
const app = express()
const cors = require('cors');

app.use(cors());
app.use(express.json());

let meetings = [];

app.get('/api/meetings', (req, res) => {
  res.json(meetings.filter(m => m && m.id));
});

app.post('/api/meetings', (req, res)=>{
    const newMeeting = req.body;
    meetings.push(newMeeting);
    res.status(201).json({message:'Successfully meeting added',newMeeting});
    console.log("Received meeting:", req.body);
});

app.post('/api/meetings/approve', (req, res)=>{
    const {id} = req.body;
    meetings = meetings.map(m=>m.id == id ? {...m, status:'Approved', approvedAt: new Date()}:m);
    res.json({message:'Meeting approved'});
});

app.listen(5000, ()=>{
    console.log('Server started');
});